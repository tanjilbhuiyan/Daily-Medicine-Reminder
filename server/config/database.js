/**
 * Database Configuration
 * 
 * SQLite database setup with secure configuration
 */

import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const NODE_ENV = process.env.NODE_ENV || 'development'

// Database path configuration
const dbPath = NODE_ENV === 'production' 
  ? path.join('/app/data', 'medicines.db')
  : path.join(__dirname, '..', 'medicines.db')

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message)
    process.exit(1)
  }
  console.log(`Connected to SQLite database at ${dbPath}`)
})

// Enable foreign key constraints for data integrity
db.run('PRAGMA foreign_keys = ON')

// Database initialization
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create medicines table
      db.run(`
        CREATE TABLE IF NOT EXISTS medicines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          frequency INTEGER NOT NULL,
          schedule_type TEXT NOT NULL,
          custom_times TEXT,
          preset_times TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          archived BOOLEAN DEFAULT 0,
          archived_at DATETIME
        )
      `)

      // Create doses table
      db.run(`
        CREATE TABLE IF NOT EXISTS doses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          medicine_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          time_label TEXT NOT NULL,
          taken BOOLEAN DEFAULT 0,
          taken_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
          UNIQUE(medicine_id, date, time_label)
        )
      `, (err) => {
        if (err) {
          console.error('Database initialization error:', err.message)
          reject(err)
        } else {
          console.log('Database initialized successfully')
          resolve()
        }
      })
    })
  })
}

export { db, initializeDatabase }