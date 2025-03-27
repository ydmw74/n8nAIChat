const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initDatabase } = require('../database/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
let PORT = parseInt(process.env.PORT || '5005', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Note: Removed fileUpload middleware to avoid conflicts with multer in routes

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/settings', require('./routes/settings'));

// Serve uploaded files
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });
}

// Error handling for port already in use
const startServer = () => {
  try {
    // Start server - listen on all IP addresses (0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on all interfaces at port ${PORT}`);
      console.log(`Access locally via: http://localhost:${PORT}`);
      console.log(`Access from other devices via: http://<your-ip-address>:${PORT}`);
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1} instead.`);
      PORT = PORT + 1;
      startServer();
    } else {
      console.error('Server error:', err);
    }
  }
};

// Start the server
startServer();
