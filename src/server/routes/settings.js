const express = require('express');
const { db } = require('../../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET api/settings
// @desc    Get user settings
// @access  Private
router.get('/', auth, (req, res) => {
  db.get(
    'SELECT * FROM settings WHERE user_id = ?',
    [req.user.id],
    (err, settings) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }

      if (!settings) {
        // Create default settings if none exist
        db.run(
          'INSERT INTO settings (user_id, theme) VALUES (?, ?)',
          [req.user.id, 'light'],
          function (err) {
            if (err) {
              console.error(err.message);
              return res.status(500).json({ msg: 'Server error' });
            }

            res.json({
              id: this.lastID,
              user_id: req.user.id,
              n8n_webhook_url: '',
              theme: 'light'
            });
          }
        );
      } else {
        res.json(settings);
      }
    }
  );
});

// @route   PUT api/settings
// @desc    Update user settings
// @access  Private
router.put('/', auth, (req, res) => {
  const { n8n_webhook_url, n8n_binary_field, theme } = req.body;
  
  // Get existing settings
  db.get(
    'SELECT * FROM settings WHERE user_id = ?',
    [req.user.id],
    (err, settings) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }

      if (!settings) {
        // Create settings if they don't exist
        db.run(
          'INSERT INTO settings (user_id, n8n_webhook_url, n8n_binary_field, theme) VALUES (?, ?, ?, ?)',
          [req.user.id, n8n_webhook_url || '', n8n_binary_field || 'data', theme || 'light'],
          function (err) {
            if (err) {
              console.error(err.message);
              return res.status(500).json({ msg: 'Server error' });
            }

            res.json({
              id: this.lastID,
              user_id: req.user.id,
              n8n_webhook_url: n8n_webhook_url || '',
              n8n_binary_field: n8n_binary_field || 'data',
              theme: theme || 'light'
            });
          }
        );
      } else {
        // Update existing settings
        const updatedWebhookUrl = n8n_webhook_url !== undefined ? n8n_webhook_url : settings.n8n_webhook_url;
        const updatedBinaryField = n8n_binary_field !== undefined ? n8n_binary_field : (settings.n8n_binary_field || 'data');
        const updatedTheme = theme !== undefined ? theme : settings.theme;

        db.run(
          'UPDATE settings SET n8n_webhook_url = ?, n8n_binary_field = ?, theme = ? WHERE user_id = ?',
          [updatedWebhookUrl, updatedBinaryField, updatedTheme, req.user.id],
          (err) => {
            if (err) {
              console.error(err.message);
              return res.status(500).json({ msg: 'Server error' });
            }

            res.json({
              id: settings.id,
              user_id: req.user.id,
              n8n_webhook_url: updatedWebhookUrl,
              n8n_binary_field: updatedBinaryField,
              theme: updatedTheme
            });
          }
        );
      }
    }
  );
});

// @route   POST api/settings/test-webhook
// @desc    Test n8n webhook connection
// @access  Private
router.post('/test-webhook', auth, async (req, res) => {
  const { webhook_url } = req.body;
  
  if (!webhook_url) {
    return res.status(400).json({ msg: 'Webhook URL is required' });
  }

  console.log('Testing webhook URL:', webhook_url);

  try {
    const axios = require('axios');
    
    // Use a safer query that won't fail if column doesn't exist
    db.get(
      'SELECT * FROM settings WHERE user_id = ?',
      [req.user.id],
      async (err, settings) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ 
            success: false, 
            message: 'Error retrieving settings',
            error: err.message
          });
        }
        
        // Get binary field name from settings, default to "data"
        let binaryFieldName = "data";
        if (settings && settings.n8n_binary_field) {
          binaryFieldName = settings.n8n_binary_field;
        }
        
        // Generate a test session ID
        const testSessionId = `n8n_test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        
        const testPayload = {
          message: 'This is a test message from n8n-chat',
          userId: req.user.id,
          chatId: 0,
          sessionId: testSessionId,
          test: true
        };
        
        try {
          console.log('Sending test payload:', testPayload);
          console.log('To webhook URL:', webhook_url);
          
          // Send message to n8n webhook with JSON payload (consistent with the actual chat implementation)
          const response = await axios.post(webhook_url, testPayload);
          
          console.log('Test webhook response:', response.data);
          
          if (response.status >= 200 && response.status < 300) {
            // Check if the response has the correct format
            if (response.data && (response.data.response || typeof response.data === 'object')) {
              res.json({ 
                success: true, 
                message: 'Webhook connection successful',
                response: response.data
              });
            } else {
              res.json({ 
                success: true, 
                message: 'Webhook connected but response format may not be optimal. Expected a response with { response: "text" } format.',
                response: response.data
              });
            }
          } else {
            res.status(400).json({ success: false, message: 'Webhook responded with an error status' });
          }
        } catch (error) {
          console.error('Webhook test error:', error.message);
          console.error('Error details:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Error connecting to webhook',
            error: error.message
          });
        }
      }
    );
    
    // Return early as we handle the response in the callback
    return;
  } catch (error) {
    console.error('Webhook test error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error connecting to webhook',
      error: error.message
    });
  }
});

module.exports = router;
