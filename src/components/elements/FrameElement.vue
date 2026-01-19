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
      <!-- 渲染子元素 -->
      <template v-if="element.elements && element.elements.length > 0">
        <!-- 动态加载 ElementFactory 以避免循环引用 -->
        <component 
          :is="ElementFactory"
          v-for="(childElement, childIndex) in element.elements"
          :key="childIndex"
          :element="childElement"
          :band-index="bandIndex"
          :element-index="childIndex"
          :selected-element="selectedElement && selectedElement.parentFrameIndex === elementIndex && selectedElement.elementIndex === childIndex ? selectedElement : null"
          :selected-elements="[]"
          :editing-element="null"
          :is-dragging="false" 
          :report-font-family="reportFontFamily"
          :report-font-size="reportFontSize"
          :report-is-bold="reportIsBold"
          :report-is-italic="reportIsItalic"
          :report-is-underline="reportIsUnderline"
          :is-out-of-bounds="false"
          @select="handleChildSelect"
          @drag-start="handleChildDragStart"
          @resize-start="handleChildResizeStart"
          @contextmenu="handleChildContextMenu"
        />
      </template>
      
      <!-- 暂时为空，未来可以支持嵌套元素 -->
      <div v-else class="frame-placeholder">
        <span class="frame-label">Frame</span>
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import BaseElement from './BaseElement.vue';
import type { FrameElement, SelectedElementInfo } from '../../types';

// 异步导入 ElementFactory 以避免循环依赖
const ElementFactory = defineAsyncComponent(() => import('./ElementFactory.vue'));

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
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
}>();

// 处理选择
const handleSelect = (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => {
  emit('select', bandIndex, elementIndex, isMultiSelect, parentFrameIndex);
};

// 处理拖拽开始
const handleDragStart = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('dragStart', event, bandIndex, elementIndex, parentFrameIndex);
};

// 处理调整大小开始
const handleResizeStart = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('resizeStart', event, bandIndex, elementIndex, parentFrameIndex);
};

// 处理上下文菜单
const handleContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('contextmenu', event, bandIndex, elementIndex, parentFrameIndex);
};

// 处理子元素事件
const handleChildSelect = (bIndex: number, childIndex: number, isMultiSelect?: boolean) => {
  // 当选中Frame内的子元素时，传递Frame的elementIndex作为parentFrameIndex
  emit('select', props.bandIndex, childIndex, isMultiSelect, props.elementIndex);
};

const handleChildDragStart = (event: MouseEvent, bIndex: number, childIndex: number) => {
  emit('dragStart', event, props.bandIndex, childIndex, props.elementIndex);
};

const handleChildResizeStart = (event: MouseEvent, bIndex: number, childIndex: number) => {
  emit('resizeStart', event, props.bandIndex, childIndex, props.elementIndex);
};

const handleChildContextMenu = (event: MouseEvent, bIndex: number, childIndex: number) => {
  emit('contextmenu', event, props.bandIndex, childIndex, props.elementIndex);
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
