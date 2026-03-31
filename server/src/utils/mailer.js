const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Configure Transporter
 * For production, use actual SMTP settings (Host, Port, User, Pass).
 * For development, you can use Mailtrap or Ethereal Email.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends credentials to a new user.
 * @param {string} to - User's email address.
 * @param {string} name - User's full name.
 * @param {string} password - The plain-text generated password.
 */
const sendCredentials = async (to, name, password) => {
  const mailOptions = {
    from: `"EDMS System" <${process.env.SMTP_FROM || 'noreply@edms.local'}>`,
    to,
    subject: 'Your EDMS Account Credentials',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to EDMS</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your official account for the <strong>Electronic Document Management System</strong> has been created successfully.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Your Login Credentials</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #111827; background: #fff; padding: 2px 6px; border: 1px solid #d1d5db; border-radius: 4px;">${password}</span></p>
        </div>

        <p style="color: #b91c1c; font-size: 13px; font-weight: bold;">⚠️ IMPORTANT: This is a temporary password. Please log in and change it immediately for security.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    // We don't throw here to avoid failing the entire user creation if mail fails,
    // though the admin will still see the password on screen as a backup.
    return null;
  }
};

/**
 * Sends an OTP to an officer for delegated sending.
 */
const sendOtp = async (to, name, otp, subject) => {
  const mailOptions = {
    from: `"EDMS System" <${process.env.SMTP_FROM || 'noreply@edms.local'}>`,
    to,
    subject: `Authorization Request: ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Send Authorization</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your assistant has requested authorization to dispatch the following document on your behalf:</p>
        
        <p style="padding: 10px; background: #f3f4f6; border-radius: 4px;">
          <strong>Subject:</strong> ${subject}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Your OTP Code</p>
          <div style="font-family: monospace; font-size: 32px; color: #111827; background: #fff; padding: 10px 20px; border: 2px dashed #4f46e5; border-radius: 8px; display: inline-block; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #ef4444; margin-top: 10px;">This code will expire in 10 minutes.</p>
        </div>

        <p style="color: #6b7280; font-size: 13px;">If you did not authorize this request, please ignore this email.</p>
      </div>
    `,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return null;
  }
};

module.exports = { sendCredentials, sendOtp };
