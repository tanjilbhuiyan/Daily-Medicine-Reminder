<template>
  <div class="view-content">
    <div class="date-navigation">
      <button @click="$emit('change-date', -1)" class="date-nav-btn">← Previous Day</button>
      <div class="date-info">
        <h2>{{ formattedDate }}</h2>
        <div v-if="isPastDate" class="past-date-warning">
          <span class="warning-icon">🔒</span>
          <span>Past records are read-only</span>
        </div>
        <div v-if="isFutureDate" class="future-date-warning">
          <span class="warning-icon">🚫</span>
          <span>Future dates are not accessible</span>
        </div>
        <div v-if="!isToday" class="go-to-today">
          <button @click="$emit('go-to-today')" class="btn-today">Go to Today</button>
        </div>
      </div>
      <button @click="$emit('change-date', 1)" class="date-nav-btn" :disabled="isToday">Next Day →</button>
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

        <div class="doses" v-if="medicine.doses && medicine.doses.length > 0">
          <div v-for="dose in medicine.doses" :key="dose.id" class="dose-item" :class="{
            taken: dose.taken,
            disabled: isPastDate || isFutureDate,
            'past-date': isPastDate,
            'future-date': isFutureDate
          }">
            <input type="checkbox" :checked="dose.taken" @change="$emit('toggle-dose', dose.id, $event.target.checked)"
              :disabled="isPastDate || isFutureDate" class="dose-checkbox" />
            <span>{{ dose.time_label }}</span>
            <span v-if="dose.taken" style="color: green;">✓</span>
            <span v-if="isPastDate && !dose.taken" class="missed-indicator" title="Missed dose">✗</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-medicines">
      <p v-if="isPastDate">No medicine records found for this date.</p>
      <p v-else>No medicines added yet. Go to "Add Medicine" tab to get started.</p>
    </div>
  </div>
</template>

<script>
import { formatDate, isToday, isPastDate, isFutureDate } from '../utils/dateUtils.js'

export default {
  name: 'TodayView',
  props: {
    medicines: {
      type: Array,
      required: true
    },
    selectedDate: {
      type: String,
      required: true
    }
  },
  emits: ['change-date', 'go-to-today', 'toggle-dose'],
  computed: {
    formattedDate() {
      return formatDate(this.selectedDate)
    },
    isToday() {
      return isToday(this.selectedDate)
    },
    isPastDate() {
      return isPastDate(this.selectedDate)
    },
    isFutureDate() {
      return isFutureDate(this.selectedDate)
    }
  }
}
</script>