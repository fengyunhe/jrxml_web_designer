<template>
  <div class="table-element-container">
    <!-- 列右键菜单 -->
    <div 
      v-if="showColumnContextMenu" 
      class="column-context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click.stop
    >
      <div 
        class="menu-item"
        @click="addSelectedColumnsToGroup"
        :disabled="selectedColumns.length < 2"
      >
        {{ t('properties.addColumnsToGroup') }}
      </div>
    </div>
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
      <div v-if="hasTableHeader" class="table-header">
        <template v-if="hasColumnGroups">
          <render-column-group 
            :group="rootGroup" 
            :level="0" 
            :type="'tableHeader'"
          />
        </template>
        <template v-else>
          <div 
            v-for="(column, index) in columns" 
            :key="column.uuid"
            :style="{ width: `${column.width}px` }"
            class="table-column table-header-cell"
            :class="{ 'column-selected': isColumnSelected(index) }"
            @click.stop="handleColumnClick(index, $event)"
            @contextmenu.stop="handleColumnContextMenu(index, $event)"
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
            
            <div v-if="column.hasTableHeader && column.tableHeader" class="cell-content" :style="getCellStyle(column.tableHeader)">
              <!-- 渲染表头内容 -->
              <template v-if="column.tableHeader.type === 'staticText'">
                <div class="static-text">{{ column.tableHeader.text }}</div>
              </template>
              <template v-else-if="column.tableHeader.type === 'textField'">
                <div class="text-field">{{ column.tableHeader.expression }}</div>
              </template>
            </div>
            <div v-else-if="column.hasTableHeader" class="cell-content empty">
              Table Header
            </div>
            <div v-else class="cell-content empty">
              - 
            </div>
          </div>
        </template>
      </div>
      <!-- 列头部 -->
      <div class="column-header">
        <template v-if="hasColumnGroups">
          <render-column-group 
            :group="rootGroup" 
            :level="0" 
            :type="'columnHeader'"
          />
        </template>
        <template v-else>
          <div 
            v-for="(column, index) in columns" 
            :key="column.uuid"
            :style="{ width: `${column.width}px` }"
            class="table-column column-header-cell"
            :class="{ 'column-selected': isColumnSelected(index) }"
            @click.stop="handleColumnClick(index, $event)"
            @contextmenu.stop="handleColumnContextMenu(index, $event)"
          >
            <div class="cell-content" :style="getColumnHeaderStyle(column)">
              <!-- 渲染列头内容，优先显示column.name -->
              <div class="column-name">{{ column.name }}</div>
            </div>
          </div>
        </template>
      </div>
      <!-- 详情行 -->
      <div class="detail-row">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column detail-cell"
          :class="{ 'column-selected': isColumnSelected(index) }"
          @click.stop="handleColumnClick(index, $event)"
          @contextmenu.stop="handleColumnContextMenu(index, $event)"
        >
          <div v-if="column.detailCell" class="cell-content" :style="getCellStyle(column.detailCell)">
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
      <div v-if="columns.some(column => column.columnFooter && (column.columnFooter.type === 'textField' && (column.columnFooter as TextFieldElement).expression || column.columnFooter.type === 'staticText'))" class="column-footer">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column column-footer-cell"
          :class="{ 'column-selected': isColumnSelected(index) }"
          @click.stop="handleColumnClick(index, $event)"
          @contextmenu.stop="handleColumnContextMenu(index, $event)"
        >
          <div v-if="column.columnFooter" class="cell-content">
            <!-- 渲染列尾内容 -->
            <template v-if="column.columnFooter.type === 'staticText'">
              <div class="static-text">{{ (column.columnFooter as StaticTextElement).text || '' }}</div>
            </template>
            <template v-else-if="column.columnFooter.type === 'textField'">
              <div class="text-field">{{ (column.columnFooter as TextFieldElement).expression || '' }}</div>
            </template>
          </div>
          <div v-else class="cell-content empty">
            Column Footer
          </div>
        </div>
      </div>
      <!-- 表格表尾 -->
      <div v-if="columns.some(column => column.tableFooter && (column.tableFooter.type === 'textField' && (column.tableFooter as TextFieldElement).expression || column.tableFooter.type === 'staticText'))" class="table-footer">
        <div 
          v-for="(column, index) in columns" 
          :key="column.uuid"
          :style="{ width: `${column.width}px` }"
          class="table-column table-footer-cell"
          :class="{ 'column-selected': isColumnSelected(index) }"
          @click.stop="handleColumnClick(index, $event)"
          @contextmenu.stop="handleColumnContextMenu(index, $event)"
        >
          <div v-if="column.tableFooter" class="cell-content">
            <!-- 渲染表格表尾内容 -->
            <template v-if="column.tableFooter.type === 'staticText'">
              <div class="static-text">{{ (column.tableFooter as StaticTextElement).text || '' }}</div>
            </template>
            <template v-else-if="column.tableFooter.type === 'textField'">
              <div class="text-field">{{ (column.tableFooter as TextFieldElement).expression || '' }}</div>
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
  </div>

  
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import BaseElement from './BaseElement.vue';
import SelectionBox from '../designer/SelectionBox.vue';
import RenderColumnGroup from './RenderColumnGroup.vue';

