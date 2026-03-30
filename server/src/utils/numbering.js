const db = require('../config/db');

/**
 * Generates an atomic inward/outward document number.
 * Format: {DEPT_CODE}/{DIRECTION}/{YEAR}/{SEQUENCE_PADDED}
 * Example: CID/OUT/2025/0042
 * 
 * @param {number} departmentId 
 * @param {string} direction - 'inward' or 'outward'
 * @param {object} client - pg transaction client (mandatory for atomicity)
 * @returns {Promise<string>}
 */
const generateNumber = async (departmentId, direction, client) => {
  const year = new Date().getFullYear();
  
  // 1. Get department code
  const deptResult = await client.query('SELECT code FROM departments WHERE id = $1', [departmentId]);
  if (!deptResult.rows[0]) throw new Error('Department not found.');
  const deptCode = deptResult.rows[0].code;

  // 2. Increment sequence atomically (SELECT FOR UPDATE via upsert)
  const upsertQuery = `
    INSERT INTO doc_number_sequences (department_id, direction, year, last_number)
    VALUES ($1, $2, $3, 1)
    ON CONFLICT (department_id, direction, year)
    DO UPDATE SET last_number = doc_number_sequences.last_number + 1
    RETURNING last_number
  `;
  
  const seqResult = await client.query(upsertQuery, [departmentId, direction, year]);
  const lastNumber = seqResult.rows[0].last_number;

  // 3. Format string
  const dirCode = direction === 'inward' ? 'IN' : 'OUT';
  const sequencePadded = String(lastNumber).padStart(4, '0');

  return `${deptCode}/${dirCode}/${year}/${sequencePadded}`;
};

module.exports = generateNumber;
