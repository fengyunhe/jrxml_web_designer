<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    @update:visible="handleVisibleChange"
    @confirm="handleSubmit"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="fieldName">
          {{ props.isParameter ? t('elementLibrary.parameterName') : t('fieldManagement.fieldName') }} *
        </label>
        <input 
          type="text" 
          id="fieldName" 
          v-model="localField.name" 
          required 
          :placeholder="props.isParameter ? t('elementLibrary.parameterNamePlaceholder') : t('fieldManagement.placeholderName')"
          class="form-input"
        />
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
      </div>
      <div class="form-group">
        <label for="fieldClass">
          {{ props.isParameter ? t('elementLibrary.parameterType') : t('fieldManagement.fieldClass') }} *
        </label>
        <select 
          id="fieldClass" 
          v-model="localField.class" 
          required 
          class="form-select"
        >
          <option value="">{{ props.isParameter ? t('elementLibrary.parameterTypePlaceholder') : t('fieldManagement.placeholderClass') }}</option>
          <option v-for="type in allowedFieldTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <div v-if="errors.class" class="error-message">{{ errors.class }}</div>
      </div>
      <!-- 为报表参数添加默认值字段 -->
      <div v-if="props.isParameter" class="form-group">
        <label for="defaultValue">{{ t('elementLibrary.defaultValue') }}</label>
        <input 
          type="text" 
          id="defaultValue" 
          v-model="localField.defaultValue"
          :placeholder="t('elementLibrary.defaultValuePlaceholder')"
          class="form-input"
        />
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';
import BaseModal from './BaseModal.vue';

const { t } = useI18n();

// Props
const props = defineProps<{
  visible: boolean;
  field?: {
    name: string;
    class: string;
    defaultValue?: string;
  };
  isParameter?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', field: { name: string; class: string; defaultValue?: string }): void;
}>();

// Local state
const localField = ref<{ name: string; class: string; defaultValue?: string }>({
  name: '',
  class: 'java.lang.String',
  defaultValue: ''
});

const errors = ref<{ name?: string; class?: string }>({});

// Computed properties
const isEditing = computed(() => !!props.field);
const modalTitle = computed(() => {
  return isEditing.value 
    ? (props.isParameter ? t('elementLibrary.editParameter') : t('fieldManagement.editField')) 
    : (props.isParameter ? t('elementLibrary.addReportParameter') : t('fieldManagement.addField'));
});

// Allowed field types based on JRXML Schema
const allowedFieldTypes = ref([
  { label: t('fieldManagement.fieldTypes.string'), value: 'java.lang.String' },
  { label: t('fieldManagement.fieldTypes.integer'), value: 'java.lang.Integer' },
  { label: t('fieldManagement.fieldTypes.long'), value: 'java.lang.Long' },
  { label: t('fieldManagement.fieldTypes.float'), value: 'java.lang.Float' },
  { label: t('fieldManagement.fieldTypes.double'), value: 'java.lang.Double' },
  { label: t('fieldManagement.fieldTypes.boolean'), value: 'java.lang.Boolean' },
  { label: t('fieldManagement.fieldTypes.date'), value: 'java.util.Date' },
  { label: t('fieldManagement.fieldTypes.timestamp'), value: 'java.sql.Timestamp' },
  { label: t('fieldManagement.fieldTypes.byteArray'), value: 'byte[]' }
]);

// Watch for field prop changes
watch(
  () => props.field,
  (newField) => {
    if (newField) {
      localField.value = { ...newField };
    } else {
      localField.value = {
        name: '',
        class: 'java.lang.String',
        defaultValue: ''
      };
    }
    // Reset errors when field changes
    errors.value = {};
  },
  { immediate: true }
);

// Watch for visible prop changes
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && !props.field) {
      // Reset form when opening for new field
      localField.value = {
        name: '',
        class: 'java.lang.String',
        defaultValue: ''
      };
      errors.value = {};
    }
  }
);

// Methods
function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function validateForm() {
  const newErrors: { name?: string; class?: string } = {};
  
  if (!localField.value.name.trim()) {
    newErrors.name = t('fieldManagement.errors.nameRequired');
  }
  
  if (!localField.value.class) {
    newErrors.class = t('fieldManagement.errors.classRequired');
  }
  
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

function handleSubmit() {
  if (validateForm()) {
    emit('save', { ...localField.value });
    emit('update:visible', false);
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}
</style>