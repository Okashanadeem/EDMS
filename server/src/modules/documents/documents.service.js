const db = require('../../config/db');
const generateNumber = require('../../utils/numbering');
const { auditLog } = require('../../utils/auditLogger');

/**
 * Creates and dispatches a document.
 * Transactional: Insert Doc + Generate Outward No + Rename File + CC/BCC + References + Audit Log.
 */
const createDocument = async (data) => {
  const { 
    subject, body_html, body, file_path, 
    receiver_department_id, created_by, sender_department_id,
    cc, bcc, references, is_restricted, restricted_to_user_id
  } = data;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Generate Outward Number
    const outwardNumber = await generateNumber(sender_department_id, 'outward', client);

    // 2. Insert Document
    const insertDocQuery = `
      INSERT INTO documents (
        subject, body_html, body, file_path, status, created_by, 
        sender_department_id, receiver_department_id, outward_number,
        is_restricted, restricted_to_user_id
      )
      VALUES ($1, $2, $3, $4, 'in_transit', $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const docResult = await client.query(insertDocQuery, [
      subject, body_html, body || '', file_path, created_by, 
      sender_department_id, receiver_department_id, outwardNumber,
      is_restricted || false, restricted_to_user_id || null
    ]);
    let document = docResult.rows[0];

    // 3. Handle CC/BCC
    if (cc && Array.isArray(cc)) {
      for (const deptId of cc) {
        await client.query(
          'INSERT INTO document_recipients (document_id, department_id, recipient_type) VALUES ($1, $2, $3)',
          [document.id, deptId, 'cc']
        );
      }
    }
    if (bcc && Array.isArray(bcc)) {
      for (const deptId of bcc) {
        await client.query(
          'INSERT INTO document_recipients (document_id, department_id, recipient_type) VALUES ($1, $2, $3)',
          [document.id, deptId, 'bcc']
        );
      }
    }

    // 4. Handle References
    if (references && Array.isArray(references)) {
      for (const refId of references) {
        await client.query(
          'INSERT INTO document_references (document_id, reference_id) VALUES ($1, $2)',
          [document.id, refId]
        );
      }
    }

    // 5. Write Audit Log
    const receiverDeptResult = await client.query('SELECT name FROM departments WHERE id = $1', [receiver_department_id]);
    const receiverDeptName = receiverDeptResult.rows[0]?.name || 'Unknown';

    await auditLog({
      actorId: created_by,
      action: 'document.created',
      entityType: 'document',
      entityId: document.id,
      metadata: { 
        subject, 
        outward_number: outwardNumber, 
        receiver_department: receiverDeptName,
        is_restricted: document.is_restricted
      },
      client
    });

    await client.query('COMMIT');
    return document;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Helper to redact restricted document content for unauthorized users.
 */
/**
 * Helper to redact restricted document content for unauthorized users.
 * Creator and Designated Recipient can always see.
 */
const applyRestriction = (doc, userId, role) => {
  if (doc.is_restricted && role !== 'super_admin' && doc.restricted_to_user_id !== userId && doc.created_by !== userId) {
    doc.body_html = null;
    doc.body = null;
    doc.file_path = null;
    doc.is_redacted = true;
  }
  return doc;
};

/**
 * Lists documents for a department's inbox (in_transit, unclaimed).
 * Includes CC/BCC recipients.
 */
const getInbox = async (departmentId, userId, role, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const whereClause = `
    WHERE (d.receiver_department_id = $1 OR dr.department_id = $1)
      AND d.status = 'in_transit' 
      AND d.assigned_to IS NULL
  `;
  
  const countQuery = `
    SELECT COUNT(DISTINCT d.id) 
    FROM documents d
    LEFT JOIN document_recipients dr ON d.id = dr.document_id
    ${whereClause}
  `;
  
  const dataQuery = `
    SELECT DISTINCT 
      d.*, 
      u.name as creator_name, 
      COALESCE(p.title, u.name) as sender_name,
      sd.name as sender_department_name
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN positions p ON d.behalf_of_position_id = p.id
    JOIN departments sd ON d.sender_department_id = sd.id
    LEFT JOIN document_recipients dr ON d.id = dr.document_id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const countRes = await db.query(countQuery, [departmentId]);
  const dataRes = await db.query(dataQuery, [departmentId, limit, offset]);

  return {
    total: parseInt(countRes.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataRes.rows.map(doc => applyRestriction(doc, userId, role))
  };
};



/**
 * Worker claims a document from the inbox.
 * Atomic: SET assigned_to = $workerId WHERE assigned_to IS NULL.
 */
const pickupDocument = async (id, workerId, departmentId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Check for restriction
    const checkQuery = 'SELECT is_restricted, restricted_to_user_id, receiver_department_id FROM documents WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);
    const doc = checkResult.rows[0];

    if (!doc) throw new Error('NOT_FOUND');

    if (doc.is_restricted && doc.restricted_to_user_id && doc.restricted_to_user_id !== parseInt(workerId)) {
      const error = new Error('FORBIDDEN');
      error.status = 403;
      throw error;
    }

    let finalDoc;
    let inwardNumber;

    // 2. Check if the department is the Primary Receiver or a CC/BCC recipient
    if (doc.receiver_department_id === departmentId) {
      // PRIMARY PICKUP
      const pickupQuery = `
        UPDATE documents
        SET assigned_to = $1, status = 'picked_up', picked_up_at = NOW(), updated_at = NOW()
        WHERE id = $2 
          AND assigned_to IS NULL 
          AND status = 'in_transit'
          AND receiver_department_id = $3
        RETURNING *
      `;
      const pickupResult = await client.query(pickupQuery, [workerId, id, departmentId]);
      
      if (pickupResult.rowCount === 0) {
        throw new Error('CONFLICT'); // Already picked up or not in transit
      }
      
      finalDoc = pickupResult.rows[0];
      inwardNumber = await generateNumber(departmentId, 'inward', client);
      
      await client.query('UPDATE documents SET inward_number = $1 WHERE id = $2', [inwardNumber, id]);
      finalDoc.inward_number = inwardNumber;

    } else {
      // CC/BCC PICKUP
      const recipientQuery = `
        UPDATE document_recipients
        SET picked_up_by = $1, picked_up_at = NOW(), status = 'picked_up'
        WHERE document_id = $2 
          AND department_id = $3 
          AND picked_up_by IS NULL
        RETURNING *
      `;
      const recipientResult = await client.query(recipientQuery, [workerId, id, departmentId]);

      if (recipientResult.rowCount === 0) {
        throw new Error('CONFLICT'); // Already picked up or not a recipient
      }

      inwardNumber = await generateNumber(departmentId, 'inward', client);
      await client.query(
        'UPDATE document_recipients SET inward_number = $1 WHERE document_id = $2 AND department_id = $3',
        [inwardNumber, id, departmentId]
      );

      // Return the document but with the recipient's inward number context
      const docQuery = 'SELECT * FROM documents WHERE id = $1';
      const docResult = await client.query(docQuery, [id]);
      finalDoc = docResult.rows[0];
      finalDoc.inward_number = inwardNumber;
    }

    // 4. Write Audit Log
    const deptResult = await client.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
    const deptName = deptResult.rows[0]?.name || 'Unknown';

    await auditLog({
      actorId: workerId,
      action: 'document.picked_up',
      entityType: 'document',
      entityId: id,
      metadata: { 
        inward_number: inwardNumber, 
        subject: finalDoc.subject,
        receiver_department: deptName 
      },
      client
    });

    await client.query('COMMIT');
    return finalDoc;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Marks a document as in_progress.
 */
const startProcessing = async (id, workerId) => {
  const query = 'UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2 AND assigned_to = $3 RETURNING *';
  const result = await db.query(query, ['in_progress', id, workerId]);
  
  if (!result.rows[0]) throw new Error('NOT_AUTHORIZED_OR_NOT_FOUND');

  await auditLog({
    actorId: workerId,
    action: 'document.started',
    entityType: 'document',
    entityId: id,
    metadata: { subject: result.rows[0].subject }
  });

  return result.rows[0];
};

/**
 * Marks a document as completed.
 */
const completeDocument = async (id, workerId) => {
  const query = 'UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2 AND assigned_to = $3 RETURNING *';
  const result = await db.query(query, ['completed', id, workerId]);

  if (!result.rows[0]) throw new Error('NOT_AUTHORIZED_OR_NOT_FOUND');

  await auditLog({
    actorId: workerId,
    action: 'document.completed',
    entityType: 'document',
    entityId: id,
    metadata: { subject: result.rows[0].subject }
  });

  return result.rows[0];
};

/**
 * Forwards a document to another department.
 * Transactional: Reset Doc + New Outward No + Forward Record + Audit Log.
 */
const forwardDocument = async (id, workerId, { to_department_id, note }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Get current document details
    const docQuery = 'SELECT * FROM documents WHERE id = $1 AND assigned_to = $2';
    const docResult = await client.query(docQuery, [id, workerId]);
    const currentDoc = docResult.rows[0];

    if (!currentDoc) throw new Error('NOT_AUTHORIZED_OR_NOT_FOUND');

    // 2. Generate new Outward Number for the forwarding department
    const newOutwardNumber = await generateNumber(currentDoc.receiver_department_id, 'outward', client);

    // 3. Update document: reset assigned_to, set status to in_transit, update outward_number
    const updateDocQuery = `
      UPDATE documents
      SET status = 'in_transit', assigned_to = NULL, picked_up_at = NULL, inward_number = NULL,
          receiver_department_id = $1, sender_department_id = $2, outward_number = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const updatedDocResult = await client.query(updateDocQuery, [
      to_department_id, currentDoc.receiver_department_id, newOutwardNumber, id
    ]);

    // 4. Record forward history
    const forwardQuery = `
      INSERT INTO document_forwards (document_id, from_user_id, from_department_id, to_department_id, note, new_outward_number)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(forwardQuery, [
      id, workerId, currentDoc.receiver_department_id, to_department_id, note, newOutwardNumber
    ]);

    // 5. Audit Log
    const fromDeptResult = await client.query('SELECT name FROM departments WHERE id = $1', [currentDoc.receiver_department_id]);
    const toDeptResult = await client.query('SELECT name FROM departments WHERE id = $1', [to_department_id]);
    
    await auditLog({
      actorId: workerId,
      action: 'document.forwarded',
      entityType: 'document',
      entityId: id,
      metadata: { 
        from_department: fromDeptResult.rows[0]?.name || 'Unknown', 
        to_department: toDeptResult.rows[0]?.name || 'Unknown',
        new_outward_number: newOutwardNumber,
        note
      },
      client
    });

    await client.query('COMMIT');
    return updatedDocResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Lists documents assigned to, created by, or CC'd to the worker's department.
 * Includes documents picked up by the user (Primary or CC/BCC).
 */
const getMyDocuments = async (userId, departmentId, role, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const whereClause = `
    WHERE d.assigned_to = $1 
       OR d.created_by = $1 
       OR d.draft_submitted_by = $1
       OR (dr.department_id = $2 AND dr.recipient_type = 'cc')
       OR dr.picked_up_by = $1
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT d.id) 
    FROM documents d
    LEFT JOIN document_recipients dr ON d.id = dr.document_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT DISTINCT 
      d.*, 
      u.name as creator_name, 
      COALESCE(p.title, u.name) as sender_name,
      sd.name as sender_department_name, 
      rd.name as receiver_department_name,
      dr.inward_number as recipient_inward_number -- Contextual inward number
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN positions p ON d.behalf_of_position_id = p.id
    JOIN departments sd ON d.sender_department_id = sd.id
    JOIN departments rd ON d.receiver_department_id = rd.id
    LEFT JOIN document_recipients dr ON d.id = dr.document_id
    ${whereClause}
    ORDER BY d.updated_at DESC
    LIMIT $3 OFFSET $4
  `;

  const countRes = await db.query(countQuery, [userId, departmentId]);
  const dataRes = await db.query(dataQuery, [userId, departmentId, limit, offset]);

  return {
    total: parseInt(countRes.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataRes.rows.map(doc => {
      const enriched = applyRestriction(doc, userId, role);
      // Use recipient inward number if primary is missing (for CC/BCC POV)
      if (!enriched.inward_number && enriched.recipient_inward_number) {
        enriched.inward_number = enriched.recipient_inward_number;
      }
      return enriched;
    })
  };
};


/**
 * Lists all documents system-wide (Super Admin).
 */
const listAllDocuments = async ({ department_id, status, assigned_to, q, page = 1, limit = 10 }, userId, role) => {
  const offset = (page - 1) * limit;
  let whereClause = "WHERE status != 'draft'";
  const params = [];
  let counter = 1;

  if (department_id) {
    whereClause += ` AND (d.sender_department_id = $${counter} OR d.receiver_department_id = $${counter})`;
    params.push(department_id);
    counter++;
  }
  if (status) {
    whereClause += ` AND d.status = $${counter++}`;
    params.push(status);
  }
  if (assigned_to) {
    whereClause += ` AND d.assigned_to = $${counter++}`;
    params.push(assigned_to);
  }
  if (q) {
    whereClause += ` AND (d.subject ILIKE $${counter} OR d.outward_number ILIKE $${counter} OR d.inward_number ILIKE $${counter})`;
    params.push(`%${q}%`);
    counter++;
  }

  const countQuery = `SELECT COUNT(*) FROM documents d ${whereClause}`;
  const dataQuery = `
    SELECT 
      d.*, 
      u.name as creator_name, 
      COALESCE(p.title, u.name) as sender_name,
      sd.name as sender_department_name, 
      rd.name as receiver_department_name, 
      au.name as assignee_name
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN positions p ON d.behalf_of_position_id = p.id
    JOIN departments sd ON d.sender_department_id = sd.id
    JOIN departments rd ON d.receiver_department_id = rd.id
    LEFT JOIN users au ON d.assigned_to = au.id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT $${counter++} OFFSET $${counter++}
  `;

  const countRes = await db.query(countQuery, params);
  const dataRes = await db.query(dataQuery, [...params, limit, offset]);

  return {
    total: parseInt(countRes.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataRes.rows.map(doc => applyRestriction(doc, userId, role))
  };
};


/**
 * Fetches full document detail including CC/BCC, references, audit trail, and forwarding history.
 */
const getDocumentDetail = async (id, userId, role, userDeptId) => {
  // 1. Basic Info
  const docQuery = `
    SELECT 
      d.*, 
      u.name as creator_name, 
      p.title as behalf_of_position_title,
      sd.name as sender_department_name, 
      rd.name as receiver_department_name, 
      au.name as assignee_name
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN positions p ON d.behalf_of_position_id = p.id
    JOIN departments sd ON d.sender_department_id = sd.id
    JOIN departments rd ON d.receiver_department_id = rd.id
    LEFT JOIN users au ON d.assigned_to = au.id
    WHERE d.id = $1
  `;
  const docResult = await db.query(docQuery, [id]);
  let document = docResult.rows[0];

  if (!document) return null;

  // Apply Phase 1.1 Restrictions
  document = applyRestriction(document, userId, role);

  // Set sender_name consistently
  document.sender_name = document.behalf_of_position_title || document.creator_name;

  // 2. CC/BCC Recipients
  let recipientQuery = `
    SELECT dr.*, d.name as department_name
    FROM document_recipients dr
    JOIN departments d ON dr.department_id = d.id
    WHERE dr.document_id = $1
  `;
  const recipientResult = await db.query(recipientQuery, [id]);
  const allRecipients = recipientResult.rows;

  document.cc = allRecipients.filter(r => r.recipient_type === 'cc');
  
  if (role === 'super_admin') {
    document.bcc = allRecipients.filter(r => r.recipient_type === 'bcc');
  } else {
    document.bcc = allRecipients.filter(r => r.recipient_type === 'bcc' && r.department_id === userDeptId);
  }

  // 3. References
  const refQuery = `
    SELECT r.id, r.subject, r.outward_number, r.status
    FROM document_references dr
    JOIN documents r ON dr.reference_id = r.id
    WHERE dr.document_id = $1
  `;
  const refResult = await db.query(refQuery, [id]);
  document.references = refResult.rows;

  // 4. Forwarding History
  const forwardQuery = `
    SELECT df.*, u.name as from_user_name, fd.name as from_department_name, td.name as to_department_name
    FROM document_forwards df
    JOIN users u ON df.from_user_id = u.id
    JOIN departments fd ON df.from_department_id = fd.id
    JOIN departments td ON df.to_department_id = td.id
    WHERE df.document_id = $1
    ORDER BY df.forwarded_at ASC
  `;
  const forwardResult = await db.query(forwardQuery, [id]);
  document.forwarding_history = forwardResult.rows;

  // 5. Audit Trail
  const auditQuery = `
    SELECT al.*, u.name as actor_name
    FROM audit_logs al
    JOIN users u ON al.actor_id = u.id
    WHERE al.entity_type = 'document' AND al.entity_id = $1
    ORDER BY al.created_at DESC
  `;
  const auditResult = await db.query(auditQuery, [id]);
  document.audit_logs = auditResult.rows;

  return document;
};

/**
 * Lists all documents where the department is sender, receiver, or CC/BCC.
 */
const getDepartmentHistory = async (departmentId, userId, role, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const whereClause = `
    WHERE (d.sender_department_id = $1 OR d.receiver_department_id = $1 OR dr.department_id = $1)
      AND d.status != 'draft'
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT d.id) 
    FROM documents d
    LEFT JOIN document_recipients dr ON d.id = dr.document_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT DISTINCT 
      d.*, 
      u.name as creator_name, 
      COALESCE(p.title, u.name) as sender_name,
      sd.name as sender_department_name, 
      rd.name as receiver_department_name,
      au.name as assignee_name
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN positions p ON d.behalf_of_position_id = p.id
    JOIN departments sd ON d.sender_department_id = sd.id
    JOIN departments rd ON d.receiver_department_id = rd.id
    LEFT JOIN document_recipients dr ON d.id = dr.document_id
    LEFT JOIN users au ON d.assigned_to = au.id
    ${whereClause}
    ORDER BY d.updated_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countRes = await db.query(countQuery, [departmentId]);
  const dataRes = await db.query(dataQuery, [departmentId, limit, offset]);

  return {
    total: parseInt(countRes.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataRes.rows.map(doc => applyRestriction(doc, userId, role))
  };
};



module.exports = {
  createDocument,
  getInbox,
  pickupDocument,
  startProcessing,
  completeDocument,
  forwardDocument,
  getMyDocuments,
  getDepartmentHistory,
  listAllDocuments,
  getDocumentDetail
};
