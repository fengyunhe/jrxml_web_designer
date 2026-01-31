<template>
  <div class="border-style-settings">
    <div class="form-group small full-width">
      <label>{{ label }}</label>
      <div class="border-controls">
        <div class="form-group small style-control">
          <label>{{ t('properties.style') }}</label>
          <select 
            v-model="borderStyle" 
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
            v-model.number="borderWidth" 
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
            v-model="borderColor" 
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

import type { DesignElement } from '../../../types';

interface BorderStyle {
  borderStyle?: string
  borderWidth?: number
  borderColor?: string
}

const props = defineProps<{
  modelValue: BorderStyle | DesignElement
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BorderStyle | DesignElement]
  'change': []
}>()

// 计算属性：边框样式
const borderStyle = computed({
  get: () => {
    if ('borderStyle' in props.modelValue) {
      return props.modelValue.borderStyle || '';
    } else if ('box' in props.modelValue) {
      return props.modelValue.box?.borderStyle || '';
    }
    return '';
  },
  set: (value) => {
    if ('borderStyle' in props.modelValue) {
      props.modelValue.borderStyle = value;
    } else if ('box' in props.modelValue) {
      if (!props.modelValue.box) {
        props.modelValue.box = {};
      }
      props.modelValue.box.borderStyle = value;
    }
  }
});

// 计算属性：边框宽度
const borderWidth = computed({
  get: () => {
    if ('borderWidth' in props.modelValue) {
      return props.modelValue.borderWidth || 0;
    } else if ('box' in props.modelValue) {
      return props.modelValue.box?.borderWidth || 0;
    }
    return 0;
  },
  set: (value) => {
    if ('borderWidth' in props.modelValue) {
      props.modelValue.borderWidth = value;
    } else if ('box' in props.modelValue) {
      if (!props.modelValue.box) {
        props.modelValue.box = {};
      }
      props.modelValue.box.borderWidth = value;
    }
  }
});

// 计算属性：边框颜色
const borderColor = computed({
  get: () => {
    if ('borderColor' in props.modelValue) {
      return props.modelValue.borderColor || '#000000';
    } else if ('box' in props.modelValue) {
      return props.modelValue.box?.borderColor || '#000000';
    }
    return '#000000';
  },
  set: (value) => {
    if ('borderColor' in props.modelValue) {
      props.modelValue.borderColor = value;
    } else if ('box' in props.modelValue) {
      if (!props.modelValue.box) {
        props.modelValue.box = {};
      }
      props.modelValue.box.borderColor = value;
    }
  }
});

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