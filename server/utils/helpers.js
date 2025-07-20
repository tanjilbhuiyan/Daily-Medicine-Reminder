/**
 * Utility Helper Functions
 * 
 * Common utility functions used across the application
 */

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string} Today's date string
 */
export function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date format
 */
export function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  
  const date = new Date(dateStr + 'T00:00:00')
  return date.toISOString().split('T')[0] === dateStr
}

/**
 * Sanitize medicine name input
 * @param {string} name - Medicine name to sanitize
 * @returns {string} Sanitized name
 */
export function sanitizeMedicineName(name) {
  if (typeof name !== 'string') return ''
  return name.trim().substring(0, 100) // Limit length and trim whitespace
}

/**
 * Generate time labels based on schedule configuration
 * @param {number} frequency - Number of doses per day
 * @param {string} scheduleType - Type of schedule (preset, custom, interval)
 * @param {Array} customTimes - Custom time array (if applicable)
 * @param {string} presetTimes - Preset time configuration (if applicable)
 * @returns {Array} Array of time labels
 */
export function generateTimeLabels(frequency, scheduleType, customTimes = null, presetTimes = null) {
  if (scheduleType === 'preset') {
    if (presetTimes) {
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
    }
  } else if (scheduleType === 'custom' && customTimes) {
    return customTimes.map(time => `${time}`)
  } else {
    // Equal intervals
    const labels = []
    const hoursPerDose = 24 / frequency
    for (let i = 0; i < frequency; i++) {
      const hour = Math.round(i * hoursPerDose)
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      labels.push(timeString)
    }
    return labels
  }
  
  return []
}