const db = require('../../config/db');
const bcrypt = require('bcrypt');
const generateTemporaryPassword = require('../../utils/passwordGenerator');

/**
 * Lists all users. Supports filtering by department_id.
 */
const listUsers = async (departmentId) => {
  let query = `
    SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.is_active, u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_active = TRUE
  `;
  const params = [];

  if (departmentId) {
    query += ' AND u.department_id = $1';
    params.push(departmentId);
  }

  query += ' ORDER BY u.name ASC';
  const result = await db.query(query, params);
  return result.rows;
};

/**
 * Creates a new worker user with a temporary password.
 */
const createUser = async ({ name, email, department_id }) => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const query = `
    INSERT INTO users (name, email, password_hash, role, department_id)
    VALUES ($1, $2, $3, 'worker', $4)
    RETURNING id, name, email, role, department_id
  `;
  const result = await db.query(query, [name, email, passwordHash, department_id]);
  
  return {
    user: result.rows[0],
    temporaryPassword
  };
};

/**
 * Updates a user's name or department.
 */
const updateUser = async (id, { name, department_id }) => {
  const query = 'UPDATE users SET name = $1, department_id = $2 WHERE id = $3 RETURNING id, name, email, role, department_id';
  const result = await db.query(query, [name, department_id, id]);
  return result.rows[0];
};

/**
 * Resets a user's password.
 */
const resetPassword = async (id) => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const query = 'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email';
  const result = await db.query(query, [passwordHash, id]);
  
  if (!result.rows[0]) return null;

  return {
    user: result.rows[0],
    temporaryPassword
  };
};

/**
 * Soft-deletes a user.
 */
const deleteUser = async (id) => {
  const query = 'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, name, email';
  const result = await db.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
};
