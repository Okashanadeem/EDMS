const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'EDMS Server is healthy.' });
});

// Modular Routes (Mounting points for Phase 1)
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/departments', require('./modules/departments/departments.routes'));
app.use('/api/v1/users', require('./modules/users/users.routes'));
app.use('/api/v1/documents', require('./modules/documents/documents.routes'));
app.use('/api/v1/drafts', require('./modules/drafts/drafts.routes'));
app.use('/api/v1/otp', require('./modules/otp/otp.routes'));
app.use('/api/v1/audit', require('./modules/audit/audit.routes'));
app.use('/api/v1/test', require('./modules/test/test.routes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`EDMS Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

module.exports = app;
