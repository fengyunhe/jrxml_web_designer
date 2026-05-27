<template>
  <div class="switch-control">
    <label class="switch-label">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        class="switch-input"
      />
      <span class="switch-slider"></span>
      <span class="switch-text">{{ label }}</span>
    </label>
    <span v-if="description" class="switch-description">{{ description }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped>
.switch-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 36px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  transition: background 0.3s;
}

.switch-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.switch-input:checked + .switch-slider {
  background: #1890ff;
}

.switch-input:checked + .switch-slider::after {
  transform: translateX(16px);
}

.switch-text {
  font-size: 14px;
  color: #333;
}

.switch-description {
  font-size: 12px;
  color: #999;
  margin-left: 44px;
}
</style>
