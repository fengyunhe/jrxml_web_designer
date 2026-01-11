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
    @contextmenu="handleContextMenu"
  >
    <!-- 矩形元素内容 -->
    <div class="rectangle-content">
      <!-- 矩形元素可以添加自定义内容 -->
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { RectangleElement, SelectedElementInfo } from '../../types';

// Props
defineProps<{
  element: RectangleElement;
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
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number];
}>();

// 处理选择
const handleSelect = (bandIndex: number, elementIndex: number, isMultiSelect?: boolean) => {
  emit('select', bandIndex, elementIndex, isMultiSelect);
};

// 处理拖拽开始
const handleDragStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('dragStart', event, bandIndex, elementIndex);
};

// 处理调整大小开始
const handleResizeStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('resizeStart', event, bandIndex, elementIndex);
};

// 处理上下文菜单
const handleContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('contextmenu', event, bandIndex, elementIndex);
};
</script>

<style scoped>
.rectangle-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>