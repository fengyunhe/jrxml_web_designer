<template>
  <div class="element-type-based-settings">
    <!-- 根据元素类型显示样式设置 -->
    <div v-if="element">
      <!-- 字体样式设置 -->
      <template v-if="['staticText', 'textField'].includes(element.type)">
        <FontStyleSettings 
          v-model="element"
          @update:modelValue="emit('update:modelValue', element)"
        />
      </template>
      
      <!-- 边框样式设置 -->
      <template v-if="element.type !== 'line'">
        <BorderStyleSettings 
          v-model="element" 
          :label="t('properties.borderStyle')"
          @change="emit('update:modelValue', element)"
        />
      </template>
      
      <!-- 静态文本特定属性 -->
      <template v-if="element.type === 'staticText'">
        <div class="form-group">
          <label>{{ t('properties.textContent') }}</label>
          <textarea v-model="element.text" @change="emit('update:modelValue', element)"></textarea>
        </div>
      </template>
      
      <!-- 文本字段特定属性 -->
      <template v-else-if="element.type === 'textField'">
        <div class="form-group">
          <label>{{ t('properties.expression') }}</label>
          <input v-model="element.expression" type="text" @change="emit('update:modelValue', element)" />
        </div>
        <div class="form-group">
          <label>{{ t('properties.pattern') }}</label>
          <input v-model="element.pattern" type="text" @change="emit('update:modelValue', element)" />
        </div>
        <div class="checkbox-group">
          <label>
            <input v-model="element.isBlankWhenNull" type="checkbox" @change="emit('update:modelValue', element)" />
            {{ t('properties.blankWhenNull') }}
          </label>
        </div>
        <div class="form-group">
          <label>{{ t('properties.evaluationTime') }}</label>
          <select v-model="element.evaluationTime" @change="emit('update:modelValue', element)">
            <option value="Now">{{ t('properties.evalTime.Now') }}</option>
            <option value="Report">{{ t('properties.evalTime.Report') }}</option>
            <option value="Page">{{ t('properties.evalTime.Page') }}</option>
            <option value="Column">{{ t('properties.evalTime.Column') }}</option>
            <option value="Group">{{ t('properties.evalTime.Group') }}</option>
            <option value="Band">{{ t('properties.evalTime.Band') }}</option>
            <option value="Auto">{{ t('properties.evalTime.Auto') }}</option>
            <option value="Master">{{ t('properties.evalTime.Master') }}</option>
          </select>
        </div>
      </template>
      
      <!-- 图片特定属性 -->
      <template v-else-if="element.type === 'image'">
        <div class="form-group">
          <label>{{ t('properties.imageExpression') }}</label>
          <input v-model="element.imageExpression" type="text" @change="emit('update:modelValue', element)" />
          <small>{{ t('properties.imageExpressionHint', { imageFileHolder: '$F{imageFieldName}' }) }}</small>
        </div>
      </template>
      
      <!-- 矩形特定属性 -->
      <template v-else-if="element.type === 'rectangle'">
        <div class="form-group">
          <label>{{ t('properties.radius') }}</label>
          <input v-model.number="element.radius" type="number" min="0" @change="emit('update:modelValue', element)" />
        </div>
      </template>
      
      <!-- 分页符特定属性 -->
      <template v-else-if="element.type === 'break'">
        <div class="form-group">
          <label>{{ t('properties.breakType') }}</label>
          <select v-model="element.breakType" @change="emit('update:modelValue', element)">
            <option value="Page">{{ t('properties.pageBreak') }}</option>
            <option value="Column">{{ t('properties.columnBreak') }}</option>
          </select>
        </div>
      </template>
      
      <!-- 框架特定属性 -->
      <template v-else-if="element.type === 'frame'">
        <div class="form-group">
          <label>{{ t('properties.layoutMode') }}</label>
          <select v-model="element.layout" @change="emit('update:modelValue', element)">
            <option :value="undefined">{{ t('properties.freeLayout') }}</option>
            <option value="HorizontalLayout">{{ t('properties.horizontalLayout') }}</option>
            <option value="VerticalLayout">{{ t('properties.verticalLayout') }}</option>
          </select>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FontStyleSettings from './FontStyleSettings.vue';
import BorderStyleSettings from './BorderStyleSettings.vue';
import type { DesignElement } from '../../../types';

const { t } = useI18n();

interface Props {
  modelValue: DesignElement;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: DesignElement];
}>();

// 为了在模板中使用方便，定义一个计算属性
const element = computed(() => props.modelValue);
</script>

<style scoped>
.element-type-based-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
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
  font-size: 12px;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
}
</style>