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
  StaticTextElement as StaticTextElementType, 
  TextFieldElement as TextFieldElementType, 
  ImageElement as ImageElementType, 
  LineElement as LineElementType,
  SelectedElementInfo,
  EditingElementInfo
} from '../../types';

// Props
const props = defineProps<{
  element: DesignElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  editingElement: EditingElementInfo | null;
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
  startEditing: [bandIndex: number, elementIndex: number];
  finishEditing: [];
  cancelEditing: [];
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
    default:
      return StaticTextElement;
  }
});

// 通用属性
const commonProps = computed(() => ({
  element: props.element,
  bandIndex: props.bandIndex,
  elementIndex: props.elementIndex,
  selectedElement: props.selectedElement,
  editingElement: props.editingElement,
  reportFontFamily: props.reportFontFamily,
  reportFontSize: props.reportFontSize,
  reportIsBold: props.reportIsBold,
  reportIsItalic: props.reportIsItalic,
  reportIsUnderline: props.reportIsUnderline
}));

// 通用事件
const commonEvents = {
  select: (bandIndex: number, elementIndex: number) => {
    emit('select', bandIndex, elementIndex);
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
  }
};
</script>