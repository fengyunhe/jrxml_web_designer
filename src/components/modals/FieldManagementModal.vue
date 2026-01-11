<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑数据字段' : '添加数据字段' }}</h3>
        <button class="close-button" @click="handleClose">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="fieldName">字段名称 *</label>
            <input 
              type="text" 
              id="fieldName" 
              v-model="localField.name" 
              required 
              placeholder="请输入字段名称"
              class="form-input"
            />
            <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
          </div>
          <div class="form-group">
            <label for="fieldClass">字段类型 *</label>
            <select 
              id="fieldClass" 
              v-model="localField.class" 
              required 
              class="form-select"
            >
              <option value="">请选择字段类型</option>
              <option v-for="type in allowedFieldTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <div v-if="errors.class" class="error-message">{{ errors.class }}</div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">取消</button>
        <button class="btn-primary" @click="handleSubmit">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Props
const props = defineProps<{
  visible: boolean;
  field?: {
    name: string;
    class: string;
  };
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', field: { name: string; class: string }): void;
}>();

// Local state
const localField = ref<{ name: string; class: string }>({
  name: '',
  class: 'java.lang.String'
});

const errors = ref<{ name?: string; class?: string }>({});

// Computed properties
const isEditing = computed(() => !!props.field);

// Allowed field types based on JRXML Schema
const allowedFieldTypes = ref([
  { label: '字符串', value: 'java.lang.String' },
  { label: '整数', value: 'java.lang.Integer' },
  { label: '长整数', value: 'java.lang.Long' },
  { label: '浮点数', value: 'java.lang.Float' },
  { label: '双精度浮点数', value: 'java.lang.Double' },
  { label: '布尔值', value: 'java.lang.Boolean' },
  { label: '日期', value: 'java.util.Date' },
  { label: '时间戳', value: 'java.sql.Timestamp' },
  { label: '字节数组', value: 'byte[]' }
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
        class: 'java.lang.String'
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
        class: 'java.lang.String'
      };
      errors.value = {};
    }
  }
);

// Methods
function handleClose() {
  emit('update:visible', false);
}

function validateForm() {
  const newErrors: { name?: string; class?: string } = {};
  
  if (!localField.value.name.trim()) {
    newErrors.name = '字段名称不能为空';
  }
  
  if (!localField.value.class) {
    newErrors.class = '请选择字段类型';
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
}

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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
}

.btn-primary {
  padding: 8px 16px;
  border: 1px solid #4a90e2;
  background-color: #4a90e2;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #3a80d2;
}

.btn-primary:disabled {
  background-color: #a0c3f5;
  border-color: #a0c3f5;
  cursor: not-allowed;
}
</style>