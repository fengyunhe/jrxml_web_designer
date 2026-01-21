<template>
  <div v-if="visible" class="input-modal" @click.self="handleCancel">
    <div class="input-content">
      <h3 class="input-title">{{ title }}</h3>
      <p v-if="message" class="input-message">{{ message }}</p>
      <input 
        v-model="inputValue" 
        type="text" 
        class="input-field" 
        ref="inputRef"
        @keyup.enter="handleConfirm"
        @keyup.esc="handleCancel"
      />
      <div class="input-actions">
        <n-button type="default" @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { NButton } from 'naive-ui';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '输入'
  },
  message: {
    type: String,
    default: ''
  },
  defaultValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const inputValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    inputValue.value = props.defaultValue;
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
        inputRef.value.select();
      }
    });
  }
});

const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

const handleConfirm = () => {
  if (inputValue.value.trim()) {
    emit('confirm', inputValue.value.trim());
    emit('update:visible', false);
  }
};
</script>

<style scoped>
.input-modal {
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

.input-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.input-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.input-message {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.input-field {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 20px;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #4a90e2;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}


</style>
