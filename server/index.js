import express from 'express'
import sqlite3 from 'sqlite3'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'medicines.db'))

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

// Get today's date string
function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

// Routes

// Get active medicines with doses for a specific date (Today view)
app.get('/api/medicines', (req, res) => {
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

// Add new medicine
app.post('/api/medicines', (req, res) => {
  const { name, frequency, scheduleType, customTimes, presetTimes } = req.body

  // Store custom times as JSON string if provided
  const customTimesJson = customTimes && scheduleType === 'custom' ? JSON.stringify(customTimes) : null

  db.run(`
    INSERT INTO medicines (name, frequency, schedule_type, custom_times, preset_times)
    VALUES (?, ?, ?, ?, ?)
  `, [name, parseInt(frequency), scheduleType, customTimesJson, presetTimes], function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }

    const medicineId = this.lastID
    const today = getTodayString()
    const timeLabels = generateTimeLabels(parseInt(frequency), scheduleType, customTimes, presetTimes)

    // Create today's doses
    timeLabels.forEach(label => {
      db.run(`
        INSERT INTO doses (medicine_id, time_label, taken, date)
        VALUES (?, ?, 0, ?)
      `, [medicineId, label, today])
    })

    res.json({ id: medicineId, message: 'Medicine added successfully' })
  })
})

// Update dose status
app.put('/api/doses/:id', (req, res) => {
  const { id } = req.params
  const { taken } = req.body

  db.run(`
    UPDATE doses SET taken = ? WHERE id = ?
  `, [taken ? 1 : 0, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }

    res.json({ message: 'Dose updated successfully' })
  })
})

// Get calendar data for a specific month
app.get('/api/calendar/:year/:month', (req, res) => {
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
      res.status(500).json({ error: err.message })
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

// Get statistics for medicines
app.get('/api/stats', (req, res) => {
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
      res.status(500).json({ error: err.message })
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

// Get all medicines (both active and archived) for Medicines page
app.get('/api/medicines/all', (req, res) => {
  db.all(`
    SELECT * FROM medicines 
    ORDER BY archived ASC, created_at DESC
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    const medicines = rows.map(row => ({
      ...row,
      archived: Boolean(row.archived)
    }))
    
    res.json(medicines)
  })
})

// Archive a medicine
app.put('/api/medicines/:id/archive', (req, res) => {
  const { id } = req.params
  const now = new Date().toISOString()
  
  db.run(`
    UPDATE medicines 
    SET archived = 1, archived_at = ?
    WHERE id = ?
  `, [now, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Medicine not found' })
      return
    }
    
    res.json({ message: 'Medicine archived successfully' })
  })
})

// Reactivate a medicine
app.put('/api/medicines/:id/reactivate', (req, res) => {
  const { id } = req.params
  
  db.run(`
    UPDATE medicines 
    SET archived = 0, archived_at = NULL
    WHERE id = ?
  `, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Medicine not found' })
      return
    }
    
    res.json({ message: 'Medicine reactivated successfully' })
  })
})

// Delete a medicine permanently
app.delete('/api/medicines/:id', (req, res) => {
  const { id } = req.params
  
  // First delete all doses for this medicine
  db.run(`DELETE FROM doses WHERE medicine_id = ?`, [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    // Then delete the medicine
    db.run(`DELETE FROM medicines WHERE id = ?`, [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Medicine not found' })
        return
      }
      
      res.json({ message: 'Medicine deleted successfully' })
    })
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})