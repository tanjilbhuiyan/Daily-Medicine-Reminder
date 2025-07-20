/**
 * Medicine Routes
 * 
 * API endpoints for medicine management
 */

import express from 'express'
import { db } from '../config/database.js'
import { getTodayString, generateTimeLabels, sanitizeMedicineName } from '../utils/helpers.js'
import { 
  medicineValidation, 
  medicineIdValidation, 
  dateValidation, 
  handleValidationErrors 
} from '../middleware/validation.js'

const router = express.Router()

/**
 * GET /api/medicines
 * Get medicines and doses for a specific date
 */
router.get('/', dateValidation, handleValidationErrors, (req, res) => {
  const date = req.query.date || getTodayString()
  const today = getTodayString()

  // Ensure today's doses exist before fetching
  if (date === today) {
    ensureTodayDoses()
      .then(() => fetchMedicinesForDate(date, res))
      .catch(err => {
        console.error('Error ensuring today doses:', err)
        res.status(500).json({ error: 'Database error' })
      })
  } else {
    fetchMedicinesForDate(date, res)
  }
})

/**
 * GET /api/medicines/all
 * Get all medicines (active and archived)
 */
router.get('/all', (req, res) => {
  db.all(`
    SELECT * FROM medicines 
    ORDER BY archived ASC, created_at DESC
  `, (err, medicines) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    res.json(medicines)
  })
})

/**
 * POST /api/medicines
 * Add a new medicine
 */
router.post('/', medicineValidation, handleValidationErrors, (req, res) => {
  const { name, frequency, scheduleType, customTimes, presetTimes } = req.body
  
  const sanitizedName = sanitizeMedicineName(name)
  if (!sanitizedName) {
    return res.status(400).json({ error: 'Invalid medicine name' })
  }

  const timeLabels = generateTimeLabels(frequency, scheduleType, customTimes, presetTimes)
  if (timeLabels.length !== frequency) {
    return res.status(400).json({ error: 'Time labels count does not match frequency' })
  }

  const customTimesJson = scheduleType === 'custom' ? JSON.stringify(customTimes) : null
  const presetTimesStr = scheduleType === 'preset' ? presetTimes : null

  db.run(`
    INSERT INTO medicines (name, frequency, schedule_type, custom_times, preset_times)
    VALUES (?, ?, ?, ?, ?)
  `, [sanitizedName, frequency, scheduleType, customTimesJson, presetTimesStr], function(err) {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Failed to add medicine' })
    }

    const medicineId = this.lastID
    const today = getTodayString()

    // Create today's dose records
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO doses (medicine_id, date, time_label)
      VALUES (?, ?, ?)
    `)

    timeLabels.forEach(label => {
      stmt.run(medicineId, today, label)
    })

    stmt.finalize((err) => {
      if (err) {
        console.error('Error creating dose records:', err)
        return res.status(500).json({ error: 'Failed to create dose records' })
      }
      res.status(201).json({ 
        message: 'Medicine added successfully', 
        id: medicineId 
      })
    })
  })
})

/**
 * PUT /api/medicines/:id/archive
 * Archive a medicine
 */
router.put('/:id/archive', medicineIdValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  const now = new Date().toISOString()

  db.run(`
    UPDATE medicines 
    SET archived = 1, archived_at = ?
    WHERE id = ? AND archived = 0
  `, [now, id], function(err) {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Failed to archive medicine' })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Medicine not found or already archived' })
    }

    res.json({ message: 'Medicine archived successfully' })
  })
})

/**
 * PUT /api/medicines/:id/reactivate
 * Reactivate an archived medicine
 */
router.put('/:id/reactivate', medicineIdValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  
  db.run(`
    UPDATE medicines 
    SET archived = 0, archived_at = NULL
    WHERE id = ? AND archived = 1
  `, [id], function(err) {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Failed to reactivate medicine' })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Medicine not found or not archived' })
    }

    // Ensure today's doses exist for reactivated medicine
    ensureTodayDosesForMedicine(id)
      .then(() => {
        res.json({ message: 'Medicine reactivated successfully' })
      })
      .catch(err => {
        console.error('Error creating doses for reactivated medicine:', err)
        res.status(500).json({ error: 'Medicine reactivated but failed to create today\'s doses' })
      })
  })
})

/**
 * DELETE /api/medicines/:id
 * Permanently delete a medicine and all its dose history
 */
router.delete('/:id', medicineIdValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  const medicineId = parseInt(id)

  if (isNaN(medicineId) || medicineId <= 0) {
    return res.status(400).json({ error: 'Invalid medicine ID' })
  }

  // First get medicine info for response
  db.get('SELECT name FROM medicines WHERE id = ?', [medicineId], (err, medicine) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' })
    }

    // Delete medicine (doses will be deleted automatically due to foreign key constraint)
    db.run('DELETE FROM medicines WHERE id = ?', [medicineId], function(err) {
      if (err) {
        console.error('Database error:', err)
        return res.status(500).json({ error: 'Failed to delete medicine' })
      }

      res.json({ 
        message: 'Medicine and all associated dose records deleted successfully',
        deletedMedicine: medicine.name
      })
    })
  })
})

// Helper functions

/**
 * Ensure all active medicines have dose records for today
 */
function ensureTodayDoses() {
  return new Promise((resolve, reject) => {
    const today = getTodayString()
    
    db.all(`
      SELECT id, frequency, schedule_type, custom_times, preset_times 
      FROM medicines 
      WHERE archived = 0
    `, (err, medicines) => {
      if (err) {
        return reject(err)
      }

      if (medicines.length === 0) {
        return resolve()
      }

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO doses (medicine_id, date, time_label)
        VALUES (?, ?, ?)
      `)

      let completed = 0
      medicines.forEach(medicine => {
        const customTimes = medicine.custom_times ? JSON.parse(medicine.custom_times) : null
        const timeLabels = generateTimeLabels(
          medicine.frequency, 
          medicine.schedule_type, 
          customTimes, 
          medicine.preset_times
        )

        timeLabels.forEach(label => {
          stmt.run(medicine.id, today, label)
        })

        completed++
        if (completed === medicines.length) {
          stmt.finalize((err) => {
            if (err) reject(err)
            else resolve()
          })
        }
      })
    })
  })
}

