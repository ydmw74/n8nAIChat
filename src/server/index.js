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
// Configure CORS for all origins (important for Docker/containerized deployments)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// Set additional headers for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  next();
});

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
  // Check for different possible paths for client build files
  const fs = require('fs');
  const possiblePaths = [
    path.join(__dirname, '../../client/build'),          // Regular path
    path.join(__dirname, '../client/build'),             // Docker path
    path.join(__dirname, '../../src/client/build'),      // Docker alternative path
    path.join(__dirname, '../../../client/build'),       // Another possible path
    '/app/client/build',                                 // Direct Docker path
    '/app/src/client/build'                              // Direct Docker alternative path
  ];
  
  console.log('=== DEBUG: Client Path Search ===');
  console.log(`Current directory: ${__dirname}`);
  
  let clientBuildPath = null;
  
  // Find the first path that exists
  for (const testPath of possiblePaths) {
    try {
      console.log(`Checking path: ${testPath}`);
      
      if (fs.existsSync(testPath)) {
        console.log(`- Directory exists: ${testPath}`);
        
        if (fs.existsSync(path.join(testPath, 'index.html'))) {
          clientBuildPath = testPath;
          console.log(`✓ Found client build files at: ${clientBuildPath}`);
          break;
        } else {
          console.log(`- No index.html in ${testPath}`);
        }
      } else {
        console.log(`- Directory does not exist: ${testPath}`);
      }
    } catch (err) {
      console.log(`Error checking ${testPath}: ${err.message}`);
    }
  }
  
  // If no build path was found, create a fallback path with minimal index.html
  if (!clientBuildPath) {
    console.log('No client build path found. Creating fallback...');
    
    // Create the fallback directory and a minimal index.html
    const fallbackPath = '/app/client/build';
    
    try {
      // Create directories recursively if they don't exist
      if (!fs.existsSync(fallbackPath)) {
        fs.mkdirSync(fallbackPath, { recursive: true });
        console.log(`Created fallback directory: ${fallbackPath}`);
      }
      
      // Create a minimal index.html
      const indexHtmlPath = path.join(fallbackPath, 'index.html');
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>n8n Chat</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 800px; margin: 0 auto; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>n8n Chat</h1>
            <p class="error">Client build files not found.</p>
            <p>Please check container logs for more details.</p>
            <p>API endpoints at <code>/api/*</code> should still be functional.</p>
          </div>
        </body>
        </html>
      `;
      
      fs.writeFileSync(indexHtmlPath, fallbackHtml.trim());
      console.log(`Created fallback index.html at: ${indexHtmlPath}`);
      
      clientBuildPath = fallbackPath;
    } catch (err) {
      console.error(`Failed to create fallback: ${err.message}`);
    }
  }
  
  if (clientBuildPath) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    });
    console.log(`Static files are being served from: ${clientBuildPath}`);
  } else {
    console.error('CRITICAL ERROR: Could not find or create client build path');
    console.error('API will work, but frontend will be unavailable');
  }
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
