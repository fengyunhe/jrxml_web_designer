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
    <div class="frame-content" :class="{ 'frame-empty': !element.elements || element.elements.length === 0 }">
      <!-- 暂时为空，未来可以支持嵌套元素 -->
      <div v-if="!element.elements || element.elements.length === 0" class="frame-placeholder">
        <span class="frame-label">Frame</span>
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

.frame-empty {
  /* 当为空时，显示一个淡灰色的背景和虚线边框，方便设计 */
  border: 1px dashed #e0e0e0;
  background-color: rgba(240, 240, 240, 0.2);
}

/* 如果选中了，边框颜色加深 */
:deep(.design-element.selected) .frame-empty {
  border-color: #a0a0a0;
}

.frame-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.frame-label {
  font-size: 10px;
  color: #ccc;
  user-select: none;
}
</style>
