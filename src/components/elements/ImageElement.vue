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
  >
    <div class="image-container">
      <img 
        v-if="imageUrl" 
        :src="imageUrl" 
        class="preview-image" 
        alt="Preview" 
        @error="handleImageError"
        @dragstart.prevent="" 
      />
      <div v-else class="image-placeholder">
        <div class="image-icon">🖼️</div>
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseElement from './BaseElement.vue';
import type { ImageElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: ImageElement;
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
}>();

// 图片加载错误标志
const imageError = ref(false);

// 解析图片表达式，提取URL
const imageUrl = computed(() => {
  if (!props.element.imageExpression || imageError.value) return null;
  
  const expr = props.element.imageExpression.trim();
  // 检查是否是双引号包裹的字符串
  if (expr.startsWith('"') && expr.endsWith('"')) {
    // 移除双引号
    const url = expr.slice(1, -1).trim();
    // 检查是否是有效的URL格式
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }
  return null;
});

// 处理图片加载错误
const handleImageError = () => {
  imageError.value = true;
};

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
</script>

<style scoped>
.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 2px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
}
</style>