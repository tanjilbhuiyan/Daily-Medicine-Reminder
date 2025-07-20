<!--
  Medicine Reminder Vue.js Application
  
  Security Features Implemented:
  - XSS Prevention: Vue.js automatic HTML escaping
  - Input Sanitization: All user inputs are validated and sanitized
  - CSRF Protection: Same-origin policy enforced
  - Content Security Policy: Implemented via backend headers
  - No Sensitive Data Exposure: All data stays local
  
  @author Medicine Reminder Team
  @version 1.0.0
  @license MIT
-->
<template>
    <div class="container">
        <!-- Notification Toast -->
        <NotificationToast :notification="notification" @hide="hideNotification" />

        <!-- Custom Confirmation Modal -->
        <ConfirmDialog :confirmDialog="confirmDialog" @cancel="cancelConfirm" @confirm="confirmAction" />

        <h1>Daily Medicine Reminder</h1>

        <!-- Navigation Tabs -->
        <div class="nav-tabs">
            <button @click="currentView = 'today'" :class="{ active: currentView === 'today' }" class="nav-tab">
                Today
            </button>
            <button @click="currentView = 'medicines'" :class="{ active: currentView === 'medicines' }" class="nav-tab">
                Medicines
            </button>
            <button @click="currentView = 'calendar'" :class="{ active: currentView === 'calendar' }" class="nav-tab">
                Calendar
            </button>
            <button @click="currentView = 'stats'" :class="{ active: currentView === 'stats' }" class="nav-tab">
                Statistics
            </button>
            <button @click="currentView = 'add'" :class="{ active: currentView === 'add' }" class="nav-tab">
                Add Medicine
            </button>
        </div>

        <!-- Today View -->
        <TodayView v-if="currentView === 'today'" :medicines="medicines" :selectedDate="selectedDate"
            @change-date="handleChangeDate" @go-to-today="goToToday" @toggle-dose="handleToggleDose" />

        <!-- Medicines View -->
        <MedicinesView v-if="currentView === 'medicines'" :allMedicines="allMedicines"
            @archive-medicine="handleArchiveMedicine" @reactivate-medicine="handleReactivateMedicine"
            @delete-medicine="handleDeleteMedicine" />

        <!-- Add Medicine View -->
        <AddMedicineForm v-if="currentView === 'add'" @add-medicine="handleAddMedicine" />

        <!-- Calendar View -->
        <CalendarView v-if="currentView === 'calendar'" :selectedDate="selectedDate" :calendarData="calendarData"
            @select-date="handleSelectDate" @change-month="handleChangeMonth" @show-notification="showNotification" />

        <!-- Statistics View -->
        <StatsView v-if="currentView === 'stats'" :medicineStats="medicineStats" />
    </div>
</template>

<script>
import NotificationToast from './components/NotificationToast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import TodayView from './components/TodayView.vue'
import MedicinesView from './components/MedicinesView.vue'
import AddMedicineForm from './components/AddMedicineForm.vue'
import CalendarView from './components/CalendarView.vue'
import StatsView from './components/StatsView.vue'
import { changeDate, getTodayString } from './utils/dateUtils.js'
import { loadMedicines, loadAllMedicines, loadCalendarData, loadStats, toggleDose, addMedicine, archiveMedicine, reactivateMedicine, deleteMedicine } from './utils/apiUtils.js'

