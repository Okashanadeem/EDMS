const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const { sendOtp } = require('../../utils/mailer');
const { auditLog } = require('../../utils/auditLogger');
const { generateNumber } = require('../../utils/numbering');

/**
 * Requests an OTP for a document to be sent on behalf of an officer.
 */
const requestOtp = async (documentId, assistantId) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify document and authority
    const query = `
      SELECT d.*, u.email as officer_email, u.name as officer_name, u.can_send_on_behalf
      FROM documents d
      JOIN users u ON d.behalf_of_officer_id = u.id
      WHERE d.id = $1 AND d.status = 'draft' AND (d.created_by = $2 OR d.draft_submitted_by = $2)
    `;
    const result = await client.query(query, [documentId, assistantId]);
    const doc = result.rows[0];

    if (!doc) throw new Error('Document not found or unauthorized.');
    if (!doc.can_send_on_behalf) throw new Error('Officer has not enabled delegated sending.');

    // 2. Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // 3. Invalidate previous OTPs for this document
    await client.query('UPDATE document_otps SET used = TRUE WHERE document_id = $1', [documentId]);

    // 4. Store new OTP
    await client.query(
      'INSERT INTO document_otps (document_id, officer_id, assistant_id, otp_hash, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [documentId, doc.behalf_of_officer_id, assistantId, otpHash, expiresAt]
    );

    // 5. Send Email
    await sendOtp(doc.officer_email, doc.officer_name, otpCode, doc.subject);

    // 6. Audit Log
    await auditLog({
      actorId: assistantId,
      action: 'otp.requested',
      entityType: 'document',
      entityId: documentId,
      metadata: { officer_id: doc.behalf_of_officer_id },
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
      metadata: { outward_number: outwardNumber, officer_id: otpRow.officer_id },
      client
    });

    await auditLog({
      actorId: assistantId,
      action: 'document.sent_on_behalf',
      entityType: 'document',
      entityId: documentId,
      metadata: { outward_number: outwardNumber, officer_id: otpRow.officer_id },
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
