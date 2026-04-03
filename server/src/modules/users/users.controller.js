const userService = require('./users.service');

/**
 * Handles listing all positions.
 */
const listPositions = async (req, res) => {
  const { department_id, role, page = 1, limit = 10 } = req.query;
  try {
    const data = await userService.listPositions({ 
      departmentId: department_id, 
      role, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch positions.' });
  }
};


/**
 * Handles creating a new position.
 */
const createPosition = async (req, res) => {
  try {
    const data = await userService.createPosition(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create position.' });
  }
};

/**
 * Handles updating a position.
 */
const updatePosition = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await userService.updatePosition(id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update position.' });
  }
};


/**
 * Handles listing all users. Supports filtering by department_id and role.
 */
const listUsers = async (req, res) => {
  const { department_id, role, page = 1, limit = 10 } = req.query;
  try {
    const data = await userService.listUsers({ 
      departmentId: department_id, 
      role,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req.user.role);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
};



/**
 * Handles creating a new user (fully position-based).
 */
const createUser = async (req, res) => {
  const { name, email, position_id } = req.body;

  if (!name || !email || !position_id) {
    return res.status(400).json({ success: false, error: 'Name, email, and position_id are required.' });
  }

  try {
    const data = await userService.createUser({ 
      name, 
      email, 
      position_id
    });
    res.status(201).json({ success: true, ...data });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to create user.' });
  }
};


/**
 * Handles updating a user.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No update fields provided.' });
  }

  try {
    const data = await userService.updateUser(id, updates);
    if (!data) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user.' });
  }
};

/**
 * Handles updating a user's own profile.
 */
const updateProfile = async (req, res) => {
  const { id } = req.user;
  const { can_send_on_behalf } = req.body;

  if (can_send_on_behalf === undefined) {
    return res.status(400).json({ success: false, error: 'Missing field: can_send_on_behalf' });
  }

  try {
    const data = await userService.updateUser(id, { can_send_on_behalf });
    if (!data) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
};

/**
 * Handles password reset for a worker.
 */
const resetPassword = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await userService.resetPassword(id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
};

/**
 * Handles soft-deleting a user.
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await userService.deleteUser(id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.status(200).json({ success: true, message: 'User deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate user.' });
  }
};

module.exports = {
  listPositions,
  createPosition,
  updatePosition,
  listUsers,
  createUser,
  updateUser,
  updateProfile,
  resetPassword,
  deleteUser
};
