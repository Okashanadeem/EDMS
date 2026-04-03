const db = require('../../config/db');
const bcrypt = require('bcrypt');
const generateTemporaryPassword = require('../../utils/passwordGenerator');
const { sendCredentials } = require('../../utils/mailer');
const { deleteFile } = require('../../utils/storage');

/**
 * Lists all positions.
 */
const listPositions = async ({ departmentId, role, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  let query = `
    FROM positions p
    LEFT JOIN departments d ON p.department_id = d.id
    LEFT JOIN positions parent ON p.parent_id = parent.id
    WHERE 1=1
  `;
  const params = [];
  let index = 1;

  if (departmentId && departmentId !== '') {
    query += ` AND p.department_id = $${index++}`;
    params.push(departmentId);
  }

  if (role && role !== '') {
    query += ` AND p.role = $${index++}`;
    params.push(role);
  }

  const countQuery = `SELECT COUNT(*) ${query}`;
  const dataQuery = `
    SELECT p.*, d.name as department_name, parent.title as parent_title 
    ${query} 
    ORDER BY p.title ASC 
    LIMIT $${index++} OFFSET $${index++}
  `;
  
  const countResult = await db.query(countQuery, params);
  const dataResult = await db.query(dataQuery, [...params, limit, offset]);

  return {
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataResult.rows
  };
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
  const result = await db.query(query, [
    title, 
    role, 
    department_id || null, 
    parent_id || null, 
    can_send_on_behalf || false
  ]);
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
    values.push(updates.department_id || null);
  }
  if (updates.parent_id !== undefined) {
    fields.push(`parent_id = $${index++}`);
    values.push(updates.parent_id || null);
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
const listUsers = async ({ departmentId, role, page = 1, limit = 10 }, actorRole) => {
  const offset = (page - 1) * limit;
  let query = `
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE 1=1
  `;

  const params = [];
  let index = 1;

  // Security: Only super_admins can see other super_admins
  if (actorRole !== 'super_admin') {
    query += ` AND u.role != 'super_admin'`;
  }

  if (departmentId && departmentId !== '') {
    query += ` AND u.department_id = $${index++}`;
    params.push(departmentId);
  }

  if (role && role !== '') {
    query += ` AND u.role = $${index++}`;
    params.push(role);
  }

  const countQuery = `SELECT COUNT(*) ${query}`;
  const dataQuery = `
    SELECT 
      u.id, u.name, u.email, u.role, u.department_id, 
      d.name as department_name, 
      u.can_send_on_behalf, u.signature_path, u.is_active, u.created_at,
      u.position_id, p.title as position_title
    ${query} 
    ORDER BY u.name ASC 
    LIMIT $${index++} OFFSET $${index++}
  `;

  const countResult = await db.query(countQuery, params);
  const dataResult = await db.query(dataQuery, [...params, limit, offset]);

  return {
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    data: dataResult.rows
  };
};


/**
 * Creates a new user with a temporary password.
 */
const createUser = async ({ name, email, position_id }) => {
  if (!position_id) {
    throw new Error('A valid position_id is required to create a user.');
  }

  // 1. Fetch position details to inherit role/department
  const posResult = await db.query('SELECT * FROM positions WHERE id = $1', [position_id]);
  const pos = posResult.rows[0];
  if (!pos) throw new Error('Position not found.');
  if (!pos.is_active) throw new Error('Cannot assign user to an inactive position.');

  // Block creation of additional Super Admins via API
  if (pos.role === 'super_admin') {
    throw new Error('New Super Admin accounts cannot be created via the system. They must be seeded manually by the Database Administrator.');
  }

  const temporaryPassword = generateTemporaryPassword();

  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  
  const query = `
    INSERT INTO users (name, email, password_hash, role, department_id, position_id, can_send_on_behalf)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, role, department_id, position_id, can_send_on_behalf, signature_path
  `;
  
  const result = await db.query(query, [
    name, 
    email, 
    passwordHash, 
    pos.role, 
    pos.department_id, 
    position_id,
    pos.can_send_on_behalf
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

  if (updates.email !== undefined) {
    fields.push(`email = $${index++}`);
    values.push(updates.email);
  }


  if (updates.position_id !== undefined) {
    fields.push(`position_id = $${index++}`);
    values.push(updates.position_id);
    
    // If assigning to a position, also update role/dept automatically
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
    RETURNING id, name, email, role, department_id, can_send_on_behalf, signature_path, is_active, position_id
  `;
  
  const result = await db.query(query, values);
  return result.rows[0];
};

/**
 * Updates a user's signature.
 */
const updateSignature = async (userId, signaturePath) => {
  // 1. Get old signature path to delete
  const userResult = await db.query('SELECT signature_path FROM users WHERE id = $1', [userId]);
  const oldPath = userResult.rows[0]?.signature_path;

  // 2. Update DB
  const query = 'UPDATE users SET signature_path = $1 WHERE id = $2 RETURNING *';
  const result = await db.query(query, [signaturePath, userId]);

  // 3. Delete old file if exists
  if (oldPath && oldPath !== signaturePath) {
    await deleteFile(oldPath);
  }

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
  updateSignature,
  resetPassword,
  deleteUser
};
