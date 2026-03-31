const db = require('../../config/db');

/**
 * Clears all dynamic data in the system while preserving the initial super admin.
 * Use for rapid cleanup during testing.
 */
const cleanup = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete all document-related history
    await client.query('DELETE FROM document_forwards');
    await client.query('DELETE FROM audit_logs');
    
    // 2. Delete all documents
    await client.query('DELETE FROM documents');
    
    // 3. Reset document numbering sequences
    await client.query('UPDATE doc_number_sequences SET last_number = 0');
    
    // 4. Delete all users except the initial super admin
    // Note: We avoid deleting 'superadmin@edms.local'
    await client.query(`
      DELETE FROM users 
      WHERE email != 'superadmin@edms.local'
    `);
    
    // 5. Delete all departments (optional, but requested for 'full cleanup')
    // We can only delete them if we don't mind recreating them
    await client.query('DELETE FROM departments');

    await client.query('COMMIT');
    return { success: true, message: 'Cleanup successful. All dynamic data removed.' };
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
