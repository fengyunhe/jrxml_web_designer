<template>
  <div class="designer-canvas" @click="setDesignAreaFocused">
    <!-- 顶部标尺容器 -->
    <div class="top-ruler-container">
      <!-- 左上角空白区域 -->
      <div class="corner-space">
        <div class="unit-label">px</div>
      </div>
      <!-- 水平标尺 -->
      <div class="horizontal-ruler" ref="horizontalRulerRef">
        <div class="ruler-content" :style="{ width: (paperWidth * zoomLevel) + 'px' }">
          <div 
            v-for="tick in horizontalRulerTicks" 
            :key="tick.position" 
            class="tick" 
            :class="{ 'major': tick.major, 'minor': !tick.major }"
            :style="{ left: (tick.position * zoomLevel) + 'px' }"
          ></div>
          <div 
            v-for="label in horizontalRulerLabels" 
            :key="label.position" 
            class="label" 
            :style="{ left: (label.position * zoomLevel) + 'px' }"
          >
            {{ label.value }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 左侧标尺和纸张容器 -->
    <div class="main-content">
      <!-- 垂直标尺 -->
      <div class="vertical-ruler-container">
        <div class="vertical-ruler" ref="verticalRulerRef">
          <div class="ruler-content" :style="{ height: (paperHeight * zoomLevel) + 'px' }">
            <div 
              v-for="tick in verticalRulerTicks" 
              :key="tick.position" 
              class="tick" 
              :class="{ 'major': tick.major, 'minor': !tick.major }"
              :style="{ top: (tick.position * zoomLevel) + 'px' }"
            ></div>
            <div 
              v-for="label in verticalRulerLabels" 
              :key="label.position" 
              class="label" 
              :style="{ top: (label.position * zoomLevel) + 'px' }"
            >
              {{ label.value }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 纸张容器 -->
      <div class="paper-container" ref="paperContainerRef">
        <!-- 纸张 -->
        <div class="paper" 
             :style="{ 
               width: paperWidth + 'px', 
               height: paperHeight + 'px',
               transform: `scale(${zoomLevel})`,
               transformOrigin: 'top left'
             }"
             :class="{'focused': isDesignAreaFocused}"
             @drop="handleDrop"
             @dragover="handleDragOver"
             @dragleave="handleDragLeave"
             @mousedown="startSelection"
        >
        <!-- 报表边距容器 -->
        <div class="pager"
             :style="{ 
               padding: reportProperties.topMargin + 'px ' + reportProperties.rightMargin + 'px ' + reportProperties.bottomMargin + 'px ' + reportProperties.leftMargin + 'px',
               width: '100%',
               height: '100%',
               position: 'relative',
               backgroundSize: uiConstants.GRID_SIZE + 'px ' + uiConstants.GRID_SIZE + 'px'
             }"
        >
        
        <!-- 报表区域 -->
        <div 
          v-for="(band, bandIndex) in bands" 
          :key="band.type"
          class="band"
          :style="{ height: band.height + 'px' }"
          @click="selectBand(bandIndex)"
          :class="{ 
            'selected': selectedBandIndex === bandIndex,
            'dragging-target': highlightedBandIndex === bandIndex,
            'drag-over': highlightedBandIndex === bandIndex
          }"
        >
          <div class="band-background-label-container">
            <span class="band-background-label">{{ t('bandNames.' + band.type) }}</span>
          </div>
          <div class="band-content">
            <ElementFactory
            v-for="(item, index) in band.elements"
            :key="index"
            :element="item"
            :band-index="bandIndex"
            :element-index="index"
            :selected-element="selectedElement"
            :selected-elements="selectedElements"
            :editing-element="editingElement"
            :is-dragging="isDraggingOrResizing"
            :report-font-family="reportProperties.defaultFont.name"
            :report-font-size="reportProperties.defaultFont.size"
            :report-is-bold="reportProperties.defaultFont.isBold"
            :report-is-italic="reportProperties.defaultFont.isItalic"
            :report-is-underline="reportProperties.defaultFont.isUnderline"
            :is-out-of-bounds="isElementOutOfBounds(bandIndex, index)"
            @select="selectElement"
            @drag-start="startDragging"
            @resize-start="startResizingElement"
            @contextmenu="handleElementContextMenu"
            @start-editing="startEditing"
            @finish-editing="finishEditing"
            @cancel-editing="cancelEditing"
            @check-fields="checkFields"
          />
          </div>
          <!-- 区域高度调整手柄 -->
          <div class="band-resize-handle" @mousedown.stop="startResizingBand($event, bandIndex)"></div>
        </div>
        
        <!-- 对齐线 -->
        <div v-if="isDraggingOrResizing" class="alignment-lines">
          <!-- 水平对齐线 -->
          <div 
            v-for="(line, index) in alignmentLines.horizontal" 
            :key="'h-' + index"
            class="alignment-line horizontal"
            :style="{ top: line + 'px' }"
          ></div>
          <!-- 垂直对齐线 -->
          <div 
            v-for="(line, index) in alignmentLines.vertical" 
            :key="'v-' + index"
            class="alignment-line vertical"
            :style="{ left: line + 'px' }"
          ></div>
        </div>
        </div>
        </div>
      </div>
      
      <!-- 框选框 -->
      <SelectionBox
        :start-x="selectionBox.startX"
        :start-y="selectionBox.startY"
        :end-x="selectionBox.endX"
        :end-y="selectionBox.endY"
        :visible="selectionBox.visible"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import ElementFactory from '../elements/ElementFactory.vue';
