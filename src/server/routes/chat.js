const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { db } = require('../../database/db');
const auth = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   GET api/chat
// @desc    Get all chats for a user
// @access  Private
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, chats) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }
      res.json(chats);
    }
  );
});

// @route   GET api/chat/:id
// @desc    Get a specific chat with messages
// @access  Private
router.get('/:id', auth, (req, res) => {
  // Check if chat belongs to user
  db.get(
    'SELECT * FROM chats WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, chat) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }

      if (!chat) {
        return res.status(404).json({ msg: 'Chat not found or unauthorized' });
      }

      // Get messages for this chat
      db.all(
        'SELECT m.*, GROUP_CONCAT(f.id || "::" || f.filename || "::" || f.filepath || "::" || f.mimetype) as files ' +
        'FROM messages m ' +
        'LEFT JOIN files f ON m.id = f.message_id ' +
        'WHERE m.chat_id = ? ' +
        'GROUP BY m.id ' +
        'ORDER BY m.created_at ASC',
        [req.params.id],
        (err, messages) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ msg: 'Server error' });
          }

          // Process file information
          const processedMessages = messages.map(message => {
            const processedMessage = { ...message, files: [] };
            
            if (message.files) {
              const fileList = message.files.split(',');
              processedMessage.files = fileList.map(fileInfo => {
                const [id, filename, filepath, mimetype] = fileInfo.split('::');
                return { id, filename, filepath, mimetype };
              });
            }
            
            delete processedMessage.files; // Remove the original concatenated string
            
            return processedMessage;
          });

          res.json({
            chat,
            messages: processedMessages
          });
        }
      );
    }
  );
});

// @route   POST api/chat
// @desc    Create a new chat
// @access  Private
router.post('/', auth, (req, res) => {
  const { title = 'New Chat' } = req.body;

  db.run(
    'INSERT INTO chats (user_id, title) VALUES (?, ?)',
    [req.user.id, title],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }

      res.json({
        id: this.lastID,
        user_id: req.user.id,
        title,
        created_at: new Date().toISOString()
      });
    }
  );
});

