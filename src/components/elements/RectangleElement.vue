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
    <!-- 矩形元素内容 -->
    <div class="rectangle-content" :style="rectangleStyle">
      <!-- 矩形元素可以添加自定义内容 -->
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseElement from './BaseElement.vue';
import type { RectangleElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
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
  parentFrameIndex?: number;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
}>();

// 计算矩形样式
const rectangleStyle = computed(() => {
  const style: any = {};
  
  // 圆角设置
  if (props.element.radius !== undefined && props.element.radius > 0) {
    style.borderRadius = `${props.element.radius}px`;
  }
  
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
    // 默认样式，如果没有设置pen，则使用默认的1px实线黑色边框，以确保矩形可见
    // 但如果显式设置了 pen 且 lineWidth 为 0，则上面已经处理了
    // 检查是否有 box 属性设置了边框（虽然 rectangle 不应使用 box，但为了兼容性）
    const box = props.element.box;
    if (box && (box.borderWidth || box.pen?.lineWidth)) {
      // BaseElement 会处理 box 属性，这里不需要重复处理
      // 但我们需要禁用 BaseElement 的默认边框渲染，或者在这里覆盖它
      // 由于 BaseElement 的样式是应用在容器上的，而这里的 style 是应用在内部 div 上的
      // 我们实际上应该让 BaseElement 处理边框，除非 radius 需要应用在边框上
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
.rectangle-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>