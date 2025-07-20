<template>
  <div class="view-content">
    <form @submit.prevent="handleSubmit" class="add-form">
      <div class="form-group">
        <label for="medicineName">Medicine Name:</label>
        <input id="medicineName" v-model="newMedicine.name" type="text" required placeholder="Enter medicine name" />
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
            <div v-for="option in availablePresetOptions" :key="option.value" class="preset-option"
              :class="{ selected: newMedicine.presetTimes === option.value }"
              @click="newMedicine.presetTimes = option.value">
              <input type="radio" :value="option.value" v-model="newMedicine.presetTimes"
                :id="'preset-' + option.value" required />
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
          <div v-for="(time, index) in newMedicine.customTimes" :key="index" class="time-input-group">
            <label :for="'time-' + index">Time {{ index + 1 }}:</label>
            <input :id="'time-' + index" v-model="newMedicine.customTimes[index]" type="time" required
              class="time-input" />
          </div>
        </div>
        <p class="time-help">Set {{ newMedicine.frequency }} time(s) when you need to take this medicine</p>
      </div>

      <button type="submit">Add Medicine</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'AddMedicineForm',
  emits: ['add-medicine'],
  data() {
    return {
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
    }
  },
  watch: {
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
    updateCustomTimes() {
      const frequency = parseInt(this.newMedicine.frequency)
      if (frequency > 0) {
        this.newMedicine.customTimes = Array(frequency).fill('').map((_, index) => {
          return this.newMedicine.customTimes[index] || ''
        })
      }
    },
    handleSubmit() {
      this.$emit('add-medicine', { ...this.newMedicine })
      this.resetForm()
    },
    resetForm() {
      this.newMedicine = {
        name: '',
        frequency: '',
        scheduleType: '',
        customTimes: [],
        presetTimes: ''
      }
    }
  }
}
</script>