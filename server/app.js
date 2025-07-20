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
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration imports
import { initializeDatabase } from './config/database.js'
import { securityHeaders, rateLimiter, corsMiddleware } from './config/security.js'

// Route imports
import medicinesRoutes from './routes/medicines.js'
import dosesRoutes from './routes/doses.js'
import calendarRoutes from './routes/calendar.js'
import statsRoutes from './routes/stats.js'

// ES6 module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment configuration
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '1mb'

// Initialize Express application
const app = express()

// Security middleware
app.use(securityHeaders)
app.use('/api/', rateLimiter)
app.use(corsMiddleware)

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: MAX_REQUEST_SIZE,
  strict: true // Only parse arrays and objects
}))
app.use(express.urlencoded({ 
  extended: false, 
  limit: MAX_REQUEST_SIZE 
}))

// Static file serving in production
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

// API Routes
app.use('/api/medicines', medicinesRoutes)
app.use('/api/doses', dosesRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/stats', statsRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  })
})

// Serve frontend in production
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 Medicine Reminder API Server running on port ${PORT}`)
      console.log(`📊 Environment: ${NODE_ENV}`)
      console.log(`🔒 Security: Rate limiting, CORS, and input validation enabled`)
      console.log(`💾 Database: SQLite initialized successfully`)
      
      if (NODE_ENV === 'production') {
        console.log(`🌐 Serving static files from dist/`)
      }
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...')
  process.exit(0)
})

// Start the server
startServer()

export default app