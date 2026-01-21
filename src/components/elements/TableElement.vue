<template>
  <BaseElement
    :element="element"
    :band-index="bandIndex"
    :element-index="elementIndex"
    :selected-element="selectedElement"
    :selected-elements="selectedElements"
    :is-dragging="isDragging"
    :is-out-of-bounds="isOutOfBounds"
    :parent-frame-index="parentFrameIndex"
    @select="handleSelect"
    @drag-start="handleDragStart"
    @resize-start="handleResizeStart"
    @contextmenu="handleContextMenu"
  >
    <!-- 表格内容 -->
    <div class="table-content">
      <!-- 表格头部 -->
      <div class="table-header">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column table-header-cell"
        >
          <!-- 调整列顺序的按钮 -->
          <!-- 向左移动按钮 -->
          <n-button 
            v-if="index > 0"
            class="order-button left-button"
            @click="moveColumn(index, 'left')"
            :title="t('properties.moveColumnLeft')"
            type="default"
            quaternary
            circle
            size="small"
          >
            ◀
          </n-button>
          
          <!-- 向右移动按钮 -->
          <n-button 
            v-if="index < columns.length - 1"
            class="order-button right-button"
            @click="moveColumn(index, 'right')"
            :title="t('properties.moveColumnRight')"
            type="default"
            quaternary
            circle
            size="small"
          >
            ▶
          </n-button>
          
          <div v-if="column.tableHeader" class="cell-content">
            <!-- 渲染表头内容 -->
            <template v-if="column.tableHeader.type === 'staticText'">
              <div class="static-text">{{ column.tableHeader.text }}</div>
            </template>
            <template v-else-if="column.tableHeader.type === 'textField'">
              <div class="text-field">{{ column.tableHeader.expression }}</div>
            </template>
          </div>
          <div v-else class="cell-content empty">
            Table Header
          </div>
        </div>
      </div>
      <!-- 列头部 -->
      <div class="column-header">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column column-header-cell"
        >
          <div class="cell-content">
            <!-- 渲染列头内容，优先显示column.name -->
            <div class="column-name">{{ column.name }}</div>
          </div>
        </div>
      </div>
      <!-- 详情行 -->
      <div class="detail-row">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column detail-cell"
        >
          <div v-if="column.detailCell" class="cell-content">
            <!-- 渲染详情内容 -->
            <template v-if="column.detailCell.type === 'staticText'">
              <div class="static-text">{{ column.detailCell.text }}</div>
            </template>
            <template v-else-if="column.detailCell.type === 'textField'">
              <div class="text-field">{{ column.detailCell.expression }}</div>
            </template>
          </div>
          <div v-else class="cell-content empty">
            Detail Cell
          </div>
        </div>
      </div>
      <!-- 列尾 -->
      <div class="column-footer">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column column-footer-cell"
        >
          <div v-if="column.columnFooter" class="cell-content">
            <!-- 渲染列尾内容 -->
            <template v-if="column.columnFooter.type === 'staticText'">
              <div class="static-text">{{ column.columnFooter.text }}</div>
            </template>
            <template v-else-if="column.columnFooter.type === 'textField'">
              <div class="text-field">{{ column.columnFooter.expression || '' }}</div>
            </template>
          </div>
          <div v-else class="cell-content empty">
            Column Footer
          </div>
        </div>
      </div>
      <!-- 表格表尾 -->
      <div class="table-footer">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column table-footer-cell"
        >
          <div v-if="column.tableFooter" class="cell-content">
            <!-- 渲染表格表尾内容 -->
            <template v-if="column.tableFooter.type === 'staticText'">
              <div class="static-text">{{ column.tableFooter.text }}</div>
            </template>
            <template v-else-if="column.tableFooter.type === 'textField'">
              <div class="text-field">{{ column.tableFooter.expression || '' }}</div>
            </template>
          </div>
          <div v-else class="cell-content empty">
            Table Footer
          </div>
        </div>
      </div>
    </div>
    
    <!-- 选择边框 -->
    <SelectionBox 
      v-if="isSelected" 
      :element="element" 
      :is-resizing="isResizing" 
      :on-resize="handleResize"
      :on-resize-start="handleResizeStart"
      :on-resize-end="handleResizeEnd"
    />
  </BaseElement>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import BaseElement from './BaseElement.vue';
