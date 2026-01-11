<template>
  <component
    :is="getElementComponent"
    v-bind="commonProps"
    v-on="commonEvents"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StaticTextElement from './StaticTextElement.vue';
import TextFieldElement from './TextFieldElement.vue';
import ImageElement from './ImageElement.vue';
import LineElement from './LineElement.vue';
import type { 
  DesignElement,
  SelectedElementInfo,
  EditingElementInfo
} from '../../types';

// Props
const props = defineProps<{
  element: DesignElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  selectedElements: {bandIndex: number, elementIndex: number}[]; // 添加多选支持
  editingElement: EditingElementInfo | null;
  isDragging?: boolean;
  reportFontFamily?: string;
  reportFontSize?: number;
  reportIsBold?: boolean;
  reportIsItalic?: boolean;
  reportIsUnderline?: boolean;
  isOutOfBounds?: boolean;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  startEditing: [bandIndex: number, elementIndex: number];
  finishEditing: [];
  cancelEditing: [];
  checkFields: [fields: string[]];
}>();

// 根据元素类型获取对应的组件
const getElementComponent = computed(() => {
  switch (props.element.type) {
    case 'staticText':
      return StaticTextElement;
    case 'textField':
      return TextFieldElement;
    case 'image':
      return ImageElement;
    case 'line':
      return LineElement;
    case 'rectangle':
      // 使用StaticTextElement作为rectangle类型的默认渲染组件
      return StaticTextElement;
    default:
      return StaticTextElement;
  }
});

// 通用属性 - 添加类型断言以确保与组件期望的类型匹配
const commonProps = computed(() => ({
  element: props.element as any, // 使用any断言暂时解决类型兼容性问题
  bandIndex: props.bandIndex,
  elementIndex: props.elementIndex,
  selectedElement: props.selectedElement,
  selectedElements: props.selectedElements, // 添加多选支持
  editingElement: props.editingElement,
  isDragging: props.isDragging,
  reportFontFamily: props.reportFontFamily,
  reportFontSize: props.reportFontSize,
  reportIsBold: props.reportIsBold,
  reportIsItalic: props.reportIsItalic,
  reportIsUnderline: props.reportIsUnderline,
  isOutOfBounds: props.isOutOfBounds
}));

// 通用事件
const commonEvents = {
  select: (bandIndex: number, elementIndex: number, isMultiSelect = false) => {
    emit('select', bandIndex, elementIndex, isMultiSelect);
  },
  dragStart: (event: MouseEvent, bandIndex: number, elementIndex: number) => {
    emit('dragStart', event, bandIndex, elementIndex);
  },
  resizeStart: (event: MouseEvent, bandIndex: number, elementIndex: number) => {
    emit('resizeStart', event, bandIndex, elementIndex);
  },
  startEditing: (bandIndex: number, elementIndex: number) => {
    emit('startEditing', bandIndex, elementIndex);
  },
  finishEditing: () => {
    emit('finishEditing');
  },
  cancelEditing: () => {
    emit('cancelEditing');
  },
  checkFields: (fields: string[]) => {
    emit('checkFields', fields);
  }
};
</script>