/**
 * Ensure today's doses exist for a specific medicine
 */
function ensureTodayDosesForMedicine(medicineId) {
  return new Promise((resolve, reject) => {
    const today = getTodayString()
    
    db.get(`
      SELECT frequency, schedule_type, custom_times, preset_times 
      FROM medicines 
      WHERE id = ? AND archived = 0
    `, [medicineId], (err, medicine) => {
      if (err) {
        return reject(err)
      }

      if (!medicine) {
        return resolve() // Medicine not found or archived
      }

      const customTimes = medicine.custom_times ? JSON.parse(medicine.custom_times) : null
      const timeLabels = generateTimeLabels(
        medicine.frequency, 
        medicine.schedule_type, 
        customTimes, 
        medicine.preset_times
      )

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO doses (medicine_id, date, time_label)
        VALUES (?, ?, ?)
      `)

      timeLabels.forEach(label => {
        stmt.run(medicineId, today, label)
      })

      stmt.finalize((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })
}

/**
 * Fetch medicines and doses for a specific date
 */
function fetchMedicinesForDate(date, res) {
  const query = `
    SELECT 
      m.id,
      m.name,
      m.frequency,
      m.schedule_type,
      m.custom_times,
      m.preset_times,
      m.created_at,
      m.archived,
      d.id as dose_id,
      d.time_label,
      d.taken,
      d.taken_at
    FROM medicines m
    LEFT JOIN doses d ON m.id = d.medicine_id AND d.date = ?
    WHERE m.archived = 0
    ORDER BY m.created_at DESC, d.time_label ASC
  `

  db.all(query, [date], (err, rows) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Database error' })
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
          created_at: row.created_at,
          archived: row.archived,
          doses: []
        })
      }

      if (row.dose_id) {
        medicinesMap.get(row.id).doses.push({
          id: row.dose_id,
          time_label: row.time_label,
          taken: Boolean(row.taken),
          taken_at: row.taken_at
        })
      }
    })

    const medicines = Array.from(medicinesMap.values())
    res.json(medicines)
  })
}

export default router