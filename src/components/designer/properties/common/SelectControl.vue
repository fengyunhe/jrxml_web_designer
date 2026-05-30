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
  gap: 4px;
}

.select-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.select-input {
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
}

.select-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.select-input:hover {
  border-color: #40a9ff;
}

.select-description {
  font-size: 12px;
  color: #999;
}
</style>
