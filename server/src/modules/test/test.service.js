const fs = require('fs');
const path = require('path');
const db = require('../../config/db');

/**
 * Clears all dynamic data in the system while preserving the initial super admin.
 * Comprehensive cleanup for Milestone 14.
 */
const cleanup = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete all high-level dependencies
    await client.query('DELETE FROM document_otps');
    await client.query('DELETE FROM document_references');
    await client.query('DELETE FROM document_recipients');
    await client.query('DELETE FROM document_forwards');
    await client.query('DELETE FROM ocr_queue');
    await client.query('DELETE FROM legacy_imports');
    await client.query('DELETE FROM audit_logs');
    
    // 2. Delete all documents
    await client.query('DELETE FROM documents');
    
    // 3. Reset document numbering sequences
    await client.query('DELETE FROM doc_number_sequences');
    
    // 4. Delete all users except the initial super admin
    await client.query("DELETE FROM users WHERE email != 'superadmin@edms.local'");
    
    // 5. Delete positions (must happen after users are cleared)
    await client.query('DELETE FROM positions');

    // 6. Delete departments (must happen after positions and sequences)
    await client.query('DELETE FROM departments');

    await client.query('COMMIT');

    // 7. Wipe uploads directory
    const uploadDir = path.join(__dirname, '../../../uploads');
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

    return { success: true, message: 'Comprehensive cleanup successful. System reset to initial state.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


module.exports = {
  cleanup
};
