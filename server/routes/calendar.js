/**
 * Calendar Routes
 * 
 * API endpoints for calendar data
 */

import express from 'express'
import { db } from '../config/database.js'
import { calendarValidation, handleValidationErrors } from '../middleware/validation.js'

const router = express.Router()

/**
 * GET /api/calendar/:year/:month
 * Get calendar data for a specific month
 */
router.get('/:year/:month', calendarValidation, handleValidationErrors, (req, res) => {
  const { year, month } = req.params
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const endDate = `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-01`

  const query = `
    SELECT 
      d.date,
      COUNT(d.id) as total_doses,
      SUM(CASE WHEN d.taken = 1 THEN 1 ELSE 0 END) as taken_doses
    FROM doses d
    JOIN medicines m ON d.medicine_id = m.id
    WHERE d.date >= ? AND d.date < ?
    GROUP BY d.date
    ORDER BY d.date
  `

  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Database error' })
    }

    // Convert to calendar format
    const calendarData = {}
    rows.forEach(row => {
      const percentage = row.total_doses > 0 
        ? Math.round((row.taken_doses / row.total_doses) * 100) 
        : 0

      calendarData[row.date] = {
        total: row.total_doses,
        taken: row.taken_doses,
        percentage: percentage
      }
    })

    res.json(calendarData)
  })
})

export default router