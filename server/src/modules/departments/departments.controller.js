const departmentService = require('./departments.service');

/**
 * Handles listing all departments.
 */
const listDepartments = async (req, res) => {
  try {
    const data = await departmentService.listDepartments();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments.' });
  }
};

/**
 * Handles creating a new department.
 */
const createDepartment = async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Name and code are required.' });
  }

  try {
    const data = await departmentService.createDepartment({ name, code });
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ success: false, error: 'Department name or code already exists.' });
    }
    res.status(500).json({ success: false, error: 'Failed to create department.' });
  }
};

/**
 * Handles updating a department.
 */
const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No update fields provided.' });
  }

  try {
    const data = await departmentService.updateDepartment(id, updates);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update department.' });
  }
};

/**
 * Handles soft-deleting a department.
 */
const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await departmentService.deleteDepartment(id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }
    res.status(200).json({ success: true, message: 'Department deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate department.' });
  }
};

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
