const userService = require('./users.service');

/**
 * Handles listing all users.
 */
const listUsers = async (req, res) => {
  const { department_id } = req.query;
  try {
    const data = await userService.listUsers(department_id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
};

/**
 * Handles creating a new worker.
 */
const createUser = async (req, res) => {
  const { name, email, department_id } = req.body;

  if (!name || !email || !department_id) {
    return res.status(400).json({ success: false, error: 'Name, email, and department_id are required.' });
  }

  try {
    const data = await userService.createUser({ name, email, department_id });
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }
    res.status(500).json({ success: false, error: 'Failed to create user.' });
  }
};

/**
 * Handles updating a user.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, department_id } = req.body;

  if (!name || !department_id) {
    return res.status(400).json({ success: false, error: 'Name and department_id are required.' });
  }

  try {
    const data = await userService.updateUser(id, { name, department_id });
    if (!data) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user.' });
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
    res.status(200).json({ success: true, data });
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
  listUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
};
