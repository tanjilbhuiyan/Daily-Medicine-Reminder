<template>
  <div class="view-content">
    <div class="calendar-header">
      <button @click="changeMonth(-1)" class="month-nav-btn">← Previous</button>
      <h2>{{ formatMonth(calendarDate) }}</h2>
      <button @click="changeMonth(1)" class="month-nav-btn">Next →</button>
    </div>

    <div class="calendar-grid">
      <div class="calendar-day-header" v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day">
        {{ day }}
      </div>

      <div v-for="day in calendarDays" :key="day.date" class="calendar-day" :class="{
        'other-month': !day.currentMonth,
        'today': day.isToday,
        'selected': day.date === selectedDate
      }" @click="selectCalendarDate(day.date)">
        <div class="day-number">{{ day.dayNumber }}</div>
        <div class="day-progress" v-if="day.currentMonth && day.progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: day.progress.percentage + '%' }"></div>
          </div>
          <div class="progress-text">{{ day.progress.taken }}/{{ day.progress.total }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatMonth, getTodayString } from '../utils/dateUtils.js'

export default {
  name: 'CalendarView',
  props: {
    selectedDate: {
      type: String,
      required: true
    },
    calendarData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['select-date', 'change-month'],
  data() {
    return {
      calendarDate: new Date()
    }
  },
  computed: {
    calendarDays() {
      const year = this.calendarDate.getFullYear();
      const month = this.calendarDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days = [];
      const today = getTodayString();

      function getLocalDateString(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }

      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = getLocalDateString(currentDate);

        days.push({
          date: dateStr,
          dayNumber: currentDate.getDate(),
          currentMonth: currentDate.getMonth() === month,
          isToday: dateStr === today,
          progress: this.calendarData[dateStr] || null
        });
      }

      return days;
    }
  },
  methods: {
    formatMonth,
    changeMonth(months) {
      const newDate = new Date(this.calendarDate)
      newDate.setMonth(newDate.getMonth() + months)
      this.calendarDate = newDate
      this.$emit('change-month', this.calendarDate)
    },
    selectCalendarDate(date) {
      const today = getTodayString()

      // Prevent selecting future dates
      if (date > today) {
        this.$emit('show-notification', 'Cannot view future dates', 'warning')
        return
      }

      this.$emit('select-date', date)
    }
  }
}
</script>