import SelectionBox from './SelectionBox.vue';
import { BAND_CONSTANTS } from '@/constants/constants';
import { getBandDisplayName } from '@/utils/bandUtils';
import type { Band } from '@/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
interface Props {
  paperWidth: number;
  paperHeight: number;
  zoomLevel: number;
  reportProperties: any;
  bands: Band[];
  selectedBandIndex: number | null;
  highlightedBandIndex: number | null;
  selectedElement: any;
  selectedElements: {bandIndex: number, elementIndex: number, parentFrameIndex?: number}[]; // 添加多选支持
  editingElement: any;
  isDraggingOrResizing: boolean;
  horizontalRulerTicks: any[];
  horizontalRulerLabels: any[];
  verticalRulerTicks: any[];
  verticalRulerLabels: any[];
  alignmentLines: any;
  isDesignAreaFocused: boolean;
  uiConstants: any;
  outOfBoundsElements: Array<{bandIndex: number, elementIndex: number, element: any}>;
}

const props = withDefaults(defineProps<Props>(), {
  paperWidth: 0,
  paperHeight: 0,
  zoomLevel: 1,
  reportProperties: () => ({}),
  bands: () => [],
  selectedBandIndex: null,
  highlightedBandIndex: null,
  selectedElement: null,
  selectedElements: () => [], // 添加多选支持的默认值
  editingElement: null,
  isDraggingOrResizing: false,
  horizontalRulerTicks: () => [],
  horizontalRulerLabels: () => [],
  verticalRulerTicks: () => [],
  verticalRulerLabels: () => [],
  alignmentLines: () => ({ horizontal: [], vertical: [] }),
  isDesignAreaFocused: false,
  uiConstants: () => ({}),
  outOfBoundsElements: () => []
});

// Emits
const emit = defineEmits([
  'set-design-area-focused',
  'handle-drop',
  'handle-drag-over',
  'handle-drag-leave',
  'select-band',
  'select-element',
  'start-dragging',
  'start-resizing-element',
  'start-editing',
  'finish-editing',
  'cancel-editing',
  'start-resizing-band',
  'zoom-change',
  'reset-zoom', // 添加重置缩放事件
  'select-elements-in-rect', // 添加框选事件
  'clear-selection', // 添加清空选择事件
  'check-fields', // 添加字段检查事件
  'contextmenu' // 添加上下文菜单事件
]);

// 框选状态
const selectionBox = ref({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  visible: false
});

const isSelecting = ref(false);

const horizontalRulerRef = ref<HTMLElement | null>(null);
const verticalRulerRef = ref<HTMLElement | null>(null);
const paperContainerRef = ref<HTMLElement | null>(null);

