<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    @update:visible="handleVisibleChange"
    @confirm="handleSubmit"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="styleName">{{ t('styleManagement.styleName') }} *</label>
        <input
          type="text"
          id="styleName"
          v-model="localStyle.name"
          required
          :placeholder="t('styleManagement.styleNamePlaceholder')"
          class="form-input"
        />
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
      </div>

      <div class="form-group">
        <label for="parentStyle">{{ t('styleManagement.parentStyle') }}</label>
        <select id="parentStyle" v-model="localStyle.parentStyle" class="form-select">
          <option value="">{{ t('styleManagement.noParent') }}</option>
          <option v-for="s in availableParentStyles" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="styleMode">{{ t('styleManagement.mode') }}</label>
        <select id="styleMode" v-model="localStyle.mode" class="form-select">
          <option value="">{{ t('styleManagement.modeDefault') }}</option>
          <option value="Opaque">{{ t('styleManagement.modeOpaque') }}</option>
          <option value="Transparent">{{ t('styleManagement.modeTransparent') }}</option>
        </select>
      </div>

      <div class="color-row">
        <div class="form-group flex-1">
          <label for="forecolor">{{ t('styleManagement.forecolor') }}</label>
          <input type="color" id="forecolor" v-model="localStyle.forecolor" class="form-color" />
        </div>
        <div class="form-group flex-1">
          <label for="backcolor">{{ t('styleManagement.backcolor') }}</label>
          <input type="color" id="backcolor" v-model="localStyle.backcolor" class="form-color" />
        </div>
      </div>

      <div class="form-group">
        <label>{{ t('styleManagement.fontFamily') }}</label>
        <select v-model="localStyle.fontFamily" class="form-select">
          <option value="SansSerif">SansSerif</option>
          <option value="Serif">Serif</option>
          <option value="Monospaced">Monospaced</option>
        </select>
      </div>

      <div class="color-row">
        <div class="form-group flex-1">
          <label>{{ t('styleManagement.fontSize') }}</label>
          <input type="number" v-model.number="localStyle.fontSize" min="6" max="72" class="form-input" />
        </div>
        <div class="form-group flex-1 font-styles">
          <label>{{ t('styleManagement.fontStyle') }}</label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="localStyle.isBold" /> {{ t('styleManagement.bold') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="localStyle.isItalic" /> {{ t('styleManagement.italic') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="localStyle.isUnderline" /> {{ t('styleManagement.underline') }}
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>{{ t('styleManagement.textAlignment') }}</label>
        <select v-model="localStyle.textAlignment" class="form-select">
          <option value="Left">{{ t('styleManagement.alignLeft') }}</option>
          <option value="Center">{{ t('styleManagement.alignCenter') }}</option>
          <option value="Right">{{ t('styleManagement.alignRight') }}</option>
          <option value="Justified">{{ t('styleManagement.alignJustified') }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ t('styleManagement.verticalAlignment') }}</label>
        <select v-model="localStyle.verticalAlignment" class="form-select">
          <option value="Top">{{ t('styleManagement.valignTop') }}</option>
          <option value="Middle">{{ t('styleManagement.valignMiddle') }}</option>
          <option value="Bottom">{{ t('styleManagement.valignBottom') }}</option>
        </select>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from './BaseModal.vue';
import type { ReportStyle } from '../../types';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  style?: ReportStyle;
  allStyles: ReportStyle[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', style: ReportStyle): void;
}>();

const localStyle = ref<ReportStyle>({
  name: '',
  parentStyle: '',
  mode: '',
  backcolor: '#FFFFFF',
  forecolor: '#000000',
  fontFamily: 'SansSerif',
  fontSize: 12,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  textAlignment: 'Left',
  verticalAlignment: 'Top'
});

const errors = ref<{ name?: string }>({});

const isEditing = computed(() => !!props.style);
const modalTitle = computed(() =>
  isEditing.value ? t('styleManagement.editStyle') : t('styleManagement.addStyle')
);

const availableParentStyles = computed(() =>
  props.allStyles
    .filter(s => s.name !== localStyle.value.name)
    .map(s => s.name)
);

watch(
  () => props.style,
  (newStyle) => {
    if (newStyle) {
      localStyle.value = { ...newStyle };
    } else {
      localStyle.value = {
        name: '',
        parentStyle: '',
        mode: '',
        backcolor: '#FFFFFF',
        forecolor: '#000000',
        fontFamily: 'SansSerif',
        fontSize: 12,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        textAlignment: 'Left',
        verticalAlignment: 'Top'
      };
    }
    errors.value = {};
  },
  { immediate: true }
);

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && !props.style) {
      localStyle.value = {
        name: '',
        parentStyle: '',
        mode: '',
        backcolor: '#FFFFFF',
        forecolor: '#000000',
        fontFamily: 'SansSerif',
        fontSize: 12,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        textAlignment: 'Left',
        verticalAlignment: 'Top'
      };
      errors.value = {};
    }
  }
);

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function validateForm() {
  const newErrors: { name?: string } = {};
  if (!localStyle.value.name.trim()) {
    newErrors.name = t('styleManagement.errors.nameRequired');
  }
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

function handleSubmit() {
  if (validateForm()) {
    emit('save', { ...localStyle.value });
    emit('update:visible', false);
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
  font-size: 13px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 7px 10px;
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

.form-color {
  width: 50px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.color-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.font-styles {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.font-styles label:first-child {
  margin-bottom: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: normal;
  color: #666;
  margin-bottom: 2px;
  cursor: pointer;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}
</style>
