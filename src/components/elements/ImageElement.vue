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
    <div class="image-placeholder">
      <div class="image-icon">🖼️</div>
      <div class="image-path">{{ imagePath || '图片' }}</div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseElement from './BaseElement.vue';
import type { ImageElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: ImageElement;
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

// 图片路径（仅显示文件名部分）
const imagePath = computed(() => {
  if (!props.element.imagePath) return '';
  return props.element.imagePath.split('/').pop()?.split('\\').pop() || '';
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

.image-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.image-path {
  font-size: 12px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>