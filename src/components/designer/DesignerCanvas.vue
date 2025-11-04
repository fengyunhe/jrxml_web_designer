<template>
  <div class="designer-canvas" @click="setDesignAreaFocused">
    <!-- 顶部标尺容器 -->
    <div class="top-ruler-container">
      <!-- 左上角空白区域 -->
      <div class="corner-space">
        <div class="unit-label">mm</div>
      </div>
      <!-- 水平标尺 -->
      <div class="horizontal-ruler" :style="{ width: (paperWidth * zoomLevel) + 'px' }">
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
        <div class="vertical-ruler" :style="{ height: (paperHeight * zoomLevel) + 'px' }">
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
      <div class="paper-container">
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
          <div class="band-header">
            <span>{{ band.type }}</span>
          </div>
          <div class="band-content">
            <ElementFactory
              v-for="(item, index) in band.elements"
              :key="index"
              :element="item"
              :band-index="bandIndex"
              :element-index="index"
              :selected-element="selectedElement"
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
              @start-editing="startEditing"
              @finish-editing="finishEditing"
              @cancel-editing="cancelEditing"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import ElementFactory from '../elements/ElementFactory.vue';

// Props
interface Props {
  paperWidth: number;
  paperHeight: number;
  zoomLevel: number;
  reportProperties: any;
  bands: any[];
  selectedBandIndex: number | null;
  highlightedBandIndex: number | null;
  selectedElement: any;
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
  'zoom-change'
]);

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

const selectElement = (bandIndex: number, elementIndex: number) => {
  emit('select-element', bandIndex, elementIndex);
};

const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('start-dragging', event, bandIndex, elementIndex);
};

const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('start-resizing-element', event, bandIndex, elementIndex, 'se'); // 默认方向为'se'
};

const startEditing = (bandIndex: number, elementIndex: number) => {
  emit('start-editing', bandIndex, elementIndex);
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

const startResizingBand = (event: MouseEvent, bandIndex: number) => {
  emit('start-resizing-band', event, bandIndex);
};

// 检查元素是否超出边界
const isElementOutOfBounds = (bandIndex: number, elementIndex: number) => {
  return props.outOfBoundsElements.some(
    item => item.bandIndex === bandIndex && item.elementIndex === elementIndex
  );
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

// 生命周期钩子
onMounted(() => {
  // 添加鼠标滚轮事件监听器
  const designerCanvas = document.querySelector('.designer-canvas');
  if (designerCanvas) {
    designerCanvas.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    (window as any).designerCanvasWheelListener = handleWheel;
  }
  
  // 添加滚动事件监听器
    const paperContainer = document.querySelector('.paper-container');
    if (paperContainer) {
      const handleScroll = () => {
        const horizontalRuler = document.querySelector('.horizontal-ruler');
        const verticalRuler = document.querySelector('.vertical-ruler');
        
        if (horizontalRuler && verticalRuler) {
          horizontalRuler.scrollLeft = paperContainer.scrollLeft;
          verticalRuler.scrollTop = paperContainer.scrollTop;
        }
      };
      
      paperContainer.addEventListener('scroll', handleScroll);
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

onUnmounted(() => {
  // 移除鼠标滚轮事件监听器
  const wheelListener = (window as any).designerCanvasWheelListener;
  const designerCanvas = document.querySelector('.designer-canvas');
  if (wheelListener && designerCanvas) {
    designerCanvas.removeEventListener('wheel', wheelListener as EventListener);
  }
  
  // 移除滚动事件监听器
  const scrollListener = (window as any).paperContainerScrollListener;
  const paperContainer = document.querySelector('.paper-container');
  if (scrollListener && paperContainer) {
    paperContainer.removeEventListener('scroll', scrollListener);
  }
  
  // 移除paper点击事件监听器
  const paperClickListener = (window as any).paperClickListener;
  const paper = document.querySelector('.paper');
  if (paperClickListener && paper) {
    paper.removeEventListener('click', paperClickListener);
  }
});
</script>

<style scoped>
.designer-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background-color: #f0f0f0;
  position: relative;
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
  width: 100%;
  height: 30px;
  background-color: #e8e8e8;
  border-bottom: 1px solid #ccc;
  overflow-x: auto;
  overflow-y: hidden;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
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
}

.vertical-ruler::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.paper-container {
  flex: 1;
  display: flex;
  justify-content: left;
  align-items: flex-start;
  overflow: auto;
}

.paper {
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: transform 0.2s ease;
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
  margin-bottom: 5px;
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

.band-header {
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(245, 245, 245, 0.8);
  padding: 2px 5px;
  font-size: 12px;
  font-weight: bold;
  color: #666;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.band:hover .band-header {
  opacity: 1;
}

.band-content {
  position: relative;
  min-height: 30px;
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