<template>
  <!-- Main Modal -->
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    @update:visible="$emit('update:visible', $event)"
    @confirm="handleSubmit"
    @cancel="handleClose"
    :contentClass="'subdataset-modal'"
  >
    <form @submit.prevent="handleSubmit" style="display: flex; width: 100%;">
      <!-- 左侧：主要表单内容 -->
      <div class="form-main">
        <!-- 常用设置 -->
        <div class="form-group">
          <label for="datasetName">{{ t('elementLibrary.subDatasetName') }} *</label>
          <input 
            type="text" 
            id="datasetName" 
            v-model="localDataset.name" 
            required 
            :placeholder="t('elementLibrary.subDatasetNamePlaceholder')"
            class="form-input"
          />
          <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
        </div>

        
        <!-- Query Configuration -->
        <div class="form-section">
          <h4>{{ t('elementLibrary.queryConfiguration') }}</h4>
          <div class="form-group">
            <label for="queryLanguage">{{ t('elementLibrary.queryLanguage') }}</label>
            <input 
              type="text" 
              id="queryLanguage" 
              v-model="localDataset.query.language" 
              readonly 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="queryText">{{ t('elementLibrary.queryText') }}</label>
            <textarea 
              id="queryText" 
              v-model="localDataset.query.text" 
              :placeholder="t('elementLibrary.queryTextPlaceholder')"
              class="form-input"
              rows="8"
            ></textarea>
          </div>
        </div>
        
        <!-- 不常用设置 -->
        <div class="form-section">
          <h4>{{ t('elementLibrary.advancedSettings') }}</h4>
          <div class="form-group">
            <label for="scriptletClass">{{ t('elementLibrary.scriptletClass') }}</label>
            <input 
              type="text" 
              id="scriptletClass" 
              v-model="localDataset.scriptletClass" 
              :placeholder="t('elementLibrary.scriptletClassPlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="resourceBundle">{{ t('elementLibrary.resourceBundle') }}</label>
            <input 
              type="text" 
              id="resourceBundle" 
              v-model="localDataset.resourceBundle" 
              :placeholder="t('elementLibrary.resourceBundlePlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="whenResourceMissingType">{{ t('elementLibrary.whenResourceMissingType') }}</label>
            <select 
              id="whenResourceMissingType" 
              v-model="localDataset.whenResourceMissingType"
              class="form-input"
            >
              <option value="Null">{{ t('elementLibrary.whenResourceMissingNull') }}</option>
              <option value="Empty">{{ t('elementLibrary.whenResourceMissingEmpty') }}</option>
              <option value="Key">{{ t('elementLibrary.whenResourceMissingKey') }}</option>
              <option value="Error">{{ t('elementLibrary.whenResourceMissingError') }}</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 右侧：字段管理 -->
      <div class="fields-section">
        <div class="section-header">
          <h4>{{ t('elementLibrary.fieldsManagement') }}</h4>
          <n-button type="default" @click="openAddFieldModal">
            {{ t('elementLibrary.addField') }}
          </n-button>
        </div>
        <div class="fields-list">
          <table class="fields-table">
            <thead>
              <tr>
                <th>{{ t('elementLibrary.fieldName') }}</th>
                <th>{{ t('elementLibrary.fieldType') }}</th>
                <th>{{ t('elementLibrary.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, index) in localDataset.fields" :key="index">
                <td>{{ field.name }}</td>
                <td>{{ field.class }}</td>
                <td class="actions-cell">
                  <n-button type="primary" size="small" @click="openEditFieldModal(index)">
                    {{ t('common.edit') }}
                  </n-button>
                  <n-button type="error" size="small" @click="deleteField(index)">
                    {{ t('common.delete') }}
                  </n-button>
                </td>
              </tr>
              <tr v-if="localDataset.fields.length === 0">
                <td colspan="3" class="no-fields">{{ t('elementLibrary.noFields') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </form>
    <template #footer>
      <n-button type="default" @click="handleClose">{{ t('common.cancel') }}</n-button>
      <n-button type="primary" @click="handleSubmit">{{ t('common.save') }}</n-button>
    </template>
  </BaseModal>
  
  <!-- Field Modal -->
  <BaseModal
    :visible="showFieldModal"
    :title="fieldModalTitle"
    @update:visible="showFieldModal = $event"
    @confirm="saveField"
    @cancel="showFieldModal = false"
  >
    <div class="form-group">
      <label for="fieldName">{{ t('elementLibrary.fieldName') }} *</label>
      <input 
        type="text" 
        id="fieldName" 
        v-model="localField.name" 
        required 
        :placeholder="t('elementLibrary.fieldNamePlaceholder')"
        class="form-input"
      />
      <div v-if="fieldErrors.name" class="error-message">{{ fieldErrors.name }}</div>
    </div>
    <div class="form-group">
      <label for="fieldType">{{ t('elementLibrary.fieldType') }} *</label>
      <select 
        id="fieldType" 
        v-model="localField.class"
        required
        class="form-input"
      >
        <option v-for="type in allowedFieldTypes" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
    </div>
    <template #footer>
      <n-button type="default" @click="showFieldModal = false">{{ t('common.cancel') }}</n-button>
      <n-button type="primary" @click="saveField">{{ t('common.save') }}</n-button>
    </template>
  </BaseModal>
</template>



<script setup lang="ts">
import BaseModal from './BaseModal.vue';
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';

const { t } = useI18n();

// Props
const props = defineProps<{
  visible: boolean;
  dataset?: {
    name: string;
    uuid: string;
    scriptletClass?: string;
    resourceBundle?: string;
    whenResourceMissingType?: string;
    query?: {
      language: string;
      text: string;
    };
    fields?: Array<{
      name: string;
      class: string;
    }>;
  };
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', dataset: {
    name: string;
    uuid: string;
    scriptletClass?: string;
    resourceBundle?: string;
    whenResourceMissingType?: string;
    query?: {
      language: string;
      text: string;
    };
    fields?: Array<{
      name: string;
      class: string;
    }>;
  }): void;
}>();

// Local state
const localDataset = ref<{
  name: string;
  uuid: string;
  scriptletClass?: string;
  resourceBundle?: string;
  whenResourceMissingType?: string;
  query: {
    language: string;
    text: string;
  };
  fields: Array<{
    name: string;
    class: string;
  }>;
}>({
  name: '',
  uuid: crypto.randomUUID(),
  scriptletClass: '',
  resourceBundle: '',
  whenResourceMissingType: 'Null',
  query: {
    language: 'sql',
    text: ''
  },
  fields: []
});

// Field management state
const showFieldModal = ref(false);
const currentFieldIndex = ref(-1);
const localField = ref<{
  name: string;
  class: string;
}>({
  name: '',
  class: 'java.lang.String'
});

// Field validation errors
const fieldErrors = ref<{ name?: string }>({});

// Allowed field types
const allowedFieldTypes = [
  { label: 'String', value: 'java.lang.String' },
  { label: 'Integer', value: 'java.lang.Integer' },
  { label: 'Long', value: 'java.lang.Long' },
  { label: 'Float', value: 'java.lang.Float' },
  { label: 'Double', value: 'java.lang.Double' },
  { label: 'Boolean', value: 'java.lang.Boolean' },
  { label: 'Date', value: 'java.util.Date' },
  { label: 'Timestamp', value: 'java.sql.Timestamp' },
  { label: 'Byte Array', value: 'byte[]' }
];

// Computed properties
const isEditing = computed(() => !!props.dataset);

const modalTitle = computed(() => {
  return isEditing.value ? t('elementLibrary.editSubDataset') : t('elementLibrary.addSubDataset');
});

const fieldModalTitle = computed(() => {
  return currentFieldIndex.value === -1 ? t('elementLibrary.addField') : t('elementLibrary.editField');
});

// Open field modal for adding
function openAddFieldModal() {
  currentFieldIndex.value = -1;
  localField.value = {
    name: '',
    class: 'java.lang.String'
  };
  showFieldModal.value = true;
}

// Open field modal for editing
function openEditFieldModal(index: number) {
  currentFieldIndex.value = index;
  const field = localDataset.value.fields![index];
  if (field) {
    localField.value = {
      name: field.name || '',
      class: field.class || 'java.lang.String'
    };
    showFieldModal.value = true;
  }
}

// Save field
function saveField() {
  // Reset field errors
  fieldErrors.value = {};
  
  // Validate field name
  if (!localField.value.name.trim()) {
    fieldErrors.value.name = t('elementLibrary.fieldNameRequired');
    return;
  }
  
  // Check for duplicate field name
  const fieldName = localField.value.name.trim();
  const existingFieldIndex = localDataset.value.fields!.findIndex(
    (field) => field.name === fieldName
  );
  
  // Allow updating existing field (except when changing name to another existing field's name)
  if (existingFieldIndex >= 0 && existingFieldIndex !== currentFieldIndex.value) {
    fieldErrors.value.name = t('elementLibrary.duplicateFieldName');
    return;
  }
  
  if (currentFieldIndex.value === -1) {
    // Add new field
    localDataset.value.fields!.push({ ...localField.value });
  } else {
    // Update existing field
    localDataset.value.fields![currentFieldIndex.value] = { ...localField.value };
  }
  
  showFieldModal.value = false;
}

// Delete field
function deleteField(index: number) {
  localDataset.value.fields!.splice(index, 1);
}

const errors = ref<{ name?: string }>({});

// Watch for dataset prop changes
watch(
  () => props.dataset,
  (newDataset) => {
    if (newDataset) {
      localDataset.value = {
        ...newDataset,
        query: newDataset.query || { language: 'sql', text: '' },
        fields: newDataset.fields || []
      };
    } else {
      localDataset.value = {
        name: '',
        uuid: crypto.randomUUID(),
        scriptletClass: '',
        resourceBundle: '',
        whenResourceMissingType: 'Null',
        query: { language: 'sql', text: '' },
        fields: []
      }
    }
    // 确保query和fields总是存在
    if (!localDataset.value.query) {
      localDataset.value.query = { language: 'sql', text: '' };
    }
    if (!localDataset.value.fields) {
      localDataset.value.fields = [];
    }
    // 重置错误信息
    errors.value = {};
  },
  { immediate: true }
);

// Watch for visible prop changes to reset form when opening modal
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      // Modal closed, reset form
      errors.value = {};
    }
  }
);

