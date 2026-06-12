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
    <div class="barcode-element">
      <div class="barcode-content">
        <svg class="barcode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <template v-if="element.barcodeType === 'QRCode' || element.barcodeType === 'DataMatrix'">
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <rect x="6" y="6" width="4" height="4" fill="currentColor" />
            <rect x="14" y="6" width="4" height="4" fill="currentColor" />
            <rect x="6" y="14" width="4" height="4" fill="currentColor" />
            <rect x="14" y="14" width="4" height="4" fill="currentColor" />
          </template>
          <template v-else>
            <line x1="4" y1="4" x2="4" y2="20" stroke-width="2" />
            <line x1="7" y1="4" x2="7" y2="20" />
            <line x1="10" y1="4" x2="10" y2="20" stroke-width="2" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="15" y1="4" x2="15" y2="20" stroke-width="1.5" />
            <line x1="18" y1="4" x2="18" y2="20" />
            <line x1="20" y1="4" x2="20" y2="20" stroke-width="2" />
          </template>
        </svg>
        <span class="barcode-label">{{ element.barcodeType }}</span>
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { BarcodeElement, SelectedElementInfo, EditingElementInfo } from '../../types';

const props = defineProps<{
  element: BarcodeElement;
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
.barcode-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f0ff;
  border: 1px dashed #d3adf7;
  border-radius: 2px;
}

.barcode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #722ed1;
}

.barcode-icon {
  width: 24px;
  height: 24px;
}

.barcode-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
