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
        @click="joinSelectedColumnsToExistingGroup"
        :disabled="selectedColumns.length < 1"
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
      <table class="designer-table">
        <!-- 表格头部区域 -->
        <thead>
          <!-- 表格头部 -->
          <template v-if="hasTableHeader && tableHeaderHeight > 0">
            <template v-if="hasColumnGroups">
              <!-- 直接渲染分组生成的行，不添加外层tr -->
              <render-column-group 
            :group="rootGroup" 
            :level="0" 
            :type="'tableHeader'"
            @column-click="handleRenderColumnClick"
          />
            </template>
            <template v-else>
              <!-- 普通列的表头 -->
              <tr class="table-header" :style="{ height: `${tableHeaderHeight}px` }">
                <n-tooltip 
                  v-for="(column, index) in columns" 
                  :key="column.uuid"
                  placement="top"
                  trigger="hover"
                >
                  <template #trigger>
                    <th 
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
                    </th>
                  </template>
                  <template #default>
                    Width: {{ column.width }}px
                  </template>
                </n-tooltip>
              </tr>
            </template>
          </template>
          <!-- 列头部 -->
          <template v-if="hasColumnHeaderGroups && columnHeaderHeight > 0">
            <!-- 直接渲染分组生成的行，不添加外层tr -->
            <render-column-group 
            :group="rootGroup" 
            :level="0" 
            :type="'columnHeader'"
            @column-click="handleRenderColumnClick"
          />
          </template>
          <template v-else-if="columnHeaderHeight > 0">
            <!-- 普通列的列头 -->
            <tr class="column-header" :style="{ height: `${columnHeaderHeight}px` }">
              <n-tooltip 
                  v-for="(column, index) in columns" 
                  :key="column.uuid"
                  placement="top"
                  trigger="hover"
                >
                  <template #trigger>
                    <th 
                      :style="{ width: `${column.width}px` }"
                      class="table-column column-header-cell"
                      :class="{ 'column-selected': isColumnSelected(index) }"
                      @click.stop="handleColumnClick(index, $event)"
                      @contextmenu.stop="handleColumnContextMenu(index, $event)"
                    >
                      <div class="cell-content" :style="getColumnHeaderStyle(column)">
                        <!-- 渲染列头内容，从columnHeader获取实际的静态文本或动态文本表达式 -->
                        <template v-if="column.columnHeader">
                          <template v-if="column.columnHeader.type === 'staticText'">
                            <div class="static-text">{{ column.columnHeader.text || '' }}</div>
                          </template>
                          <template v-else-if="column.columnHeader.type === 'textField'">
                            <div class="text-field">{{ column.columnHeader.expression || '' }}</div>
                          </template>
                          <template v-else>
                            <div class="column-name">{{ column.name }}</div>
                          </template>
                        </template>
                        <template v-else>
                          <div class="column-name">{{ column.name }}</div>
                        </template>
                      </div>
                    </th>
                  </template>
                  <template #default>
                    Width: {{ column.width }}px
                  </template>
                </n-tooltip>
            </tr>
          </template>
          
        </thead>
        <!-- 表格主体区域 -->
        <tbody>
          <!-- 详情行 -->
          <tr v-if="detailCellHeight > 0" class="detail-row" :style="{ height: `${detailCellHeight}px` }">
            <n-tooltip 
              v-for="(column, index) in columns" 
              :key="column.uuid"
              placement="top"
              trigger="hover"
            >
              <template #trigger>
                <td 
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
                </td>
              </template>
              <template #default>
                Width: {{ column.width }}px
              </template>
            </n-tooltip>
          </tr>
        </tbody>
        <!-- 表格尾部区域 -->
        <tfoot>
          <!-- 列尾 -->
          <tr v-if="columnFooterHeight > 0 && columns.some(column => column.columnFooter && (column.columnFooter.type === 'textField' && (column.columnFooter as TextFieldElement).expression || column.columnFooter.type === 'staticText'))" class="column-footer" :style="{ height: `${columnFooterHeight}px` }">
            <n-tooltip 
              v-for="(column, index) in columns" 
              :key="column.uuid"
              placement="top"
              trigger="hover"
            >
              <template #trigger>
                <td 
                  :style="{ width: `${column.width}px` }"
                  class="table-column column-footer-cell"
                  :class="{ 'column-selected': isColumnSelected(index) }"
                  @click.stop="handleColumnClick(index, $event)"
                  @contextmenu.stop="handleColumnContextMenu(index, $event)"
                >
                  <div v-if="column.columnFooter" class="cell-content" :style="getCellStyle(column.columnFooter)">
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
                </td>
              </template>
              <template #default>
                Width: {{ column.width }}px
              </template>
            </n-tooltip>
          </tr>
          <!-- 表格表尾 -->
          <tr v-if="tableFooterHeight > 0 && columns.some(column => column.tableFooter && (column.tableFooter.type === 'textField' && (column.tableFooter as TextFieldElement).expression || column.tableFooter.type === 'staticText'))" class="table-footer" :style="{ height: `${tableFooterHeight}px` }">
            <n-tooltip 
              v-for="(column, index) in columns" 
              :key="column.uuid"
              placement="top"
              trigger="hover"
            >
              <template #trigger>
                <td 
                  :style="{ width: `${column.width}px` }"
                  class="table-column table-footer-cell"
                  :class="{ 'column-selected': isColumnSelected(index) }"
                  @click.stop="handleColumnClick(index, $event)"
                  @contextmenu.stop="handleColumnContextMenu(index, $event)"
                >
                  <div v-if="column.tableFooter" class="cell-content" :style="getCellStyle(column.tableFooter)">
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
                </td>
              </template>
              <template #default>
                Width: {{ column.width }}px
              </template>
            </n-tooltip>
          </tr>
        </tfoot>
      </table>
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
import { NButton, NTooltip } from 'naive-ui';
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
  joinColumnsToExistingGroup: [elementIndex: number, columnIndices: number[], bandIndex: number, parentFrameIndex: number | undefined];


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