const { t } = useI18n();
import type { 
  DesignElement, 
  SelectedElementInfo, 
  EditingElementInfo, 
  TableElement as TableElementType,
  StaticTextElement,
  TextFieldElement
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
  zoomLevel?: number;
}>();

const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeEnd: [];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  moveColumn: [elementIndex: number, fromIndex: number, toIndex: number];
  addColumnsToGroup: [elementIndex: number, columnIndices: number[]];
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

// 列选中状态管理
const selectedColumns = ref<number[]>([]);

// 右键菜单状态
const showColumnContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// 计算元素是否被选中
const isSelected = computed(() => {
  return props.selectedElement?.bandIndex === props.bandIndex &&
         props.selectedElement?.elementIndex === props.elementIndex &&
         props.selectedElement?.parentFrameIndex === props.parentFrameIndex;
});

// 判断列是否被选中
function isColumnSelected(index: number): boolean {
  return selectedColumns.value.includes(index);
}

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

// 处理列点击事件，支持多选
function handleColumnClick(index: number, event: MouseEvent) {
  const isMultiSelect = event.ctrlKey || event.shiftKey || event.metaKey;
  
  if (isMultiSelect) {
    // 多选模式：切换列选中状态
    if (selectedColumns.value.includes(index)) {
      // 取消选中
      selectedColumns.value = selectedColumns.value.filter(colIndex => colIndex !== index);
    } else {
      // 添加选中
      selectedColumns.value.push(index);
      // 保持选中索引有序
      selectedColumns.value.sort((a, b) => a - b);
    }
  } else {
    // 单选模式：只选中当前列
    selectedColumns.value = [index];
  }
  
  event.stopPropagation();
}

// 处理列右键菜单事件
function handleColumnContextMenu(index: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  // 如果当前列没有被选中，添加到选中列表
  if (!selectedColumns.value.includes(index)) {
    selectedColumns.value = [index];
  }
  
  // 获取table-element-container元素
  const container = (event.currentTarget as HTMLElement)?.closest('.table-element-container');
  if (container) {
    // 获取容器的位置信息
    const rect = container.getBoundingClientRect();
    
    // 获取当前缩放级别，默认为1
    const zoom = props.zoomLevel || 1;
    
    // 计算相对于容器的坐标，并考虑缩放因子
    // 由于DesignerCanvas中的纸张使用了transform: scale(${zoomLevel})来缩放，所以鼠标事件的坐标需要除以zoomLevel
    showColumnContextMenu.value = true;
    contextMenuPosition.value = {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom
    };
  }
}

// 点击页面其他地方关闭右键菜单
function handleClickOutside() {
  showColumnContextMenu.value = false;
}

// 添加点击事件监听器，点击页面其他地方关闭右键菜单
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 将选中的列加入组
function addSelectedColumnsToGroup() {
  if (selectedColumns.value.length < 2) return;
  
  // Emit event to parent component
  emit('addColumnsToGroup', props.elementIndex, selectedColumns.value);
}

