const db = require('../../config/db');
const bcrypt = require('bcrypt');
const generateTemporaryPassword = require('../../utils/passwordGenerator');
const { sendCredentials } = require('../../utils/mailer');

/**
 * Lists all users. Supports filtering by department_id and role.
 */
const listUsers = async ({ departmentId, role }) => {
  let query = `
    SELECT 
      u.id, u.name, u.email, u.role, u.department_id, 
      d.name as department_name, u.officer_id, off.name as officer_name,
      u.can_send_on_behalf, u.is_active, u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users off ON u.officer_id = off.id
    WHERE 1=1
  `;
  const params = [];
  let index = 1;

  if (departmentId) {
    query += ` AND u.department_id = $${index++}`;
    params.push(departmentId);
  }

  if (role) {
    query += ` AND u.role = $${index++}`;
    params.push(role);
  }

  query += ' ORDER BY u.name ASC';
  const result = await db.query(query, params);
  return result.rows;
};

/**
 * Creates a new user with a temporary password.
 * Supports Phase 1.1 roles: worker, officer, assistant.
 */
const createUser = async ({ name, email, role, department_id, officer_id, can_send_on_behalf }) => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // Validate assistant requirement
  if (role === 'assistant' && !officer_id) {
    throw new Error('An assistant must be assigned to an officer.');
  }

  const query = `
    INSERT INTO users (name, email, password_hash, role, department_id, officer_id, can_send_on_behalf)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, role, department_id, officer_id, can_send_on_behalf
  `;
  const result = await db.query(query, [
    name, 
    email, 
    passwordHash, 
    role || 'worker', 
    department_id, 
    officer_id || null, 
    can_send_on_behalf || false
  ]);
  const user = result.rows[0];

  // Send credentials via email (async)
  sendCredentials(user.email, user.name, temporaryPassword).catch(err => {
    console.error('Email background send failed:', err);
  });
  
  return {
    user,
    temporaryPassword
  };
};

/**
 * Updates a user's details (partial update supported).
 */
const updateUser = async (id, updates) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(updates.name);
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${index++}`);
    values.push(updates.role);
  }
  if (updates.department_id !== undefined) {
    fields.push(`department_id = $${index++}`);
    values.push(updates.department_id);
  }
  if (updates.officer_id !== undefined) {
    fields.push(`officer_id = $${index++}`);
    values.push(updates.officer_id);
  }
  if (updates.can_send_on_behalf !== undefined) {
    fields.push(`can_send_on_behalf = $${index++}`);
    values.push(updates.can_send_on_behalf);
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.is_active);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE users 
    SET ${fields.join(', ')} 
    WHERE id = $${index} 
    RETURNING id, name, email, role, department_id, officer_id, can_send_on_behalf, is_active
  `;
  
  const result = await db.query(query, values);
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
  const user = result.rows[0];
  
  if (!user) return null;

  // Send credentials via email (async)
  sendCredentials(user.email, user.name, temporaryPassword).catch(err => {
    console.error('Email background send failed:', err);
  });

  return {
    user,
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