// 计算元素是否被选中，与BaseElement保持一致的逻辑
const isSelected = computed(() => {
  // 2. 降级到索引比较（辅助函数：将 undefined 视为 -1 进行比较）
  const getPFI = (pfi: number | undefined) => pfi === undefined ? -1 : pfi;
  const currentPFI = getPFI(props.parentFrameIndex);

  // 检查是否在多选列表中
  if (props.selectedElements && props.selectedElements.length > 0) {
    return props.selectedElements.some(
      el => el.bandIndex === props.bandIndex && 
            el.elementIndex === props.elementIndex && 
            getPFI(el.parentFrameIndex) === currentPFI
    );
  }
  
  // 单选逻辑
  return props.selectedElement && 
         props.selectedElement.bandIndex === props.bandIndex && 
         props.selectedElement.elementIndex === props.elementIndex &&
         getPFI(props.selectedElement.parentFrameIndex) === currentPFI;
});

// 判断列是否被选中
function isColumnSelected(index: number): boolean {
  return selectedColumns.value.includes(index);
}

// 处理选择事件
const handleSelect = (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => {
  emit('select', bandIndex, elementIndex, isMultiSelect || false, parentFrameIndex);
};

// 处理RenderColumnGroup组件的点击事件
const handleRenderColumnClick = (column: any, event: MouseEvent) => {
  // 直接触发表格元素的选择事件
  emit('select', props.bandIndex, props.elementIndex, false, props.parentFrameIndex);
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
    // 多选模式下，阻止事件冒泡，保持列选中状态
    event.stopPropagation();
  } else {
    // 单选模式：只选中当前列
    selectedColumns.value = [index];
    // 单选模式下，允许事件冒泡，触发表格元素选中
    // event.stopPropagation(); // 移除阻止冒泡，让BaseElement处理选择
    // 直接触发表格元素的选择事件
    emit('select', props.bandIndex, props.elementIndex, false, props.parentFrameIndex);
  }
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

// 将选中的列加入现有组
function joinSelectedColumnsToExistingGroup() {
  if (selectedColumns.value.length < 1) return;
  
  // Emit event to parent component with correct parameter order
  emit('joinColumnsToExistingGroup', props.elementIndex, selectedColumns.value, props.bandIndex, props.parentFrameIndex);
}

// 获取单元格样式
function getCellStyle(cell: any) {
  if (!cell) return {};
  
  const styles: any = {};
  
  // 文本样式
  if (cell.fontSize) {
    styles.fontSize = `${cell.fontSize}px`;
  } else {
    // 默认字体大小10，与JasperReport Studio一致
    styles.fontSize = '10px';
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
  if (cell.mode === 'Opaque' && cell.backcolor) {
    styles.backgroundColor = cell.backcolor;
  }
  
  // 文本对齐方式 - 由于cell-content使用flex布局，需要设置justify-content
  if (cell.textAlignment) {
    const align = cell.textAlignment.toLowerCase();
    switch (align) {
      case 'left':
        styles.justifyContent = 'flex-start';
        break;
      case 'center':
        styles.justifyContent = 'center';
        break;
      case 'right':
        styles.justifyContent = 'flex-end';
        break;
      case 'justified':
        styles.justifyContent = 'space-between';
        break;
      default:
        styles.justifyContent = 'center';
    }
  }
  // 垂直对齐方式 - 由于cell-content使用flex布局，需要设置align-items
  if (cell.verticalAlignment) {
    const align = cell.verticalAlignment.toLowerCase();
    switch (align) {
      case 'top':
        styles.alignItems = 'flex-start';
        break;
      case 'middle':
        styles.alignItems = 'center';
        break;
      case 'bottom':
        styles.alignItems = 'flex-end';
        break;
      default:
        styles.alignItems = 'center';
    }
  }
  
  // 边框样式 - 优先从box对象获取，否则从根级别获取
  let borderWidth = 0;
  let borderStyle = 'solid';
  let borderColor = '#000000';
  
  if (cell.box && cell.box.pen) {
    borderWidth = cell.box.pen.lineWidth || 0;
    borderStyle = cell.box.pen.lineStyle || 'solid';
    borderColor = cell.box.pen.lineColor || '#000000';
  } else {
    borderWidth = cell.borderWidth || 0;
    borderStyle = cell.borderStyle || 'solid';
    borderColor = cell.borderColor || '#000000';
  }
  
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

// 检查是否有列分组（用于Table Header）
const hasTableHeaderGroups = computed(() => {
  return tableElement.value.children && 
         tableElement.value.children.length > 0 &&
         tableElement.value.children.some(child => (child as any).children && (child as any).children.length > 0);
});

// 检查是否有列分组（用于Column Header）
const hasColumnHeaderGroups = computed(() => {
  // 只有当列分组实际定义了columnHeader时，才渲染为分组
  const hasGroups = tableElement.value.children && 
                   tableElement.value.children.length > 0 &&
                   tableElement.value.children.some(child => (child as any).children && (child as any).children.length > 0);
  
  if (!hasGroups) return false;
  
  // 检查是否有任何列分组实际定义了columnHeader
  const checkHasColumnHeader = (group: any): boolean => {
    if (group.columnHeader) return true;
    if (group.children) {
      return group.children.some((child: any) => {
        if (child.children) {
          return checkHasColumnHeader(child);
        } else {
          return child.columnHeader;
        }
      });
    }
    return false;
  };
  
  return tableElement.value.children!.some((child: any) => {
    if (child.children) {
      return checkHasColumnHeader(child);
    }
    return child.columnHeader;
  });
});

// 统一的列分组检查，根据上下文使用不同的判断
const hasColumnGroups = computed(() => {
  // 默认使用Table Header的判断，实际使用时根据上下文决定
  return hasTableHeaderGroups.value;
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

// 计算行高
const tableHeaderHeight = computed(() => {
  if (columns.value.length === 0) return 30;
  const firstColumn = columns.value[0];
  if (!firstColumn) return 30;
  return firstColumn.tableHeader?.height || 30;
});

const columnHeaderHeight = computed(() => {
  if (columns.value.length === 0) return 30;
  const firstColumn = columns.value[0];
  if (!firstColumn) return 30;
  return firstColumn.columnHeader?.height || 30;
});

const detailCellHeight = computed(() => {
  if (columns.value.length === 0) return 30;
  const firstColumn = columns.value[0];
  if (!firstColumn) return 30;
  return firstColumn.detailCell?.height || 30;
});

const columnFooterHeight = computed(() => {
  if (columns.value.length === 0) return 30;
  const firstColumn = columns.value[0];
  if (!firstColumn) return 30;
  return firstColumn.columnFooter?.height || 30;
});

const tableFooterHeight = computed(() => {
  if (columns.value.length === 0) return 30;
  const firstColumn = columns.value[0];
  if (!firstColumn) return 30;
  return firstColumn.tableFooter?.height || 30;
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


.table-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.designer-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.table-header,
.column-header,
.detail-row,
.column-footer,
.table-footer {
  height: 30px;
}

.table-column {
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  padding: 0;
  margin: 0;
  border: 1px solid transparent;
}

.table-column.th,
.table-column.td {
  padding: 0;
  margin: 0;
  border: 1px solid transparent;
}

.designer-table th,
.designer-table td {
  padding: 0;
  margin: 0;
  border: 1px solid transparent;
  box-sizing: border-box;
  overflow: visible;
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
  overflow: hidden;
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