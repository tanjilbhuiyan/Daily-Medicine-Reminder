/**
 * Input Validation Middleware
 * 
 * Express-validator configurations for API endpoints
 */

import { body, param, query, validationResult } from 'express-validator'

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// Medicine validation rules
export const medicineValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Medicine name must be 1-100 characters'),
  
  body('frequency')
    .isInt({ min: 1, max: 4 })
    .withMessage('Frequency must be between 1 and 4'),
  
  body('scheduleType')
    .isIn(['preset', 'custom', 'interval'])
    .withMessage('Schedule type must be preset, custom, or interval'),
  
  body('customTimes')
    .optional()
    .isArray()
    .withMessage('Custom times must be an array'),
  
  body('presetTimes')
    .optional()
    .isString()
    .withMessage('Preset times must be a string')
]

// Dose validation rules
export const doseValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Dose ID must be a positive integer'),
  
  body('taken')
    .isBoolean()
    .withMessage('Taken status must be boolean')
]

// Medicine ID validation
export const medicineIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Medicine ID must be a positive integer')
]

// Calendar validation
export const calendarValidation = [
  param('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
]

// Date validation
export const dateValidation = [
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const date = new Date(value + 'T00:00:00')
      if (date.toISOString().split('T')[0] !== value) {
        throw new Error('Invalid date')
      }
      return true
    })
]