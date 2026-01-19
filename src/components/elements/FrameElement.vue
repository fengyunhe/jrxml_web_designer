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
    <!-- Frame 元素内容 -->
    <div class="frame-content">
      <!-- 暂时为空，未来可以支持嵌套元素 -->
      <div v-if="!element.elements || element.elements.length === 0" class="frame-placeholder">
        <!-- 只有当没有内容且处于设计模式时才显示占位符，这里简单处理为空 -->
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { FrameElement, SelectedElementInfo } from '../../types';

// Props
defineProps<{
  element: FrameElement;
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
.frame-content {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
