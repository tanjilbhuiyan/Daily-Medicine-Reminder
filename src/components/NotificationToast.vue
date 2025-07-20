<template>
  <div v-if="notification.show" class="notification" :class="notification.type">
    <div class="notification-content">
      <span class="notification-icon">{{ notification.icon }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button @click="hideNotification" class="notification-close">&times;</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationToast',
  props: {
    notification: {
      type: Object,
      required: true
    }
  },
  emits: ['hide'],
  methods: {
    hideNotification() {
      this.$emit('hide')
    }
  }
}
</script>