/**
 * Medicine Reminder API Server
 * 
 * A secure Express.js server that provides REST API endpoints for managing
 * medicine reminders, schedules, and dose tracking. Uses SQLite for data
 * persistence and includes comprehensive security measures.
 * 
 * @author Medicine Reminder Team
 * @version 1.0.0
 * @license MIT
 */

import express from 'express'
import sqlite3 from 'sqlite3'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { body, param, query, validationResult } from 'express-validator'

// ES6 module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Express application
const app = express()

// Environment configuration with secure defaults
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '1mb'

// Security Configuration
// ===================

// Security headers middleware - protects against common vulnerabilities
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for Vite build
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow embedding for development
}))

// Rate limiting - prevents abuse and DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use('/api/', limiter)

// CORS configuration - secure cross-origin requests
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false // Only allow specific origins in production
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: MAX_REQUEST_SIZE,
  strict: true // Only parse arrays and objects
}))
app.use(express.urlencoded({ 
  extended: false, 
  limit: MAX_REQUEST_SIZE 
}))

// Static file serving in production with security headers
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath, {
    maxAge: '1d', // Cache static files for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Additional security headers for static files
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    }
  }))
}

// Database Configuration & Security
// ================================

/**
 * Initialize SQLite database with secure configuration
 * - Uses separate paths for development and production
 * - Enables foreign key constraints for data integrity
 * - Sets secure database options
 */
const dbPath = NODE_ENV === 'production' 
  ? path.join('/app/data', 'medicines.db')
  : path.join(__dirname, 'medicines.db')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message)
    process.exit(1)
  }
  console.log(`Connected to SQLite database: ${dbPath}`)
})

// Enable foreign key constraints for data integrity
db.run('PRAGMA foreign_keys = ON')

// Set secure database options
db.run('PRAGMA journal_mode = WAL') // Write-Ahead Logging for better concurrency
db.run('PRAGMA synchronous = NORMAL') // Balance between safety and performance

// Initialize database tables
db.serialize(() => {
  // Medicines table
  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency INTEGER NOT NULL,
      schedule_type TEXT NOT NULL,
      custom_times TEXT,
      preset_times TEXT,
      archived BOOLEAN DEFAULT 0,
      archived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Doses table
  db.run(`
    CREATE TABLE IF NOT EXISTS doses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER,
      time_label TEXT NOT NULL,
      taken BOOLEAN DEFAULT 0,
      date TEXT NOT NULL,
      FOREIGN KEY (medicine_id) REFERENCES medicines (id)
    )
  `)
  
  // Migration: Add archived columns to existing medicines if they don't exist
  db.run(`
    ALTER TABLE medicines ADD COLUMN archived BOOLEAN DEFAULT 0
  `, (err) => {
    // Ignore error if column already exists
  })
  
  db.run(`
    ALTER TABLE medicines ADD COLUMN archived_at DATETIME
  `, (err) => {
    // Ignore error if column already exists
  })
  
  // Ensure all existing medicines have archived = 0 (active by default)
  db.run(`
    UPDATE medicines SET archived = 0 WHERE archived IS NULL
  `)
})

// Helper function to generate time labels
function generateTimeLabels(frequency, scheduleType, customTimes = null, presetTimes = null) {
  if (scheduleType === 'preset') {
    if (presetTimes) {
      // Use specific preset selection
      const presetMap = {
        'morning': ['Morning'],
        'noon': ['Noon'],
        'evening': ['Evening'],
        'night': ['Night'],
        'morning-night': ['Morning', 'Night'],
        'morning-noon': ['Morning', 'Noon'],
        'noon-night': ['Noon', 'Night'],
        'morning-evening': ['Morning', 'Evening'],
        'morning-noon-night': ['Morning', 'Noon', 'Night'],
        'morning-noon-evening': ['Morning', 'Noon', 'Evening'],
        'morning-noon-evening-night': ['Morning', 'Noon', 'Evening', 'Night']
      }
      return presetMap[presetTimes] || []
    } else {
      // Fallback to default presets
      const presets = {
        1: ['Morning'],
        2: ['Morning', 'Night'],
        3: ['Morning', 'Noon', 'Night'],
        4: ['Morning', 'Noon', 'Evening', 'Night']
      }
      return presets[frequency] || []
    }
  } else if (scheduleType === 'custom' && customTimes) {
    // Parse custom times from JSON string if needed
    const times = typeof customTimes === 'string' ? JSON.parse(customTimes) : customTimes
    return times.filter(time => time && time.trim() !== '')
  } else {
    // Interval-based
    const labels = []
    const interval = 24 / frequency
    for (let i = 0; i < frequency; i++) {
      const hour = Math.round(i * interval)
      labels.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return labels
  }
}

// Utility Functions
// =================

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date string
 */
function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date format
 */
function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  
  const date = new Date(dateStr + 'T00:00:00')
  return date.toISOString().split('T')[0] === dateStr
}

