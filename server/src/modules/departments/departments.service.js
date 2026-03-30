const db = require('../../config/db');

/**
 * Lists all active departments.
 */
const listDepartments = async () => {
  const query = 'SELECT id, name, code, is_active, created_at FROM departments WHERE is_active = TRUE ORDER BY name ASC';
  const result = await db.query(query);
  return result.rows;
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
 * Updates a department's name or code.
 */
const updateDepartment = async (id, { name, code }) => {
  const query = 'UPDATE departments SET name = $1, code = $2 WHERE id = $3 RETURNING *';
  const result = await db.query(query, [name, code, id]);
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
