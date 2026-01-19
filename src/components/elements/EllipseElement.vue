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
    <!-- 椭圆元素内容 -->
    <div class="ellipse-content" :style="ellipseStyle">
      <!-- 椭圆元素可以添加自定义内容 -->
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseElement from './BaseElement.vue';
import type { EllipseElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: EllipseElement;
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

// 计算椭圆样式
const ellipseStyle = computed(() => {
  const style: any = {
    borderRadius: '50%' // 椭圆形状
  };
  
  // 边框设置 - 优先使用 pen 属性
  if (props.element.pen) {
    const width = props.element.pen.lineWidth || 0;
    const color = props.element.pen.lineColor || '#000000';
    let lineStyle = 'solid';
    
    if (props.element.pen.lineStyle) {
      if (props.element.pen.lineStyle === 'Dashed') lineStyle = 'dashed';
      else if (props.element.pen.lineStyle === 'Dotted') lineStyle = 'dotted';
      else if (props.element.pen.lineStyle === 'Double') lineStyle = 'double';
    }
    
    // 如果线宽为0，则无边框
    if (width > 0) {
      style.border = `${width}px ${lineStyle} ${color}`;
    } else {
      style.border = 'none';
    }
  } else {
    // 默认样式，如果没有设置pen，则使用默认的1px实线黑色边框
    // 检查是否有 box 属性设置了边框（兼容性）
    const box = props.element.box;
    if (box && (box.borderWidth || box.pen?.lineWidth)) {
      // BaseElement 会处理 box 属性，但在椭圆中我们需要覆盖它
    } else {
      // 默认边框
      style.border = '1px solid #000000';
    }
  }
  
  return style;
});

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
.ellipse-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