export default {
    name: 'App',
    components: {
        NotificationToast,
        ConfirmDialog,
        TodayView,
        MedicinesView,
        AddMedicineForm,
        CalendarView,
        StatsView
    },
    data() {
        return {
            currentView: 'today',
            medicines: [],
            allMedicines: [],
            selectedDate: getTodayString(),
            calendarData: {},
            medicineStats: [],

            notification: {
                show: false,
                message: '',
                type: 'success',
                icon: '✓'
            },
            confirmDialog: {
                show: false,
                title: '',
                message: '',
                medicineName: '',
                details: [],
                warning: '',
                type: 'danger',
                icon: '⚠️',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                onConfirm: null
            }
        }
    },

    async mounted() {
        await this.loadMedicinesData()
        await this.loadAllMedicinesData()
        await this.loadCalendarData()
        await this.loadStatsData()
    },

    watch: {
        selectedDate() {
            this.loadMedicinesData()
        }
    },

    methods: {
        async loadMedicinesData() {
            try {
                this.medicines = await loadMedicines(this.selectedDate)
            } catch (error) {
                this.showNotification('Failed to load medicines. Please refresh the page.', 'error')
            }
        },

        async handleChangeDate(days) {
            const newDateStr = changeDate(this.selectedDate, days)
            const today = getTodayString()

            // Prevent navigation to future dates
            if (newDateStr > today) {
                this.showNotification('Cannot navigate to future dates', 'warning')
                return
            }

            this.selectedDate = newDateStr
        },

        goToToday() {
            this.selectedDate = getTodayString()
            this.showNotification('Switched to today\'s view', 'info')
        },

        async handleToggleDose(doseId, taken) {
            // Don't try to update virtual doses (for past dates without records)
            if (typeof doseId === 'string' && doseId.startsWith('virtual-')) {
                this.showNotification('Cannot modify doses from past dates', 'warning')
                return
            }

            try {
                await toggleDose(doseId, taken)
                await this.loadMedicinesData()
            } catch (error) {
                this.showNotification('Error updating dose. Please try again.', 'error')
            }
        },

        showNotification(message, type = 'success') {
            const icons = {
                success: '✓',
                error: '✗',
                warning: '⚠',
                info: 'ℹ'
            }

            this.notification = {
                show: true,
                message,
                type,
                icon: icons[type] || '✓'
            }

            // Auto-hide after 4 seconds
            setTimeout(() => {
                this.hideNotification()
            }, 4000)
        },

        hideNotification() {
            this.notification.show = false
        },

        cancelConfirm() {
            this.confirmDialog.show = false
            this.confirmDialog.onConfirm = null
        },

        confirmAction() {
            if (this.confirmDialog.onConfirm) {
                this.confirmDialog.onConfirm()
            }
            this.cancelConfirm()
        },

        async loadAllMedicinesData() {
            try {
                this.allMedicines = await loadAllMedicines()
            } catch (error) {
                this.showNotification('Failed to load medicines list.', 'error')
            }
        },

        async handleAddMedicine(medicineData) {
            try {
                await addMedicine(medicineData)
                await Promise.all([
                    this.loadMedicinesData(),
                    this.loadAllMedicinesData(),
                    this.loadStatsData()
                ])
                this.showNotification(`Medicine "${medicineData.name}" added successfully!`, 'success')
                this.currentView = 'today'
            } catch (error) {
                this.showNotification('Failed to add medicine. Please try again.', 'error')
            }
        },

        async handleArchiveMedicine(medicineId) {
            try {
                const medicine = this.allMedicines.find(m => m.id === medicineId)
                const medicineName = medicine ? medicine.name : 'Medicine'

                await archiveMedicine(medicineId)
                await Promise.all([
                    this.loadAllMedicinesData(),
                    this.loadMedicinesData(),
                    this.loadStatsData()
                ])
                this.showNotification(`"${medicineName}" has been archived successfully!`, 'success')
            } catch (error) {
                this.showNotification('Failed to archive medicine. Please try again.', 'error')
            }
        },

        async handleReactivateMedicine(medicineId) {
            try {
                const medicine = this.allMedicines.find(m => m.id === medicineId)
                const medicineName = medicine ? medicine.name : 'Medicine'

                await reactivateMedicine(medicineId)
                await Promise.all([
                    this.loadAllMedicinesData(),
                    this.loadMedicinesData(),
                    this.loadStatsData()
                ])
                this.showNotification(`"${medicineName}" has been reactivated successfully!`, 'success')
            } catch (error) {
                this.showNotification('Failed to reactivate medicine. Please try again.', 'error')
            }
        },

        async handleDeleteMedicine(medicineId) {
            try {
                const medicine = this.allMedicines.find(m => m.id === medicineId)
                const medicineName = medicine ? medicine.name : 'Medicine'

                await deleteMedicine(medicineId)
                await Promise.all([
                    this.loadAllMedicinesData(),
                    this.loadMedicinesData(),
                    this.loadStatsData()
                ])
                this.showNotification(`"${medicineName}" has been deleted permanently.`, 'success')
            } catch (error) {
                this.showNotification('Failed to delete medicine. Please try again.', 'error')
            }
        },

        async loadCalendarData() {
            try {
                const now = new Date()
                const year = now.getFullYear()
                const month = now.getMonth() + 1
                this.calendarData = await loadCalendarData(year, month)
            } catch (error) {
                console.error('Error loading calendar data:', error)
            }
        },

        async loadStatsData() {
            try {
                this.medicineStats = await loadStats()
            } catch (error) {
                console.error('Error loading stats:', error)
            }
        },

        handleSelectDate(date) {
            this.selectedDate = date
            this.currentView = 'today'
        },

        async handleChangeMonth(calendarDate) {
            try {
                const year = calendarDate.getFullYear()
                const month = calendarDate.getMonth() + 1
                this.calendarData = await loadCalendarData(year, month)
            } catch (error) {
                console.error('Error loading calendar data:', error)
            }
        }
    }
}
</script>