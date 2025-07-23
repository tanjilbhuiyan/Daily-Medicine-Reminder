export function formatDate(dateStr) {
  console.log('=== Date Formatting Debug ===')
  console.log('Input dateStr:', dateStr)
  
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  const todayStr = getTodayString()
  
  // Calculate yesterday and tomorrow using UTC+6 timezone
  const now = new Date()
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const today = new Date(utcTime + (6 * 3600000)) // UTC+6
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  console.log('Today:', todayStr)
  console.log('Yesterday:', yesterdayStr)
  console.log('Date being formatted:', dateStr)

  if (dateStr === todayStr) {
    return `Today, ${today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
  } else if (dateStr === yesterdayStr) {
    return `Yesterday, ${yesterday.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
  } else if (dateStr === tomorrowStr) {
    return `Tomorrow, ${tomorrow.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

export function changeDate(currentDate, days) {
  console.log('=== Date Navigation Debug ===')
  console.log('Current selectedDate:', currentDate)
  console.log('Days to change:', days)
  
  // Parse the current date more reliably
  const [year, month, day] = currentDate.split('-').map(Number)
  const currentDateObj = new Date(year, month - 1, day) // month is 0-indexed
  console.log('Current date object:', currentDateObj)
  console.log('Current date formatted:', currentDateObj.toDateString())
  
  // Create new date by adding days
  const newDate = new Date(year, month - 1, day + days)
  console.log('New date object:', newDate)
  console.log('New date formatted:', newDate.toDateString())
  
  // Format back to YYYY-MM-DD
  const newYear = newDate.getFullYear()
  const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
  const newDay = String(newDate.getDate()).padStart(2, '0')
  const newDateStr = `${newYear}-${newMonth}-${newDay}`
  console.log('New date string:', newDateStr)
  console.log('=== End Debug ===')
  
  return newDateStr
}

export function formatMonth(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
}

export function formatCreatedDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatStatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getTodayString() {
  const now = new Date()
  // Convert to UTC+6 timezone to match server
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const clientTime = new Date(utcTime + (6 * 3600000)) // UTC+6
  
  const year = clientTime.getFullYear()
  const month = String(clientTime.getMonth() + 1).padStart(2, '0')
  const day = String(clientTime.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isToday(dateStr) {
  return dateStr === getTodayString()
}

export function isPastDate(dateStr) {
  return dateStr < getTodayString()
}

export function isFutureDate(dateStr) {
  return dateStr > getTodayString()
}