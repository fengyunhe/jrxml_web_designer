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
          @input="updateProperty('backcolor', $event.target.value)"
          class="color-input"
        />
        <input
          type="text"
          :value="element.backcolor || '#FFFFFF'"
          @input="updateProperty('backcolor', $event.target.value)"
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
  padding: 12px;
}

.frame-properties h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.color-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.color-text {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.color-text:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
