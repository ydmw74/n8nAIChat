const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Simple validation
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Check if user exists
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create salt & hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ msg: 'Server error' });
        }

        // Create default settings for user
        db.run(
          'INSERT INTO settings (user_id, theme) VALUES (?, ?)',
          [this.lastID, 'light'],
          (err) => {
            if (err) {
              console.error(err.message);
              // Continue even if settings creation fails
            }
          }
        );

        // Create JWT
        const jwtSecret = process.env.JWT_SECRET || 'temporary_secret_key_not_for_production';
        jwt.sign(
          { id: this.lastID },
          jwtSecret,
          { expiresIn: 3600 },
          (err, token) => {
            if (err) throw err;
            res.json({
              token,
              user: {
                id: this.lastID,
                username,
                email
              }
            });
          }
        );
      }
    );
  });
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Check for existing user
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }

    if (!user) {
      return res.status(400).json({ msg: 'User does not exist' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT
    if (!process.env.JWT_SECRET) {
      console.error('WARNING: JWT_SECRET is not set. This is insecure for production!');
    }
    const jwtSecret = process.env.JWT_SECRET || 'temporary_secret_key_not_for_production';
    jwt.sign(
      { id: user.id },
      jwtSecret,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  });
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, (req, res) => {
  db.get('SELECT id, username, email FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  });
});

module.exports = router;