/**
 * Sanitize and validate medicine name
 * @param {string} name - Medicine name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeMedicineName(name) {
  if (typeof name !== 'string') return ''
  return name.trim().substring(0, 100) // Limit length and trim whitespace
}

/**
 * Middleware to handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// Input Validation Rules
// =====================

const medicineValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Medicine name must be 1-100 characters'),
  body('frequency')
    .isInt({ min: 1, max: 4 })
    .withMessage('Frequency must be between 1 and 4'),
  body('scheduleType')
    .isIn(['preset', 'interval', 'custom'])
    .withMessage('Schedule type must be preset, interval, or custom'),
  body('customTimes')
    .optional()
    .isArray({ max: 4 })
    .withMessage('Custom times must be an array with max 4 items'),
  body('presetTimes')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Preset times must be a string with max 50 characters')
]

const doseValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Dose ID must be a positive integer'),
  body('taken')
    .isBoolean()
    .withMessage('Taken must be a boolean value')
]

const medicineIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Medicine ID must be a positive integer')
]

const calendarValidation = [
  param('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
]

const dateValidation = [
  query('date')
    .optional()
    .custom((value) => {
      if (value && !isValidDateString(value)) {
        throw new Error('Date must be in YYYY-MM-DD format')
      }
      return true
    })
]

const statsValidation = [
  query('period')
    .optional()
    .isIn(['week', 'month'])
    .withMessage('Period must be either week or month')
]

// API Routes with Security & Validation
// ====================================

/**
 * GET /api/medicines
 * Get active medicines with doses for a specific date (Today view)
 * 
 * Query Parameters:
 * - date (optional): Date in YYYY-MM-DD format, defaults to today
 * 
 * Returns: Array of active medicines with their doses for the specified date
 * 
 * Security: Input validation, SQL injection protection via parameterized queries
 */
app.get('/api/medicines', dateValidation, handleValidationErrors, (req, res) => {
  const date = req.query.date || getTodayString()

  db.all(`
    SELECT m.*, d.id as dose_id, d.time_label, d.taken
    FROM medicines m
    LEFT JOIN doses d ON m.id = d.medicine_id AND d.date = ?
    WHERE m.archived = 0
    ORDER BY m.id, d.time_label
  `, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }

    // Group doses by medicine
    const medicinesMap = new Map()

    rows.forEach(row => {
      if (!medicinesMap.has(row.id)) {
        medicinesMap.set(row.id, {
          id: row.id,
          name: row.name,
          frequency: row.frequency,
          schedule_type: row.schedule_type,
          custom_times: row.custom_times,
          preset_times: row.preset_times,
          doses: []
        })
      }

      if (row.dose_id) {
        medicinesMap.get(row.id).doses.push({
          id: row.dose_id,
          time_label: row.time_label,
          taken: Boolean(row.taken)
        })
      }
    })

    const medicines = Array.from(medicinesMap.values())

    // Create missing doses for the requested date
    const promises = []
    medicines.forEach(medicine => {
      const expectedLabels = generateTimeLabels(medicine.frequency, medicine.schedule_type, medicine.custom_times, medicine.preset_times)
      const existingLabels = medicine.doses.map(d => d.time_label)

      expectedLabels.forEach(label => {
        if (!existingLabels.includes(label)) {
          // Create missing dose
          const promise = new Promise((resolve) => {
            db.run(`
              INSERT INTO doses (medicine_id, time_label, taken, date)
              VALUES (?, ?, 0, ?)
            `, [medicine.id, label, date], function (err) {
              if (!err) {
                medicine.doses.push({
                  id: this.lastID,
                  time_label: label,
                  taken: false
                })
              }
              resolve()
            })
          })
          promises.push(promise)
        }
      })
    })

    Promise.all(promises).then(() => {
      res.json(medicines)
    })
  })
})

/**
 * POST /api/medicines
 * Add a new medicine with schedule configuration
 * 
 * Request Body:
 * - name: Medicine name (1-100 characters)
 * - frequency: Number of times per day (1-4)
 * - scheduleType: 'preset', 'interval', or 'custom'
 * - customTimes: Array of time strings (for custom schedule)
 * - presetTimes: Preset time configuration string
 * 
 * Returns: Created medicine ID and success message
 * 
 * Security: Input validation, sanitization, SQL injection protection
 */
