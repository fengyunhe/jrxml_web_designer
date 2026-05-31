<template>
  <div class="select-control">
    <label v-if="label" class="select-label">{{ label }}</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="select-input"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-if="description" class="select-description">{{ description }}</span>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: string;
  label: string;
}

defineProps<{
  modelValue: string;
  options: Option[];
  label?: string;
  description?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.select-control {
  display: flex;
  flex-direction: column;
  gap: var(--prop-spacing-xs);
}

.select-label {
  display: block;
  margin-bottom: var(--prop-spacing-xs);
  font-size: var(--prop-font-size-sm);
  font-weight: var(--prop-font-weight-medium);
  color: var(--prop-text-secondary);
}

.select-input {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-primary);
  background-color: var(--prop-bg-primary);
  border: 1px solid var(--prop-border-color);
  border-radius: var(--prop-border-radius-md);
  outline: none;
  cursor: pointer;
  transition: border-color var(--prop-transition-fast), box-shadow var(--prop-transition-fast);
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}

.select-input:hover {
  border-color: var(--prop-border-hover);
}

.select-input:focus {
  border-color: var(--prop-border-focus);
  box-shadow: var(--prop-focus-ring);
}

.select-description {
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-tertiary);
}
</style>