// @route   POST api/chat/:id/message
// @desc    Send a message to n8n webhook and save response
// @access  Private
router.post('/:id/message', auth, upload.array('files', 5), async (req, res) => {
  console.log('--------- NEW MESSAGE RECEIVED ---------');
  console.log('Message body:', req.body);
  console.log('Files count:', req.files ? req.files.length : 0);
  console.log('Chat ID:', req.params.id);
  
  const { content } = req.body;
  const files = req.files || [];
  const chatId = req.params.id;

  // Validate chat belongs to user
  db.get(
    'SELECT * FROM chats WHERE id = ? AND user_id = ?',
    [chatId, req.user.id],
    async (err, chat) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }

      if (!chat) {
        return res.status(404).json({ msg: 'Chat not found or unauthorized' });
      }

      // Get user's n8n webhook URL from settings
      db.get(
        'SELECT n8n_webhook_url FROM settings WHERE user_id = ?',
        [req.user.id],
        async (err, settings) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ msg: 'Server error' });
          }

          if (!settings || !settings.n8n_webhook_url) {
            return res.status(400).json({ msg: 'n8n webhook URL not set in settings' });
          }
          
          // Store user message in database
          db.run(
            'INSERT INTO messages (chat_id, content, role) VALUES (?, ?, ?)',
            [chatId, content, 'user'],
            async function (err) {
              if (err) {
                console.error(err.message);
                return res.status(500).json({ msg: 'Server error' });
              }

              const messageId = this.lastID;

              // Store files in database and disk
              for (const file of files) {
                db.run(
                  'INSERT INTO files (message_id, filename, filepath, mimetype, size) VALUES (?, ?, ?, ?, ?)',
                  [
                    messageId,
                    file.originalname,
                    file.path,
                    file.mimetype,
                    file.size
                  ],
                  (err) => {
                    if (err) {
                      console.error('Error saving file record:', err.message);
                      // Continue even if file record saving fails
                    }
                  }
                );
              }

              // Process message with n8n
              try {
                // Get binary field name from settings (or use default)
                db.get(
                  'SELECT * FROM settings WHERE user_id = ?',
                  [req.user.id],
                  async (err, fullSettings) => {
                    if (err) {
                      console.error('Error getting settings:', err.message);
                      throw new Error('Failed to get user settings');
                    }
                    
                    // Default to 'data' if not specified
                    const binaryFieldName = (fullSettings && fullSettings.n8n_binary_field) || 'data';
                    
                    console.log('===== DEBUG: CHAT MESSAGE SUBMISSION =====');
                    console.log('Message:', content);
                    console.log('Files count:', files.length);
                    console.log('Chat ID:', chatId);
                    console.log('Webhook URL:', settings.n8n_webhook_url);
                    console.log('Binary field name:', binaryFieldName);
                    
                    let response;
                    
                    if (files.length > 0) {
                      // Use FormData to send binary data when files are present
                      const FormData = require('form-data');
                      const formData = new FormData();
                      
                      // Add message JSON
                      const jsonPayload = {
                        message: content,
                        userId: req.user.id,
                        chatId: chat.id
                      };
                      
                      formData.append('json', JSON.stringify(jsonPayload));
                      
                      // Add files to FormData
                      files.forEach((file, index) => {
                        const fileData = fs.readFileSync(file.path);
                        const fieldName = index === 0 ? binaryFieldName : `${binaryFieldName}${index}`;
                        formData.append(fieldName, fileData, file.originalname);
                        console.log(`Attaching file ${file.originalname} as ${fieldName}`);
                      });
                      
                      console.log("Sending multipart FormData to n8n with files");
                      
                      // Send message with files to n8n webhook
                      response = await axios.post(settings.n8n_webhook_url, formData, {
                        headers: {
                          ...formData.getHeaders()
                        }
                      });
                    } else {
                      // Send simple JSON if no files
                      const payload = {
                        message: content,
                        userId: req.user.id,
                        chatId: chat.id
                      };
                      
                      console.log("Sending JSON payload to n8n:", JSON.stringify(payload, null, 2));
                      
                      // Send message to n8n webhook
                      response = await axios.post(settings.n8n_webhook_url, payload);
                    }
                    
                    console.log('===== DEBUG: N8N RESPONSE =====');
                    console.log('Response status:', response.status);
                    console.log('Response data:', response.data);
                    
                    // Store n8n response in database
                    let n8nResponse = 'No response from n8n';
                    
                    if (response.data && response.data.response) {
                      n8nResponse = response.data.response;
                    } else if (response.data) {
                      n8nResponse = JSON.stringify(response.data);
                    }
                    
                    db.run(
                      'INSERT INTO messages (chat_id, content, role) VALUES (?, ?, ?)',
                      [chatId, n8nResponse, 'assistant'],
                      function (err) {
                        if (err) {
                          console.error(err.message);
                          return res.status(500).json({ msg: 'Error saving n8n response' });
                        }

                        res.json({
                          userMessage: {
                            id: messageId,
                            chat_id: chatId,
                            content,
                            role: 'user',
                            files: files.map(file => ({
                              filename: file.originalname,
                              filepath: file.path,
                              mimetype: file.mimetype
                            }))
                          },
                          assistantMessage: {
                            id: this.lastID,
                            chat_id: chatId,
                            content: n8nResponse,
                            role: 'assistant'
                          }
                        });
                      }
                    );
                  }
                );
              } catch (error) {
                console.error('Error calling n8n webhook:', error.message);
                console.error('Error details:', error);
                
                // Save error message
                db.run(
                  'INSERT INTO messages (chat_id, content, role) VALUES (?, ?, ?)',
                  [chatId, 'Error: Could not reach n8n webhook. Please check your settings.', 'assistant'],
                  function (err) {
                    if (err) {
                      console.error(err.message);
                      return res.status(500).json({ msg: 'Server error' });
                    }

                    return res.status(500).json({
                      msg: 'Error calling n8n webhook',
                      error: error.message,
                      userMessage: {
                        id: messageId,
                        content,
                        role: 'user'
                      },
                      assistantMessage: {
                        id: this.lastID,
                        content: 'Error: Could not reach n8n webhook. Please check your settings.',
                        role: 'assistant'
                      }
                    });
                  }
                );
              }
            }
          );
        }
      );
    }
  );
});

// @route   DELETE api/chat/:id
// @desc    Delete a chat and its messages
// @access  Private
router.delete('/:id', auth, (req, res) => {
  // Check if chat belongs to user
  db.get(
    'SELECT * FROM chats WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, chat) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }

      if (!chat) {
        return res.status(404).json({ msg: 'Chat not found or unauthorized' });
      }

      // Delete associated files first
      db.all(
        'SELECT f.* FROM files f JOIN messages m ON f.message_id = m.id WHERE m.chat_id = ?',
        [req.params.id],
        (err, files) => {
          if (err) {
            console.error(err.message);
            // Continue deleting even if file retrieval fails
          } else {
            // Delete physical files
            files.forEach(file => {
              try {
                fs.unlinkSync(file.filepath);
              } catch (error) {
                console.error(`Error deleting file ${file.filepath}:`, error.message);
              }
            });
          }

          // Delete from database
          db.serialize(() => {
            // Delete files
            db.run(
              'DELETE FROM files WHERE message_id IN (SELECT id FROM messages WHERE chat_id = ?)',
              [req.params.id],
              (err) => {
                if (err) {
                  console.error('Error deleting files:', err.message);
                }
              }
            );

            // Delete messages
            db.run(
              'DELETE FROM messages WHERE chat_id = ?',
              [req.params.id],
              (err) => {
                if (err) {
                  console.error('Error deleting messages:', err.message);
                }
              }
            );

            // Delete chat
            db.run(
              'DELETE FROM chats WHERE id = ?',
              [req.params.id],
              (err) => {
                if (err) {
                  console.error('Error deleting chat:', err.message);
                  return res.status(500).json({ msg: 'Error deleting chat' });
                }

                res.json({ msg: 'Chat deleted' });
              }
            );
          });
        }
      );
    }
  );
});

module.exports = router;
