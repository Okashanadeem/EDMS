const db = require('../../config/db');

/**
 * Lists all departments.
 * Security: Hides 'System Administration' from non-super-admins.
 */
const listDepartments = async (actorRole, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let query = 'FROM departments WHERE 1=1';
  
  if (actorRole !== 'super_admin') {
    query += " AND name != 'System Administration'";
  }
  
  const countResult = await db.query(`SELECT COUNT(*) ${query}`);
  const dataResult = await db.query(`SELECT id, name, code, is_active, created_at ${query} ORDER BY name ASC LIMIT $1 OFFSET $2`, [limit, offset]);

  return {
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataResult.rows
  };
};



/**
 * Creates a new department.
 */
const createDepartment = async ({ name, code }) => {
  const query = 'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *';
  const result = await db.query(query, [name, code]);
  return result.rows[0];
};

/**
 * Updates a department's details (partial update supported).
 */
const updateDepartment = async (id, updates) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(updates.name);
  }
  if (updates.code !== undefined) {
    fields.push(`code = $${index++}`);
    values.push(updates.code);
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.is_active);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE departments 
    SET ${fields.join(', ')} 
    WHERE id = $${index} 
    RETURNING *
  `;
  
  const result = await db.query(query, values);
  return result.rows[0];
};

/**
 * Soft-deletes a department.
 */
const deleteDepartment = async (id) => {
  const query = 'UPDATE departments SET is_active = false WHERE id = $1 RETURNING *';
  const result = await db.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
