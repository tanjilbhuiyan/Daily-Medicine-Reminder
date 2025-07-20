/**
 * Statistics Routes
 * 
 * API endpoints for medicine statistics
 */

import express from 'express'
import { db } from '../config/database.js'
import { getTodayString } from '../utils/helpers.js'

const router = express.Router()

/**
 * GET /api/stats
 * Get medicine statistics and adherence data
 */
router.get('/', (req, res) => {
  const today = getTodayString()

  const query = `
    SELECT 
      m.id,
      m.name,
      m.frequency,
      m.created_at,
      m.archived,
      m.archived_at,
      COUNT(d.id) as total_doses,
      SUM(CASE WHEN d.taken = 1 THEN 1 ELSE 0 END) as taken_doses,
      MIN(d.date) as first_dose_date,
      MAX(d.date) as last_dose_date
    FROM medicines m
    LEFT JOIN doses d ON m.id = d.medicine_id
    GROUP BY m.id, m.name, m.frequency, m.created_at, m.archived, m.archived_at
    ORDER BY m.archived ASC, m.created_at DESC
  `

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Database error' })
    }

    const stats = rows.map(row => {
      const startDate = row.first_dose_date || row.created_at.split('T')[0]
      const endDate = row.archived ? (row.archived_at?.split('T')[0] || today) : today
      
      // Calculate total days
      const start = new Date(startDate)
      const end = new Date(endDate)
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
      
      // Calculate expected doses
      const expectedDoses = totalDays * row.frequency
      const takenDoses = row.taken_doses || 0
      const missedDoses = Math.max(0, expectedDoses - takenDoses)
      
      // Calculate adherence percentage
      const adherencePercentage = expectedDoses > 0 
        ? Math.round((takenDoses / expectedDoses) * 100) 
        : 0

      return {
        id: row.id,
        name: row.name,
        frequency: row.frequency,
        status: row.archived ? 'archived' : 'active',
        startDate: startDate,
        endDate: endDate,
        totalDays: totalDays,
        expectedDoses: expectedDoses,
        takenDoses: takenDoses,
        missedDoses: missedDoses,
        adherencePercentage: adherencePercentage
      }
    })

    res.json(stats)
  })
})

export default router