<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    @update:visible="handleVisibleChange"
    @confirm="handleSubmit"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="varName">{{ t('variableManagement.variableName') }} *</label>
        <input
          type="text"
          id="varName"
          v-model="localVariable.name"
          required
          :placeholder="t('variableManagement.variableNamePlaceholder')"
          class="form-input"
        />
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
      </div>

      <div class="form-group">
        <label for="varClass">{{ t('variableManagement.variableClass') }} *</label>
        <select
          id="varClass"
          v-model="localVariable.class"
          required
          class="form-select"
        >
          <option value="">{{ t('variableManagement.selectClass') }}</option>
          <option v-for="type in allowedClasses" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <div v-if="errors.class" class="error-message">{{ errors.class }}</div>
      </div>

      <div class="form-group">
        <label for="varCalc">{{ t('variableManagement.calculationType') }}</label>
        <select id="varCalc" v-model="localVariable.calculationType" class="form-select">
          <option value="Nothing">{{ t('variableManagement.calcNothing') }}</option>
          <option value="Count">{{ t('variableManagement.calcCount') }}</option>
          <option value="DistinctCount">{{ t('variableManagement.calcDistinctCount') }}</option>
          <option value="Sum">{{ t('variableManagement.calcSum') }}</option>
          <option value="Average">{{ t('variableManagement.calcAverage') }}</option>
          <option value="First">{{ t('variableManagement.calcFirst') }}</option>
          <option value="Min">{{ t('variableManagement.calcMin') }}</option>
          <option value="Max">{{ t('variableManagement.calcMax') }}</option>
          <option value="StDev">{{ t('variableManagement.calcStDev') }}</option>
          <option value="Variance">{{ t('variableManagement.calcVariance') }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="varReset">{{ t('variableManagement.resetType') }}</label>
        <select id="varReset" v-model="localVariable.resetType" class="form-select">
          <option value="Report">{{ t('variableManagement.resetReport') }}</option>
          <option value="Page">{{ t('variableManagement.resetPage') }}</option>
          <option value="Column">{{ t('variableManagement.resetColumn') }}</option>
          <option value="Group">{{ t('variableManagement.resetGroup') }}</option>
        </select>
      </div>

      <div v-if="localVariable.resetType === 'Group'" class="form-group">
        <label for="varResetGroup">{{ t('variableManagement.resetGroup') }}</label>
        <input
          type="text"
          id="varResetGroup"
          v-model="localVariable.resetGroup"
          :placeholder="t('variableManagement.resetGroupPlaceholder')"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>{{ t('variableManagement.expression') }}</label>
        <ExpressionEditor
          :model-value="localVariable.expression || ''"
          @update:model-value="localVariable.expression = $event"
          :report-fields="reportFields"
          :report-parameters="reportParameters"
          :report-variables="reportVariables"
          :placeholder="t('variableManagement.expressionPlaceholder')"
        />
      </div>

      <div class="form-group">
        <label>{{ t('variableManagement.initialValueExpression') }}</label>
        <ExpressionEditor
          :model-value="localVariable.initialValueExpression || ''"
          @update:model-value="localVariable.initialValueExpression = $event"
          :report-fields="reportFields"
          :report-parameters="reportParameters"
          :report-variables="reportVariables"
          :placeholder="t('variableManagement.initialValuePlaceholder')"
        />
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from './BaseModal.vue';
import ExpressionEditor from '../designer/properties/common/ExpressionEditor.vue';
import type { ReportVariable, ReportField, ReportParameter } from '../../types';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  variable?: ReportVariable;
  reportFields: ReportField[];
  reportParameters: ReportParameter[];
  reportVariables: ReportVariable[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', variable: ReportVariable): void;
}>();

const localVariable = ref<ReportVariable>({
  name: '',
  class: 'java.lang.String',
  calculationType: 'Nothing',
  resetType: 'Report',
  resetGroup: '',
  expression: '',
  initialValueExpression: ''
});

const errors = ref<{ name?: string; class?: string }>({});

const isEditing = computed(() => !!props.variable);
const modalTitle = computed(() =>
  isEditing.value ? t('variableManagement.editVariable') : t('variableManagement.addVariable')
);

const allowedClasses = ref([
  { label: 'String', value: 'java.lang.String' },
  { label: 'Integer', value: 'java.lang.Integer' },
  { label: 'Long', value: 'java.lang.Long' },
  { label: 'Float', value: 'java.lang.Float' },
  { label: 'Double', value: 'java.lang.Double' },
  { label: 'Boolean', value: 'java.lang.Boolean' },
  { label: 'Date', value: 'java.util.Date' },
  { label: 'BigDecimal', value: 'java.math.BigDecimal' },
  { label: 'List', value: 'java.util.List' }
]);

watch(
  () => props.variable,
  (newVar) => {
    if (newVar) {
      localVariable.value = { ...newVar };
    } else {
      localVariable.value = {
        name: '',
        class: 'java.lang.String',
        calculationType: 'Nothing',
        resetType: 'Report',
        resetGroup: '',
        expression: '',
        initialValueExpression: ''
      };
    }
    errors.value = {};
  },
  { immediate: true }
);

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && !props.variable) {
      localVariable.value = {
        name: '',
        class: 'java.lang.String',
        calculationType: 'Nothing',
        resetType: 'Report',
        resetGroup: '',
        expression: '',
        initialValueExpression: ''
      };
      errors.value = {};
    }
  }
);

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function validateForm() {
  const newErrors: { name?: string; class?: string } = {};
  if (!localVariable.value.name.trim()) {
    newErrors.name = t('variableManagement.errors.nameRequired');
  }
  if (!localVariable.value.class) {
    newErrors.class = t('variableManagement.errors.classRequired');
  }
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

function handleSubmit() {
  if (validateForm()) {
    emit('save', { ...localVariable.value });
    emit('update:visible', false);
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
  font-size: 13px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
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
