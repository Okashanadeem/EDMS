const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const { sendOtp } = require('../../utils/mailer');
const { auditLog } = require('../../utils/auditLogger');
const generateNumber = require('../../utils/numbering');


/**
 * Requests an OTP for a document to be sent on behalf of an officer position.
 */
const requestOtp = async (documentId, assistantId) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch assistant's position and its parent (officer position)
    const assistantQuery = `
      SELECT u.position_id, p.parent_id as officer_position_id
      FROM users u
      JOIN positions p ON u.position_id = p.id
      WHERE u.id = $1
    `;
    const assistantRes = await client.query(assistantQuery, [assistantId]);
    const { position_id: assistantPosId, officer_position_id: officerPosId } = assistantRes.rows[0] || {};

    if (!officerPosId) throw new Error('No officer position linked to your current position.');

    // 2. Find the active user currently holding the officer position
    const officerQuery = `
      SELECT u.id, u.email, u.name, u.can_send_on_behalf
      FROM users u
      WHERE u.position_id = $1 AND u.is_active = TRUE
      LIMIT 1
    `;
    const officerRes = await client.query(officerQuery, [officerPosId]);
    const officer = officerRes.rows[0];

    if (!officer) throw new Error('The officer position is currently vacant or inactive.');
    if (!officer.can_send_on_behalf) throw new Error('Officer has not enabled delegated sending.');

    // 3. Verify document exists and belongs to this position hierarchy
    const docQuery = `
      SELECT id, subject FROM documents 
      WHERE id = $1 AND status = 'draft' AND behalf_of_position_id = $2
    `;
    const docRes = await client.query(docQuery, [documentId, officerPosId]);
    if (docRes.rowCount === 0) throw new Error('Document not found or not assigned to your officer.');

    // 4. Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // 5. Invalidate previous OTPs for this document
    await client.query('UPDATE document_otps SET used = TRUE WHERE document_id = $1', [documentId]);

    // 6. Store new OTP with position context
    await client.query(
      `INSERT INTO document_otps 
       (document_id, officer_id, assistant_id, officer_position_id, assistant_position_id, otp_hash, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [documentId, officer.id, assistantId, officerPosId, assistantPosId, otpHash, expiresAt]
    );

    // 7. Send Email to the current officer
    await sendOtp(officer.email, officer.name, otpCode, docRes.rows[0].subject);

    // 8. Audit Log
    await auditLog({
      actorId: assistantId,
      action: 'otp.requested',
      entityType: 'document',
      entityId: documentId,
      metadata: { 
        officer_id: officer.id, 
        officer_position_id: officerPosId,
        assistant_position_id: assistantPosId 
      },
      client
    });

    await client.query('COMMIT');
    return { success: true, message: 'OTP sent to officer email.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verifies OTP and dispatches document.
 */
const verifyOtp = async (documentId, assistantId, otpCode) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch latest valid OTP
    const otpQuery = `
      SELECT * FROM document_otps 
      WHERE document_id = $1 AND assistant_id = $2 AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    const otpResult = await client.query(otpQuery, [documentId, assistantId]);
    const otpRow = otpResult.rows[0];

    if (!otpRow) throw new Error('Invalid or expired OTP.');

    // 2. Compare Hash
    const isMatch = await bcrypt.compare(otpCode, otpRow.otp_hash);
    if (!isMatch) throw new Error('Invalid OTP code.');

    // 3. Mark OTP used
    await client.query('UPDATE document_otps SET used = TRUE WHERE id = $1', [otpRow.id]);

    // 4. Dispatch Document
    const docQuery = 'SELECT * FROM documents WHERE id = $1';
    const docResult = await client.query(docQuery, [documentId]);
    const doc = docResult.rows[0];

    const outwardNumber = await generateNumber(doc.sender_department_id, 'outward', client);

    const updateDocQuery = `
      UPDATE documents 
      SET status = 'in_transit',
          outward_number = $1,
          behalf_otp_used = TRUE,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const finalResult = await client.query(updateDocQuery, [outwardNumber, documentId]);

    // 5. Audit Log
    await auditLog({
      actorId: assistantId,
      action: 'otp.verified',
      entityType: 'document',
      entityId: documentId,
      metadata: { 
        outward_number: outwardNumber, 
        officer_id: otpRow.officer_id,
        officer_position_id: otpRow.officer_position_id 
      },
      client
    });

    await auditLog({
      actorId: assistantId,
      action: 'document.sent_on_behalf',
      entityType: 'document',
      entityId: documentId,
      metadata: { 
        outward_number: outwardNumber, 
        officer_id: otpRow.officer_id,
        officer_position_id: otpRow.officer_position_id 
      },
      client
    });

    await client.query('COMMIT');
    return finalResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


module.exports = {
  requestOtp,
  verifyOtp
};
