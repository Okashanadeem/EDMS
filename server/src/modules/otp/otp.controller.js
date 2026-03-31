const otpService = require('./otp.service');

/**
 * Handles OTP request.
 */
const requestOtp = async (req, res) => {
  const { document_id } = req.body;
  if (!document_id) return res.status(400).json({ success: false, error: 'document_id is required.' });

  try {
    const result = await otpService.requestOtp(document_id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to request OTP.' });
  }
};

/**
 * Handles OTP verification and dispatch.
 */
const verifyOtp = async (req, res) => {
  const { document_id, otp } = req.body;
  if (!document_id || !otp) return res.status(400).json({ success: false, error: 'document_id and otp are required.' });

  try {
    const data = await otpService.verifyOtp(document_id, req.user.id, otp);
    res.status(200).json({ success: true, data, message: 'OTP verified. Document dispatched on behalf of Officer.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Failed to verify OTP.' });
  }
};

module.exports = {
  requestOtp,
  verifyOtp
};
