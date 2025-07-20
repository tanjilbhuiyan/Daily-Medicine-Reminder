export function formatDate(dateStr) {
  console.log('=== Date Formatting Debug ===')
  console.log('Input dateStr:', dateStr)
  
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  console.log('Today:', today.toISOString().split('T')[0])
  console.log('Yesterday:', yesterday.toISOString().split('T')[0])
  console.log('Date being formatted:', dateStr)

  if (dateStr === today.toISOString().split('T')[0]) {
    return `Today, ${today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return `Yesterday, ${yesterday.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
  } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
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
  return new Date().toISOString().split('T')[0]
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