// 获取单元格样式
function getCellStyle(cell: any) {
  if (!cell) return {};
  
  const styles: any = {};
  
  // 文本样式
  if (cell.fontSize) {
    styles.fontSize = `${cell.fontSize}px`;
  }
  if (cell.forecolor) {
    styles.color = cell.forecolor;
  }
  if (cell.isBold) {
    styles.fontWeight = 'bold';
  }
  if (cell.isItalic) {
    styles.fontStyle = 'italic';
  }
  if (cell.isUnderline) {
    styles.textDecoration = 'underline';
  }
  if (cell.backcolor) {
    styles.backgroundColor = cell.backcolor;
  }
  
  // 边框样式
  const borderWidth = cell.borderWidth || 0;
  const borderStyle = cell.borderStyle || 'solid';
  const borderColor = cell.borderColor || '#000000';
  
  if (borderWidth > 0) {
    styles.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
  }
  
  return styles;
};

// 获取列头样式
function getColumnHeaderStyle(column: any) {
  if (!column) return {};
  
  // 如果column.header有样式属性，使用它
  if (column.columnHeader) {
    return getCellStyle(column.columnHeader);
  }
  
  // 否则返回默认样式
  return {
    backgroundColor: '#e6e6e6',
    fontWeight: '500',
    color: '#333'
  };
};

// ===== 列分组相关功能 =====

// 检查是否有列分组
const hasColumnGroups = computed(() => {
  return tableElement.value.children && 
         tableElement.value.children.length > 0 &&
         tableElement.value.children.some(child => (child as any).children && (child as any).children.length > 0);
});

// 创建一个虚拟根分组，包含所有children
const rootGroup = computed(() => {
  return {
    children: tableElement.value.children || []
  };
});

// 检查是否有表格头部
const hasTableHeader = computed(() => {
  if (hasColumnGroups.value) {
    // 递归检查所有分组和列是否有tableHeader
    const checkHasTableHeader = (group: any): boolean => {
      if (group.children) {
        return group.children.some((child: any) => {
          if (child.children) {
            return checkHasTableHeader(child);
          } else {
            return child.hasTableHeader;
          }
        });
      }
      return false;
    };
    return checkHasTableHeader(rootGroup.value);
  } else {
    return columns.value.some(column => column.hasTableHeader);
  }
});

// 根据列UUID获取列索引
function getColumnIndex(column: any): number {
  return columns.value.findIndex(col => col.uuid === column.uuid);
}

// 获取分组单元格样式
function getGroupCellStyle(group: any, type: string) {
  if (group[type]) {
    return getCellStyle(group[type]);
  }
  // 默认样式
  return {
    backgroundColor: type === 'tableHeader' ? '#f0f0f0' : '#e6e6e6',
    fontWeight: '600',
    color: '#333'
  };
}

// 获取单元格内容样式
function getCellContentStyle(column: any, type: string) {
  if (column[type]) {
    return getCellStyle(column[type]);
  }
  if (type === 'columnHeader') {
    return {
      backgroundColor: '#e6e6e6',
      fontWeight: '500',
      color: '#333'
    };
  }
  return {};
}


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
.column-header {
  display: block;
}

.detail-row,
.column-footer,
.table-footer {
  display: flex;
  height: 30px;
  border-bottom: 1px solid #ccc;
}

.detail-row,
.column-footer,
.table-footer {
  display: flex;
  height: 30px;
}

.table-column {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
}

/* 列选中样式 */
.column-selected {
  background-color: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.5);
  box-sizing: border-box;
}

.table-column:hover {
  background-color: rgba(64, 158, 255, 0.1);
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
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  color: inherit;
  background-color: transparent;
}

.cell-content.empty {
  color: #999;
  font-style: italic;
}

.static-text,
.text-field,
.column-name {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  color: inherit;
}

.text-field {
  font-family: monospace;
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

/* 表格元素容器样式 */
.table-element-container {
  position: relative;
}

/* 右键菜单样式 */
.column-context-menu {
  position: absolute;
  z-index: 1000;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 120px;
}

.menu-item {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
}

.menu-item:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.menu-item:disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}
</style>