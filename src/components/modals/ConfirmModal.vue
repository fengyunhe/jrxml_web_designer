<template>
  <div v-if="visible" class="confirm-modal" @click.self="handleCancel">
    <div class="confirm-content">
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
    <n-button type="default" @click="handleCancel">{{ t('modal.cancel') }}</n-button>
    <n-button type="primary" @click="handleConfirm">{{ t('modal.confirm') }}</n-button>
  </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认'
  },
  message: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

const handleConfirm = () => {
  emit('update:visible', false);
  emit('confirm');
};
</script>

<style scoped>
.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.confirm-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.confirm-message {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}


</style>
