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
    <div class="subreport-element">
      <div class="subreport-content">
        <svg class="subreport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <rect x="5" y="5" width="14" height="14" rx="1" stroke-dasharray="3 2" />
          <text x="12" y="13" text-anchor="middle" font-size="6" fill="currentColor" stroke="none">SR</text>
        </svg>
        <span class="subreport-label">Subreport</span>
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { SubreportElement, SelectedElementInfo, EditingElementInfo } from '../../types';

const props = defineProps<{
  element: SubreportElement;
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
.subreport-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f5ff;
  border: 1px dashed #91caff;
  border-radius: 2px;
}

.subreport-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #1677ff;
}

.subreport-icon {
  width: 24px;
  height: 24px;
}

.subreport-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
