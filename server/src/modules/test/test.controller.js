const testService = require('./test.service');

/**
 * Helper to check if request is authorized for cleanup.
 */
const isAuthorized = (req) => {
  return process.env.NODE_ENV === 'development' || req.headers['x-internal-test'] === 'true';
};

/**
 * Handles comprehensive system cleanup.
 */
const cleanup = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }
  try {
    const result = await testService.cleanup();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handles document cleanup.
 */
const cleanupDocuments = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }
  try {
    const result = await testService.cleanupDocuments();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handles user cleanup.
 */
const cleanupUsers = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }
  try {
    const result = await testService.cleanupUsers();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handles department cleanup.
 */
const cleanupDepartments = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }
  try {
    const result = await testService.cleanupDepartments();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handles log cleanup.
 */
const cleanupLogs = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }
  try {
    const result = await testService.cleanupLogs();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  cleanup,
  cleanupDocuments,
  cleanupUsers,
  cleanupDepartments,
  cleanupLogs
};
