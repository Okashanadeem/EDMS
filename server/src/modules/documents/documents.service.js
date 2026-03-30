const db = require('../../config/db');
const generateNumber = require('../../utils/numbering');
const auditLog = require('../../utils/auditLogger');

/**
 * Creates and dispatches a document.
 * Transactional: Insert Doc + Generate Outward No + Audit Log.
 */
const createDocument = async ({ subject, body, file_path, receiver_department_id, created_by, sender_department_id }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Generate Outward Number
    const outwardNumber = await generateNumber(sender_department_id, 'outward', client);

    // 2. Insert Document
    const insertDocQuery = `
      INSERT INTO documents (
        subject, body, file_path, status, created_by, 
        sender_department_id, receiver_department_id, outward_number
      )
      VALUES ($1, $2, $3, 'in_transit', $4, $5, $6, $7)
      RETURNING *
    `;
    const docResult = await client.query(insertDocQuery, [
      subject, body, file_path, created_by, 
      sender_department_id, receiver_department_id, outwardNumber
    ]);
    const document = docResult.rows[0];

    // 3. Write Audit Log
    await auditLog({
      actorId: created_by,
      action: 'document.created',
      entityType: 'document',
      entityId: document.id,
      metadata: { subject, outward_number: outwardNumber, receiver_department_id },
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
 * Lists documents for a department's inbox (in_transit, unclaimed).
 */
const getInbox = async (departmentId) => {
  const query = `
    SELECT d.*, u.name as creator_name, sd.name as sender_department_name
    FROM documents d
    JOIN users u ON d.created_by = u.id
    JOIN departments sd ON d.sender_department_id = sd.id
    WHERE d.receiver_department_id = $1 AND d.status = 'in_transit' AND d.assigned_to IS NULL
    ORDER BY d.created_at DESC
  `;
  const result = await db.query(query, [departmentId]);
  return result.rows;
};

/**
 * Worker claims a document from the inbox.
 * Atomic: SET assigned_to = $workerId WHERE assigned_to IS NULL.
 */
const pickupDocument = async (id, workerId, departmentId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Atomic update to claim ownership
    const pickupQuery = `
      UPDATE documents
      SET assigned_to = $1, status = 'picked_up', picked_up_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND assigned_to IS NULL AND status = 'in_transit' AND receiver_department_id = $3
      RETURNING *
    `;
    const pickupResult = await client.query(pickupQuery, [workerId, id, departmentId]);
    
    if (pickupResult.rowCount === 0) {
      throw new Error('CONFLICT'); // Already picked up or not in inbox
    }
    
    const document = pickupResult.rows[0];

    // 2. Generate Inward Number
    const inwardNumber = await generateNumber(departmentId, 'inward', client);
    
    // 3. Update document with inward number
    const updateInwardQuery = 'UPDATE documents SET inward_number = $1 WHERE id = $2 RETURNING *';
    const finalResult = await client.query(updateInwardQuery, [inwardNumber, id]);
    const finalDoc = finalResult.rows[0];

    // 4. Write Audit Log
    await auditLog({
      actorId: workerId,
      action: 'document.picked_up',
      entityType: 'document',
      entityId: id,
      metadata: { inward_number: inwardNumber, subject: finalDoc.subject },
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

module.exports = {
  createDocument,
  getInbox,
  pickupDocument
};
