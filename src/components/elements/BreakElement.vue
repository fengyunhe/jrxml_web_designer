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
    :parent-frame-index="parentFrameIndex"
    @select="handleSelect"
    @drag-start="handleDragStart"
    @resize-start="handleResizeStart"
    @contextmenu="handleContextMenu"
  >
    <!-- Break 元素内容 -->
    <div class="break-content" :class="{ 'column-break': element.breakType === 'Column' }">
      <div class="break-line"></div>
      <div class="break-label">{{ element.breakType === 'Column' ? 'Column Break' : 'Page Break' }}</div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { BreakElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: BreakElement;
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
  parentFrameIndex?: number;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
}>();

// 处理选择
const handleSelect = (bandIndex: number, elementIndex: number, isMultiSelect?: boolean) => {
  emit('select', bandIndex, elementIndex, isMultiSelect, props.parentFrameIndex);
};

// 处理拖拽开始
const handleDragStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('dragStart', event, bandIndex, elementIndex, props.parentFrameIndex);
};

// 处理调整大小开始
const handleResizeStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('resizeStart', event, bandIndex, elementIndex, props.parentFrameIndex);
};

// 处理上下文菜单
const handleContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('contextmenu', event, bandIndex, elementIndex, props.parentFrameIndex);
};
</script>

<style scoped>
.break-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: visible;
}

.break-line {
  width: 100%;
  height: 1px;
  border-top: 2px dashed #ff4d4f; /* Page break default color (Reddish) */
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.column-break .break-line {
  border-top-color: #1890ff; /* Column break color (Blueish) */
}

.break-label {
  background-color: white;
  padding: 0 4px;
  font-size: 10px;
  color: #ff4d4f;
  z-index: 1;
  border: 1px solid #ff4d4f;
  border-radius: 2px;
}

.column-break .break-label {
  color: #1890ff;
  border-color: #1890ff;
}
</style>
