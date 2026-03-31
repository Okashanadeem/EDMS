const testService = require('./test.service');

/**
 * Handles cleanup request for internal testing.
 */
const cleanup = async (req, res) => {
  // Security check: Only allow in development mode or via a specific header
  if (process.env.NODE_ENV !== 'development' && req.headers['x-internal-test'] !== 'true') {
    return res.status(403).json({ 
      success: false, 
      error: 'Cleanup endpoint is restricted to internal development use only.' 
    });
  }

  try {
    const result = await testService.cleanup();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Cleanup failed.',
      message: error.message 
    });
  }
};

module.exports = {
  cleanup
};
