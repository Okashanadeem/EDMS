const db = require('../../config/db');

/**
 * Lists audit logs with optional filters.
 */
const listLogs = async ({ entity_id, actor_id, action, from, to }) => {
  let query = `
    SELECT al.*, u.name as actor_name
    FROM audit_logs al
    JOIN users u ON al.actor_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let counter = 1;

  if (entity_id) {
    query += ` AND al.entity_id = $${counter++}`;
    params.push(entity_id);
  }
  if (actor_id) {
    query += ` AND al.actor_id = $${counter++}`;
    params.push(actor_id);
  }
  if (action) {
    query += ` AND al.action = $${counter++}`;
    params.push(action);
  }
  if (from) {
    query += ` AND al.created_at >= $${counter++}`;
    params.push(from);
  }
  if (to) {
    query += ` AND al.created_at <= $${counter++}`;
    params.push(to);
  }

  query += ' ORDER BY al.created_at DESC LIMIT 1000';
  const result = await db.query(query, params);
  return result.rows;
};

module.exports = {
  listLogs
};
