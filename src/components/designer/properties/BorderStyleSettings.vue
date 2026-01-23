<template>
  <div class="border-style-settings">
    <div class="form-group small full-width">
      <label>{{ label }}</label>
      <div class="border-controls">
        <div class="form-group small style-control">
          <label>{{ t('properties.style') }}</label>
          <select 
            v-model="modelValue.borderStyle" 
            class="small-input border-select"
            @change="handleChange"
          >
            <option value="">{{ t('properties.none') }}</option>
            <option value="Solid">{{ t('properties.solid') }}</option>
            <option value="Dashed">{{ t('properties.dashed') }}</option>
            <option value="Dotted">{{ t('properties.dotted') }}</option>
            <option value="Double">{{ t('properties.double') }}</option>
          </select>
        </div>
        <div class="form-group small width-control">
          <label>{{ t('properties.width') }}</label>
          <input 
            v-model.number="modelValue.borderWidth" 
            type="number" 
            min="0"
            max="10"
            step="0.5"
            class="small-input"
            @change="handleChange"
          />
        </div>
        <div class="form-group small color-control">
          <label>{{ t('properties.color') }}</label>
          <input 
            v-model="modelValue.borderColor" 
            type="color" 
            class="small-input color-picker"
            @change="handleChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface BorderStyle {
  borderStyle?: string
  borderWidth?: number
  borderColor?: string
}

const props = defineProps<{
  modelValue: BorderStyle
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BorderStyle]
  'change': []
}>()

const handleChange = () => {
  emit('update:modelValue', props.modelValue)
  emit('change')
}
</script>

<style scoped>
.border-style-settings {
  width: 100%;
}

.form-group.small {
  flex: 1;
  min-width: 80px;
  margin-bottom: 4px;
}

.form-group.small.full-width {
  width: 100%;
  flex-basis: 100%;
  margin-top: 2px;
}

.form-group.small label {
  margin-bottom: 1px;
  font-size: 10px;
}

.small-input {
  width: 100%;
  padding: 1px 4px;
  font-size: 10px;
  border: 1px solid #ddd;
  border-radius: 2px;
  height: 20px;
}

.small-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.border-controls {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.style-control {
  flex: 1;
}

.width-control {
  flex: 0 0 60px;
}

.color-control {
  flex: 0 0 60px;
}

.border-select {
  padding: 0 4px;
}

.color-picker {
  padding: 0;
  cursor: pointer;
}
</style>