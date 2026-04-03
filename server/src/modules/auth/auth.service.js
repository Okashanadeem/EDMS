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
      d.name as department_name, 
      p.parent_id as officer_position_id,
      u.can_send_on_behalf, u.position_id, p.title as position_title
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
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
      officer_position_id: user.officer_position_id,
      can_send_on_behalf: user.can_send_on_behalf,
      position_id: user.position_id,
      position_title: user.position_title
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // Remove password before returning
  delete user.password_hash;

  return { accessToken, user };
};


/**
 * Updates a user's password.
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  if (!user) throw new Error('User not found.');

  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) throw new Error('Current password incorrect.');

  // Hash new password and update
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

  return true;
};

module.exports = {
  login,
  changePassword
};
