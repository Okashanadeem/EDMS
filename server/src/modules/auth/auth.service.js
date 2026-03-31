const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
require('dotenv').config();

/**
 * Validates user credentials and returns a JWT if successful.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{accessToken: string, user: object}>}
 */
const login = async (email, password) => {
  const query = `
    SELECT 
      u.id, u.name, u.email, u.password_hash, u.role, u.department_id, 
      d.name as department_name, u.officer_id, off.name as officer_name,
      u.can_send_on_behalf
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users off ON u.officer_id = off.id
    WHERE u.email = $1 AND u.is_active = TRUE
  `;
  
  const result = await db.query(query, [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const accessToken = jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      department_id: user.department_id,
      officer_id: user.officer_id,
      can_send_on_behalf: user.can_send_on_behalf
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Remove password hash from user object
  delete user.password_hash;

  return { accessToken, user };
};

/**
 * Changes a user's password after verifying the current one.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // 1. Fetch user
  const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1 AND is_active = TRUE', [userId]);
  const user = userResult.rows[0];

  if (!user) {
    throw new Error('User not found or inactive.');
  }

  // 2. Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new Error('Current password does not match.');
  }

  // 3. Hash new password and update
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

  return true;
};

module.exports = {
  login,
  changePassword
};