// Handle form submission
function handleSubmit() {
  // Validate form
  const newErrors: { name?: string } = {};
  
  if (!localDataset.value.name.trim()) {
    newErrors.name = t('elementLibrary.subDatasetNameRequired');
  }
  
  if (Object.keys(newErrors).length > 0) {
    errors.value = newErrors;
    return;
  }
  
  // Ensure UUID is generated if not provided (should always be generated)
  if (!localDataset.value.uuid) {
    localDataset.value.uuid = crypto.randomUUID();
  }
  
  // Emit save event
  emit('save', { ...localDataset.value });
  
  // Close modal
  handleClose();
}

// Close modal
function handleClose() {
  emit('update:visible', false);
}
</script>

<style scoped>
/* SubDataset Modal Specific Styles */
.subdataset-modal {
  width: 98vw;
  max-width: none;
  max-height: 98vh;
}

:deep(.modal-body) {
  display: flex;
  gap: 20px;
  overflow: hidden;
  padding: 20px;
}

.form-main {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.fields-section {
  width: 400px;
  overflow-y: auto;
  background-color: #fafafa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.form-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.fields-list {
  margin-top: 15px;
}

.fields-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.fields-table th,
.fields-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.fields-table th {
  background-color: #fafafa;
  font-weight: bold;
  color: #333;
}

.fields-table tr:last-child td {
  border-bottom: none;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 3px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn-small.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-small.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-small.btn-danger {
  background-color: #f56c6c;
  color: white;
}

.btn-small.btn-danger:hover {
  background-color: #f78989;
}

.no-fields {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  cursor: pointer;
  box-sizing: border-box;
}

.form-select:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.error-message {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}
</style>