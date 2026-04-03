const fs = require('fs');
const path = require('path');
const db = require('../../config/db');

/**
 * Helper to wipe uploads directory.
 */
const wipeUploads = () => {
  const uploadDir = path.resolve(__dirname, '../../../../uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      if (file !== '.gitkeep' && file !== '.gitignore') {
        const filePath = path.join(uploadDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }
  }
};

/**
 * Clears all dynamic data in the system while preserving the initial super admin.
 */
const cleanup = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM document_otps');
    await client.query('DELETE FROM document_references');
    await client.query('DELETE FROM document_recipients');
    await client.query('DELETE FROM document_forwards');
    await client.query('DELETE FROM ocr_queue');
    await client.query('DELETE FROM legacy_imports');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM doc_number_sequences');
    await client.query("DELETE FROM users WHERE email != 'superadmin@edms.local'");
    await client.query('DELETE FROM positions');
    await client.query('DELETE FROM departments');

    await client.query('COMMIT');
    wipeUploads();

    return { success: true, message: 'Comprehensive cleanup successful.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deletes all documents and related tracking data.
 */
const cleanupDocuments = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM document_otps');
    await client.query('DELETE FROM document_references');
    await client.query('DELETE FROM document_recipients');
    await client.query('DELETE FROM document_forwards');
    await client.query('DELETE FROM ocr_queue');
    await client.query('DELETE FROM legacy_imports');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM doc_number_sequences');
    await client.query('COMMIT');
    wipeUploads();
    return { success: true, message: 'All documents and numbering sequences cleared.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deletes all users except superadmin.
 */
const cleanupUsers = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("DELETE FROM users WHERE email != 'superadmin@edms.local'");
    await client.query('COMMIT');
    return { success: true, message: 'All users (except superadmin) cleared.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deletes all departments and positions.
 */
const cleanupDepartments = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM positions');
    await client.query('DELETE FROM departments');
    await client.query('COMMIT');
    return { success: true, message: 'All departments and positions cleared.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deletes all audit logs.
 */
const cleanupLogs = async () => {
  await db.query('DELETE FROM audit_logs');
  return { success: true, message: 'All audit logs cleared.' };
};

module.exports = {
  cleanup,
  cleanupDocuments,
  cleanupUsers,
  cleanupDepartments,
  cleanupLogs
};