// Methods
const setDesignAreaFocused = () => {
  emit('set-design-area-focused');
};

const handleDrop = (event: DragEvent) => {
  emit('handle-drop', event);
};

const handleDragOver = (event: DragEvent) => {
  emit('handle-drag-over', event);
};

const handleDragLeave = (event: DragEvent) => {
  emit('handle-drag-leave', event);
};

const selectBand = (bandIndex: number) => {
  emit('select-band', bandIndex);
};

const selectElement = (bandIndex: number, elementIndex: number, isMultiSelect = false, parentFrameIndex?: number) => {
  emit('select-element', bandIndex, elementIndex, isMultiSelect, parentFrameIndex);
};

const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('start-dragging', event, bandIndex, elementIndex, parentFrameIndex);
};

const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('start-resizing-element', event, bandIndex, elementIndex, 'se', parentFrameIndex); // 默认方向为'se'
};

const startEditing = (bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('start-editing', bandIndex, elementIndex, parentFrameIndex);
};

const finishEditing = () => {
  // 由于ElementFactory的finishEditing事件不传递参数，我们需要从editingElement中获取信息
  if (props.editingElement) {
    emit('finish-editing');
  }
};

const cancelEditing = () => {
  // 由于ElementFactory的cancelEditing事件不传递参数，我们需要从editingElement中获取信息
  if (props.editingElement) {
    emit('cancel-editing');
  }
};

const checkFields = (fields: string[]) => {
  emit('check-fields', fields);
};

// 处理元素上下文菜单
const handleElementContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('contextmenu', event, bandIndex, elementIndex, parentFrameIndex);
};

const startResizingBand = (event: MouseEvent, bandIndex: number) => {
  emit('start-resizing-band', event, bandIndex);
};

// 检查元素是否超出边界
const isElementOutOfBounds = (bandIndex: number, elementIndex: number) => {
  return props.outOfBoundsElements.some(
    item => item.bandIndex === bandIndex && item.elementIndex === elementIndex
  );
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // CTRL+0 重置缩放
  if (event.ctrlKey && event.key === '0') {
    event.preventDefault();
    emit('reset-zoom');
  }
};

// 滚动事件处理
const handleWheel = (event: WheelEvent) => {
  // 如果按住Ctrl键，则进行缩放
  if (event.ctrlKey) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    emit('zoom-change', delta);
  }
};

// 框选功能
const startSelection = (event: MouseEvent) => {
  // 只有点击空白区域才开始框选
  if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains('pager')) {
    isSelecting.value = true;
    
    // 获取纸张元素的位置信息
    const paperEl = document.querySelector('.paper') as HTMLElement;
    const paperContainer = document.querySelector('.paper-container') as HTMLElement;
    if (paperEl && paperContainer) {
      const containerRect = paperContainer.getBoundingClientRect();
      const currentZoom = props.zoomLevel;
      
      // 获取滚动位置
      const scrollLeft = paperContainer.scrollLeft;
      const scrollTop = paperContainer.scrollTop;
      
      // 计算相对于纸张的坐标，考虑缩放比例和滚动位置
      // 鼠标位置 - 容器位置 + 滚动位置 = 相对于未缩放纸张的位置
      const paperStartX = (event.clientX - containerRect.left + scrollLeft) / currentZoom;
      const paperStartY = (event.clientY - containerRect.top + scrollTop) / currentZoom;
      
      // 设置框选框的坐标，需要考虑缩放因子，因为SelectionBox现在在paper-container外
      selectionBox.value.startX = paperStartX * currentZoom;
      selectionBox.value.startY = paperStartY * currentZoom;
      selectionBox.value.endX = selectionBox.value.startX;
      selectionBox.value.endY = selectionBox.value.startY;
      selectionBox.value.visible = true;
      
      // 添加全局鼠标移动和释放事件监听器
      document.addEventListener('mousemove', updateSelection);
      document.addEventListener('mouseup', endSelection);
      
      // 阻止默认行为和冒泡
      event.preventDefault();
      event.stopPropagation();
    }
  }
};