app.post('/api/medicines', medicineValidation, handleValidationErrors, (req, res) => {
  const { name, frequency, scheduleType, customTimes, presetTimes } = req.body

  // Sanitize input data
  const sanitizedName = sanitizeMedicineName(name)
  const parsedFrequency = parseInt(frequency)
  
  // Validate custom times if provided
  let customTimesJson = null
  if (scheduleType === 'custom' && customTimes) {
    try {
      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      const validTimes = customTimes.filter(time => 
        typeof time === 'string' && timeRegex.test(time.trim())
      )
      
      if (validTimes.length !== parsedFrequency) {
        return res.status(400).json({ 
          error: 'Custom times count must match frequency' 
        })
      }
      
      customTimesJson = JSON.stringify(validTimes)
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid custom times format' 
      })
    }
  }

  db.run(`
    INSERT INTO medicines (name, frequency, schedule_type, custom_times, preset_times)
    VALUES (?, ?, ?, ?, ?)
  `, [sanitizedName, parsedFrequency, scheduleType, customTimesJson, presetTimes], function (err) {
    if (err) {
      console.error('Database error adding medicine:', err)
      res.status(500).json({ error: 'Failed to add medicine' })
      return
    }

    const medicineId = this.lastID
    const today = getTodayString()
    const timeLabels = generateTimeLabels(parsedFrequency, scheduleType, customTimes, presetTimes)

    // Create today's doses with error handling
    let dosesCreated = 0
    const totalDoses = timeLabels.length
    
    if (totalDoses === 0) {
      return res.json({ id: medicineId, message: 'Medicine added successfully' })
    }

    timeLabels.forEach(label => {
      db.run(`
        INSERT INTO doses (medicine_id, time_label, taken, date)
        VALUES (?, ?, 0, ?)
      `, [medicineId, label, today], (err) => {
        dosesCreated++
        if (err) {
          console.error('Error creating dose:', err)
        }
        
        // Send response when all doses are processed
        if (dosesCreated === totalDoses) {
          res.json({ id: medicineId, message: 'Medicine added successfully' })
        }
      })
    })
  })
})

/**
 * PUT /api/doses/:id
 * Update the taken status of a specific dose
 * 
 * Parameters:
 * - id: Dose ID (positive integer)
 * 
 * Request Body:
 * - taken: Boolean indicating if dose was taken
 * 
 * Returns: Success message
 * 
 * Security: Input validation, SQL injection protection
 */
app.put('/api/doses/:id', doseValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  const { taken } = req.body

  db.run(`
    UPDATE doses SET taken = ? WHERE id = ?
  `, [taken ? 1 : 0, parseInt(id)], function (err) {
    if (err) {
      console.error('Database error updating dose:', err)
      res.status(500).json({ error: 'Failed to update dose' })
      return
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Dose not found' })
      return
    }

    res.json({ message: 'Dose updated successfully' })
  })
})

/**
 * GET /api/calendar/:year/:month
 * Get calendar data showing medicine adherence for a specific month
 * 
 * Parameters:
 * - year: Year (2020-2030)
 * - month: Month (1-12)
 * 
 * Returns: Object with date keys and adherence statistics
 * 
 * Security: Input validation, SQL injection protection
 */
app.get('/api/calendar/:year/:month', calendarValidation, handleValidationErrors, (req, res) => {
  const { year, month } = req.params
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const endDate = `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-01`

  db.all(`
    SELECT 
      d.date,
      COUNT(*) as total_doses,
      SUM(d.taken) as taken_doses
    FROM doses d
    WHERE d.date >= ? AND d.date < ?
    GROUP BY d.date
  `, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Database error fetching calendar data:', err)
      res.status(500).json({ error: 'Failed to fetch calendar data' })
      return
    }

    const calendarData = {}
    rows.forEach(row => {
      const percentage = row.total_doses > 0 ? Math.round((row.taken_doses / row.total_doses) * 100) : 0
      calendarData[row.date] = {
        total: row.total_doses,
        taken: row.taken_doses,
        percentage: percentage
      }
    })

    res.json(calendarData)
  })
})

/**
 * GET /api/stats
 * Get medicine adherence statistics for a specific period
 * 
 * Query Parameters:
 * - period (optional): 'week' or 'month', defaults to 'week'
 * 
 * Returns: Array of medicine statistics with adherence percentages
 * 
 * Security: Input validation, SQL injection protection
 */
