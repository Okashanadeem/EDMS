const crypto = require('crypto');

/**
 * Generates a random temporary password.
 * @param {number} length 
 * @returns {string}
 */
const generateTemporaryPassword = (length = 10) => {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
};

module.exports = generateTemporaryPassword;