const updateSelection = (event: MouseEvent) => {
  if (!isSelecting.value) return;
  
  // 获取纸张元素的位置信息
  const paperEl = document.querySelector('.paper') as HTMLElement;
  const paperContainer = document.querySelector('.paper-container') as HTMLElement;
  if (paperEl && paperContainer) {
    const containerRect = paperContainer.getBoundingClientRect();
    const currentZoom = props.zoomLevel;
    
    // 获取滚动位置
    const scrollLeft = paperContainer.scrollLeft;
    const scrollTop = paperContainer.scrollTop;
    
    // 计算相对于纸张的坐标，考虑缩放比例和滚动位置
    const paperEndX = (event.clientX - containerRect.left + scrollLeft) / currentZoom;
    const paperEndY = (event.clientY - containerRect.top + scrollTop) / currentZoom;
    
    // 更新框选框的终点坐标，需要考虑缩放因子，因为SelectionBox现在在paper-container外
    selectionBox.value.endX = paperEndX * currentZoom;
    selectionBox.value.endY = paperEndY * currentZoom;
  }
};

const endSelection = () => {
  if (!isSelecting.value) return;
  
  // 移除全局事件监听器
  document.removeEventListener('mousemove', updateSelection);
  document.removeEventListener('mouseup', endSelection);
  
  // 计算框选区域（缩放后的坐标）
  const scaledLeft = Math.min(selectionBox.value.startX, selectionBox.value.endX);
  const scaledTop = Math.min(selectionBox.value.startY, selectionBox.value.endY);
  const scaledRight = Math.max(selectionBox.value.startX, selectionBox.value.endX);
  const scaledBottom = Math.max(selectionBox.value.startY, selectionBox.value.endY);
  
  // 如果框选区域太小（小于5像素），则不进行框选，而是清空选择
  if (Math.abs(scaledRight - scaledLeft) < 5 || Math.abs(scaledBottom - scaledTop) < 5) {
    selectionBox.value.visible = false;
    isSelecting.value = false;
    // 触发清空选择事件
    emit('clear-selection');
    return;
  }
  
  // 将缩放后的坐标转换为相对于纸张的坐标
  const currentZoom = props.zoomLevel;
  const left = scaledLeft / currentZoom;
  const top = scaledTop / currentZoom;
  const right = scaledRight / currentZoom;
  const bottom = scaledBottom / currentZoom;
  
  // 触发框选事件，传递框选区域的坐标（相对于纸张）
  emit('select-elements-in-rect', {
    left,
    top,
    right,
    bottom
  });
  
  // 隐藏框选框
  selectionBox.value.visible = false;
  isSelecting.value = false;
};

// 生命周期钩子
onMounted(() => {
  // 添加鼠标滚轮事件监听器
  const designerCanvas = document.querySelector('.designer-canvas');
  if (designerCanvas) {
    designerCanvas.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    (window as any).designerCanvasWheelListener = handleWheel;
    
    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown as EventListener);
    (window as any).designerCanvasKeyDownListener = handleKeyDown;
  }
  
  // 添加滚动事件监听器
    if (paperContainerRef.value) {
      const handleScroll = () => {
        if (horizontalRulerRef.value && verticalRulerRef.value && paperContainerRef.value) {
          horizontalRulerRef.value.scrollLeft = paperContainerRef.value.scrollLeft;
          verticalRulerRef.value.scrollTop = paperContainerRef.value.scrollTop;
        }
      };
      
      paperContainerRef.value.addEventListener('scroll', handleScroll);
      (window as any).paperContainerScrollListener = handleScroll;
    }
  
  // 添加paper点击事件监听器
  const paper = document.querySelector('.paper');
  if (paper) {
    const handlePaperClick = () => {
      emit('set-design-area-focused');
    };
    
    paper.addEventListener('click', handlePaperClick);
    (window as any).paperClickListener = handlePaperClick;
  }
});

