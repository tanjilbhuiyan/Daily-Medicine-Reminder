<template>
  <div class="view-content">
    <h2>Medicine History & Statistics</h2>

    <div class="medicine-stats" v-if="medicineStats.length > 0">
      <div v-for="stat in medicineStats" :key="stat.id" class="stat-item"
        :class="{ archived: stat.status === 'archived' }">
        <div class="stat-header">
          <div class="stat-title-section">
            <h3>{{ stat.name }}</h3>
            <div class="stat-status" :class="stat.status">
              {{ stat.status === 'active' ? 'Active' : 'Archived' }}
            </div>
          </div>
          <div class="stat-summary">
            {{ stat.takenDoses }}/{{ stat.expectedDoses }} doses taken ({{ stat.adherencePercentage }}%)
          </div>
        </div>

        <div class="stat-timeline">
          <div class="timeline-item">
            <strong>Started:</strong> {{ formatStatDate(stat.startDate) }}
            <span class="timeline-detail">({{ stat.totalDays }} {{ stat.totalDays === 1 ? 'day' : 'days' }})</span>
          </div>
          <div v-if="stat.status === 'archived'" class="timeline-item">
            <strong>Archived:</strong> {{ formatStatDate(stat.endDate) }}
          </div>
          <div class="timeline-item">
            <strong>Frequency:</strong> {{ stat.frequency }} {{ stat.frequency === 1 ? 'dose' : 'doses' }} per day
          </div>
        </div>

        <div class="stat-progress">
          <div class="progress-bar large">
            <div class="progress-fill" :style="{
              width: stat.adherencePercentage + '%',
              backgroundColor: getAdherenceColor(stat.adherencePercentage)
            }"></div>
          </div>
        </div>

        <div class="stat-details">
          <div class="stat-detail-grid">
            <div class="stat-detail-item">
              <span class="stat-label">Expected:</span>
              <span class="stat-value">{{ stat.expectedDoses }} doses</span>
            </div>
            <div class="stat-detail-item">
              <span class="stat-label">Taken:</span>
              <span class="stat-value taken">{{ stat.takenDoses }} doses</span>
            </div>
            <div class="stat-detail-item">
              <span class="stat-label">Missed:</span>
              <span class="stat-value missed">{{ stat.missedDoses }} doses</span>
            </div>
            <div class="stat-detail-item">
              <span class="stat-label">Adherence:</span>
              <span class="stat-value" :class="getAdherenceClass(stat.adherencePercentage)">
                {{ stat.adherencePercentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-stats">
      <p>No medicine statistics available yet. Add some medicines to start tracking!</p>
    </div>
  </div>
</template>

<script>
import { formatStatDate } from '../utils/dateUtils.js'

export default {
  name: 'StatsView',
  props: {
    medicineStats: {
      type: Array,
      required: true
    }
  },
  methods: {
    formatStatDate,
    getAdherenceColor(percentage) {
      if (percentage >= 90) return '#4CAF50' // Green
      if (percentage >= 70) return '#FF9800' // Orange
      return '#F44336' // Red
    },
    getAdherenceClass(percentage) {
      if (percentage >= 90) return 'excellent'
      if (percentage >= 70) return 'good'
      return 'poor'
    }
  }
}
</script>