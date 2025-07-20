<template>
  <div v-if="confirmDialog.show" class="modal-overlay" @click="cancelConfirm">
    <div class="modal-dialog" @click.stop>
      <div class="modal-header">
        <div class="modal-icon" :class="confirmDialog.type">
          {{ confirmDialog.icon }}
        </div>
        <h3 class="modal-title">{{ confirmDialog.title }}</h3>
      </div>

      <div class="modal-body">
        <div class="modal-medicine-info" v-if="confirmDialog.medicineName">
          <strong>Medicine:</strong> "{{ confirmDialog.medicineName }}"
        </div>

        <div class="modal-message">
          {{ confirmDialog.message }}
        </div>

        <div class="modal-details" v-if="confirmDialog.details && confirmDialog.details.length > 0">
          <p><strong>This will permanently delete:</strong></p>
          <ul>
            <li v-for="detail in confirmDialog.details" :key="detail">{{ detail }}</li>
          </ul>
        </div>

        <div class="modal-warning" v-if="confirmDialog.warning">
          <strong>⚠️ {{ confirmDialog.warning }}</strong>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="cancelConfirm" class="btn-cancel">
          {{ confirmDialog.cancelText || 'Cancel' }}
        </button>
        <button @click="confirmAction" class="btn-confirm" :class="confirmDialog.type">
          {{ confirmDialog.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    confirmDialog: {
      type: Object,
      required: true
    }
  },
  emits: ['cancel', 'confirm'],
  methods: {
    cancelConfirm() {
      this.$emit('cancel')
    },
    confirmAction() {
      this.$emit('confirm')
    }
  }
}
</script>