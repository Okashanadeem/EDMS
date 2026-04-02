const db = require('../../config/db');
const { auditLog } = require('../../utils/auditLogger');
const generateNumber = require('../../utils/numbering');

/**
 * Lists drafts for a user.
 * Workers/Assistants see their own drafts.
 * Officers see their own drafts AND drafts submitted to them.
 */
const listDrafts = async (userId, role) => {
  // Get user's position_id for thorough filtering
  const userRes = await db.query('SELECT position_id FROM users WHERE id = $1', [userId]);
  const userPosId = userRes.rows[0]?.position_id;

  let query = `
    SELECT d.*, u.name as creator_name, off.name as officer_name, sub.name as submitter_name
    FROM documents d
    JOIN users u ON d.created_by = u.id
    LEFT JOIN users off ON d.behalf_of_officer_id = off.id
    LEFT JOIN users sub ON d.draft_submitted_by = sub.id
    WHERE d.status = 'draft'
  `;
  const params = [];

  if (role === 'officer') {
    query += ' AND (d.created_by = $1 OR d.behalf_of_officer_id = $1';
    params.push(userId);
    if (userPosId) {
      query += ` OR d.behalf_of_position_id = $${params.length + 1}`;
      params.push(userPosId);
    }
    query += ')';
  } else {
    query += ' AND d.created_by = $1';
    params.push(userId);
  }

  query += ' ORDER BY d.updated_at DESC';
  const result = await db.query(query, params);
  const drafts = result.rows;

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

  return drafts;
};

/**
 * Creates a new draft.
 */
const createDraft = async (userId, deptId, data) => {
  const { 
    subject, body_html, receiver_department_id, 
    cc, bcc, references, is_restricted, restricted_to_user_id,
    behalf_of_officer_id, behalf_of_position_id 
  } = data;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO documents (
        subject, body_html, status, created_by, 
        sender_department_id, receiver_department_id,
        behalf_of_officer_id, behalf_of_position_id, 
        is_restricted, restricted_to_user_id
      )
      VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await client.query(query, [
      subject, body_html, userId, deptId, receiver_department_id,
      behalf_of_officer_id || null, behalf_of_position_id || null,
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
      metadata: { subject: draft.subject },
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
    draft_revision_note, file_path
  } = data;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership or officer relationship
    const checkQuery = 'SELECT created_by, behalf_of_officer_id, draft_submitted_at, draft_revision_note FROM documents WHERE id = $1 AND status = \'draft\'';
    const checkResult = await client.query(checkQuery, [draftId]);
    const existing = checkResult.rows[0];

    if (!existing) throw new Error('Draft not found.');

    // Edit Restriction: Assistant can only edit if not submitted OR if revision note is present
    if (role === 'assistant' && existing.draft_submitted_at && !existing.draft_revision_note) {
      throw new Error('Draft is currently under review and cannot be edited.');
    }
    
    const query = `
      UPDATE documents 
      SET subject = COALESCE($1, subject),
          body_html = COALESCE($2, body_html),
          receiver_department_id = COALESCE($3, receiver_department_id),
          is_restricted = COALESCE($4, is_restricted),
          restricted_to_user_id = COALESCE($5, restricted_to_user_id),
          draft_revision_note = COALESCE($6, draft_revision_note),
          behalf_of_officer_id = COALESCE($7, behalf_of_officer_id),
          behalf_of_position_id = COALESCE($8, behalf_of_position_id),
          file_path = COALESCE($9, file_path),
          updated_at = NOW()
      WHERE id = $10 AND status = 'draft'
      RETURNING *
    `;
    const result = await client.query(query, [
      subject, body_html, receiver_department_id, 
      is_restricted, restricted_to_user_id, draft_revision_note,
      data.behalf_of_officer_id || null, data.behalf_of_position_id || null,
      file_path !== undefined ? file_path : null,
      draftId
    ]);
    const draft = result.rows[0];

    // CC/BCC/References are easier to recreate for drafts
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
 * Assistant submits draft to officer.
 */
const submitDraft = async (draftId, userId) => {
  const query = `
    UPDATE documents 
    SET draft_submitted_by = $1, 
        draft_submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = $2 AND status = 'draft' AND (behalf_of_officer_id IS NOT NULL OR behalf_of_position_id IS NOT NULL)
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
    metadata: { officer_id: draft.behalf_of_officer_id }
  });

  return draft;
};

/**
 * Officer approves and dispatches a draft.
 */
const approveDraft = async (draftId, officerId) => {
  const userRes = await db.query('SELECT position_id FROM users WHERE id = $1', [officerId]);
  const userPosId = userRes.rows[0]?.position_id;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify eligibility (User ID or Position ID)
    let checkQuery = 'SELECT * FROM documents WHERE id = $1 AND status = \'draft\' AND (behalf_of_officer_id = $2';
    const checkParams = [draftId, officerId];
    if (userPosId) {
      checkQuery += ' OR behalf_of_position_id = $3';
      checkParams.push(userPosId);
    }
    checkQuery += ')';

    const checkResult = await client.query(checkQuery, checkParams);
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
      metadata: { outward_number: outwardNumber },
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

  let query = `
    UPDATE documents 
    SET draft_revision_note = $1,
        updated_at = NOW()
    WHERE id = $2 AND status = 'draft' AND (behalf_of_officer_id = $3
  `;
  const params = [note, draftId, officerId];
  if (userPosId) {
    query += ' OR behalf_of_position_id = $4';
    params.push(userPosId);
  }
  query += ') RETURNING *';

  const result = await db.query(query, params);
  const draft = result.rows[0];

  if (!draft) throw new Error('Draft not found or unauthorized.');

  await auditLog({
    actorId: officerId,
    action: 'draft.revision_requested',
    entityType: 'document',
    entityId: draftId,
    metadata: { note }
  });

  return draft;
};

/**
 * Deletes a draft.
 */
const deleteDraft = async (draftId, userId) => {
  const query = 'DELETE FROM documents WHERE id = $1 AND created_by = $2 AND status = \'draft\' RETURNING id';
  const result = await db.query(query, [draftId, userId]);
  
  if (result.rowCount === 0) throw new Error('Draft not found or unauthorized.');

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
