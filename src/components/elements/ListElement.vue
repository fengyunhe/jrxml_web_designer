<template>
  <BaseElement
    :element="element"
    :band-index="bandIndex"
    :element-index="elementIndex"
    :selected-element="selectedElement"
    :selected-elements="selectedElements"
    :editing-element="editingElement"
    :is-dragging="isDragging"
    :is-out-of-bounds="isOutOfBounds"
    :parent-frame-index="parentFrameIndex"
    :zoom-level="zoomLevel"
    @select="(b, e, m, p) => emit('select', b, e, m, p)"
    @drag-start="(ev, b, e, p) => emit('dragStart', ev, b, e, p)"
    @resize-start="(ev, b, e, p) => emit('resizeStart', ev, b, e, p)"
    @contextmenu="(ev, b, e, p) => emit('contextmenu', ev, b, e, p)"
  >
    <div class="list-element">
      <div class="list-content">
        <svg class="list-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="2" width="18" height="6" rx="1" />
          <rect x="3" y="10" width="18" height="6" rx="1" />
          <rect x="3" y="18" width="18" height="6" rx="1" />
        </svg>
        <span class="list-label">List</span>
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { ListElement, SelectedElementInfo, EditingElementInfo } from '../../types';

const props = defineProps<{
  element: ListElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  selectedElements: {bandIndex: number, elementIndex: number, parentFrameIndex?: number}[];
  editingElement: EditingElementInfo | null;
  isDragging?: boolean;
  isOutOfBounds?: boolean;
  parentFrameIndex?: number;
  zoomLevel?: number;
}>();

const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
}>();
</script>

<style scoped>
.list-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6ffed;
  border: 1px dashed #95de64;
  border-radius: 2px;
}

.list-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #52c41a;
}

.list-icon {
  width: 24px;
  height: 24px;
}

.list-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
