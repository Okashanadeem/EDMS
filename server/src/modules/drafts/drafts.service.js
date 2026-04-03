const db = require('../../config/db');
const { auditLog } = require('../../utils/auditLogger');
const generateNumber = require('../../utils/numbering');
const { deleteFile } = require('../../utils/storage');

/**
 * Lists drafts for a user.
 * Workers see their own drafts.
 * Assistants see their drafts.
 * Officers see their own drafts AND drafts submitted to their position.
 */
const listDrafts = async (userId, role, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  // Get user's position_id for thorough filtering
  const userRes = await db.query('SELECT position_id FROM users WHERE id = $1', [userId]);
  const userPosId = userRes.rows[0]?.position_id;

  let whereClause = "WHERE d.status = 'draft'";
  const params = [];

  if (role === 'officer' && userPosId) {
    whereClause += ' AND (d.created_by = $1 OR d.behalf_of_position_id = $2)';
    params.push(userId, userPosId);
  } else {
    whereClause += ' AND d.created_by = $1';
    params.push(userId);
  }

  const countQuery = `SELECT COUNT(*) FROM documents d ${whereClause}`;
  const dataQuery = `
    SELECT d.*, u.name as creator_name, sub.name as submitter_name, p.title as behalf_of_position_title
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN users sub ON d.draft_submitted_by = sub.id
    LEFT JOIN positions p ON d.behalf_of_position_id = p.id
    ${whereClause}
    ORDER BY d.updated_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const countResult = await db.query(countQuery, params);
  const dataResult = await db.query(dataQuery, [...params, limit, offset]);
  const drafts = dataResult.rows;

  // Enrich with CC, BCC, and References
  for (const draft of drafts) {
    const recipients = await db.query(
      'SELECT dr.*, d.name as department_name FROM document_recipients dr JOIN departments d ON dr.department_id = d.id WHERE dr.document_id = $1',
      [draft.id]
    );
    draft.cc = recipients.rows.filter(r => r.recipient_type === 'cc').map(r => r.department_id);
    draft.bcc = recipients.rows.filter(r => r.recipient_type === 'bcc').map(r => r.department_id);

    const refs = await db.query(
      'SELECT r.id, r.subject, r.outward_number FROM document_references dr JOIN documents r ON dr.reference_id = r.id WHERE dr.document_id = $1',
      [draft.id]
    );
    draft.references = refs.rows;
  }

  return {
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: drafts
  };
};


/**
 * Creates a new draft.
 * Automatically links to the parent position if the creator is an assistant.
 */
const createDraft = async (userId, deptId, data) => {
  const { 
    subject, body_html, receiver_department_id, 
    cc, bcc, references, is_restricted, restricted_to_user_id
  } = data;

  // Determine behalf_of_position_id
  const userRes = await db.query('SELECT position_id FROM users WHERE id = $1', [userId]);
  const userPosId = userRes.rows[0]?.position_id;
  
  let finalBehalfOfPos = data.behalf_of_position_id;
  
  if (!finalBehalfOfPos && userPosId) {
    const posRes = await db.query('SELECT parent_id FROM positions WHERE id = $1', [userPosId]);
    finalBehalfOfPos = posRes.rows[0]?.parent_id || null;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO documents (
        subject, body_html, status, created_by, 
        sender_department_id, receiver_department_id,
        behalf_of_position_id, 
        is_restricted, restricted_to_user_id
      )
      VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await client.query(query, [
      subject, body_html, userId, deptId, receiver_department_id,
      finalBehalfOfPos,
      is_restricted || false, restricted_to_user_id || null
    ]);

    const draft = result.rows[0];

    // Handle CC/BCC
    if (cc && Array.isArray(cc)) {
      for (const deptId of cc) {
        await client.query(
          'INSERT INTO document_recipients (document_id, department_id, recipient_type) VALUES ($1, $2, $3)',
          [draft.id, deptId, 'cc']
        );
      }
    }
    if (bcc && Array.isArray(bcc)) {
      for (const deptId of bcc) {
        await client.query(
          'INSERT INTO document_recipients (document_id, department_id, recipient_type) VALUES ($1, $2, $3)',
          [draft.id, deptId, 'bcc']
        );
      }
    }

    // Handle References
    if (references && Array.isArray(references)) {
      for (const refId of references) {
        await client.query(
          'INSERT INTO document_references (document_id, reference_id) VALUES ($1, $2)',
          [draft.id, refId]
        );
      }
    }

    await auditLog({
      actorId: userId,
      action: 'draft.saved',
      entityType: 'document',
      entityId: draft.id,
      metadata: { subject: draft.subject, behalf_of_position_id: finalBehalfOfPos },
      client
    });

    await client.query('COMMIT');
    return draft;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Updates an existing draft.
 */
const updateDraft = async (draftId, userId, data, role) => {
  const { 
    subject, body_html, receiver_department_id, 
    cc, bcc, references, is_restricted, restricted_to_user_id,
    draft_revision_note, file_path, behalf_of_position_id
  } = data;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership or position relationship
    const checkQuery = `
      SELECT d.created_by, d.behalf_of_position_id, d.draft_submitted_at, d.draft_revision_note, u.position_id
      FROM documents d
      JOIN users u ON u.id = $2
      WHERE d.id = $1 AND d.status = 'draft'
    `;
    const checkResult = await client.query(checkQuery, [draftId, userId]);
    const existing = checkResult.rows[0];

    if (!existing) throw new Error('Draft not found.');

    // Edit Restriction: Assistant can only edit if not submitted OR if revision note is present
    if (role === 'assistant' && existing.draft_submitted_at && !existing.draft_revision_note) {
      throw new Error('Draft is currently under review and cannot be edited.');
    }
    
    // Auth Check: Must be creator OR hold the target position
    if (existing.created_by !== userId && existing.behalf_of_position_id !== existing.position_id) {
       throw new Error('Unauthorized to edit this draft.');
    }

    const query = `
      UPDATE documents 
      SET subject = COALESCE($1, subject),
          body_html = COALESCE($2, body_html),
          receiver_department_id = COALESCE($3, receiver_department_id),
          is_restricted = COALESCE($4, is_restricted),
          restricted_to_user_id = COALESCE($5, restricted_to_user_id),
          draft_revision_note = COALESCE($6, draft_revision_note),
          behalf_of_position_id = COALESCE($7, behalf_of_position_id),
          file_path = COALESCE($8, file_path),
          updated_at = NOW()
      WHERE id = $9 AND status = 'draft'
      RETURNING *
    `;
    const result = await client.query(query, [
      subject, body_html, receiver_department_id, 
      is_restricted, restricted_to_user_id, draft_revision_note,
      behalf_of_position_id || null,
      file_path !== undefined ? file_path : null,
      draftId
    ]);
    const draft = result.rows[0];

    // CC/BCC/References recreate
    if (cc !== undefined || bcc !== undefined) {
      await client.query('DELETE FROM document_recipients WHERE document_id = $1', [draftId]);
      if (cc && Array.isArray(cc)) {
        for (const deptId of cc) {
          await client.query(
            'INSERT INTO document_recipients (document_id, department_id, recipient_type) VALUES ($1, $2, $3)',
            [draftId, deptId, 'cc']
          );
        }
      }
      if (bcc && Array.isArray(bcc)) {
        for (const deptId of bcc) {
          await client.query(
            'INSERT INTO document_recipients (document_id, department_id, recipient_type) VALUES ($1, $2, $3)',
            [draftId, deptId, 'bcc']
          );
        }
      }
    }

    if (references !== undefined) {
      await client.query('DELETE FROM document_references WHERE document_id = $1', [draftId]);
      if (references && Array.isArray(references)) {
        for (const refId of references) {
          await client.query(
            'INSERT INTO document_references (document_id, reference_id) VALUES ($1, $2)',
            [draftId, refId]
          );
        }
      }
    }

    await auditLog({
      actorId: userId,
      action: 'draft.saved',
      entityType: 'document',
      entityId: draft.id,
      metadata: { subject: draft.subject, updated_fields: Object.keys(data) },
      client
    });

    await client.query('COMMIT');
    return draft;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Assistant submits draft to officer position.
 */
const submitDraft = async (draftId, userId) => {
  const query = `
    UPDATE documents 
    SET draft_submitted_by = $1, 
        draft_submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = $2 AND status = 'draft' AND behalf_of_position_id IS NOT NULL
    RETURNING *
  `;
  const result = await db.query(query, [userId, draftId]);
  const draft = result.rows[0];

  if (!draft) throw new Error('Draft not found or not eligible for submission.');

  await auditLog({
    actorId: userId,
    action: 'draft.submitted',
    entityType: 'document',
    entityId: draft.id,
    metadata: { behalf_of_position_id: draft.behalf_of_position_id }
  });

  return draft;
};

/**
 * Officer approves and dispatches a draft.
 */
const approveDraft = async (draftId, officerId) => {
  const userRes = await db.query('SELECT position_id FROM users WHERE id = $1', [officerId]);
  const userPosId = userRes.rows[0]?.position_id;

  if (!userPosId) throw new Error('Officer must be assigned to a position.');

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify eligibility via Position ID
    const checkQuery = `
      SELECT * FROM documents 
      WHERE id = $1 AND status = 'draft' 
      AND (created_by = $2 OR behalf_of_position_id = $3)
    `;
    const checkResult = await client.query(checkQuery, [draftId, officerId, userPosId]);
    const draft = checkResult.rows[0];

    if (!draft) throw new Error('Draft not found or unauthorized.');

    // 2. Generate Outward Number
    const outwardNumber = await generateNumber(draft.sender_department_id, 'outward', client);

    // 3. Dispatch
    const updateQuery = `
      UPDATE documents 
      SET status = 'in_transit',
          outward_number = $1,
          behalf_approved = TRUE,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await client.query(updateQuery, [outwardNumber, draftId]);
    const finalDoc = result.rows[0];


    await auditLog({
      actorId: officerId,
      action: 'draft.approved',
      entityType: 'document',
      entityId: draftId,
      metadata: { outward_number: outwardNumber, position_id: userPosId },
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
 * Officer requests revisions.
 */
const reviseDraft = async (draftId, officerId, note) => {
  const userRes = await db.query('SELECT position_id FROM users WHERE id = $1', [officerId]);
  const userPosId = userRes.rows[0]?.position_id;

  if (!userPosId) throw new Error('Officer must be assigned to a position.');

  const query = `
    UPDATE documents 
    SET draft_revision_note = $1,
        updated_at = NOW()
    WHERE id = $2 AND status = 'draft' 
      AND (created_by = $3 OR behalf_of_position_id = $4)
    RETURNING *
  `;
  const result = await db.query(query, [note, draftId, officerId, userPosId]);
  const draft = result.rows[0];

  if (!draft) throw new Error('Draft not found or unauthorized.');

  await auditLog({
    actorId: officerId,
    action: 'draft.revision_requested',
    entityType: 'document',
    entityId: draftId,
    metadata: { note, position_id: userPosId }
  });

  return draft;
};

/**
 * Deletes a draft.
 */
const deleteDraft = async (draftId, userId) => {
  // 1. Get file path before deletion
  const checkQuery = 'SELECT file_path FROM documents WHERE id = $1 AND created_by = $2 AND status = \'draft\'';
  const checkRes = await db.query(checkQuery, [draftId, userId]);
  const draft = checkRes.rows[0];

  if (!draft) throw new Error('Draft not found or unauthorized.');

  // 2. Delete Record
  const query = 'DELETE FROM documents WHERE id = $1 AND created_by = $2 AND status = \'draft\' RETURNING id';
  const result = await db.query(query, [draftId, userId]);
  
  if (result.rowCount === 0) throw new Error('Draft not found or unauthorized.');

  // 3. Delete Physical File
  if (draft.file_path) {
    await deleteFile(draft.file_path);
  }

  await auditLog({
    actorId: userId,
    action: 'draft.deleted',
    entityType: 'document',
    entityId: draftId
  });

  return true;
};


module.exports = {
  listDrafts,
  createDraft,
  updateDraft,
  submitDraft,
  approveDraft,
  reviseDraft,
  deleteDraft
};

