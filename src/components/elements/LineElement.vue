<template>
  <BaseElement
    :element="element"
    :band-index="bandIndex"
    :element-index="elementIndex"
    :selected-element="selectedElement"
    :report-font-family="reportFontFamily"
    :report-font-size="reportFontSize"
    :report-is-bold="reportIsBold"
    :report-is-italic="reportIsItalic"
    :report-is-underline="reportIsUnderline"
    @select="handleSelect"
    @drag-start="handleDragStart"
    @resize-start="handleResizeStart"
  >
    <div 
      class="line-element"
      :style="lineStyle"
    ></div>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseElement from './BaseElement.vue';
import type { LineElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: LineElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
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
}>();

// 线条样式
const lineStyle = computed(() => {
  const direction = props.element.lineDirection || 'Horizontal';
  const width = props.element.lineWidth || 1;
  
  if (direction === 'Horizontal') {
    return {
      width: '100%',
      height: `${width}px`,
      backgroundColor: '#000',
      marginTop: `${(props.element.height - width) / 2}px`
    };
  } else {
    return {
      height: '100%',
      width: `${width}px`,
      backgroundColor: '#000',
      marginLeft: `${(props.element.width - width) / 2}px`
    };
  }
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
</script>

<style scoped>
.line-element {
  background-color: #000;
}
</style>