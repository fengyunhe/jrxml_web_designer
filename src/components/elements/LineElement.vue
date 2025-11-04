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
}>();

// 线条样式
const lineStyle = computed(() => {
  const direction = props.element.lineDirection || 'TopDown';
  const width = props.element.lineWidth || 1;
  
  // 根据XSD规范，线条是对角线
  // TopDown: 从左上角到右下角的对角线
  // BottomUp: 从左下角到右上角的对角线
  const diagonalLength = Math.sqrt(props.element.width ** 2 + props.element.height ** 2);
  
  if (direction === 'TopDown') {
    // 从左上角到右下角的对角线
    return {
      position: 'absolute' as const,
      top: '0',
      left: '0',
      width: `${diagonalLength}px`,
      height: `${width}px`,
      backgroundColor: '#000',
      transformOrigin: '0 0',
      transform: `rotate(${Math.atan2(props.element.height, props.element.width)}rad)`
    };
  } else {
    // BottomUp - 从左下角到右上角的对角线
    return {
      position: 'absolute' as const,
      bottom: '0',
      left: '0',
      width: `${diagonalLength}px`,
      height: `${width}px`,
      backgroundColor: '#000',
      transformOrigin: '0 0',
      transform: `rotate(${-Math.atan2(props.element.height, props.element.width)}rad)`
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