app.get('/api/stats', statsValidation, handleValidationErrors, (req, res) => {
  const period = req.query.period || 'week'
  const today = new Date()
  let startDate

  if (period === 'week') {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    startDate = weekStart.toISOString().split('T')[0]
  } else {
    // Month
    startDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`
  }

  const endDate = today.toISOString().split('T')[0]

  db.all(`
    SELECT 
      m.id,
      m.name,
      m.frequency,
      COUNT(d.id) as total_doses,
      SUM(d.taken) as taken_doses
    FROM medicines m
    LEFT JOIN doses d ON m.id = d.medicine_id 
      AND d.date >= ? AND d.date <= ?
    GROUP BY m.id, m.name, m.frequency
    ORDER BY m.name
  `, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Database error fetching statistics:', err)
      res.status(500).json({ error: 'Failed to fetch statistics' })
      return
    }

    const stats = rows.map(row => {
      const taken = row.taken_doses || 0
      const total = row.total_doses || 0
      const percentage = total > 0 ? Math.round((taken / total) * 100) : 0

      return {
        id: row.id,
        name: row.name,
        frequency: row.frequency,
        taken: taken,
        total: total,
        percentage: percentage
      }
    })

    res.json(stats)
  })
})

/**
 * GET /api/medicines/all
 * Get all medicines (both active and archived) for Medicines management page
 * 
 * Returns: Array of all medicines with archived status
 * 
 * Security: SQL injection protection via parameterized queries
 */
app.get('/api/medicines/all', (req, res) => {
  db.all(`
    SELECT * FROM medicines 
    ORDER BY archived ASC, created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Database error fetching all medicines:', err)
      res.status(500).json({ error: 'Failed to fetch medicines' })
      return
    }
    
    const medicines = rows.map(row => ({
      ...row,
      archived: Boolean(row.archived)
    }))
    
    res.json(medicines)
  })
})

/**
 * PUT /api/medicines/:id/archive
 * Archive a medicine (mark as completed/inactive)
 * 
 * Parameters:
 * - id: Medicine ID (positive integer)
 * 
 * Returns: Success message
 * 
 * Security: Input validation, SQL injection protection
 */
app.put('/api/medicines/:id/archive', medicineIdValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  const now = new Date().toISOString()
  
  db.run(`
    UPDATE medicines 
    SET archived = 1, archived_at = ?
    WHERE id = ? AND archived = 0
  `, [now, parseInt(id)], function(err) {
    if (err) {
      console.error('Database error archiving medicine:', err)
      res.status(500).json({ error: 'Failed to archive medicine' })
      return
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Medicine not found or already archived' })
      return
    }
    
    res.json({ message: 'Medicine archived successfully' })
  })
})

/**
 * PUT /api/medicines/:id/reactivate
 * Reactivate an archived medicine
 * 
 * Parameters:
 * - id: Medicine ID (positive integer)
 * 
 * Returns: Success message
 * 
 * Security: Input validation, SQL injection protection
 */
app.put('/api/medicines/:id/reactivate', medicineIdValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  
  db.run(`
    UPDATE medicines 
    SET archived = 0, archived_at = NULL
    WHERE id = ? AND archived = 1
  `, [parseInt(id)], function(err) {
    if (err) {
      console.error('Database error reactivating medicine:', err)
      res.status(500).json({ error: 'Failed to reactivate medicine' })
      return
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Medicine not found or already active' })
      return
    }
    
    res.json({ message: 'Medicine reactivated successfully' })
  })
})

/**
 * DELETE /api/medicines/:id
 * Permanently delete a medicine and all associated data
 * 
 * Parameters:
 * - id: Medicine ID (positive integer)
 * 
 * Returns: Success message
 * 
 * Security: Input validation, SQL injection protection, cascading delete
 * 
 * Warning: This permanently deletes all medicine data including dose history
 */
app.delete('/api/medicines/:id', medicineIdValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  const medicineId = parseInt(id)
  
  // Use transaction for data integrity
  db.serialize(() => {
    db.run('BEGIN TRANSACTION')
    
    // First delete all doses for this medicine
    db.run(`DELETE FROM doses WHERE medicine_id = ?`, [medicineId], (err) => {
      if (err) {
        console.error('Database error deleting doses:', err)
        db.run('ROLLBACK')
        res.status(500).json({ error: 'Failed to delete medicine data' })
        return
      }
      
      // Then delete the medicine
      db.run(`DELETE FROM medicines WHERE id = ?`, [medicineId], function(err) {
        if (err) {
          console.error('Database error deleting medicine:', err)
          db.run('ROLLBACK')
          res.status(500).json({ error: 'Failed to delete medicine' })
          return
        }
        
        if (this.changes === 0) {
          db.run('ROLLBACK')
          res.status(404).json({ error: 'Medicine not found' })
          return
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Database error committing transaction:', err)
            res.status(500).json({ error: 'Failed to complete deletion' })
            return
          }
          
          res.json({ message: 'Medicine deleted successfully' })
        })
      })
    })
  })
})

// Serve frontend in production
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
})