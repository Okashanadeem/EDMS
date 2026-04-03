const db = require('../../config/db');

/**
 * Lists audit logs with optional filters.
 */
const listLogs = async ({ entity_id, actor_id, action, from, to, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  const params = [];
  let counter = 1;

  if (entity_id) {
    whereClause += ` AND al.entity_id = $${counter++}`;
    params.push(entity_id);
  }
  if (actor_id) {
    whereClause += ` AND al.actor_id = $${counter++}`;
    params.push(actor_id);
  }
  if (action) {
    whereClause += ` AND al.action = $${counter++}`;
    params.push(action);
  }
  if (from) {
    whereClause += ` AND al.created_at >= $${counter++}`;
    params.push(from);
  }
  if (to) {
    whereClause += ` AND al.created_at <= $${counter++}`;
    params.push(to);
  }

  const countQuery = `SELECT COUNT(*) FROM audit_logs al ${whereClause}`;
  const dataQuery = `
    SELECT al.*, u.name as actor_name, p.title as position_title
    FROM audit_logs al
    JOIN users u ON al.actor_id = u.id
    LEFT JOIN positions p ON al.position_id = p.id
    ${whereClause}
    ORDER BY al.created_at DESC 
    LIMIT $${counter++} OFFSET $${counter++}
  `;

  const countResult = await db.query(countQuery, params);
  const dataResult = await db.query(dataQuery, [...params, limit, offset]);

  return {
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataResult.rows
  };
};


module.exports = {
  listLogs
};
