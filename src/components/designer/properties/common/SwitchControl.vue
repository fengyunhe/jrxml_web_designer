<template>
  <div class="switch-control">
    <label class="switch-label">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
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
  gap: var(--prop-spacing-xs);
}

.switch-label {
  display: flex;
  align-items: center;
  gap: var(--prop-spacing-sm);
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
  background: var(--prop-bg-tertiary);
  border: 1px solid var(--prop-border-color);
  border-radius: 10px;
  transition: background-color var(--prop-transition-fast), border-color var(--prop-transition-fast);
}

.switch-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transition: transform var(--prop-transition-fast);
}

.switch-input:checked + .switch-slider {
  background: var(--prop-primary-color);
  border-color: var(--prop-primary-color);
}

.switch-input:checked + .switch-slider::after {
  transform: translateX(16px);
}

.switch-text {
  font-size: var(--prop-font-size-md);
  color: var(--prop-text-primary);
}

.switch-description {
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-tertiary);
  margin-left: 44px;
}
</style>
