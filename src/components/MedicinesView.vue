<template>
  <div class="view-content">
    <h2>Manage Medicines</h2>

    <div class="medicines-tabs">
      <button @click="activeTab = 'active'" :class="{ active: activeTab === 'active' }" class="medicines-tab-btn">
        Active Medicines ({{ activeMedicines.length }})
      </button>
      <button @click="activeTab = 'archived'" :class="{ active: activeTab === 'archived' }" class="medicines-tab-btn">
        Archived Medicines ({{ archivedMedicines.length }})
      </button>
    </div>

    <!-- Active Medicines -->
    <div v-if="activeTab === 'active'" class="medicines-section">
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
            <button @click="$emit('archive-medicine', medicine.id)" class="btn-archive" title="Mark as completed/archived">
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
    <div v-if="activeTab === 'archived'" class="medicines-section">
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
            <button @click="$emit('reactivate-medicine', medicine.id)" class="btn-reactivate" title="Reactivate this medicine">
              Reactivate
            </button>
            <button @click="$emit('delete-medicine', medicine.id)" class="btn-delete" title="Permanently delete this medicine">
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
</template>

<script>
import { formatCreatedDate } from '../utils/dateUtils.js'

export default {
  name: 'MedicinesView',
  props: {
    allMedicines: {
      type: Array,
      required: true
    }
  },
  emits: ['archive-medicine', 'reactivate-medicine', 'delete-medicine'],
  data() {
    return {
      activeTab: 'active'
    }
  },
  computed: {
    activeMedicines() {
      return this.allMedicines.filter(medicine => !medicine.archived)
    },
    archivedMedicines() {
      return this.allMedicines.filter(medicine => medicine.archived)
    }
  },
  methods: {
    formatCreatedDate
  }
}
</script>