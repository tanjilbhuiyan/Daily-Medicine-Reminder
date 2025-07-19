<template>
  <div class="container">
    <h1>Daily Medicine Reminder</h1>
    
    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      <button 
        @click="currentView = 'today'" 
        :class="{ active: currentView === 'today' }"
        class="nav-tab"
      >
        Today
      </button>
      <button 
        @click="currentView = 'medicines'" 
        :class="{ active: currentView === 'medicines' }"
        class="nav-tab"
      >
        Medicines
      </button>
      <button 
        @click="currentView = 'calendar'" 
        :class="{ active: currentView === 'calendar' }"
        class="nav-tab"
      >
        Calendar
      </button>
      <button 
        @click="currentView = 'stats'" 
        :class="{ active: currentView === 'stats' }"
        class="nav-tab"
      >
        Statistics
      </button>
      <button 
        @click="currentView = 'add'" 
        :class="{ active: currentView === 'add' }"
        class="nav-tab"
      >
        Add Medicine
      </button>
    </div>

    <!-- Today View -->
    <div v-if="currentView === 'today'" class="view-content">
      <div class="date-navigation">
        <button @click="changeDate(-1)" class="date-nav-btn">← Previous Day</button>
        <h2>{{ formatDate(selectedDate) }}</h2>
        <button @click="changeDate(1)" class="date-nav-btn" :disabled="isToday">Next Day →</button>
      </div>
      
      <div class="medicine-list" v-if="medicines.length > 0">
        <div v-for="medicine in medicines" :key="medicine.id" class="medicine-item">
          <div class="medicine-name">{{ medicine.name }}</div>
          <div class="schedule-info">
            {{ medicine.frequency }} times per day
            <span v-if="medicine.schedule_type === 'preset'"> - Preset times</span>
            <span v-else-if="medicine.schedule_type === 'custom'" class="custom-times-display"> - Custom times</span>
            <span v-else> - Every {{ 24 / medicine.frequency }} hours</span>
          </div>
          
          <div class="doses">
            <div 
              v-for="dose in medicine.doses" 
              :key="dose.id"
              class="dose-item"
              :class="{ taken: dose.taken }"
            >
              <input 
                type="checkbox" 
                :checked="dose.taken"
                @change="toggleDose(dose.id, $event.target.checked)"
                class="dose-checkbox"
              />
              <span>{{ dose.time_label }}</span>
              <span v-if="dose.taken" style="color: green;">✓</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-medicines">
        <p>No medicines added yet. Go to "Add Medicine" tab to get started.</p>
      </div>
    </div>

    <!-- Medicines View -->
    <div v-if="currentView === 'medicines'" class="view-content">
      <h2>Manage Medicines</h2>
      
      <div class="medicines-tabs">
        <button 
          @click="medicinesTab = 'active'" 
          :class="{ active: medicinesTab === 'active' }"
          class="medicines-tab-btn"
        >
          Active Medicines ({{ activeMedicines.length }})
        </button>
        <button 
          @click="medicinesTab = 'archived'" 
          :class="{ active: medicinesTab === 'archived' }"
          class="medicines-tab-btn"
        >
          Archived Medicines ({{ archivedMedicines.length }})
        </button>
      </div>

      <!-- Active Medicines -->
      <div v-if="medicinesTab === 'active'" class="medicines-section">
        <div v-if="activeMedicines.length > 0" class="medicines-grid">
          <div v-for="medicine in activeMedicines" :key="medicine.id" class="medicine-card">
            <div class="medicine-card-header">
              <h3 class="medicine-card-name">{{ medicine.name }}</h3>
              <div class="medicine-status active">Active</div>
            </div>
            
            <div class="medicine-card-info">
              <p><strong>Frequency:</strong> {{ medicine.frequency }} times per day</p>
              <p><strong>Schedule:</strong> 
                <span v-if="medicine.schedule_type === 'preset'">Preset times</span>
                <span v-else-if="medicine.schedule_type === 'custom'">Custom times</span>
                <span v-else>Equal intervals</span>
              </p>
              <p><strong>Added:</strong> {{ formatCreatedDate(medicine.created_at) }}</p>
            </div>
            
            <div class="medicine-card-actions">
              <button 
                @click="archiveMedicine(medicine.id)" 
                class="btn-archive"
                title="Mark as completed/archived"
              >
                Archive Medicine
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-medicines">
          <p>No active medicines. Add some medicines to get started!</p>
        </div>
      </div>

      <!-- Archived Medicines -->
      <div v-if="medicinesTab === 'archived'" class="medicines-section">
        <div v-if="archivedMedicines.length > 0" class="medicines-grid">
          <div v-for="medicine in archivedMedicines" :key="medicine.id" class="medicine-card archived">
            <div class="medicine-card-header">
              <h3 class="medicine-card-name">{{ medicine.name }}</h3>
              <div class="medicine-status archived">Archived</div>
            </div>
            
            <div class="medicine-card-info">
              <p><strong>Frequency:</strong> {{ medicine.frequency }} times per day</p>
              <p><strong>Schedule:</strong> 
                <span v-if="medicine.schedule_type === 'preset'">Preset times</span>
                <span v-else-if="medicine.schedule_type === 'custom'">Custom times</span>
                <span v-else>Equal intervals</span>
              </p>
              <p><strong>Added:</strong> {{ formatCreatedDate(medicine.created_at) }}</p>
              <p v-if="medicine.archived_at"><strong>Archived:</strong> {{ formatCreatedDate(medicine.archived_at) }}</p>
            </div>
            
            <div class="medicine-card-actions">
              <button 
                @click="reactivateMedicine(medicine.id)" 
                class="btn-reactivate"
                title="Reactivate this medicine"
              >
                Reactivate
              </button>
              <button 
                @click="deleteMedicine(medicine.id)" 
                class="btn-delete"
                title="Permanently delete this medicine"
                onclick="return confirm('Are you sure you want to permanently delete this medicine? This action cannot be undone.')"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-medicines">
          <p>No archived medicines yet.</p>
        </div>
      </div>
    </div>

    <!-- Add Medicine Form -->
    <div v-if="currentView === 'add'" class="view-content">
      <form @submit.prevent="addMedicine" class="add-form">
        <div class="form-group">
          <label for="medicineName">Medicine Name:</label>
          <input 
            id="medicineName"
            v-model="newMedicine.name" 
            type="text" 
            required 
            placeholder="Enter medicine name"
          />
        </div>
        
        <div class="form-group">
          <label for="frequency">How many times per day:</label>
          <select id="frequency" v-model="newMedicine.frequency" required>
            <option value="">Select frequency</option>
            <option value="1">Once a day</option>
            <option value="2">Twice a day</option>
            <option value="3">Three times a day</option>
            <option value="4">Four times a day</option>
          </select>
        </div>
        
        <div class="form-group" v-if="newMedicine.frequency">
          <label>Schedule Type:</label>
          <select v-model="newMedicine.scheduleType" required>
            <option value="">Select schedule type</option>
            <option value="preset">Preset times (Morning, Noon, Night)</option>
            <option value="interval">Equal intervals</option>
            <option value="custom">Custom times (Choose exact times)</option>
          </select>
        </div>

        <!-- Preset Times Selection -->
        <div v-if="newMedicine.scheduleType === 'preset'" class="form-group">
          <label>Choose Preset Times:</label>
          <div class="preset-times">
            <div class="preset-options">
              <div 
                v-for="option in availablePresetOptions" 
                :key="option.value"
                class="preset-option"
                :class="{ selected: newMedicine.presetTimes === option.value }"
                @click="newMedicine.presetTimes = option.value"
              >
                <input 
                  type="radio" 
                  :value="option.value" 
                  v-model="newMedicine.presetTimes"
                  :id="'preset-' + option.value"
                  required
                />
                <label :for="'preset-' + option.value">{{ option.label }}</label>
              </div>
            </div>
          </div>
          <p class="time-help">Choose {{ newMedicine.frequency }} preset time(s) for your medicine</p>
        </div>

        <!-- Custom Times Input -->
        <div v-if="newMedicine.scheduleType === 'custom'" class="form-group">
          <label>Set Custom Times:</label>
          <div class="custom-times">
            <div 
              v-for="(time, index) in newMedicine.customTimes" 
              :key="index"
              class="time-input-group"
            >
              <label :for="'time-' + index">Time {{ index + 1 }}:</label>
              <input 
                :id="'time-' + index"
                v-model="newMedicine.customTimes[index]"
                type="time" 
                required
                class="time-input"
              />
            </div>
          </div>
          <p class="time-help">Set {{ newMedicine.frequency }} time(s) when you need to take this medicine</p>
        </div>
        
        <button type="submit">Add Medicine</button>
      </form>
    </div>

    <!-- Calendar View -->
    <div v-if="currentView === 'calendar'" class="view-content">
      <div class="calendar-header">
        <button @click="changeMonth(-1)" class="month-nav-btn">← Previous</button>
        <h2>{{ formatMonth(calendarDate) }}</h2>
        <button @click="changeMonth(1)" class="month-nav-btn">Next →</button>
      </div>
      
      <div class="calendar-grid">
        <div class="calendar-day-header" v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day">
          {{ day }}
        </div>
        
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          class="calendar-day"
          :class="{ 
            'other-month': !day.currentMonth,
            'today': day.isToday,
            'selected': day.date === selectedDate
          }"
          @click="selectCalendarDate(day.date)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="day-progress" v-if="day.currentMonth && day.progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: day.progress.percentage + '%' }"
              ></div>
            </div>
            <div class="progress-text">{{ day.progress.taken }}/{{ day.progress.total }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics View -->
    <div v-if="currentView === 'stats'" class="view-content">
      <h2>Medicine Statistics</h2>
      
      <div class="stats-period">
        <button 
          @click="statsPeriod = 'week'" 
          :class="{ active: statsPeriod === 'week' }"
          class="period-btn"
        >
          This Week
        </button>
        <button 
          @click="statsPeriod = 'month'" 
          :class="{ active: statsPeriod === 'month' }"
          class="period-btn"
        >
          This Month
        </button>
      </div>

      <div class="medicine-stats" v-if="medicineStats.length > 0">
        <div v-for="stat in medicineStats" :key="stat.id" class="stat-item">
          <div class="stat-header">
            <h3>{{ stat.name }}</h3>
            <div class="stat-summary">
              {{ stat.taken }}/{{ stat.total }} doses taken ({{ stat.percentage }}%)
            </div>
          </div>
          
          <div class="stat-progress">
            <div class="progress-bar large">
              <div 
                class="progress-fill" 
                :style="{ width: stat.percentage + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="stat-details">
            <p>Expected: {{ stat.total }} doses</p>
            <p>Taken: {{ stat.taken }} doses</p>
            <p>Missed: {{ stat.total - stat.taken }} doses</p>
          </div>
        </div>
      </div>
      <div v-else class="no-stats">
        <p>No statistics available yet. Start taking your medicines to see progress!</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentView: 'today',
      medicines: [],
      allMedicines: [],
      medicinesTab: 'active',
      selectedDate: new Date().toISOString().split('T')[0],
      calendarDate: new Date(),
      calendarData: {},
      medicineStats: [],
      statsPeriod: 'week',
      newMedicine: {
        name: '',
        frequency: '',
        scheduleType: '',
        customTimes: [],
        presetTimes: ''
      }
    }
  },
  
  computed: {
    isToday() {
      return this.selectedDate === new Date().toISOString().split('T')[0]
    },
    
    availablePresetOptions() {
      const frequency = parseInt(this.newMedicine.frequency)
      const allOptions = [
        { value: 'morning', label: 'Morning', times: ['Morning'] },
        { value: 'noon', label: 'Noon', times: ['Noon'] },
        { value: 'evening', label: 'Evening', times: ['Evening'] },
        { value: 'night', label: 'Night', times: ['Night'] },
        { value: 'morning-night', label: 'Morning & Night', times: ['Morning', 'Night'] },
        { value: 'morning-noon', label: 'Morning & Noon', times: ['Morning', 'Noon'] },
        { value: 'noon-night', label: 'Noon & Night', times: ['Noon', 'Night'] },
        { value: 'morning-evening', label: 'Morning & Evening', times: ['Morning', 'Evening'] },
        { value: 'morning-noon-night', label: 'Morning, Noon & Night', times: ['Morning', 'Noon', 'Night'] },
        { value: 'morning-noon-evening', label: 'Morning, Noon & Evening', times: ['Morning', 'Noon', 'Evening'] },
        { value: 'morning-noon-evening-night', label: 'Morning, Noon, Evening & Night', times: ['Morning', 'Noon', 'Evening', 'Night'] }
      ]
      
      return allOptions.filter(option => option.times.length === frequency)
    },
    
    activeMedicines() {
      return this.allMedicines.filter(medicine => !medicine.archived)
    },
    
    archivedMedicines() {
      return this.allMedicines.filter(medicine => medicine.archived)
    },
    
    calendarDays() {
      const year = this.calendarDate.getFullYear()
      const month = this.calendarDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      const days = []
      const today = new Date().toISOString().split('T')[0]
      
      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        const dateStr = currentDate.toISOString().split('T')[0]
        
        days.push({
          date: dateStr,
          dayNumber: currentDate.getDate(),
          currentMonth: currentDate.getMonth() === month,
          isToday: dateStr === today,
          progress: this.calendarData[dateStr] || null
        })
      }
      
      return days
    }
  },
  
  async mounted() {
    await this.loadMedicines()
    await this.loadAllMedicines()
    await this.loadCalendarData()
    await this.loadStats()
  },
  
  watch: {
    selectedDate() {
      this.loadMedicines()
    },
    
    calendarDate() {
      this.loadCalendarData()
    },
    
    statsPeriod() {
      this.loadStats()
    },
    
    'newMedicine.frequency'() {
      if (this.newMedicine.scheduleType === 'custom') {
        this.updateCustomTimes()
      }
    },
    
    'newMedicine.scheduleType'() {
      if (this.newMedicine.scheduleType === 'custom') {
        this.updateCustomTimes()
      }
    }
  },
  
  methods: {
    async loadMedicines() {
      try {
        const response = await fetch(`/api/medicines?date=${this.selectedDate}`)
        this.medicines = await response.json()
      } catch (error) {
        console.error('Error loading medicines:', error)
      }
    },
    
    async loadCalendarData() {
      try {
        const year = this.calendarDate.getFullYear()
        const month = this.calendarDate.getMonth() + 1
        const response = await fetch(`/api/calendar/${year}/${month}`)
        this.calendarData = await response.json()
      } catch (error) {
        console.error('Error loading calendar data:', error)
      }
    },
    
    async loadStats() {
      try {
        const response = await fetch(`/api/stats?period=${this.statsPeriod}`)
        this.medicineStats = await response.json()
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    },
    
    updateCustomTimes() {
      const frequency = parseInt(this.newMedicine.frequency)
      if (frequency > 0) {
        this.newMedicine.customTimes = Array(frequency).fill('').map((_, index) => {
          return this.newMedicine.customTimes[index] || ''
        })
      }
    },

    async addMedicine() {
      try {
        const response = await fetch('/api/medicines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newMedicine)
        })
        
        if (response.ok) {
          this.newMedicine = { name: '', frequency: '', scheduleType: '', customTimes: [], presetTimes: '' }
          this.currentView = 'today'
          await this.loadMedicines()
        }
      } catch (error) {
        console.error('Error adding medicine:', error)
      }
    },
    
    async toggleDose(doseId, taken) {
      try {
        await fetch(`/api/doses/${doseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ taken })
        })
        
        await this.loadMedicines()
        await this.loadCalendarData()
        await this.loadStats()
      } catch (error) {
        console.error('Error updating dose:', error)
      }
    },
    
    changeDate(days) {
      const newDate = new Date(this.selectedDate)
      newDate.setDate(newDate.getDate() + days)
      this.selectedDate = newDate.toISOString().split('T')[0]
    },
    
    changeMonth(months) {
      const newDate = new Date(this.calendarDate)
      newDate.setMonth(newDate.getMonth() + months)
      this.calendarDate = newDate
    },
    
    selectCalendarDate(date) {
      this.selectedDate = date
      this.currentView = 'today'
    },
    
    formatDate(dateStr) {
      const date = new Date(dateStr + 'T00:00:00')
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (dateStr === today.toISOString().split('T')[0]) {
        return 'Today'
      } else if (dateStr === yesterday.toISOString().split('T')[0]) {
        return 'Yesterday'
      } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
        return 'Tomorrow'
      } else {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }
    },
    
    formatMonth(date) {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    },
    
    async loadAllMedicines() {
      try {
        const response = await fetch('/api/medicines/all')
        this.allMedicines = await response.json()
      } catch (error) {
        console.error('Error loading all medicines:', error)
      }
    },
    
    async archiveMedicine(medicineId) {
      try {
        const response = await fetch(`/api/medicines/${medicineId}/archive`, {
          method: 'PUT'
        })
        
        if (response.ok) {
          await this.loadAllMedicines()
          await this.loadMedicines()
          await this.loadStats()
        }
      } catch (error) {
        console.error('Error archiving medicine:', error)
      }
    },
    
    async reactivateMedicine(medicineId) {
      try {
        const response = await fetch(`/api/medicines/${medicineId}/reactivate`, {
          method: 'PUT'
        })
        
        if (response.ok) {
          await this.loadAllMedicines()
          await this.loadMedicines()
          await this.loadStats()
        }
      } catch (error) {
        console.error('Error reactivating medicine:', error)
      }
    },
    
    async deleteMedicine(medicineId) {
      if (!confirm('Are you sure you want to permanently delete this medicine? This action cannot be undone.')) {
        return
      }
      
      try {
        const response = await fetch(`/api/medicines/${medicineId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await this.loadAllMedicines()
          await this.loadMedicines()
          await this.loadStats()
        }
      } catch (error) {
        console.error('Error deleting medicine:', error)
      }
    },
    
    formatCreatedDate(dateStr) {
      if (!dateStr) return 'Unknown'
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }
}
</script>