const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function auth(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    if (!process.env.JWT_SECRET) {
      console.error('WARNING: JWT_SECRET is not set. This is insecure for production!');
    }
    const jwtSecret = process.env.JWT_SECRET || 'temporary_secret_key_not_for_production';
    const decoded = jwt.verify(token, jwtSecret);

    // Add user from payload
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;
