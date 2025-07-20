export async function loadMedicines(date) {
  try {
    const response = await fetch(`/api/medicines?date=${date}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error loading medicines:', error)
    throw error
  }
}

export async function loadAllMedicines() {
  try {
    const response = await fetch('/api/medicines/all')
    return await response.json()
  } catch (error) {
    console.error('Error loading all medicines:', error)
    throw error
  }
}

export async function loadCalendarData(year, month) {
  try {
    const response = await fetch(`/api/calendar/${year}/${month}`)
    return await response.json()
  } catch (error) {
    console.error('Error loading calendar data:', error)
    throw error
  }
}

export async function loadStats() {
  try {
    const response = await fetch('/api/stats')
    return await response.json()
  } catch (error) {
    console.error('Error loading stats:', error)
    throw error
  }
}

export async function addMedicine(medicineData) {
  try {
    const response = await fetch('/api/medicines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(medicineData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to add medicine')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error adding medicine:', error)
    throw error
  }
}

export async function toggleDose(doseId, taken) {
  try {
    const response = await fetch(`/api/doses/${doseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taken })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update dose')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating dose:', error)
    throw error
  }
}

export async function archiveMedicine(medicineId) {
  try {
    const response = await fetch(`/api/medicines/${medicineId}/archive`, {
      method: 'PUT'
    })
    
    if (!response.ok) {
      throw new Error('Failed to archive medicine')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error archiving medicine:', error)
    throw error
  }
}

export async function reactivateMedicine(medicineId) {
  try {
    const response = await fetch(`/api/medicines/${medicineId}/reactivate`, {
      method: 'PUT'
    })
    
    if (!response.ok) {
      throw new Error('Failed to reactivate medicine')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error reactivating medicine:', error)
    throw error
  }
}

export async function deleteMedicine(medicineId) {
  try {
    const response = await fetch(`/api/medicines/${medicineId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete medicine')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error deleting medicine:', error)
    throw error
  }
}