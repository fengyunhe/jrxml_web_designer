<template>
  <div class="frame-properties">
    <h4>Frame属性</h4>

    <!-- 布局模式 -->
    <div class="form-group">
      <SelectControl
        :model-value="element.layout || 'FreeLayout'"
        @update:model-value="updateProperty('layout', $event)"
        :options="layoutOptions"
        label="布局模式"
        description="选择Frame的布局方式"
      />
    </div>

    <!-- 条件打印表达式 -->
    <div class="form-group">
      <label>条件打印表达式</label>
      <ExpressionEditor
        :model-value="element.printWhenExpression || ''"
        @update:model-value="updateProperty('printWhenExpression', $event)"
        placeholder="例如: $F{status}.equals(&quot;active&quot;)"
      />
      <span class="form-hint">当表达式为true时打印此Frame</span>
    </div>

    <!-- 分页控制 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.isIgnorePagination || false"
        @update:model-value="updateProperty('isIgnorePagination', $event)"
        label="忽略分页"
        description="Frame内容不会被分页打断"
      />
    </div>

    <!-- 分割控制 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.isSplitAllowed !== false"
        @update:model-value="updateProperty('isSplitAllowed', $event)"
        label="允许分割"
        description="允许Frame在分页时被分割"
      />
    </div>

    <!-- 分页类型 -->
    <div v-if="element.isSplitAllowed !== false" class="form-group">
      <SelectControl
        :model-value="element.splitType || 'Stretch'"
        @update:model-value="updateProperty('splitType', $event)"
        :options="splitTypeOptions"
        label="分页类型"
        description="选择分页时的处理方式"
      />
    </div>

    <!-- 打印控制 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.isPrintRepeatedValues !== false"
        @update:model-value="updateProperty('isPrintRepeatedValues', $event)"
        label="打印重复值"
        description="是否打印重复的值"
      />
    </div>

    <!-- 移除空白行 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.isRemoveLineWhenBlank || false"
        @update:model-value="updateProperty('isRemoveLineWhenBlank', $event)"
        label="移除空白行"
        description="当Frame内容为空时移除整行"
      />
    </div>

    <!-- 背景颜色 -->
    <div class="form-group">
      <label>背景颜色</label>
      <div class="color-input-group">
        <input
          type="color"
          :value="element.backcolor || '#FFFFFF'"
          @input="updateProperty('backcolor', ($event.target as HTMLInputElement).value)"
          class="color-input"
        />
        <input
          type="text"
          :value="element.backcolor || '#FFFFFF'"
          @input="updateProperty('backcolor', ($event.target as HTMLInputElement).value)"
          class="color-text"
          placeholder="#FFFFFF"
        />
      </div>
    </div>

    <!-- 显示模式 -->
    <div class="form-group">
      <SelectControl
        :model-value="element.mode || 'Transparent'"
        @update:model-value="updateProperty('mode', $event)"
        :options="modeOptions"
        label="显示模式"
        description="Opaque显示背景，Transparent透明"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ExpressionEditor from './common/ExpressionEditor.vue';
import SwitchControl from './common/SwitchControl.vue';
import SelectControl from './common/SelectControl.vue';

const props = defineProps<{
  element: any;
}>();

const emit = defineEmits<{
  'update:element': [element: any];
}>();

const layoutOptions = [
  { value: 'FreeLayout', label: '自由布局' },
  { value: 'HorizontalLayout', label: '水平布局' },
  { value: 'VerticalLayout', label: '垂直布局' }
];

const splitTypeOptions = [
  { value: 'Stretch', label: '拉伸' },
  { value: 'Prevent', label: '阻止' },
  { value: 'Immediate', label: '立即' }
];

const modeOptions = [
  { value: 'Opaque', label: '不透明' },
  { value: 'Transparent', label: '透明' }
];

const updateProperty = (property: string, value: any) => {
  const updatedElement = { ...props.element };
  updatedElement[property] = value;
  emit('update:element', updatedElement);
};
</script>

<style scoped>
.frame-properties {
  padding: var(--prop-spacing-lg);
}

.frame-properties h4 {
  margin: 0 0 var(--prop-spacing-lg) 0;
  padding: 0 0 var(--prop-spacing-sm) 0;
  font-size: var(--prop-font-size-md);
  color: var(--prop-text-primary);
  font-weight: var(--prop-font-weight-semibold);
  border-bottom: 1px solid var(--prop-divider-color);
}

.form-group {
  margin-bottom: var(--prop-spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--prop-spacing-xs);
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-secondary);
  font-weight: var(--prop-font-weight-medium);
}

.form-hint {
  display: block;
  margin-top: var(--prop-spacing-xs);
  font-size: var(--prop-font-size-xs);
  color: var(--prop-text-tertiary);
}

.color-input-group {
  display: flex;
  gap: var(--prop-spacing-sm);
  align-items: center;
}

.color-input {
  width: 32px;
  height: 32px;
  border: 1px solid var(--prop-border-color);
  border-radius: var(--prop-border-radius-md);
  cursor: pointer;
  padding: 2px;
}

.color-text {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--prop-border-color);
  border-radius: var(--prop-border-radius-md);
  font-family: monospace;
  font-size: var(--prop-font-size-sm);
  transition: border-color var(--prop-transition-fast), box-shadow var(--prop-transition-fast);
}

.color-text:hover {
  border-color: var(--prop-border-hover);
}

.color-text:focus {
  outline: none;
  border-color: var(--prop-border-focus);
  box-shadow: var(--prop-focus-ring);
}
</style>
