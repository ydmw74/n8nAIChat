const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database path
const dbPath = path.join(dbDir, 'n8n_chat.db');

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// Initialize database schema
const initDatabase = () => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      n8n_webhook_url TEXT,
      n8n_binary_field TEXT DEFAULT 'data',
      n8n_message_field TEXT DEFAULT 'message',
      n8n_user_id_field TEXT DEFAULT 'userId',
      n8n_chat_id_field TEXT DEFAULT 'chatId',
      n8n_session_id_field TEXT DEFAULT 'sessionId',
      theme TEXT DEFAULT 'light',
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating settings table:', err.message);
    } else {
      // Check and add columns if they don't exist
      const addColumnIfNotExists = (columnName, defaultValue) => {
        db.all("PRAGMA table_info(settings)", [], (err, columns) => {
          if (err) {
            console.error(`Error checking settings table schema for ${columnName}:`, err.message);
            return;
          }
          
          const columnExists = columns.some(col => col.name === columnName);
          if (!columnExists) {
            console.log(`Adding ${columnName} column to settings table...`);
            db.run(`ALTER TABLE settings ADD COLUMN ${columnName} TEXT DEFAULT '${defaultValue}'`, (err) => {
              if (err) {
                console.error(`Error adding ${columnName} column:`, err.message);
              } else {
                console.log(`${columnName} column added successfully`);
              }
            });
          }
        });
      };
      
      // Check for all required columns and add if missing
      addColumnIfNotExists('n8n_binary_field', 'data');
      addColumnIfNotExists('n8n_message_field', 'message');
      addColumnIfNotExists('n8n_user_id_field', 'userId');
      addColumnIfNotExists('n8n_chat_id_field', 'chatId');
      addColumnIfNotExists('n8n_session_id_field', 'sessionId');
    }
  });

  // Create chats table
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      session_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  
  // Check if session_id column exists, add it if not
  db.all("PRAGMA table_info(chats)", [], (err, columns) => {
    if (err) {
      console.error('Error checking chats table schema:', err.message);
      return;
    }
    
    const columnExists = columns.some(col => col.name === 'session_id');
    if (!columnExists) {
      console.log('Adding session_id column to chats table...');
      db.run(`ALTER TABLE chats ADD COLUMN session_id TEXT`, (err) => {
        if (err) {
          console.error('Error adding session_id column:', err.message);
        } else {
          console.log('session_id column added successfully');
        }
      });
    }
  });

  // Create messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats (id)
    )
  `);

  // Create files table
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages (id)
    )
  `);

  console.log('Database tables initialized');
};

module.exports = {
  db,
  initDatabase
};
