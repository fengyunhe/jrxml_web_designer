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
    <div class="chart-element">
      <div class="chart-content">
        <svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <!-- Pie chart -->
          <template v-if="element.chartType === 'pie' || element.chartType === 'pie3D'">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="currentColor" opacity="0.3" />
          </template>
          <!-- Bar chart -->
          <template v-else-if="element.chartType === 'bar' || element.chartType === 'bar3D' || element.chartType === 'stackedBar' || element.chartType === 'stackedBar3D'">
            <rect x="2" y="14" width="4" height="8" />
            <rect x="7" y="8" width="4" height="14" />
            <rect x="12" y="11" width="4" height="11" />
            <rect x="17" y="5" width="4" height="17" />
          </template>
          <!-- Line chart -->
          <template v-else-if="element.chartType === 'line' || element.chartType === 'xyLine' || element.chartType === 'timeSeries'">
            <polyline points="2,20 6,14 10,16 14,8 18,10 22,4" />
          </template>
          <!-- Area chart -->
          <template v-else-if="element.chartType === 'area' || element.chartType === 'xyArea' || element.chartType === 'stackedArea'">
            <polygon points="2,20 6,14 10,16 14,8 18,10 22,4 22,20" fill="currentColor" opacity="0.2" />
            <polyline points="2,20 6,14 10,16 14,8 18,10 22,4" />
          </template>
          <!-- Scatter chart -->
          <template v-else-if="element.chartType === 'scatter' || element.chartType === 'bubble'">
            <circle cx="5" cy="15" r="2" fill="currentColor" />
            <circle cx="10" cy="8" r="2" fill="currentColor" />
            <circle cx="15" cy="12" r="2" fill="currentColor" />
            <circle cx="19" cy="6" r="2" fill="currentColor" />
          </template>
          <!-- Meter/Gauge -->
          <template v-else-if="element.chartType === 'meter' || element.chartType === 'thermometer'">
            <path d="M12 22 A10 10 0 0 1 2 12" stroke-width="3" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </template>
          <!-- Default -->
          <template v-else>
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <line x1="2" y1="18" x2="22" y2="18" />
            <line x1="6" y1="18" x2="6" y2="10" />
            <line x1="10" y1="18" x2="10" y2="6" />
            <line x1="14" y1="18" x2="14" y2="8" />
            <line x1="18" y1="18" x2="18" y2="4" />
          </template>
        </svg>
        <span class="chart-label">{{ getChartLabel() }}</span>
      </div>
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import BaseElement from './BaseElement.vue';
import type { ChartElement, SelectedElementInfo, EditingElementInfo } from '../../types';

const props = defineProps<{
  element: ChartElement;
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

function getChartLabel(): string {
  const chartTypeLabels: Record<string, string> = {
    pie: 'Pie', pie3D: 'Pie3D',
    bar: 'Bar', bar3D: 'Bar3D', xyBar: 'XYBar', stackedBar: 'StackedBar', stackedBar3D: 'StackedBar3D',
    line: 'Line', xyLine: 'XYLine',
    area: 'Area', xyArea: 'XYArea', stackedArea: 'StackedArea',
    scatter: 'Scatter', bubble: 'Bubble',
    timeSeries: 'TimeSeries', highLow: 'HighLow', candlestick: 'Candlestick',
    meter: 'Meter', thermometer: 'Thermometer',
    multiAxis: 'MultiAxis', gantt: 'Gantt', spider: 'Spider'
  };
  return chartTypeLabels[props.element.chartType] || 'Chart';
}
</script>

<style scoped>
.chart-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff7e6;
  border: 1px dashed #ffc53d;
  border-radius: 2px;
}

.chart-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #fa8c16;
}

.chart-icon {
  width: 24px;
  height: 24px;
}

.chart-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
