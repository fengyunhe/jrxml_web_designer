<template>
  <BaseElement
    :element="element"
    :band-index="bandIndex"
    :element-index="elementIndex"
    :selected-element="selectedElement"
    :is-dragging="isDragging"
    :is-out-of-bounds="isOutOfBounds"
    :report-font-family="reportFontFamily"
    :report-font-size="reportFontSize"
    :report-is-bold="reportIsBold"
    :report-is-italic="reportIsItalic"
    :report-is-underline="reportIsUnderline"
    @select="handleSelect"
    @drag-start="handleDragStart"
    @resize-start="handleResizeStart"
  >
    <span @dblclick.stop="handleStartEditing">{{ displayText }}</span>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseElement from './BaseElement.vue';
import type { TextFieldElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: TextFieldElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  isDragging?: boolean;
  isOutOfBounds?: boolean;
  reportFontFamily?: string;
  reportFontSize?: number;
  reportIsBold?: boolean;
  reportIsItalic?: boolean;
  reportIsUnderline?: boolean;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  updateElement: [];
  checkFields: [fields: string[]];
}>();

// 显示文本
const displayText = computed(() => {
  if (props.element.expression) {
    return props.element.expression;
  } else if (props.element.fieldName) {
    return `字段: ${props.element.fieldName}`;
  }
  return '文本字段';
});

// 处理选择
const handleSelect = (bandIndex: number, elementIndex: number) => {
  emit('select', bandIndex, elementIndex);
};

// 处理拖拽开始
const handleDragStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('dragStart', event, bandIndex, elementIndex);
};

// 处理调整大小开始
const handleResizeStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('resizeStart', event, bandIndex, elementIndex);
};

// 开始编辑表达式
const handleStartEditing = () => {
  // 获取当前表达式，优先使用expression，其次使用fieldName
  const currentExpression = props.element.expression || 
                           (props.element.fieldName ? `$F{${props.element.fieldName}}` : '');
  
  // 使用prompt弹窗输入新表达式，默认值为当前表达式
  const newExpression = prompt('请输入新的表达式:', currentExpression);
  
  // 如果用户点击了确定且表达式有变化，则更新表达式
  if (newExpression !== null && newExpression !== currentExpression) {
    // 提取表达式中的所有字段引用 $F{fieldName}
    const fieldReferences: string[] = [];
    const fieldRegex = /\$F\{([^}]+)\}/g;
    let match;
    while ((match = fieldRegex.exec(newExpression)) !== null) {
      fieldReferences.push(match[1]);
    }
    
    // 发送字段引用给父组件检查
    if (fieldReferences.length > 0) {
      emit('checkFields', fieldReferences);
    }
    
    // 更新元素表达式
    if (newExpression.startsWith('$F{') && newExpression.endsWith('}')) {
      // 如果是字段引用格式，提取字段名
      const fieldName = newExpression.substring(3, newExpression.length - 1);
      props.element.fieldName = fieldName;
      props.element.expression = undefined;
    } else {
      // 否则作为完整表达式
      props.element.expression = newExpression;
      props.element.fieldName = undefined;
    }
    
    // 触发父组件更新JRXML
    emit('updateElement');
  }
};
</script>","}}}