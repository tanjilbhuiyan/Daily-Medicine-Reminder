/**
 * Dose Routes
 * 
 * API endpoints for dose tracking
 */

import express from 'express'
import { db } from '../config/database.js'
import { getTodayString } from '../utils/helpers.js'
import { doseValidation, handleValidationErrors } from '../middleware/validation.js'

const router = express.Router()

/**
 * PUT /api/doses/:id
 * Update dose taken status
 */
router.put('/:id', doseValidation, handleValidationErrors, (req, res) => {
  const { id } = req.params
  const { taken } = req.body
  const now = new Date().toISOString()

  // First check if the dose exists and get its date
  db.get(`
    SELECT d.date, d.taken, m.name as medicine_name
    FROM doses d
    JOIN medicines m ON d.medicine_id = m.id
    WHERE d.id = ?
  `, [id], (err, dose) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!dose) {
      return res.status(404).json({ error: 'Dose not found' })
    }

    const today = getTodayString()
    
    // Prevent editing past dates (except for today)
    if (dose.date < today) {
      return res.status(403).json({ 
        error: 'Cannot modify doses from past dates',
        date: dose.date
      })
    }

    // Prevent editing future dates
    if (dose.date > today) {
      return res.status(403).json({ 
        error: 'Cannot modify doses for future dates',
        date: dose.date
      })
    }

    // Update the dose
    const takenAt = taken ? now : null
    
    db.run(`
      UPDATE doses 
      SET taken = ?, taken_at = ?
      WHERE id = ?
    `, [taken, takenAt, id], function(err) {
      if (err) {
        console.error('Database error:', err)
        return res.status(500).json({ error: 'Failed to update dose' })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Dose not found' })
      }

      res.json({ 
        message: 'Dose updated successfully',
        dose: {
          id: parseInt(id),
          taken: taken,
          taken_at: takenAt,
          medicine_name: dose.medicine_name
        }
      })
    })
  })
})

export default router