import SelectionBox from '../designer/SelectionBox.vue';

const { t } = useI18n();
import type { 
  DesignElement, 
  SelectedElementInfo, 
  EditingElementInfo, 
  TableElement as TableElementType
} from '../../types';

const props = defineProps<{
  element: DesignElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  selectedElements: Array<{ bandIndex: number; elementIndex: number; parentFrameIndex?: number }>;
  editingElement: EditingElementInfo | null;
  isDragging?: boolean;
  isOutOfBounds?: boolean;
  parentFrameIndex?: number;
}>();

const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeEnd: [];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  moveColumn: [elementIndex: number, fromIndex: number, toIndex: number];
}>();

// Move column left or right
function moveColumn(index: number, direction: 'left' | 'right') {
  const newIndex = direction === 'left' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= columns.value.length) return;
  
  // Emit move column event to parent component
  emit('moveColumn', props.elementIndex, index, newIndex);
}

const isResizing = ref(false);
const tableElement = computed(() => props.element as TableElementType);
const columns = computed(() => tableElement.value.columns || []);

// 计算元素是否被选中
const isSelected = computed(() => {
  return props.selectedElement?.bandIndex === props.bandIndex &&
         props.selectedElement?.elementIndex === props.elementIndex &&
         props.selectedElement?.parentFrameIndex === props.parentFrameIndex;
});

// 处理选择事件
const handleSelect = (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => {
  emit('select', bandIndex, elementIndex, isMultiSelect || false, parentFrameIndex);
};

// 处理拖拽开始事件
const handleDragStart = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  emit('dragStart', event, bandIndex, elementIndex, parentFrameIndex);
};

// 处理右键菜单事件
const handleContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  event.preventDefault();
  event.stopPropagation();
  emit('contextmenu', event, bandIndex, elementIndex, parentFrameIndex);
};

// 调整大小事件
const handleResize = (newWidth: number, newHeight: number) => {
  // 这里需要更新元素大小，会通过父组件处理
};

// 调整大小开始事件
const handleResizeStart = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  event.stopPropagation();
  emit('resizeStart', event, bandIndex, elementIndex, parentFrameIndex);
  isResizing.value = true;
};

// 调整大小结束事件
const handleResizeEnd = () => {
  isResizing.value = false;
  emit('resizeEnd');
};
</script>

<style scoped>
.design-element {
  overflow: hidden;
}

.table-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-collapse: collapse;
}

.table-header,
.column-header,
.detail-row,
.column-footer,
.table-footer {
  display: flex;
  height: 30px;
  border-bottom: 1px solid #ccc;
}

.table-header {
  background-color: #f0f0f0;
}

.column-header {
  background-color: #e6e6e6;
}

.detail-row {
  background-color: #ffffff;
}

.column-footer {
  background-color: #e6e6e6;
  font-style: italic;
}

.table-footer {
  background-color: #f0f0f0;
  font-weight: bold;
}

.table-column {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #ccc;
  box-sizing: border-box;
}

.table-column:last-child {
  border-right: none;
}

.table-header-cell {
  font-weight: bold;
  color: #006699;
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-content.empty {
  color: #999;
  font-style: italic;
}

.static-text {
  color: #333;
}

.text-field {
  color: #0066cc;
  font-family: monospace;
}

.column-name {
  color: #333;
  font-weight: 500;
}

/* 列顺序控制按钮样式 */
.table-column {
  position: relative;
  overflow: visible; /* Ensure buttons are not clipped */
}

.order-button {
  width: 7px;
  height: 7px;
  background-color: rgba(64, 158, 255, 0.85);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.15);
}

.order-button:hover {
  background-color: rgba(64, 158, 255, 1);
}

.order-button:active {
  background-color: rgba(44, 138, 235, 1);
}

/* Position buttons inside the column, on opposite sides */
.left-button {
  position: absolute;
  left: 1px;
  top: 50%;
  transform: translateY(-50%);
}

.right-button {
  position: absolute;
  right: 1px;
  top: 50%;
  transform: translateY(-50%);
}

/* Ensure cells have enough padding to accommodate the buttons */
.cell-content {
  padding: 0 12px;
}

/* Ensure the buttons are not clipped by parent elements */
.design-element {
  overflow: visible !important;
}

.table-content {
  overflow: visible !important;
}
</style>