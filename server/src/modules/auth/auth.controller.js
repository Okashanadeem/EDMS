const authService = require('./auth.service');

/**
 * Handles user login requests.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required.' 
    });
  }

  try {
    const data = await authService.login(email, password);
    res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Handles user logout (stateless).
 */
const logout = async (req, res) => {
  // Stateless JWT: logout is primarily a client-side action.
  res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully.' 
  });
};

module.exports = {
  login,
  logout
};
