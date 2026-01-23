<template>
  <div class="font-style-settings">
    <div class="form-group">
      <label>{{ t('properties.textAlignment') }}</label>
      <div class="button-group alignment-buttons">
        <button 
          type="button" 
          :class="{ active: modelValue.textAlignment === 'Left' }" 
          @click="modelValue.textAlignment = 'Left'"
        >
          {{ t('properties.left') }}
        </button>
        <button 
          type="button" 
          :class="{ active: modelValue.textAlignment === 'Center' }" 
          @click="modelValue.textAlignment = 'Center'"
        >
          {{ t('properties.center') }}
        </button>
        <button 
          type="button" 
          :class="{ active: modelValue.textAlignment === 'Right' }" 
          @click="modelValue.textAlignment = 'Right'"
        >
          {{ t('properties.right') }}
        </button>
        <button 
          type="button" 
          :class="{ active: modelValue.textAlignment === 'Justified' }" 
          @click="modelValue.textAlignment = 'Justified'"
        >
          {{ t('properties.justified') }}
        </button>
      </div>
    </div>
    <div class="form-group">
      <label>{{ t('properties.verticalAlignment') }}</label>
      <div class="button-group alignment-buttons">
        <button 
          type="button" 
          :class="{ active: modelValue.verticalAlignment === 'Top' }" 
          @click="modelValue.verticalAlignment = 'Top'"
        >
          {{ t('properties.top') }}
        </button>
        <button 
          type="button" 
          :class="{ active: modelValue.verticalAlignment === 'Middle' }" 
          @click="modelValue.verticalAlignment = 'Middle'"
        >
          {{ t('properties.middle') }}
        </button>
        <button 
          type="button" 
          :class="{ active: modelValue.verticalAlignment === 'Bottom' }" 
          @click="modelValue.verticalAlignment = 'Bottom'"
        >
          {{ t('properties.bottom') }}
        </button>
      </div>
    </div>
    <div class="form-group">
      <label>{{ t('properties.fontSize') }}</label>
      <input v-model.number="modelValue.fontSize" type="number" />
    </div>
    <div class="checkbox-group">
      <label>
        <input v-model="modelValue.isBold" type="checkbox" />
        {{ t('properties.bold') }}
      </label>
      <label>
        <input v-model="modelValue.isItalic" type="checkbox" />
        {{ t('properties.italic') }}
      </label>
      <label>
        <input v-model="modelValue.isUnderline" type="checkbox" />
        {{ t('properties.underline') }}
      </label>
    </div>
    <div class="color-settings-row">
      <div class="form-group color-setting" style="flex: 1; margin-right: 8px;">
        <label>{{ t('properties.forecolor') }}</label>
        <ColorPickerWithOpacity 
          v-model="modelValue.forecolor"
          v-model:mode="modelValue.forecolorMode"
          @update:modelValue="emit('update:modelValue', modelValue)"
          @update:mode="emit('update:modelValue', modelValue)"
        />
      </div>
      <div class="form-group color-setting" style="flex: 1; margin-left: 8px;">
        <label>{{ t('properties.backgroundColor') }}</label>
        <ColorPickerWithOpacity 
          v-model="modelValue.backcolor"
          v-model:mode="modelValue.mode"
          @update:modelValue="emit('update:modelValue', modelValue)"
          @update:mode="emit('update:modelValue', modelValue)"
        />
      </div>
    </div>
    <div class="checkbox-group">
      <label>
        <input 
          v-model="modelValue.mode" 
          type="checkbox" 
          true-value="Opaque" 
          false-value="Transparent" 
        />
        {{ t('properties.opaque') }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ColorPickerWithOpacity from './ColorPickerWithOpacity.vue';

const { t } = useI18n();

interface Props {
  modelValue: {
    textAlignment?: string;
    verticalAlignment?: string;
    fontSize?: number;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    forecolor?: string;
    forecolorMode?: 'Opaque' | 'Transparent';
    backcolor?: string;
    mode?: 'Opaque' | 'Transparent';
  };
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    textAlignment: 'Center',
    verticalAlignment: 'Middle',
    fontSize: 12,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    forecolor: '#000000',
    forecolorMode: 'Opaque',
    backcolor: '#ffffff',
    mode: 'Opaque'
  })
});

const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']];
}>();
</script>

<style scoped>
.font-style-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-settings-row {
  display: flex;
  flex-direction: row;
  gap: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 11px;
  font-weight: 500;
  color: #333;
}

.form-group select,
.form-group input[type="number"] {
  padding: 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #333;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.alignment-buttons button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 80px;
}

.alignment-buttons button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.alignment-buttons button.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
</style>
