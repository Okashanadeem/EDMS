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
    SELECT u.id, u.name, u.email, u.password_hash, u.role, u.department_id, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
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
      department_id: user.department_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Remove password hash from user object
  delete user.password_hash;

  return { accessToken, user };
};

module.exports = {
  login
};