onBeforeUnmount(() => {
  // 移除滚动事件监听器
  const scrollListener = (window as any).paperContainerScrollListener;
  if (scrollListener && paperContainerRef.value) {
    paperContainerRef.value.removeEventListener('scroll', scrollListener);
  }
  
  // 移除鼠标滚轮事件监听器
  const wheelListener = (window as any).designerCanvasWheelListener;
  const designerCanvas = document.querySelector('.designer-canvas');
  if (wheelListener && designerCanvas) {
    designerCanvas.removeEventListener('wheel', wheelListener as EventListener);
  }
  
  // 移除键盘事件监听器
  const keyDownListener = (window as any).designerCanvasKeyDownListener;
  if (keyDownListener) {
    document.removeEventListener('keydown', keyDownListener as EventListener);
  }
  
  // 移除paper点击事件监听器
  const paperClickListener = (window as any).paperClickListener;
  const paper = document.querySelector('.paper');
  if (paperClickListener && paper) {
    paper.removeEventListener('click', paperClickListener);
  }

  // 清理全局引用
  delete (window as any).paperContainerScrollListener;
  delete (window as any).designerCanvasWheelListener;
  delete (window as any).designerCanvasKeyDownListener;
  delete (window as any).paperClickListener;
});
</script>

<style scoped>
.designer-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;
  min-height: 0;
}

.top-ruler-container {
  display: flex;
  height: 30px;
  background-color: #e8e8e8;
  border-bottom: 1px solid #ccc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.corner-space {
  width: 30px;
  height: 30px;
  background-color: #e0e0e0;
  border-right: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unit-label {
  font-size: 10px;
  color: #666;
}

.horizontal-ruler {
  position: relative;
  flex: 1;
  width: 0;
  height: 30px;
  background-color: #e8e8e8;
  border-bottom: 1px solid #ccc;
  overflow-x: auto;
  overflow-y: hidden;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  flex-shrink: 0;
}

.horizontal-ruler::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.ruler-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.vertical-ruler-container {
  width: 30px;
  background-color: #e8e8e8;
  border-right: 1px solid #ccc;
  position: sticky;
  left: 0;
  z-index: 5;
}

.vertical-ruler {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #e8e8e8;
  border-top: 1px solid #ccc;
  overflow-x: hidden;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  flex-shrink: 0;
}

.vertical-ruler::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.paper-container {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  overflow: auto;
  min-width: 0;
  min-height: 0;
}

.paper {
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.paper.focused {
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}

.pager {
  position: relative;
  background-image: 
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
}

.band {
  border: 1px solid #ddd;
  margin-bottom: v-bind('BAND_CONSTANTS.SPACING + "px"');
  position: relative;
  background-color: rgba(255, 255, 255, 0.8);
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.band:hover {
  background-color: rgba(240, 240, 255, 0.8);
}

.band.selected {
  border-color: #4a90e2;
  background-color: rgba(240, 248, 255, 0.8);
}

.band.dragging-target {
  border-color: #ff9500;
  background-color: rgba(255, 248, 240, 0.8);
}

.band.drag-over {
  border-color: #ff9500;
  background-color: rgba(255, 248, 240, 0.9);
}

.band-background-label-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.band-background-label {
  font-size: 40px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.05);
  user-select: none;
  white-space: nowrap;
}

.band-content {
  position: relative;
  min-height: 30px;
  z-index: 1;
}

.band-resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5px;
  cursor: ns-resize;
  background-color: rgba(74, 144, 226, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.band:hover .band-resize-handle {
  opacity: 1;
}

.alignment-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}

.alignment-line {
  position: absolute;
  background-color: rgba(24, 144, 255, 0.8);
  opacity: 0.7;
}

.alignment-line.horizontal {
  height: 1px;
  left: 0;
  right: 0;
}

.alignment-line.vertical {
  width: 1px;
  top: 0;
  bottom: 0;
}

.tick {
  position: absolute;
  background-color: #666;
}

.tick.major {
  height: 10px;
  width: 1px;
}

.tick.minor {
  height: 5px;
  width: 1px;
}

.horizontal-ruler .tick {
  top: 0;
}

.vertical-ruler .tick {
  left: 0;
  width: 10px;
  height: 1px;
}

.label {
  position: absolute;
  font-size: 10px;
  color: #666;
}

.horizontal-ruler .label {
  top: 12px;
  transform: translateX(-50%);
}

.vertical-ruler .label {
  left: 12px;
  transform: translateY(-50%);
}
</style>