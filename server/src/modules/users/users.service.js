const db = require('../../config/db');
const bcrypt = require('bcrypt');
const generateTemporaryPassword = require('../../utils/passwordGenerator');
const { sendCredentials } = require('../../utils/mailer');

/**
 * Lists all positions.
 */
const listPositions = async ({ departmentId, role }) => {
  let query = `
    SELECT p.*, d.name as department_name, parent.title as parent_title
    FROM positions p
    LEFT JOIN departments d ON p.department_id = d.id
    LEFT JOIN positions parent ON p.parent_id = parent.id
    WHERE 1=1
  `;
  const params = [];
  let index = 1;

  if (departmentId) {
    query += ` AND p.department_id = $${index++}`;
    params.push(departmentId);
  }

  if (role) {
    query += ` AND p.role = $${index++}`;
    params.push(role);
  }

  query += ' ORDER BY p.title ASC';
  const result = await db.query(query, params);
  return result.rows;
};

/**
 * Creates a new position.
 */
const createPosition = async ({ title, role, department_id, parent_id, can_send_on_behalf }) => {
  const query = `
    INSERT INTO positions (title, role, department_id, parent_id, can_send_on_behalf)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await db.query(query, [title, role, department_id, parent_id || null, can_send_on_behalf || false]);
  return result.rows[0];
};

/**
 * Updates a position.
 */
const updatePosition = async (id, updates) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(updates.title);
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${index++}`);
    values.push(updates.role);
  }
  if (updates.department_id !== undefined) {
    fields.push(`department_id = $${index++}`);
    values.push(updates.department_id);
  }
  if (updates.parent_id !== undefined) {
    fields.push(`parent_id = $${index++}`);
    values.push(updates.parent_id);
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
    UPDATE positions 
    SET ${fields.join(', ')} 
    WHERE id = $${index} 
    RETURNING *
  `;
  
  const result = await db.query(query, values);
  return result.rows[0];
};

/**
 * Lists all users. Supports filtering by department_id and role.
 */
const listUsers = async ({ departmentId, role }) => {
  let query = `
    SELECT 
      u.id, u.name, u.email, u.role, u.department_id, 
      d.name as department_name, u.officer_id, off.name as officer_name,
      u.can_send_on_behalf, u.is_active, u.created_at,
      u.position_id, p.title as position_title
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users off ON u.officer_id = off.id
    LEFT JOIN positions p ON u.position_id = p.id
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
const createUser = async ({ name, email, role, department_id, officer_id, can_send_on_behalf, position_id }) => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // If position_id is provided, inherit role/dept from position
  let finalRole = role || 'worker';
  let finalDept = department_id;
  let finalOfficer = officer_id;
  let finalCanSend = can_send_on_behalf;

  if (position_id) {
    const posResult = await db.query('SELECT * FROM positions WHERE id = $1', [position_id]);
    const pos = posResult.rows[0];
    if (pos) {
      finalRole = pos.role;
      finalDept = pos.department_id;
      finalCanSend = pos.can_send_on_behalf;
      
      if (pos.parent_id) {
        // Find the user currently in the parent position
        const parentUserRes = await db.query('SELECT id FROM users WHERE position_id = $1 AND is_active = TRUE', [pos.parent_id]);
        finalOfficer = parentUserRes.rows[0]?.id || null;
      }
    }
  }

  const query = `
    INSERT INTO users (name, email, password_hash, role, department_id, officer_id, can_send_on_behalf, position_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, email, role, department_id, officer_id, can_send_on_behalf, position_id
  `;
  const result = await db.query(query, [
    name, 
    email, 
    passwordHash, 
    finalRole, 
    finalDept, 
    finalOfficer || null, 
    finalCanSend || false,
    position_id || null
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

  if (updates.position_id !== undefined) {
    fields.push(`position_id = $${index++}`);
    values.push(updates.position_id);
    
    // If assigning to a position, also update role/dept/officer_id automatically
    if (updates.position_id) {
      const posResult = await db.query('SELECT * FROM positions WHERE id = $1', [updates.position_id]);
      const pos = posResult.rows[0];
      if (pos) {
        fields.push(`role = $${index++}`);
        values.push(pos.role);
        fields.push(`department_id = $${index++}`);
        values.push(pos.department_id);
        fields.push(`can_send_on_behalf = $${index++}`);
        values.push(pos.can_send_on_behalf);

        if (pos.parent_id) {
          const parentUserRes = await db.query('SELECT id FROM users WHERE position_id = $1 AND is_active = TRUE', [pos.parent_id]);
          fields.push(`officer_id = $${index++}`);
          values.push(parentUserRes.rows[0]?.id || null);
        } else {
           fields.push(`officer_id = $${index++}`);
           values.push(null);
        }
      }
    }
  } else {
    // Legacy manual updates if no position_id change
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
    RETURNING id, name, email, role, department_id, officer_id, can_send_on_behalf, is_active, position_id
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
  listPositions,
  createPosition,
  updatePosition,
  listUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
};
