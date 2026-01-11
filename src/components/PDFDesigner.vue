<template>
  <div class="pdf-designer">
    <div class="designer-header">
      <h1>PDF模板设计器</h1>
      <div class="header-actions">
        <!-- 文件管理组件 -->
        <FileManager
          :current-file-name="currentFileName"
          :current-file-id="currentFileId"
          @create-new-file="createNewFile"
          @load-file="loadFile"
          @update:currentFileName="currentFileName = $event"
          @update:currentFileId="currentFileId = $event"
        />
        <span class="current-file-name">{{ currentFileName }}</span>
        
        <button @click="toggleLeftPanel" class="btn-secondary">
          {{ showLeftPanel ? '隐藏左侧面板' : '显示左侧面板' }}
        </button>
        <button @click="toggleRightPanel" class="btn-secondary">
          {{ showRightPanel ? '隐藏右侧面板' : '显示右侧面板' }}
        </button>
        <button @click="toggleBottomPanel" class="btn-secondary">
          {{ showBottomPanel ? '隐藏底部面板' : '显示底部面板' }}
        </button>
        
        <!-- 自动吸附开关 -->
        <div class="snap-toggle">
          <label>
            <input type="checkbox" v-model="enableSnapToGrid" />
            网格吸附
          </label>
          <label>
            <input type="checkbox" v-model="enableSnapToAlignment" />
            对齐线吸附
          </label>
        </div>
        
        <!-- 缩放控制组件 -->
        <ZoomControls
          :zoom-level="zoomLevel"
          :paper-width="paperWidth"
          @update:zoomLevel="zoomLevel = $event"
        />
        
        <button @click="clearLocalStorage" class="btn-secondary">清空本地数据</button>
        <button @click="generateJRXML" class="btn-primary">生成JRXML</button>
        <button @click="showReward = true" class="btn-secondary">打赏</button>
        <button @click="showHelp = true" class="btn-secondary">使用说明</button>
      </div>
    </div>
    
    <!-- 坐标显示元素 -->
      <div 
        v-if="dragCoordinates.visible" 
        class="coordinates-display"
      >
        {{ dragCoordinates.bandName }}X: {{ dragCoordinates.x }}, Y: {{ dragCoordinates.y }} (相对于Band)
      </div>
      
      <div class="designer-layout">
      <!-- 左侧元素库 -->
      <ResizablePanel 
        v-show="showLeftPanel"
        position="left"
        :initial-size="leftPanelWidth"
        :min-size="PANEL_CONSTANTS.LEFT_PANEL_MIN_WIDTH"
        :max-size="PANEL_CONSTANTS.LEFT_PANEL_MAX_WIDTH"
        :collapsible="false"
        @size-change="handleLeftPanelSizeChange"
      >
        <ElementLibrary
          :elements="elements"
          :report-fields="reportFields"
          :report-parameters="reportParameters"
          :bands="bands"
          :selected-element="selectedElement"
          @drag-start="handleDragStart"
          @element-double-click="handleElementDoubleClick"
          @select-element="selectElement"
          @add-field="handleAddField"
          @edit-field="handleEditField"
          @delete-field="handleDeleteField"
          @delete-element="handleDeleteElement"
        />
      </ResizablePanel>
      
      <!-- 中间设计区域 -->
      <DesignerCanvas
        ref="designerCanvasRef"
        :paper-width="paperWidth"
        :paper-height="paperHeight"
        :zoom-level="zoomLevel"
        :report-properties="reportProperties"
        :bands="bands"
        :selected-band-index="selectedBandIndex"
        :highlighted-band-index="highlightedBandIndex"
        :selected-element="selectedElement"
        :selected-elements="selectedElements"
        :editing-element="editingElement"
        :is-dragging-or-resizing="isDraggingOrResizing"
        :alignment-lines="alignmentLines"
        :horizontal-ruler-ticks="horizontalRulerTicks"
        :horizontal-ruler-labels="horizontalRulerLabels"
        :vertical-ruler-ticks="verticalRulerTicks"
        :vertical-ruler-labels="verticalRulerLabels"
        :is-design-area-focused="isDesignAreaFocused"
        :out-of-bounds-elements="outOfBoundsElements"
        :ui-constants="UI_CONSTANTS"
        @set-design-area-focused="setDesignAreaFocused"
        @select-band="selectBand"
        @select-element="selectElement"
        @start-dragging="startDragging"
        @start-resizing-element="startResizingElement"
        @start-editing="startEditing"
        @finish-editing="finishEditing"
        @cancel-editing="cancelEditing"
        @handle-drop="handleDrop"
        @handle-drag-over="handleDragOver"
        @handle-drag-leave="handleDragLeave"
        @start-resizing-band="startResizingBand"
        @zoom-change="handleZoomChange"
        @select-elements-in-rect="selectElementsInRect"
        @clear-selection="clearSelection"
        @check-fields="handleCheckFields"
        @contextmenu="handleElementContextMenu"
        @reset-zoom="resetZoom"
      />
      
      <!-- 右侧属性面板 -->
      <ResizablePanel 
        v-show="showRightPanel"
        position="right"
        :initial-size="propertyPanelWidth"
        :min-size="200"
        :max-size="600"
        :collapsible="false"
        @size-change="handlePropertyPanelSizeChange"
      >
        <h3>属性设置</h3>
        
        <!-- 元素属性组件 -->
        <ElementProperties
          :selected-band-index="selectedBandIndex"
          :selected-element="selectedElement"
          :bands="bands"
          :report-properties="reportProperties"
          @update:bands="bands = $event"
          @delete-element="deleteElement"
          @update-jrxml="updateJRXML"
        />
      </ResizablePanel>
    </div>
    
    <!-- 底部标签页区域 -->
    <BottomPanel
      :visible="showBottomPanel"
      :initial-height="bottomPanelHeight"
      :report-properties="reportProperties"
      :bands="bands"
      :all-band-types="allBandTypes"
      :selected-band-types="selectedBandTypes"
      :jrxml-content="jrxmlContent"
      @update:visible="showBottomPanel = $event"
      @size-change="handleBottomPanelSizeChange"
      @update:report-properties="reportProperties = $event"
      @update:selected-band-types="selectedBandTypes = $event"
      @update:jrxml-content="jrxmlContent = $event"
      @copy-jrxml="copyJRXML"
      @save-jrxml="saveJRXML"
      @regenerate-jrxml="regenerateJRXML"
      @generate-jrxml="generateJRXML"
      @band-selection-change="handleBandSelectionChange"
    />
    
    <!-- 打赏弹窗 -->
    <RewardModal v-model:visible="showReward" />
    
    <!-- 使用说明弹窗 -->
    <HelpModal v-model:visible="showHelp" />
    
    <!-- 字段管理弹窗 -->
    <FieldManagementModal 
      v-model:visible="showFieldModal" 
      :field="editingField" 
      @save="handleFieldSave" 
    />
  </div>
</template>

<script setup lang="ts">
// 定义文件接口类型
interface DesignerFile {
  id: string;
  name: string;
  content?: string;
  lastModified?: Date | string;
  createdAt?: Date | string;
}

import ResizablePanel from './panels/ResizablePanel.vue';
import DesignerCanvas from './designer/DesignerCanvas.vue';
import RewardModal from './modals/RewardModal.vue';
import HelpModal from './modals/HelpModal.vue';
import FieldManagementModal from './modals/FieldManagementModal.vue';
import BottomPanel from './panels/BottomPanel.vue';
import ElementLibrary from './ElementLibrary.vue';
import FileManager from './designer/controls/FileManager.vue';
import ZoomControls from './designer/controls/ZoomControls.vue';
import ElementProperties from './designer/properties/ElementProperties.vue';
import type {Band, BandType, DesignElement, ReportField, ReportParameter} from '../types';
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {
  BAND_CONSTANTS,
  BAND_HEIGHT_CONSTANTS,
  BAND_TYPE_CONSTANTS,
  ELEMENT_CONSTANTS,
  ELEMENT_TYPE_CONSTANTS,
  FONT_CONSTANTS,
  HISTORY_CONSTANTS,
  KEYBOARD_CONSTANTS,
  PANEL_CONSTANTS,
  REPORT_CONSTANTS,
  RULER_CONSTANTS,
  UI_CONSTANTS,
  ZOOM_CONSTANTS
} from '../constants/constants';

// 导入新创建的工具函数和常量


import {getBandDisplayName} from '../utils/bandUtils';

import {clearLocalStorage, loadFromLocalStorage, saveToLocalStorage} from '../utils/fileUtils';

// 导入元素边界验证工具
import {
  getOutOfBoundsElements
} from '../utils/elementBoundsValidator';

// 确保浏览器环境中DOMParser可用
// 移除未使用的getDOMParser函数
import {generateJRXMLContent, parseJRXMLContent} from '../utils/jrxmlGenerator';

// 导入通知管理器
import notification from '../utils/notification';

// 标签页相关
const activeTab = ref('pageSettings');

// 面板显示状态
const showLeftPanel = ref(true);
const showRightPanel = ref(true);
const showBottomPanel = ref(false);

// 属性面板宽度
const propertyPanelWidth = ref(PANEL_CONSTANTS.DEFAULT_PROPERTY_PANEL_WIDTH); // 默认宽度300px

// 左侧面板宽度
const leftPanelWidth = ref(PANEL_CONSTANTS.DEFAULT_LEFT_PANEL_WIDTH); 

// 自动吸附功能开关
const enableSnapToGrid = ref(false);
const enableSnapToAlignment = ref(true); // 默认开启对齐线吸附

// 对齐线相关状态
const alignmentLines = ref({
  horizontal: [] as number[],
  vertical: [] as number[]
});

// 缩放相关状态
const zoomLevel = ref(ZOOM_CONSTANTS.DEFAULT_ZOOM); // 默认缩放级别为100%

// DesignerCanvas组件引用
const designerCanvasRef = ref<any>(null);

// 重置缩放
function resetZoom() {
  zoomLevel.value = ZOOM_CONSTANTS.DEFAULT_ZOOM;
}

// 计算适应窗口的最佳缩放比例
function calculateOptimalZoom(): number {
  // 获取设计区域的可用大小
  const designerContainer = document.querySelector('.designer-canvas') || document.querySelector('.pdf-designer');
  if (!designerContainer) {
    return ZOOM_CONSTANTS.DEFAULT_ZOOM;
  }

  // 获取设计区域的实际可用宽度
  const availableWidth = designerContainer.clientWidth - 40; // 减去边距

  // 计算宽度的缩放比例
  const widthRatio = availableWidth / paperWidth.value;

  // 使用宽度缩放比例，确保报表宽度适应设计区域
  const optimalZoom = widthRatio * ZOOM_CONSTANTS.OPTIMAL_ZOOM_MARGIN;

  // 从预设的缩放级别中选择最接近的
  const zoomLevels = ZOOM_CONSTANTS.ZOOM_LEVELS;
  let closestZoom = zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM;
  let minDiff = Math.abs((zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM) - optimalZoom);

  for (let i = 1; i < zoomLevels.length; i++) {
    const level = zoomLevels[i];
    if (level !== undefined) {
      const diff = Math.abs(level - optimalZoom);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = level;
      }
    }
  }

  // 确保缩放比例在有效范围内
  return Math.max(ZOOM_CONSTANTS.MIN_ZOOM, Math.min(ZOOM_CONSTANTS.MAX_ZOOM, closestZoom));
}

// 处理来自DesignerCanvas的缩放变化
function handleZoomChange(delta: number) {
  // 计算新的缩放级别
  const newZoom = Math.max(ZOOM_CONSTANTS.MIN_ZOOM, Math.min(ZOOM_CONSTANTS.MAX_ZOOM, zoomLevel.value + delta));
  
  // 从预设的缩放级别中选择最接近的
  const zoomLevels = ZOOM_CONSTANTS.ZOOM_LEVELS;
  let closestZoom = zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM;
  let minDiff = Math.abs((zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM) - newZoom);
  
  for (let i = 1; i < zoomLevels.length; i++) {
    const level = zoomLevels[i];
    if (level !== undefined) {
      const diff = Math.abs(level - newZoom);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = level;
      }
    }
  }
  
  // 设置新的缩放级别
  zoomLevel.value = closestZoom;
}

// 底部面板高度
const bottomPanelHeight = ref(PANEL_CONSTANTS.DEFAULT_BOTTOM_PANEL_HEIGHT); // 默认高度400px

// JRXML内容显示
const jrxmlContent = ref('');

// 报表属性
const reportProperties = ref({
  name: 'NewReport',
  pageWidth: REPORT_CONSTANTS.DEFAULT_PAGE_WIDTH,
  pageHeight: REPORT_CONSTANTS.DEFAULT_PAGE_HEIGHT,
  leftMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  rightMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  topMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  bottomMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  defaultFont: {
    name: FONT_CONSTANTS.SANS_SERIF,
    size: REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
    isBold: false,
    isItalic: false,
    isUnderline: false
  },
  
});

// 文件管理相关状态
const showFileMenu = ref(false);
const showFileSubmenu = ref(false);
const currentFileName = ref('未命名报表');
const currentFileId = ref<string | null>(null);
const fileMenuContainer = ref<HTMLElement | null>(null);

// 文件列表相关
const files = ref<DesignerFile[]>([]);
const fileFilterText = ref('');

// 从localStorage加载文件列表
function loadFilesFromStorage() {
  try {
    const storedFiles = localStorage.getItem('pdfDesignerFiles');
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles) as DesignerFile[];
      files.value = parsedFiles.map((file: DesignerFile) => ({
        ...file,
        lastModified: new Date(file.lastModified || Date.now()),
        createdAt: new Date(file.createdAt || Date.now())
      }));
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
  }
}

// 保存文件列表到localStorage
function saveFilesToStorage() {
  try {
    localStorage.setItem('pdfDesignerFiles', JSON.stringify(files.value));
  } catch (error) {
    console.error('保存文件列表失败:', error);
  }
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  if (fileMenuContainer.value && !fileMenuContainer.value.contains(event.target as Node)) {
    showFileMenu.value = false;
    showFileSubmenu.value = false;
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function createNewFile() {
  showFileMenu.value = false;
  // 创建新文件的逻辑
  const timestamp = new Date().getTime();
  currentFileName.value = `未命名报表${timestamp}`;
  currentFileId.value = `file_${timestamp}`;
  
  // 重置报表数据
  reportProperties.value = {
    name: 'NewReport',
    pageWidth: 595,
    pageHeight: 842,
    leftMargin: 20,
    rightMargin: 20,
    topMargin: 20,
    bottomMargin: 20,
    defaultFont: {
      name: 'SansSerif',
      size: 12,
      isBold: false,
      isItalic: false,
      isUnderline: false
    }
  };
  
  bands.value = [
    { type: BAND_TYPE_CONSTANTS.TITLE as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.TITLE] || 50, elements: [] },
    { type: BAND_TYPE_CONSTANTS.PAGE_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_HEADER] || 50, elements: [] },
    { type: BAND_TYPE_CONSTANTS.COLUMN_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_HEADER] || 30, elements: [] },
    { type: BAND_TYPE_CONSTANTS.DETAIL as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.DETAIL] || 100, elements: [] },
    { type: BAND_TYPE_CONSTANTS.COLUMN_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_FOOTER] || 30, elements: [] },
    { type: BAND_TYPE_CONSTANTS.PAGE_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_FOOTER] || 40, elements: [] },
    { type: BAND_TYPE_CONSTANTS.SUMMARY as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.SUMMARY] || 60, elements: [] }
  ];
  
  // 更新selectedBandTypes以匹配新的bands
  selectedBandTypes.value = bands.value.map(band => band.type);
  
  reportFields.value = [];
  reportParameters.value = [];
  jrxmlContent.value = '';
  
  // 清除当前选中的元素
  selectedElement.value = null;
  selectedBandIndex.value = null;
}

function saveCurrentFileToStorage() {
  showFileMenu.value = false;
  // 保存当前文件到本地存储
  const fileData = saveCurrentFile();
  
  try {
    // 从localStorage获取现有文件列表
    const storedFiles = localStorage.getItem('pdfDesignerFiles');
    const files = storedFiles ? JSON.parse(storedFiles) : [];
    
    // 查找当前文件是否已存在
    const existingFileIndex = files.findIndex((file: any) => file.id === currentFileId.value);
    
    if (existingFileIndex !== -1) {
      // 更新现有文件
      files[existingFileIndex] = {
        ...files[existingFileIndex],
        content: JSON.stringify(fileData),
        lastModified: new Date().toISOString()
      };
    } else if (currentFileId.value) {
      // 添加新文件
      files.push({
        id: currentFileId.value,
        name: currentFileName.value,
        content: JSON.stringify(fileData),
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    } else {
      // 如果没有文件ID，创建一个新文件
      const newId = `file_${new Date().getTime()}`;
      currentFileId.value = newId;
      files.push({
        id: newId,
        name: currentFileName.value,
        content: JSON.stringify(fileData),
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }
    
    // 保存更新后的文件列表
    localStorage.setItem('pdfDesignerFiles', JSON.stringify(files));
    notification.success('文件保存成功');
  } catch (error) {
    console.error('保存文件失败:', error);
    notification.error('保存文件失败');
  }
}

function loadFile(fileData: any) {
  try {
    // 解析文件内容
    const fileContent = typeof fileData.content === 'string' 
      ? JSON.parse(fileData.content) 
      : fileData;
      
    // 加载文件数据到当前报表
    if (fileContent.reportProperties) {
      reportProperties.value = { ...reportProperties.value, ...fileContent.reportProperties };
    }
    
    if (fileContent.bands) {
      bands.value = fileContent.bands;
      // 更新selectedBandTypes以匹配加载的bands
      selectedBandTypes.value = fileContent.bands.map((band: Band) => band.type);
    }
    
    if (fileContent.reportFields) {
      reportFields.value = fileContent.reportFields;
    }
    
    if (fileContent.reportParameters) {
      reportParameters.value = fileContent.reportParameters;
    }
    
    if (fileContent.jrxmlContent) {
      jrxmlContent.value = fileContent.jrxmlContent;
    }
    
    // 更新当前文件信息
    currentFileName.value = fileData.name || '未命名报表';
    currentFileId.value = fileData.id || null;
    
    // 保存最后编辑的文件信息到localStorage
    if (fileData.id) {
      localStorage.setItem('pdfDesignerLastFile', JSON.stringify({
        id: fileData.id,
        name: fileData.name
      }));
    }
    
    // 清除当前选中的元素
    selectedElement.value = null;
    selectedBandIndex.value = null;
  } catch (error) {
    console.error('加载文件失败:', error);
    notification.error('文件格式不正确，无法加载');
  }
}

function saveCurrentFile() {
  // 创建bands的深拷贝，以便处理边框属性
  const processedBands = JSON.parse(JSON.stringify(bands.value));
  
  // 处理每个band中的元素，过滤掉宽度为0的边框属性
  processedBands.forEach((band: any) => {
    if (band.elements && Array.isArray(band.elements)) {
      band.elements.forEach((element: any) => {
        if (element.box) {
          // 处理新边框模型
          if (element.box.pen && element.box.pen.lineWidth <= 0) {
            delete element.box.pen;
          }
          
          // 处理各边边框
          ['topPen', 'leftPen', 'bottomPen', 'rightPen'].forEach(penType => {
            if (element.box[penType] && element.box[penType].lineWidth <= 0) {
              delete element.box[penType];
            }
          });
          
          // 如果box对象为空，则删除整个box属性
          if (Object.keys(element.box).length === 0) {
            delete element.box;
          }
        }
      });
    }
  });
  
  // 准备要保存的数据
  const fileData = {
    id: currentFileId.value,
    name: currentFileName.value,
    reportProperties: reportProperties.value,
    bands: processedBands,
    reportFields: reportFields.value,
    reportParameters: reportParameters.value,
    jrxmlContent: jrxmlContent.value,
    lastModified: new Date().toISOString()
  };
  
  // 返回文件数据
  return fileData;
}

// 可用元素
const elements = ref([
  { type: ELEMENT_TYPE_CONSTANTS.STATIC_TEXT, name: '静态文本' },
  { type: ELEMENT_TYPE_CONSTANTS.TEXT_FIELD, name: '动态文本' },
  { type: ELEMENT_TYPE_CONSTANTS.IMAGE, name: '图片' },
  { type: ELEMENT_TYPE_CONSTANTS.LINE, name: '线条' }
]);

// 定义元素接口
// 使用从types/index.ts导入的Pen和Box接口

// 使用从types/index.ts导入的接口

// 报表区域
const bands = ref<Band[]>([
  { type: BAND_TYPE_CONSTANTS.TITLE as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.TITLE] || 50, elements: [] },
  { type: BAND_TYPE_CONSTANTS.PAGE_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_HEADER] || 50, elements: [] },
  { type: BAND_TYPE_CONSTANTS.COLUMN_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_HEADER] || 30, elements: [] },
  { type: BAND_TYPE_CONSTANTS.DETAIL as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.DETAIL] || 100, elements: [] }, // 默认给detail区域100的高度
  { type: BAND_TYPE_CONSTANTS.COLUMN_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_FOOTER] || 30, elements: [] },
  { type: BAND_TYPE_CONSTANTS.PAGE_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_FOOTER] || 40, elements: [] },
  { type: BAND_TYPE_CONSTANTS.SUMMARY as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.SUMMARY] || 60, elements: [] }
]);

// 所有可能的band类型
const allBandTypes = [
  { type: BAND_TYPE_CONSTANTS.TITLE as BandType, name: '标题', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.TITLE] || 80 },
  { type: BAND_TYPE_CONSTANTS.PAGE_HEADER as BandType, name: '页眉', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_HEADER] || 50 },
  { type: BAND_TYPE_CONSTANTS.COLUMN_HEADER as BandType, name: '列标题', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_HEADER] || 30 },
  { type: BAND_TYPE_CONSTANTS.DETAIL as BandType, name: '详细数据', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.DETAIL] || 100 },
  { type: BAND_TYPE_CONSTANTS.COLUMN_FOOTER as BandType, name: '列脚', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_FOOTER] || 30 },
  { type: BAND_TYPE_CONSTANTS.PAGE_FOOTER as BandType, name: '页脚', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_FOOTER] || 40 },
  { type: BAND_TYPE_CONSTANTS.SUMMARY as BandType, name: '汇总', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.SUMMARY] || 60 },
  { type: BAND_TYPE_CONSTANTS.BACKGROUND as BandType, name: '背景', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.BACKGROUND] || 0 },
  { type: BAND_TYPE_CONSTANTS.LAST_PAGE_FOOTER as BandType, name: '末页页脚', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.LAST_PAGE_FOOTER] || 40 },
  { type: BAND_TYPE_CONSTANTS.NO_DATA as BandType, name: '无数据', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.NO_DATA] || 50 }
];

// 当前选中的band类型
const selectedBandTypes = ref<BandType[]>(bands.value.map(band => band.type));

// 数据字段
const reportFields = ref<ReportField[]>([
]);

// 报表参数
const reportParameters = ref<ReportParameter[]>([
]);

// 历史记录栈 - 用于撤销功能
interface HistoryState {
  reportProperties: typeof reportProperties.value;
  bands: typeof bands.value;
  reportFields: typeof reportFields.value;
  reportParameters: typeof reportParameters.value;
}

// 超出边界的元素
const outOfBoundsElements = ref<Array<{bandIndex: number, elementIndex: number, element: DesignElement}>>([]);

// 检查并更新超出边界的元素
function updateOutOfBoundsElements() {
  // 安全检查，确保bands和reportProperties已初始化
  if (!bands.value || !reportProperties.value) {
    console.warn('bands或reportProperties未初始化，跳过边界检查');
    return;
  }
  
  // 获取所有超出边界的元素
  const outOfBounds = getOutOfBoundsElements(bands.value, reportProperties.value);
  outOfBoundsElements.value = outOfBounds;
  
  // 如果有超出边界的元素，在控制台输出警告
  if (outOfBounds.length > 0) {
    console.warn(`发现 ${outOfBounds.length} 个超出边界的元素:`, outOfBounds);
  }
}

// 历史记录栈 - 用于撤销功能
const historyStack = ref<HistoryState[]>([]);
const redoStack = ref<HistoryState[]>([]);
const MAX_HISTORY_SIZE = HISTORY_CONSTANTS.MAX_HISTORY_SIZE; // 最大历史记录数量
const isDraggingOrResizing = ref(false); // 标记是否正在拖动或调整大小

// 保存当前状态到历史记录
function saveStateToHistory() {
  // 创建状态快照（深拷贝）
  const stateSnapshot: HistoryState = {
    reportProperties: JSON.parse(JSON.stringify(reportProperties.value)),
    bands: JSON.parse(JSON.stringify(bands.value)),
    reportFields: JSON.parse(JSON.stringify(reportFields.value)),
    reportParameters: JSON.parse(JSON.stringify(reportParameters.value))
  };
  
  // 添加到历史栈
  historyStack.value.push(stateSnapshot);
  
  // 如果历史栈超过最大限制，删除最旧的记录
  if (historyStack.value.length > MAX_HISTORY_SIZE) {
    historyStack.value.shift();
  }
  
  // 清空重做栈
  redoStack.value = [];
}

// 撤销功能
function undo() {
  if (historyStack.value.length === 0) return;
  
  // 保存当前状态到重做栈
  const currentState: HistoryState = {
    reportProperties: JSON.parse(JSON.stringify(reportProperties.value)),
    bands: JSON.parse(JSON.stringify(bands.value)),
    reportFields: JSON.parse(JSON.stringify(reportFields.value)),
    reportParameters: JSON.parse(JSON.stringify(reportParameters.value))
  };
  redoStack.value.push(currentState);
  
  // 恢复上一个状态
  const previousState = historyStack.value.pop()!;
  reportProperties.value = previousState.reportProperties;
  bands.value = previousState.bands;
  reportFields.value = previousState.reportFields;
  reportParameters.value = previousState.reportParameters;
  
  // 更新JRXML
  updateJRXML();
}

// 重做功能
function redo() {
  if (redoStack.value.length === 0) return;
  
  // 保存当前状态到历史栈
  const currentState: HistoryState = {
    reportProperties: JSON.parse(JSON.stringify(reportProperties.value)),
    bands: JSON.parse(JSON.stringify(bands.value)),
    reportFields: JSON.parse(JSON.stringify(reportFields.value)),
    reportParameters: JSON.parse(JSON.stringify(reportParameters.value))
  };
  historyStack.value.push(currentState);
  
  // 应用下一个状态
  const nextState = redoStack.value.pop()!;
  reportProperties.value = nextState.reportProperties;
  bands.value = nextState.bands;
  reportFields.value = nextState.reportFields;
  reportParameters.value = nextState.reportParameters;
  
  // 更新JRXML
  updateJRXML();
}

// 添加新参数
// 移除未使用的参数管理函数

// 选中状态
const selectedBandIndex = ref<number | null>(null);
const selectedElement = ref<{bandIndex: number, elementIndex: number} | null>(null);
const selectedElements = ref<{bandIndex: number, elementIndex: number}[]>([]); // 多选元素数组
const editingElement = ref<{bandIndex: number, elementIndex: number} | null>(null);
const editInput = ref<HTMLInputElement | null>(null);



// 报表设计区域焦点状态
const isDesignAreaFocused = ref(true); // 默认聚焦设计区域

// 设置设计区域焦点
const setDesignAreaFocused = () => {
  isDesignAreaFocused.value = true;
};

// 移除设计区域焦点
const removeDesignAreaFocused = () => {
  isDesignAreaFocused.value = false;
};

// 计算属性
const paperWidth = computed(() => reportProperties.value?.pageWidth || REPORT_CONSTANTS.DEFAULT_PAGE_WIDTH);
const paperHeight = computed(() => reportProperties.value?.pageHeight || REPORT_CONSTANTS.DEFAULT_PAGE_HEIGHT);
const currentElement = computed(() => {
  if (selectedElement.value && bands.value && Array.isArray(bands.value)) {
    const band = bands.value[selectedElement.value.bandIndex];
    if (band && band.elements && Array.isArray(band.elements)) {
      return band.elements[selectedElement.value.elementIndex];
    }
  }
  return null;
});

// 获取所有报表元素




// 按band分组的报表元素 - 暂时注释掉，因为未使用
/*
const groupedReportElements = computed(() => {
  const groups: Record<string, Array<{ element: DesignElement, bandIndex: number, elementIndex: number }>> = {};
  
  if (!filteredReportElements.value || !bands.value || !Array.isArray(bands.value)) {
    return groups;
  }
  
  filteredReportElements.value.forEach(item => {
    if (!bands.value || item.bandIndex >= bands.value.length) return;
    const band = bands.value[item.bandIndex];
    if (!band) return;
    const bandType = band.type;
    const bandName = getBandDisplayName(bandType);
    
    if (!groups[bandName]) {
      groups[bandName] = [];
    }
    
    groups[bandName].push(item);
  });
  
  return groups;
});
*/

// 标尺相关计算属性
const horizontalRulerTicks = computed(() => {
  const ticks = [];
  const width = paperWidth.value;
  const unit = RULER_CONSTANTS.UNIT_SIZE; // 减小基本单位，从10px改为5px，增加刻度密度
  
  for (let i = 0; i <= width; i += unit) {
    ticks.push({
      position: i, // 不应用缩放比例，保持实际位置
      major: i % RULER_CONSTANTS.MAJOR_TICK_INTERVAL === 0 // 每25px一个主要刻度，从50px改为25px
    });
  }
  
  return ticks;
});

const horizontalRulerLabels = computed(() => {
  const labels = [];
  const width = paperWidth.value;
  
  for (let i = 0; i <= width; i += RULER_CONSTANTS.LABEL_INTERVAL) { // 每25px显示一个标签，从50px改为25px
    labels.push({
      position: i, // 不应用缩放比例，保持实际位置
      value: i.toString()
    });
  }
  
  return labels;
});

const verticalRulerTicks = computed(() => {
  const ticks = [];
  const height = paperHeight.value;
  const unit = RULER_CONSTANTS.UNIT_SIZE; // 减小基本单位，从10px改为5px，增加刻度密度
  
  for (let i = 0; i <= height; i += unit) {
    ticks.push({
      position: i, // 不应用缩放比例，保持实际位置
      major: i % RULER_CONSTANTS.MAJOR_TICK_INTERVAL === 0 // 每25px一个主要刻度，从50px改为25px
    });
  }
  
  return ticks;
});

const verticalRulerLabels = computed(() => {
  const labels = [];
  const height = paperHeight.value;
  
  for (let i = 0; i <= height; i += RULER_CONSTANTS.LABEL_INTERVAL) { // 每25px显示一个标签，从50px改为25px
    labels.push({
      position: i, // 不应用缩放比例，保持实际位置
      value: i.toString()
    });
  }
  
  return labels;
});

// 拖拽相关
const draggingInfo = ref<{bandIndex: number, elementIndex: number, startX: number, startY: number, lastTargetBandIndex?: number} | null>(null);
const highlightedBandIndex = ref<number | null>(null); // 高亮显示的目标band索引
// 拖动时显示的坐标信息
const dragCoordinates = ref<{x: number, y: number, visible: boolean, bandName: string}>({ x: 0, y: 0, visible: false, bandName: '' });
// 调整大小相关
const resizingInfo = ref<{bandIndex: number, elementIndex: number, startX: number, startY: number, startWidth: number, startHeight: number} | null>(null);

// 跟踪最后点击的band
const lastClickedBandIndex = ref<number>(3); // 默认为DETAIL区域（索引3）

// 处理拖放
const handleDragStart = (event: DragEvent, element: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(element));
  }
};

// 处理元素双击事件
const handleElementDoubleClick = (element: any) => {
  // 确保有最后点击的band
  if (lastClickedBandIndex.value === null || lastClickedBandIndex.value === undefined) {
    console.warn('没有选中的band，将使用默认band');
    lastClickedBandIndex.value = 3; // 默认使用DETAIL区域
  }
  
  // 获取目标band
  const targetBand = bands.value[lastClickedBandIndex.value];
  if (!targetBand) {
    console.error('目标band不存在');
    return;
  }
  
  // 创建新元素
  const newElement: DesignElement = {
    type: element.type,
    x: 50, // 默认位置
    y: 20, // 默认位置
    width: 100,
    height: 30,
    ...getDefaultElementProperties(element.type)
  };
  
  // 确保band有elements数组
  if (!targetBand.elements) {
    targetBand.elements = [];
  }
  
  // 添加元素到目标band
  targetBand.elements.push(newElement);
  
  // 选中新添加的元素
  const newElementIndex = targetBand.elements.length - 1;
  selectElement(lastClickedBandIndex.value, newElementIndex);
  
  // 更新JRXML
  updateJRXML();
  
  console.log('元素已添加到band:', newElement);
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    const elementData = JSON.parse(event.dataTransfer.getData('application/json'));
    
    // 获取paper元素作为参考点
    const paper = document.querySelector('.paper') as HTMLElement;
    if (!paper) return;
    
    const paperRect = paper.getBoundingClientRect();
    // 计算相对于paper的坐标
    const x = event.clientX - paperRect.left;
    const y = event.clientY - paperRect.top;
    
    // 考虑缩放比例
    const currentZoom = zoomLevel.value;
    const scaledX = x / currentZoom;
    const scaledY = y / currentZoom;
    
    // 找到对应的band
    let bandIndex = 0;
    let currentY = 0;
    if (bands.value && Array.isArray(bands.value)) {
      for (let i = 0; i < bands.value.length; i++) {
        const band = bands.value[i];
        if (band && scaledY >= currentY && scaledY <= currentY + band.height) {
          bandIndex = i;
          break;
        }
        if (band) {
          currentY += band.height;
        }
      }
    }
    
    // 创建新元素
    const newElement: DesignElement = {
      type: elementData.type,
      x: Math.round(Math.max(0, scaledX - 50)), // 减去元素宽度的一半以居中，并确保为整数
      y: Math.round(Math.max(0, scaledY - currentY)), // 相对于band的位置，并确保为整数
      width: 100,
      height: 30,
      ...getDefaultElementProperties(elementData.type)
    };
    
    const targetBand = bands.value[bandIndex];
    if (targetBand && targetBand.elements) {
      // 确保元素不会超出边距限制
      // 注意：由于现在使用padding，元素坐标是相对于内容区域的
      const availableWidth = paperWidth.value - (reportProperties.value?.leftMargin || 0) - (reportProperties.value?.rightMargin || 0);
      
      // 限制元素不超出右边界
      if (newElement.x + newElement.width > availableWidth) {
        newElement.x = Math.round(availableWidth - newElement.width);
      }
      
      // 确保元素宽度不超过可用空间
      if (newElement.width > availableWidth) {
        newElement.width = Math.round(availableWidth);
      }
      
      // 确保元素不超出band高度
      if (newElement.y + newElement.height > targetBand.height) {
        newElement.y = Math.round(targetBand.height - newElement.height);
      }
      
      targetBand.elements.push(newElement);
      
      // 选中刚添加的元素
      selectElement(bandIndex, targetBand.elements.length - 1);
      
      // 更新JRXML
      updateJRXML();
    }
  }
  
  // 清除高亮状态
  highlightedBandIndex.value = null;
};

// 处理拖动过程中的视觉反馈
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  
  // 获取paper元素作为参考点
  const paper = document.querySelector('.paper') as HTMLElement;
  if (!paper) return;
  
  const paperRect = paper.getBoundingClientRect();
  // 计算相对于paper的坐标
  const y = event.clientY - paperRect.top;
  
  // 考虑缩放比例
  const currentZoom = zoomLevel.value;
  const scaledY = y / currentZoom;
  
  // 找到对应的band
  let bandIndex = -1;
  let currentY = 0;
  for (let i = 0; i < bands.value.length; i++) {
    const band = bands.value[i];
    if (band && scaledY >= currentY && scaledY <= currentY + band.height) {
      bandIndex = i;
      break;
    }
    if (band) {
      currentY += band.height;
    }
  }
  
  // 更新高亮状态
  highlightedBandIndex.value = bandIndex;
};

// 处理拖动离开事件
const handleDragLeave = (event: DragEvent) => {
  // 检查是否真的离开了paper区域
  const paper = document.querySelector('.paper') as HTMLElement;
  if (paper && !paper.contains(event.relatedTarget as Node)) {
    highlightedBandIndex.value = null;
  }
};

// 检测对齐线
const detectAlignmentLines = (currentElement: DesignElement, currentBandIndex: number, updateState: boolean = true) => {
  const threshold = 3; // 对齐阈值，像素 - 减小阈值使吸附更精确
  const verticalAlignmentLines: number[] = []; // 垂直对齐线（X坐标）
  const horizontalAlignmentLines: number[] = []; // 水平对齐线（Y坐标）
  
  // 用于存储吸附信息的对象
  const snapInfo = {
    horizontal: null as { position: number; offset: number } | null,
    vertical: null as { position: number; offset: number } | null
  };
  
  // 获取页边距
  const { leftMargin = 0, topMargin = 0 } = reportProperties.value || {};
  
  // 计算当前band的Y坐标偏移
  let currentBandY = 0;
  const bandSpacing = BAND_CONSTANTS.SPACING; // band之间的间距，与DesignerCanvas.vue中的margin-bottom一致
  for (let i = 0; i < currentBandIndex; i++) {
    currentBandY += bands.value[i]?.height || 0;
    if (i < currentBandIndex - 1) {
      currentBandY += bandSpacing; // 只在band之间添加间距，不在最后一个band后添加
    }
  }
  
  // 获取当前元素的边界
  const currentLeft = currentElement.x;
  const currentRight = currentElement.x + currentElement.width;
  const currentTop = currentElement.y;
  const currentBottom = currentElement.y + currentElement.height;
  const currentCenterX = currentElement.x + currentElement.width / 2;
  const currentCenterY = currentElement.y + currentElement.height / 2;
  
  // 遍历所有band和元素，检测对齐关系
  let bandOffsetY = 0;
  bands.value.forEach((band, bandIndex) => {
    band.elements.forEach((element, _elementIndex) => {
      // 跳过当前元素
      if (bandIndex === currentBandIndex && element === currentElement) return;
      
      // 获取其他元素的边界
      const otherLeft = element.x;
      const otherRight = element.x + element.width;
      const otherTop = element.y;
      const otherBottom = element.y + element.height;
      const otherCenterX = element.x + element.width / 2;
      const otherCenterY = element.y + element.height / 2;
      
      // 检测垂直对齐线（左右对齐）
      // 左边对齐
      if (Math.abs(currentLeft - otherLeft) < threshold) {
        const linePosition = otherLeft + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentLeft - otherLeft) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherLeft - currentLeft
          };
        }
      }
      // 右边对齐
      if (Math.abs(currentRight - otherRight) < threshold) {
        const linePosition = otherRight + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentRight - otherRight) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherRight - currentRight
          };
        }
      }
      // 中心对齐
      if (Math.abs(currentCenterX - otherCenterX) < threshold) {
        const linePosition = otherCenterX + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentCenterX - otherCenterX) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherCenterX - currentCenterX
          };
        }
      }
      // 左边对齐到其他元素的右边
      if (Math.abs(currentLeft - otherRight) < threshold) {
        const linePosition = otherRight + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentLeft - otherRight) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherRight - currentLeft
          };
        }
      }
      // 右边对齐到其他元素的左边
      if (Math.abs(currentRight - otherLeft) < threshold) {
        const linePosition = otherLeft + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentRight - otherLeft) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherLeft - currentRight
          };
        }
      }
      
      // 检测水平对齐线（上下对齐）
      // 对于相同band中的元素，进行完整的对齐检测和吸附
      if (bandIndex === currentBandIndex) {
        // 顶部对齐
        if (Math.abs(currentTop - otherTop) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherTop + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentTop - otherTop) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherTop - currentTop
            };
          }
        }
        // 底部对齐
        if (Math.abs(currentBottom - otherBottom) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherBottom + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentBottom - otherBottom) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherBottom - currentBottom
            };
          }
        }
        // 中心对齐
        if (Math.abs(currentCenterY - otherCenterY) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherCenterY + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentCenterY - otherCenterY) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherCenterY - currentCenterY
            };
          }
        }
        // 顶部对齐到其他元素的底部
        if (Math.abs(currentTop - otherBottom) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherBottom + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentTop - otherBottom) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherBottom - currentTop
            };
          }
        }
        // 底部对齐到其他元素的顶部
        if (Math.abs(currentBottom - otherTop) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherTop + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentBottom - otherTop) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherTop - currentBottom
            };
          }
        }
      }
      // 对于不同band中的元素，只显示参考线但不进行吸附
      else {
        // 只有当鼠标悬浮在目标band中时，才检测横向对齐线
        // 使用highlightedBandIndex来判断当前鼠标悬浮的band
        if (highlightedBandIndex.value === bandIndex) {
          // 计算当前元素相对于目标band的Y坐标
          // 获取当前元素所在band和目标band的Y坐标偏移差
          let sourceBandOffsetY = 0;
          let targetBandOffsetY = 0;
          
          // 计算源band的Y坐标偏移
          for (let i = 0; i < currentBandIndex; i++) {
            sourceBandOffsetY += bands.value[i]?.height || 0;
            if (i < currentBandIndex - 1) {
              sourceBandOffsetY += bandSpacing;
            }
          }
          
          // 计算目标band的Y坐标偏移
          for (let i = 0; i < bandIndex; i++) {
            targetBandOffsetY += bands.value[i]?.height || 0;
            if (i < bandIndex - 1) {
              targetBandOffsetY += bandSpacing;
            }
          }
          
          // 计算当前元素相对于目标band的Y坐标
          const relativeY = currentTop + (sourceBandOffsetY - targetBandOffsetY);
          const relativeBottom = currentBottom + (sourceBandOffsetY - targetBandOffsetY);
          const relativeCenterY = currentCenterY + (sourceBandOffsetY - targetBandOffsetY);
          
          // 顶部对齐
          if (Math.abs(relativeY - otherTop) < threshold) {
            // 添加目标band的Y坐标偏移到参考线位置
            const linePosition = otherTop + topMargin + targetBandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
          // 底部对齐
          if (Math.abs(relativeBottom - otherBottom) < threshold) {
            // 添加目标band的Y坐标偏移到参考线位置
            const linePosition = otherBottom + topMargin + targetBandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
          // 中心对齐
          if (Math.abs(relativeCenterY - otherCenterY) < threshold) {
            // 添加目标band的Y坐标偏移到参考线位置
            const linePosition = otherCenterY + topMargin + targetBandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
          // 顶部对齐到其他元素的底部
          if (Math.abs(relativeY - otherBottom) < threshold) {
            // 添加目标band的Y坐标偏移到参考线位置
            const linePosition = otherBottom + topMargin + targetBandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
          // 底部对齐到其他元素的顶部
          if (Math.abs(relativeBottom - otherTop) < threshold) {
            // 添加目标band的Y坐标偏移到参考线位置
            const linePosition = otherTop + topMargin + targetBandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
        }
      }
    });
    
    // 更新band的Y坐标偏移，考虑band之间的间距
    bandOffsetY += band.height + bandSpacing;
  });
  
  // 更新对齐线状态
  if (updateState) {
    alignmentLines.value = {
      horizontal: [...new Set(horizontalAlignmentLines)], // 水平对齐线（Y坐标）
      vertical: [...new Set(verticalAlignmentLines)] // 垂直对齐线（X坐标）
    };
  }
  
  // 返回吸附信息
  return snapInfo;
};

// 清除对齐线
const clearAlignmentLines = () => {
  alignmentLines.value = {
    horizontal: [],
    vertical: []
  };
};
const getDefaultElementProperties = (type: string): Partial<DesignElement> => {
  // 使用报表的默认字体设置
  const defaultFontProps = {
    fontFamily: reportProperties.value?.defaultFont?.name || FONT_CONSTANTS.SANS_SERIF,
    fontSize: reportProperties.value?.defaultFont?.size || REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
    isBold: reportProperties.value?.defaultFont?.isBold || false,
    isItalic: reportProperties.value?.defaultFont?.isItalic || false,
    isUnderline: reportProperties.value?.defaultFont?.isUnderline || false
  };
  
  switch (type) {
    case 'staticText':
      return { 
        text: '静态文本', 
        ...defaultFontProps
      };
    case 'textField':
      return {
        fieldName: '', 
        expression: '',
        isStretchWithOverflow: false,
        evaluationTime: 'Now',
        pattern: '',
        isBlankWhenNull: false,
        ...defaultFontProps,
        textAlignment: 'Left',
        verticalAlignment: 'Top'
      };
    case 'image':
      return { imagePath: '' };
    case 'line':
      return { lineDirection: 'TopDown', lineWidth: 1 };
    case 'rectangle':
      return { 
        backcolor: '#f0f0f0',
        border: '1px solid #ccc' // 为矩形元素默认添加边框
      };
    default:
      return {};
  }
};

// 选择区域
const selectBand = (index: number) => {
  selectedBandIndex.value = index;
  selectedElement.value = null;
  selectedElements.value = []; // 清空多选
  // 更新最后点击的band索引
  lastClickedBandIndex.value = index;
  // 自动隐藏底部面板
  showBottomPanel.value = false;
};

// 选择元素
const selectElement = (bandIndex: number, elementIndex: number, isMultiSelect = false) => {
  // 快速更新选中状态，避免不必要的DOM操作
  if (isMultiSelect) {
    // 多选模式
    const existingIndex = selectedElements.value.findIndex(
      el => el.bandIndex === bandIndex && el.elementIndex === elementIndex
    );
    
    if (existingIndex !== -1) {
      // 如果元素已选中，则取消选中
      selectedElements.value.splice(existingIndex, 1);
    } else {
      // 添加到多选列表
      selectedElements.value.push({ bandIndex, elementIndex });
    }
    
    // 如果没有选中任何元素，则清空selectedElement
    if (selectedElements.value.length === 0) {
      selectedElement.value = null;
    } else {
      // 将最后一个选中的元素作为当前选中的元素
      const lastSelected = selectedElements.value[selectedElements.value.length - 1];
      if (lastSelected) {
        selectedElement.value = { bandIndex: lastSelected.bandIndex, elementIndex: lastSelected.elementIndex };
      }
    }
  } else {
    // 单选模式
    selectedElement.value = { bandIndex, elementIndex };
    selectedElements.value = [{ bandIndex, elementIndex }]; // 清空多选列表，只保留当前选中的元素
  }
  
  selectedBandIndex.value = null;
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  // 确保元素有box属性，如果没有则初始化
  const band = bands.value[bandIndex];
  const element = band?.elements[elementIndex];
  
  if (element && !element.box) {
    // 使用initBox函数初始化box属性
    initBox();
  }
  
  // 移除了昂贵的DOM查询和动画效果，通过Vue的响应式系统和CSS类来管理选择状态
};

// 清空所有选择
const clearSelection = () => {
  selectedElement.value = null;
  selectedElements.value = [];
  selectedBandIndex.value = null;
};

// 框选元素
const selectElementsInRect = (rect: { left: number, top: number, right: number, bottom: number }) => {
  // 清空当前选择
  selectedElements.value = [];
  selectedElement.value = null;
  
  // 计算band的累积高度，用于将绝对坐标转换为相对于band的坐标
  // 初始偏移量需要考虑上边距
  let bandOffsetY = reportProperties.value?.topMargin || 0;
  
  // 遍历所有band和元素，检查是否在框选区域内
  bands.value.forEach((band, bandIndex) => {
    // 检查当前band是否与框选区域有重叠
    const bandTop = bandOffsetY;
    const bandBottom = bandOffsetY + band.height;
    
    // 如果band与框选区域没有重叠，跳过
    if (bandBottom < rect.top || bandTop > rect.bottom) {
      bandOffsetY += band.height;
      return;
    }
    
    // 遍历当前band中的所有元素
    band.elements.forEach((element, elementIndex) => {
      // 计算元素在画布上的绝对位置
      // 元素的X坐标需要考虑左边距
      const elementLeft = (reportProperties.value?.leftMargin || 0) + element.x;
      const elementTop = bandOffsetY + element.y;
      const elementRight = elementLeft + element.width;
      const elementBottom = elementTop + element.height;
      
      // 检查元素是否与框选区域有重叠
      const isOverlapping = !(
        elementRight < rect.left || 
        elementLeft > rect.right || 
        elementBottom < rect.top || 
        elementTop > rect.bottom
      );
      
      // 如果有重叠，添加到选择列表
      if (isOverlapping) {
        selectedElements.value.push({ bandIndex, elementIndex });
      }
    });
    
    // 更新band的Y坐标偏移
    bandOffsetY += band.height;
  });
  
  // 如果有选中的元素，将最后一个选中的元素作为当前选中的元素
  if (selectedElements.value.length > 0) {
    const lastSelected = selectedElements.value[selectedElements.value.length - 1];
    if (lastSelected) {
      selectedElement.value = { bandIndex: lastSelected.bandIndex, elementIndex: lastSelected.elementIndex };
    }
  }
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
};

// 缓存事件处理函数，避免重复创建
let cachedMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let cachedMouseUpHandler: ((e: MouseEvent) => void) | null = null;

// 开始拖拽元素
const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  event.stopPropagation();
  selectElement(bandIndex, elementIndex);
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const band = bands.value[bandIndex];
  const draggedElement = band?.elements[elementIndex];
  
  if (draggedElement) {
    // 获取当前缩放比例
    const currentZoom = zoomLevel.value;
    
    // 获取paper元素的位置信息，用于更准确的坐标计算
    const paperEl = document.querySelector('.paper') as HTMLElement;
    let paperOffsetX = 0;
    let paperOffsetY = 0;
    
    if (paperEl) {
      const paperRect = paperEl.getBoundingClientRect();
      // 考虑缩放比例的偏移量
      paperOffsetX = paperRect.left;
      paperOffsetY = paperRect.top;
    }
    
    // 存储拖拽信息，考虑缩放比例
    draggingInfo.value = {
      bandIndex,
      elementIndex,
      startX: ((event.clientX - paperOffsetX) / currentZoom) - draggedElement.x,
      startY: ((event.clientY - paperOffsetY) / currentZoom) - draggedElement.y,
      lastTargetBandIndex: bandIndex // 初始化为当前band索引
    };
    
    isDraggingOrResizing.value = true;
    
    // 使用缓存的事件处理函数，避免每次拖拽都创建新的函数
    if (!cachedMouseMoveHandler) {
      cachedMouseMoveHandler = (e: MouseEvent) => {
        if (draggingInfo.value) {
          const currentBand = bands.value[draggingInfo.value.bandIndex];
          const currentElement = currentBand?.elements[draggingInfo.value.elementIndex];
          
          if (currentBand && currentElement) {
            // 获取当前缩放比例
            const currentZoom = zoomLevel.value;
            
            // 计算元素相对于paper的位置，考虑缩放比例
            // 注意：由于现在使用padding，元素坐标是相对于内容区域的
            // 计算可用宽度，不除以currentZoom因为newX计算已经考虑了缩放
            const availableWidth = (paperWidth.value - (reportProperties.value?.leftMargin || 0) - (reportProperties.value?.rightMargin || 0));
            
            // 获取paper元素的位置信息，用于更准确的坐标计算
            let paperOffsetX = 0;
            let paperOffsetY = 0;
            const paperEl = document.querySelector('.paper') as HTMLElement;
            
            if (paperEl) {
              const paperRect = paperEl.getBoundingClientRect();
              // 考虑缩放比例的偏移量
              paperOffsetX = paperRect.left;
              paperOffsetY = paperRect.top;
            }
            
            // 计算新的X和Y坐标，考虑缩放和偏移
            let newX = Math.max(0, Math.min(((e.clientX - paperOffsetX) / currentZoom) - draggingInfo.value.startX, availableWidth - currentElement.width));
            let newY = ((e.clientY - paperOffsetY) / currentZoom) - draggingInfo.value.startY; // 移除y坐标的下限限制
            
            // 获取第一个band和最后一个band的位置信息
            const firstBandElement = document.querySelectorAll('.band')[0] as HTMLElement;
            const lastBandElement = document.querySelectorAll('.band')[bands.value.length - 1] as HTMLElement;
            
            // 计算当前band在页面中的位置
            const currentBandElement = document.querySelectorAll('.band')[draggingInfo.value.bandIndex] as HTMLElement;
            let currentBandTopInPage = 0;
            
            if (firstBandElement && lastBandElement && currentBandElement && paperEl) {
              const firstBandRect = firstBandElement.getBoundingClientRect();
              const lastBandRect = lastBandElement.getBoundingClientRect();
              const currentBandRect = currentBandElement.getBoundingClientRect();
              const paperRect = paperEl.getBoundingClientRect();
              
              // 计算第一个band和最后一个band相对于页面的位置
              const firstBandTopInPage = (firstBandRect.top - paperRect.top) / currentZoom;
              const lastBandBottomInPage = (lastBandRect.bottom - paperRect.top) / currentZoom;
              currentBandTopInPage = (currentBandRect.top - paperRect.top) / currentZoom;
              
              // 计算元素在页面中的绝对位置（相对于整个页面）
              const elementTopInPage = currentBandTopInPage + newY;
              
              // 限制元素顶部不能超出第一个band的上边界
              if (elementTopInPage < firstBandTopInPage) {
                const adjustment = firstBandTopInPage - elementTopInPage;
                newY += adjustment;
              }
              
              // 对于最后一个band中的元素，限制其底部不能超出最后一个band的底部边界
              if (draggingInfo.value.bandIndex === bands.value.length - 1) {
                // 计算元素在最后一个band中的最大Y坐标
                const maxRelativeY = lastBandBottomInPage - currentBandTopInPage - currentElement.height;
                newY = Math.min(newY, maxRelativeY);
              }
            }
            
            // 应用自动吸附功能
            if (enableSnapToGrid.value) {
              // 定义网格大小为3像素，减小吸附距离
              const gridSize = 3;
              
              // 对X坐标进行吸附
              const remainderX = newX % gridSize;
              if (remainderX < gridSize / 2) {
                newX = newX - remainderX;
              } else {
                newX = newX + (gridSize - remainderX);
              }
              
              // 对Y坐标进行吸附
              const remainderY = newY % gridSize;
              if (remainderY < gridSize / 2) {
                newY = newY - remainderY;
              } else {
                newY = newY + (gridSize - remainderY);
              }
            }
            
            // 应用对齐线吸附功能
            if (enableSnapToAlignment.value) {
              // 创建临时元素对象用于检测对齐线
              const tempElement = { ...currentElement, x: newX, y: newY };
              const snapInfo = detectAlignmentLines(tempElement, draggingInfo.value.bandIndex, false);
              
              // 应用水平吸附
              if (snapInfo.horizontal) {
                newX += snapInfo.horizontal.offset;
              }
              
              // 应用垂直吸附
              if (snapInfo.vertical) {
                newY += snapInfo.vertical.offset;
              }
            }
            
            // 确保坐标值为整数
            currentElement.x = Math.round(newX);
            currentElement.y = Math.round(newY);
            
            // 如果元素移动到不同的band，需要限制Y坐标不超过band高度
            if (highlightedBandIndex.value !== null && highlightedBandIndex.value !== draggingInfo.value.bandIndex) {
              const targetBand = bands.value[highlightedBandIndex.value];
              if (targetBand) {
                const maxY = targetBand.height - currentElement.height;
                // 计算元素相对于目标band的Y坐标
                const bandElements = document.querySelectorAll('.band');
                const currentBandElement = bandElements[draggingInfo.value.bandIndex] as HTMLElement;
                const targetBandElement = bandElements[highlightedBandIndex.value] as HTMLElement;
                
                if (currentBandElement && targetBandElement) {
                  const currentBandRect = currentBandElement.getBoundingClientRect();
                  const targetBandRect = targetBandElement.getBoundingClientRect();
                  const relativeY = newY + (currentBandRect.top - targetBandRect.top) / currentZoom;
                  
                  // 限制相对Y坐标
                  if (relativeY > maxY) {
                    // 调整元素的实际Y坐标
                    currentElement.y = newY - (relativeY - maxY);
                  }
                }
              }
            }
            
            // 检测对齐线（使用最终位置）
            // 使用当前元素所在的band索引，确保对齐线检测的一致性
            detectAlignmentLines(currentElement, draggingInfo.value.bandIndex);
            
            // 更新并显示坐标信息
            // 显示元素的相对坐标值
            let relativeX = Math.round(newX);
            let relativeY = Math.round(newY);
            
            // 使用已经获取的paperElement变量
            if (paperEl) {
              const bandElements = document.querySelectorAll('.band');
              
              // 计算元素在拖动过程中相对于目标band的坐标
              if (highlightedBandIndex.value !== null && bandElements[highlightedBandIndex.value]) {
                // 如果有高亮的band（表示鼠标当前所在的band），计算元素相对于这个band的坐标
                const targetBandElement = bandElements[highlightedBandIndex.value] as HTMLElement;
                const targetBandRect = targetBandElement.getBoundingClientRect();
                
                // 修复：使用元素的实际Y坐标（newY）而不是鼠标位置来计算相对Y坐标
                // 获取当前元素所在band的顶部位置
                const currentBandElement = bandElements[draggingInfo.value.bandIndex] as HTMLElement;
                const currentBandRect = currentBandElement.getBoundingClientRect();
                
                // 如果元素在不同的band，需要调整计算方式
                if (highlightedBandIndex.value !== draggingInfo.value.bandIndex) {
                  // 元素移动到不同的band，计算相对于新band的Y坐标
                  relativeY = Math.round(newY + (currentBandRect.top - targetBandRect.top) / currentZoom);
                } else {
                  // 元素在同一band内，使用元素的Y坐标
                  relativeY = Math.round(newY);
                }
                
                // 确保Y坐标是相对于目标band的相对值
                if (relativeY < 0) {
                  relativeY = 0;
                }
                
                // 限制移动元素相对Y值的最大值不能超过targetBand的高度减去元素的高度
                const targetBand = bands.value[highlightedBandIndex.value];
                if (targetBand && currentElement) {
                  const maxY = targetBand.height - currentElement.height;
                  if (relativeY > maxY) {
                    relativeY = maxY;
                  }
                }
              }
            }
            
            dragCoordinates.value = {
              x: relativeX,
              y: relativeY,
              visible: true,
              bandName: ''
            };
            
            // 使用DOM元素的实际位置来计算目标band，提高准确性
            // 使用已经获取的paperElement变量
            if (paperEl) {
              let targetBandIndex = draggingInfo.value.bandIndex;
              let isOverBand = false;
              
              // 获取所有band元素
              const bandElements = document.querySelectorAll('.band');
              for (let i = 0; i < bandElements.length; i++) {
                const bandElement = bandElements[i] as HTMLElement;
                const bandRect = bandElement.getBoundingClientRect();
                
                // 检查鼠标位置是否在当前band的范围内
                if (e.clientY >= bandRect.top && e.clientY <= bandRect.bottom) {
                  targetBandIndex = i;
                  isOverBand = true;
                  break;
                }
              }
              
              // 只有当鼠标在某个band上方时，才更新高亮的band
              if (isOverBand) {
                highlightedBandIndex.value = targetBandIndex;
              }
              
              // 当拖动中的元素移动到目标band后输出日志
              if (isOverBand && targetBandIndex !== draggingInfo.value.bandIndex && 
                  targetBandIndex !== draggingInfo.value.lastTargetBandIndex) {
                const sourceBand = bands.value[draggingInfo.value.bandIndex];
                const targetBand = bands.value[targetBandIndex];
                if (sourceBand && targetBand) {
                  console.log(`元素从 ${getBandDisplayName(sourceBand.type)} 移动到 ${getBandDisplayName(targetBand.type)}`);
                  // 更新上一次的目标band索引
                  draggingInfo.value.lastTargetBandIndex = targetBandIndex;

                  //这里增加移动元素相对Y值的最大值不能超过targetBand的高度减去元素的高度
                  
                }
              }
            }
            
            // 更新坐标显示元素的位置，使其跟随鼠标
            const coordinatesElement = document.querySelector('.coordinates-display') as HTMLElement;
            if (coordinatesElement) {
              // 获取当前鼠标所在band的名称
              let bandName = '';
              if (highlightedBandIndex.value !== null && 
                  bands.value[highlightedBandIndex.value] !== undefined) {
                const currentBand = bands.value[highlightedBandIndex.value];
                if (currentBand) {
                  bandName = getBandDisplayName(currentBand.type) + ' - ';
                }
              }
              
              // 考虑缩放比例的坐标显示
              coordinatesElement.style.left = (e.clientX + 10) + 'px';
              coordinatesElement.style.top = (e.clientY - 30) + 'px';
              
              // 更新dragCoordinates的值，让模板显示正确的坐标和band名称
              dragCoordinates.value.x = relativeX;
              dragCoordinates.value.y = relativeY;
              dragCoordinates.value.bandName = bandName;
            }
          }
        }
      };
    }
    
    if (!cachedMouseUpHandler) {
      cachedMouseUpHandler = (e: MouseEvent) => {
        // 保存状态到历史记录
        saveStateToHistory();
        
        if (draggingInfo.value) {
          const currentBand = bands.value[draggingInfo.value.bandIndex];
          const currentElement = currentBand?.elements[draggingInfo.value.elementIndex];
          
          if (currentBand && currentElement) {
            // 优先使用最后一次高亮的band索引，如果存在的话
            let targetBandIndex = draggingInfo.value.bandIndex;
            
            // 如果有最后一次高亮的band索引，且该索引有效，则使用它
            if (draggingInfo.value.lastTargetBandIndex !== undefined && 
                draggingInfo.value.lastTargetBandIndex >= 0 && 
                draggingInfo.value.lastTargetBandIndex < bands.value.length) {
              targetBandIndex = draggingInfo.value.lastTargetBandIndex;
            } else {
              // 否则，使用鼠标位置来确定目标band
              const paperEl = document.querySelector('.paper') as HTMLElement;
              if (paperEl) {
                // 获取所有band元素
                const bandElements = document.querySelectorAll('.band');
                for (let i = 0; i < bandElements.length; i++) {
                  const bandElement = bandElements[i] as HTMLElement;
                  const bandRect = bandElement.getBoundingClientRect();
                  
                  // 使用鼠标位置来确定目标band，确保元素始终移动到鼠标所在的band
                  if (e.clientY >= bandRect.top && e.clientY <= bandRect.bottom) {
                    targetBandIndex = i;
                    break;
                  }
                }
              }
            }
            
            // 如果元素移动到了不同的band
            if (targetBandIndex !== draggingInfo.value.bandIndex) {
              // 如果元素是从第一个band移动到其他band，需要检查y坐标
              if (draggingInfo.value.bandIndex === 0 && targetBandIndex > 0) {
                // 从第一个band移动到其他band，不需要特殊处理
              } else if (draggingInfo.value.bandIndex > 0 && targetBandIndex === 0) {
                // 从其他band移动到第一个band，需要确保y坐标不小于0
                const targetBandElement = document.querySelectorAll('.band')[targetBandIndex] as HTMLElement | undefined;
                if (targetBandElement) {
                  // 使用拖拽过程中显示的Y坐标，而不是鼠标位置
                  currentElement.y = Math.max(0, dragCoordinates.value.y);
                }
              }
              
              const targetBand = bands.value[targetBandIndex];
              if (targetBand) {
                // 移除原band中的元素
                currentBand.elements.splice(draggingInfo.value.elementIndex, 1);
                
                // 计算元素相对于目标band的y坐标
                const targetBandElement = document.querySelectorAll('.band')[targetBandIndex] as HTMLElement | undefined;
                if (targetBandElement) {
                  // 使用拖拽过程中显示的Y坐标，而不是鼠标位置
                  // 确保Y坐标不小于0
                  currentElement.y = Math.max(0, dragCoordinates.value.y);
                
                  // 添加到新band中，使用相对于band的坐标
                  targetBand.elements.push(currentElement);
                
                  // 更新选中的元素索引
                  selectedElement.value = {
                    bandIndex: targetBandIndex,
                    elementIndex: targetBand.elements.length - 1
                  };
                }
              }
            }
            // 元素在同一band内移动，使用拖拽过程中显示的坐标值
            else {
              // 使用拖拽过程中显示的坐标值，确保元素位置与显示一致
              currentElement.x = dragCoordinates.value.x;
              currentElement.y = dragCoordinates.value.y;
            }
          }
        }
        
        // 清除高亮和坐标显示
        highlightedBandIndex.value = null;
        dragCoordinates.value.visible = false;
        
        // 清除对齐线
        clearAlignmentLines();
        
        draggingInfo.value = null;
        isDraggingOrResizing.value = false;
        
        // 更新JRXML
        updateJRXML();
        
        // 移除事件监听器
        if (cachedMouseMoveHandler) {
          document.removeEventListener('mousemove', cachedMouseMoveHandler);
        }
        if (cachedMouseUpHandler) {
          document.removeEventListener('mouseup', cachedMouseUpHandler);
          cachedMouseUpHandler = null;
        }
      };
    }
    
    // 添加事件监听器
    document.addEventListener('mousemove', cachedMouseMoveHandler);
    document.addEventListener('mouseup', cachedMouseUpHandler);
    
    // 立即触发一次mousemove事件，确保元素能够立即跟随鼠标
    // 这解决了在按下鼠标键100毫秒内移动鼠标，元素没有立即跟上鼠标位置的问题
    setTimeout(() => {
      if (cachedMouseMoveHandler) {
        cachedMouseMoveHandler(event);
      }
    }, 0);
  }
};

// 删除元素
const deleteElement = () => {
  // 检查是否有选中的元素
  if (selectedElements.value && selectedElements.value.length > 0) {
    // 删除多个选中的元素
    saveStateToHistory();
    
    // 按照从后往前的顺序删除，避免索引变化问题
    const sortedElements = [...selectedElements.value].sort((a, b) => {
      if (a.bandIndex !== b.bandIndex) {
        return b.bandIndex - a.bandIndex; // 按band索引降序
      }
      return b.elementIndex - a.elementIndex; // 按元素索引降序
    });
    
    // 删除元素
    sortedElements.forEach(({ bandIndex, elementIndex }) => {
      const band = bands.value[bandIndex];
      if (band && band.elements) {
        band.elements.splice(elementIndex, 1);
      }
    });
    
    // 清空选中列表
    selectedElements.value = [];
    selectedElement.value = null;
  } else if (selectedElement.value) {
    // 删除单个选中的元素（保持原有逻辑）
    saveStateToHistory();
    const { bandIndex, elementIndex } = selectedElement.value;
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      band.elements.splice(elementIndex, 1);
      selectedElement.value = null;
    }
  }
};

// 开始编辑静态文本
const startEditing = (bandIndex: number, elementIndex: number) => {
  editingElement.value = { bandIndex, elementIndex };
  // 选择该元素
  selectElement(bandIndex, elementIndex);
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (editInput.value) {
      editInput.value.focus();
      editInput.value.select();
    }
  }, 10);
};

// 完成编辑
const finishEditing = () => {
  editingElement.value = null;
  // 保存数据
  saveToLocalStorageWrapper();
  updateJRXML();
};

// 取消编辑
const cancelEditing = () => {
  editingElement.value = null;
};

// fileUtils函数的包装函数
const saveToLocalStorageWrapper = () => {
  // 安全检查，确保reportProperties.value存在
  if (!reportProperties.value) {
    console.error('reportProperties.value未定义，无法保存到本地存储');
    return;
  }
  
  saveToLocalStorage(
    {
      reportProperties: reportProperties.value,
      bands: bands.value,
      reportFields: reportFields.value,
      jrxmlContent: jrxmlContent.value
    },
    reportProperties.value?.name || 'report'
  );
};

const loadFromLocalStorageWrapper = () => {
  const loadedData = loadFromLocalStorage(); 
  if (loadedData && loadedData.reportData) {
    reportProperties.value = loadedData.reportData.reportProperties;
    bands.value = loadedData.reportData.bands;
    reportFields.value = loadedData.reportData.reportFields;
    jrxmlContent.value = loadedData.reportData.jrxmlContent;
    // 更新selectedBandTypes以匹配加载的bands
    if (loadedData.reportData.bands && Array.isArray(loadedData.reportData.bands)) {
      selectedBandTypes.value = loadedData.reportData.bands.map((band: Band) => band.type);
    } else {
      selectedBandTypes.value = [];
    }
  }
};

// 初始化元素的Box属性
const initBox = () => {
  if (currentElement.value) {
    // 创建一个默认的box对象
    currentElement.value.box = {
      // 全局边框
      border: '',
      borderColor: '#000000',
      borderWidth: 0,
      borderStyle: '',
      
      // 各边边框 - 样式默认为空字符串，表示"使用全局"
      topBorder: '',
      topBorderColor: '#000000',
      topBorderWidth: 0,
      topBorderStyle: '', // 默认为空字符串，表示"使用全局"
      leftBorder: '',
      leftBorderColor: '#000000',
      leftBorderWidth: 0,
      leftBorderStyle: '', // 默认为空字符串，表示"使用全局"
      bottomBorder: '',
      bottomBorderColor: '#000000',
      bottomBorderWidth: 0,
      bottomBorderStyle: '', // 默认为空字符串，表示"使用全局"
      rightBorder: '',
      rightBorderColor: '#000000',
      rightBorderWidth: 0,
      rightBorderStyle: '', // 默认为空字符串，表示"使用全局"
      
      // 边距
      padding: 0,
      topPadding: 0,
      leftPadding: 0,
      bottomPadding: 0,
      rightPadding: 0
    };
  }
};

// 生成JRXML
const generateJRXML = () => {
  const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value);
  jrxmlContent.value = content;
  
  // 自动切换到JRXML标签页
  activeTab.value = 'jrxml';
  
  // 创建下载链接
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportProperties.value?.name || 'report'}.jrxml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // 保存数据
  saveToLocalStorageWrapper();
};

// 面板显示控制函数
const toggleLeftPanel = () => {
  showLeftPanel.value = !showLeftPanel.value;
};

const toggleRightPanel = () => {
  showRightPanel.value = !showRightPanel.value;
};

const toggleBottomPanel = () => {
  showBottomPanel.value = !showBottomPanel.value;
};


// 处理左侧面板大小变化
const handleLeftPanelSizeChange = (newSize: number) => {
  leftPanelWidth.value = newSize;
};

// 处理属性面板大小变化
const handlePropertyPanelSizeChange = (newSize: number) => {
  propertyPanelWidth.value = newSize;
};

// 处理底部面板大小变化
const handleBottomPanelSizeChange = (newSize: number) => {
  bottomPanelHeight.value = newSize;
};


// 自动更新JRXML内容
const updateJRXML = () => {
  try {
    console.log('开始更新JRXML内容...');
    
    // 确保所有数据都已初始化
    if (!reportProperties.value || !bands.value || !reportFields.value || !reportParameters.value) {
      console.log('数据未完全初始化，跳过JRXML更新');
      return;
    }
    
    console.log('当前reportProperties:', reportProperties.value);
    console.log('当前bands数量:', bands.value.length);
    console.log('当前reportFields数量:', reportFields.value.length);
    console.log('当前reportParameters数量:', reportParameters.value.length);
    
    const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value);
    console.log('生成的JRXML内容长度:', content.length);
    console.log('生成的JRXML内容预览:', content.substring(0, 200) + '...');
    
    // 如果内容有变化，保存到历史记录
    if (content !== jrxmlContent.value) {
      console.log('JRXML内容已变化，更新中...');
      // 只在非拖拽/调整大小状态下保存历史
      if (!isDraggingOrResizing.value && historyStack.value.length === 0) {
        // 初始化时保存第一次状态
        saveStateToHistory();
      }
      jrxmlContent.value = content;
      console.log('JRXML内容已更新到响应式变量，新长度:', jrxmlContent.value.length);
      
      // 立即保存到本地存储，确保JRXML内容被保存
      saveToLocalStorageWrapper();
    } else {
      console.log('JRXML内容未变化');
    }
  } catch (error) {
    console.error('更新JRXML失败:', error);
  }
};

// 复制元素到剪贴板
const copyElement = async () => {
  if (selectedElement.value) {
    const { bandIndex, elementIndex } = selectedElement.value;
    const band = bands.value[bandIndex];
    if (band && band.elements && band.elements[elementIndex]) {
      try {
        // 深拷贝元素数据
        let elementData = JSON.parse(JSON.stringify(band.elements[elementIndex]));
        
        // 处理边框属性，只保留宽度大于0的边框
        if (elementData.box) {
          // 处理新边框模型
          if (elementData.box.pen && elementData.box.pen.lineWidth <= 0) {
            delete elementData.box.pen;
          }
          
          // 处理各边边框
          ['topPen', 'leftPen', 'bottomPen', 'rightPen'].forEach(penType => {
            if (elementData.box[penType] && elementData.box[penType].lineWidth <= 0) {
              delete elementData.box[penType];
            }
          });
          
          // 如果box对象为空，则删除整个box属性
          if (Object.keys(elementData.box).length === 0) {
            delete elementData.box;
          }
        }
        
        // 创建要复制的数据对象，包含元数据标记以便识别这是PDF设计器的元素
        const clipboardData = {
          type: 'PDF_DESIGNER_ELEMENT',
          version: '1.0',
          elementData: elementData
        };
        // 将数据转换为JSON字符串并写入剪贴板
        await navigator.clipboard.writeText(JSON.stringify(clipboardData));
        console.log('元素已复制到剪贴板:', elementData);
        // 可选：显示复制成功的提示
      } catch (err) {
        console.error('复制到剪贴板失败:', err);
        // 降级方案：使用旧的内存存储方式作为备用
        let elementData = JSON.parse(JSON.stringify(band.elements[elementIndex]));
        
        // 处理边框属性，只保留宽度大于0的边框
        if (elementData.box) {
          // 处理新边框模型
          if (elementData.box.pen && elementData.box.pen.lineWidth <= 0) {
            delete elementData.box.pen;
          }
          
          // 处理各边边框
          ['topPen', 'leftPen', 'bottomPen', 'rightPen'].forEach(penType => {
            if (elementData.box[penType] && elementData.box[penType].lineWidth <= 0) {
              delete elementData.box[penType];
            }
          });
          
          // 如果box对象为空，则删除整个box属性
          if (Object.keys(elementData.box).length === 0) {
            delete elementData.box;
          }
        }
        
        sessionStorage.setItem('pdfDesignerCopiedElement', JSON.stringify({
          type: 'PDF_DESIGNER_ELEMENT',
          version: '1.0',
          elementData: elementData
        }));
      }
    }
  }
};

// 从剪贴板粘贴元素
const pasteElement = async () => {
  try {
    // 首先尝试从剪贴板读取
    const clipboardText = await navigator.clipboard.readText();
    const clipboardData = JSON.parse(clipboardText);
    
    // 验证是否是我们的PDF设计器元素数据
    if (clipboardData.type === 'PDF_DESIGNER_ELEMENT' && clipboardData.elementData) {
      processPastedElement(clipboardData.elementData);
    }
  } catch (err) {
    console.error('从剪贴板读取失败:', err);
    // 降级方案：尝试从sessionStorage读取
    try {
      const savedData = sessionStorage.getItem('pdfDesignerCopiedElement');
      if (savedData) {
        const clipboardData = JSON.parse(savedData);
        if (clipboardData.type === 'PDF_DESIGNER_ELEMENT' && clipboardData.elementData) {
          processPastedElement(clipboardData.elementData);
        }
      }
    } catch (sessionErr) {
      console.error('从sessionStorage读取失败:', sessionErr);
    }
  }
};

// 处理粘贴的元素数据（抽取为单独函数以便重用）
const processPastedElement = (elementData: any) => {
  saveStateToHistory();
  
  // 确定粘贴位置（使用当前选中的区域或默认使用第一个可编辑区域）
  let targetBandIndex = selectedBandIndex.value !== null ? selectedBandIndex.value : 0;
  
  // 找到第一个包含elements数组的band
  if (targetBandIndex === null) {
    targetBandIndex = bands.value.findIndex(band => band.elements && Array.isArray(band.elements));
    // 如果没有找到，使用detail区域（通常索引为3）
    if (targetBandIndex === -1) {
      targetBandIndex = 3;
    }
  }
  
  const targetBand = bands.value[targetBandIndex];
  if (!targetBand) {
    console.error('目标区域不存在');
    return;
  }
  
  // 创建新元素（深拷贝）
  const newElement = JSON.parse(JSON.stringify(elementData));
  
  // 调整位置，避免与原元素重叠（向右下方移动一点）
  newElement.x = Math.round(newElement.x + KEYBOARD_CONSTANTS.ELEMENT_PASTE_OFFSET);
  newElement.y = Math.round(newElement.y + KEYBOARD_CONSTANTS.ELEMENT_PASTE_OFFSET);
  
  // 确保元素的宽度和高度也为整数
  if (newElement.width) {
    newElement.width = Math.round(newElement.width);
  }
  if (newElement.height) {
    newElement.height = Math.round(newElement.height);
  }
  
  // 确保元素ID唯一
  if (newElement.id) {
    newElement.id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 添加到目标区域
  if (!targetBand.elements) {
    targetBand.elements = [];
  }
  
  targetBand.elements.push(newElement);
  
  // 选中新添加的元素
  const newElementIndex = targetBand.elements.length - 1;
  selectElement(targetBandIndex, newElementIndex);
  
  // 更新JRXML
  updateJRXML();
  
  console.log('元素已粘贴:', newElement);
};

// 在组件顶层定义handleKeyDown函数
const handleKeyDown = (event: KeyboardEvent) => {
  // 获取当前活动元素，用于判断焦点状态
  const activeEl = document.activeElement;
  const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
  const isTextareaFocused = activeEl && activeEl.tagName === 'TEXTAREA';
  
  // 检测是否有文本被选中
  const selection = window.getSelection();
  const isTextSelected = selection && selection.toString().trim().length > 0;
  
  // 检测是否按下了ctrl键（windows）或meta键（mac）
  const isCtrlOrMetaPressed = event.ctrlKey || event.metaKey;
  
  // CTRL/CMD+0 重置缩放比例
  if (isCtrlOrMetaPressed && event.key === '0') {
    event.preventDefault();
    resetZoom();
    return;
  }
  
  // CTRL/CMD+S 保存当前文件
  if (isCtrlOrMetaPressed && event.key === 's') {
    event.preventDefault();
    saveCurrentFileToStorage();
    return;
  }
  
  // CTRL/CMD+B 快捷键切换底部面板显示状态
  if (isCtrlOrMetaPressed && event.key === 'b') {
    event.preventDefault();
    toggleBottomPanel();
    return;
  }
  
  // CTRL/CMD+Z 撤销操作
  if (isCtrlOrMetaPressed && event.key === 'z') {
    event.preventDefault();
    undo();
    return;
  }
  
  // CTRL/CMD+Y 重做操作
  if (isCtrlOrMetaPressed && event.key === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  
  // CTRL/CMD+C 处理：优先检查是否有输入框处于焦点状态，如果有则执行浏览器默认复制行为
  if (isCtrlOrMetaPressed && event.key === 'c') {
    // 如果输入框处于焦点状态，执行浏览器默认复制行为
    if (isInputFocused) {
      // 不阻止默认行为，让浏览器执行默认的文本复制
      return;
    }
    
    // 如果有文本被选中，执行浏览器默认复制行为
    if (isTextSelected) {
      // 不阻止默认行为，让浏览器执行默认的文本复制
      return;
    }
    
    // 如果没有文本被选中，但有元素被选中，则复制元素
    if (selectedElement.value) {
      event.preventDefault();
      copyElement();
      return;
    }
    
    // 如果没有文本被选中，也没有元素被选中，但设计区域有焦点，则复制JRXML
    if (isDesignAreaFocused.value) {
      event.preventDefault();
      copyJRXML();
      return;
    }
  }
  
  // CTRL/CMD+V 处理：优先检查是否有输入框处于焦点状态，如果有则执行浏览器默认粘贴行为
  if (isCtrlOrMetaPressed && event.key === 'v') {
    // 如果输入框处于焦点状态，执行浏览器默认粘贴行为
    if (isInputFocused) {
      // 不阻止默认行为，让浏览器执行默认的文本粘贴
      return;
    }
    
    // 粘贴元素（只要设计区域有焦点且不在textarea中时才执行自定义粘贴功能）
    if (isDesignAreaFocused.value && !isTextareaFocused) {
      event.preventDefault();
      pasteElement();
      return;
    }
  }
  
  // Del键删除选中的组件（仅在非编辑模式下且没有输入框处于焦点状态时）
  if ((event.key === 'Delete' || event.key === 'Backspace') && 
      (selectedElement.value || (selectedElements.value && selectedElements.value.length > 0)) && 
      !editingElement.value && 
      !isInputFocused) {
    event.preventDefault();
    deleteElement();
    return;
  }
  
  // 方向键处理：Shift+方向键微调元素位置，单独方向键选择周围组件
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    // 如果输入框处于焦点状态，使用默认行为（移动光标）
    if (isInputFocused) {
      return;
    }
    
    event.preventDefault();
    
    // 如果按住Shift键且有选中元素，则微调元素位置
    if (event.shiftKey && selectedElement.value) {
      moveElementByKeyboard(event.key);
    } else {
      // 否则执行原来的导航功能
      navigateElements(event.key);
    }
    return;
  }
};

// 键盘导航选择周围组件
const navigateElements = (direction: string) => {
  if (!selectedElement.value) return;
  
  const { bandIndex: currentBandIndex, elementIndex: currentElementIndex } = selectedElement.value;
  const currentBand = bands.value[currentBandIndex];
  const currentElement = currentBand?.elements[currentElementIndex];
  
  if (!currentBand || !currentElement) return;
  
  let nearestElement: { bandIndex: number; elementIndex: number; distance: number } | null = null;
  let currentBandY = 0;
  
  // 计算当前元素的绝对位置
  const currentX = currentElement.x;
  const currentY = currentBandY + currentElement.y;
  
  // 遍历所有元素，找到最近的符合方向条件的元素
  bands.value.forEach((band, bandIdx) => {
    // 累计带的Y坐标
    const bandOffsetY = currentBandY;
    currentBandY += band.height;
    
    band.elements.forEach((element, elementIdx) => {
      // 跳过当前选中的元素
      if (bandIdx === currentBandIndex && elementIdx === currentElementIndex) return;
      
      // 计算元素的绝对位置
      const elementX = element.x;
      const elementY = bandOffsetY + element.y;
      
      // 根据方向计算是否符合条件
      let isValidDirection = false;
      
      switch (direction) {
        case 'ArrowUp':
          isValidDirection = elementY < currentY;
          break;
        case 'ArrowDown':
          isValidDirection = elementY > currentY;
          break;
        case 'ArrowLeft':
          isValidDirection = elementX < currentX;
          break;
        case 'ArrowRight':
          isValidDirection = elementX > currentX;
          break;
      }
      
      if (isValidDirection) {
        // 计算距离
        let distance = 0;
        switch (direction) {
          case 'ArrowUp':
          case 'ArrowDown':
            distance = Math.abs(elementY - currentY) + Math.abs(elementX - currentX) * KEYBOARD_CONSTANTS.SECONDARY_AXIS_WEIGHT; // Y方向为主，X方向为辅
            break;
          case 'ArrowLeft':
          case 'ArrowRight':
            distance = Math.abs(elementX - currentX) + Math.abs(elementY - currentY) * KEYBOARD_CONSTANTS.SECONDARY_AXIS_WEIGHT; // X方向为主，Y方向为辅
            break;
        }
        
        // 更新最近的元素
        if (!nearestElement || distance < nearestElement.distance) {
          nearestElement = { bandIndex: bandIdx, elementIndex: elementIdx, distance };
        }
      }
    });
  });
  
  // 选择最近的元素
  if (nearestElement) {
    // 使用类型断言确保属性访问有效
    const element = nearestElement as { bandIndex: number; elementIndex: number };
    selectElement(element.bandIndex, element.elementIndex);
  }
};

// 使用键盘微调元素位置
const moveElementByKeyboard = (direction: string) => {
  if (!selectedElement.value) return;
  
  const { bandIndex: currentBandIndex, elementIndex: currentElementIndex } = selectedElement.value;
  const currentBand = bands.value[currentBandIndex];
  const currentElement = currentBand?.elements[currentElementIndex];
  
  if (!currentBand || !currentElement) return;
  
  // 定义微调的步长（像素）
  const MOVE_STEP = 1;
  
  // 计算新位置
  let newX = currentElement.x;
  let newY = currentElement.y;
  
  switch (direction) {
    case 'ArrowUp':
      newY = Math.max(0, currentElement.y - MOVE_STEP);
      break;
    case 'ArrowDown':
      newY = Math.min(currentBand.height - currentElement.height, currentElement.y + MOVE_STEP);
      break;
    case 'ArrowLeft':
      newX = Math.max(0, currentElement.x - MOVE_STEP);
      break;
    case 'ArrowRight':
      newX = Math.min(reportProperties.value.pageWidth - currentElement.width, currentElement.x + MOVE_STEP);
      break;
  }
  
  // 更新元素位置
  currentElement.x = newX;
  currentElement.y = newY;
  
  // 触发更新
  updateJRXML();
  saveToLocalStorageWrapper();
  
  // 检查是否超出边界
  updateOutOfBoundsElements();
};

// 处理报表区域的点击事件，取消选中状态
const handlePaperClick = () => {
  // 只有在没有其他元素被点击的情况下才取消选中
  selectedElement.value = null;
  selectedBandIndex.value = null;
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('组件挂载开始...');
  loadFromLocalStorageWrapper();
  console.log('本地数据加载完成');
  
  // 尝试加载最后编辑的文件
  try {
    const lastFileData = localStorage.getItem('pdfDesignerLastFile');
    if (lastFileData) {
      const lastFile = JSON.parse(lastFileData);
      console.log('找到最后编辑的文件:', lastFile.name);
      
      // 从文件列表中查找最后编辑的文件
      const storedFiles = localStorage.getItem('pdfDesignerFiles');
      if (storedFiles) {
        const files = JSON.parse(storedFiles);
        const lastFileInList = files.find((file: any) => file.id === lastFile.id);
        if (lastFileInList) {
          console.log('加载最后编辑的文件内容');
          loadFile(lastFileInList);
        }
      }
    }
  } catch (error) {
    console.error('加载最后编辑的文件失败:', error);
  }
  
  // 初始加载后更新JRXML，使用setTimeout确保所有数据都已加载
  setTimeout(() => {
    console.log('开始初始JRXML生成...');
    updateJRXML();
  }, 100);
  
  // 初始缩放设置 - 自动适应窗口
  // 使用setTimeout确保DOM已完全渲染后再计算缩放比例
  setTimeout(() => {
    zoomLevel.value = calculateOptimalZoom();
  }, 200);
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown);
  
  // 添加鼠标滚轮事件监听，用于缩放功能
  const handleWheel = (event: Event) => {
    // 检查是否按下了Ctrl键
    const wheelEvent = event as WheelEvent;
    if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
      // 阻止默认行为（页面缩放）
      wheelEvent.preventDefault();
      
      // 根据滚轮方向执行缩放
      const delta = wheelEvent.deltaY < 0 ? 0.1 : -0.1;
      handleZoomChange(delta);
    }
  };
  
  document.addEventListener('wheel', handleWheel, { passive: false });
  (window as any).pdfDesignerWheelListener = handleWheel;
  
  // 获取paper元素并添加点击事件监听
  const paperElement = document.querySelector('.paper');
  if (paperElement) {
    paperElement.addEventListener('click', () => {
      handlePaperClick();
      setDesignAreaFocused();
    });
  }
  
  // 保存监听器引用，以便在组件卸载时移除
  (window as any).pdfDesignerKeydownListener = handleKeyDown;
  (window as any).pdfDesignerPaperClickListener = handlePaperClick;
  (window as any).pdfDesignerSetFocused = setDesignAreaFocused;
  (window as any).pdfDesignerRemoveFocused = removeDesignAreaFocused;
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  // 移除键盘事件监听器
  const keydownListener = (window as any).pdfDesignerKeydownListener;
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener);
  }
  
  // 移除鼠标滚轮事件监听器
  const wheelListener = (window as any).pdfDesignerWheelListener;
  if (wheelListener) {
    document.removeEventListener('wheel', wheelListener);
  }
  
  // 移除paper点击事件监听器
  const handlePaperClick = (window as any).pdfDesignerPaperClickListener;
  const paperElement = document.querySelector('.paper');
  if (handlePaperClick && paperElement) {
    paperElement.removeEventListener('click', handlePaperClick);
  }
});

// 监听关键数据变化，自动保存和更新JRXML
watch(
  [reportProperties, bands, reportFields, reportParameters],
  () => {
    console.log('watch监听器被触发，isDraggingOrResizing:', isDraggingOrResizing.value);
    // 只在非拖拽/调整大小状态下更新
    if (!isDraggingOrResizing.value) {
      console.log('开始保存到本地存储和更新JRXML...');
      saveToLocalStorageWrapper();
      updateJRXML();
      // 更新超出边界的元素
      updateOutOfBoundsElements();
    } else {
      console.log('拖拽/调整大小中，跳过更新');
    }
  },
  { deep: true }
);

// 监听拖拽状态变化，在拖拽结束时更新超出边界的元素
watch(
  isDraggingOrResizing,
  (newValue, oldValue) => {
    // 当从拖拽状态变为非拖拽状态时，更新超出边界的元素
    if (oldValue === true && newValue === false) {
      updateOutOfBoundsElements();
    }
  }
);

// 复制JRXML内容到剪贴板
const copyJRXML = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(jrxmlContent.value);
    notification.success('JRXML内容已复制到剪贴板');
  } catch (err: unknown) {
    console.error('复制失败:', err);
    notification.error('复制失败，请手动复制');
  }
};

// 重新生成JRXML内容
const regenerateJRXML = (): void => {
  updateJRXML();
  // 显示提示信息
  notification.info('JRXML已重新生成');
};

// 保存编辑后的JRXML内容
const saveJRXML = (): void => {
  try {
    // 使用我们的parseJRXMLContent函数解析JRXML内容
    const parsedData = parseJRXMLContent(jrxmlContent.value);
    
    // 更新报表属性
    reportProperties.value = {
      ...parsedData.properties,
      defaultFont: reportProperties.value?.defaultFont || {
        name: FONT_CONSTANTS.SANS_SERIF,
        size: REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
        isBold: false,
        isItalic: false,
        isUnderline: false
      }
    };
    
    // 更新字段定义
    reportFields.value = parsedData.fields;
    
    // 更新参数定义
    reportParameters.value = parsedData.parameters || [];
    
    // 更新bands
    bands.value = parsedData.bands;
    
    // 更新选中的band类型
    selectedBandTypes.value = parsedData.bands.map(band => band.type);
    
    // 重新生成JRXML内容，确保参数被包含
    updateJRXML();
    
    // 为矩形元素添加默认边框，确保显示效果
    bands.value.forEach(band => {
      band.elements.forEach(element => {
        if (element.type === 'rectangle' && !element.border && (!element.box?.border && !element.box?.topBorder)) {
          if (!element.box) {
            element.box = {};
          }
          element.box.border = 'Thin';
          element.box.borderColor = '#000000';
        }
        
        // 确保元素宽度合理（但不强制最小高度，以保留JRXML原始设置）
        if (element.width < ELEMENT_CONSTANTS.MIN_WIDTH) element.width = ELEMENT_CONSTANTS.MIN_WIDTH; // 确保最小宽度
        
        // 对于box元素，确保解析的边框属性正确应用
        if (element.box) {
          // 处理pen元素中的边框样式
          const processPen = (pen: any): string => {
            if (!pen) return '';
            
            // 如果lineWidth为0或undefined，返回空字符串表示无边框
            if (pen.lineWidth === 0 || pen.lineWidth === undefined) {
              return '';
            }
            
            let width = `${pen.lineWidth}px`;
            let style = 'solid';
            let color = '#000000';
            
            if (pen.lineStyle) {
              switch (pen.lineStyle) {
                case 'Dashed':
                  style = 'dashed';
                  break;
                case 'Dotted':
                  style = 'dotted';
                  break;
                case 'Double':
                  style = 'double';
                  break;
                default:
                  style = 'solid';
              }
            }
            
            if (pen.lineColor) {
              color = pen.lineColor;
            }
            
            return `${width} ${style} ${color}`;
          };
          
          // 将边框样式字符串转换为UI显示的边框样式名称
          const convertBorderStyleToName = (borderStyle: string): string => {
            if (!borderStyle || borderStyle === '') return '';
            
            // 如果已经是样式名称，直接返回
            if (['Thin', 'Medium', 'Thick', 'Dashed', 'Dotted', 'Double', '1Point', '2Point', '4Point'].includes(borderStyle)) {
              return borderStyle;
            }
            
            // 解析边框样式字符串，如 "1px solid #000000"
            const parts = borderStyle.split(' ');
            if (parts.length >= 2) {
              const width = parts[0];
              const style = parts[1];
              
              // 如果宽度为0，返回空字符串表示无边框
              if (width === '0px') {
                return '';
              }
              
              // 根据宽度确定样式名称
              if (width === '1px') {
                if (style === 'solid') return 'Thin';
                if (style === 'dashed') return 'Dashed';
                if (style === 'dotted') return 'Dotted';
              } else if (width === '2px') {
                if (style === 'solid') return 'Medium';
              } else if (width === '3px' && style === 'double') {
                return 'Double';
              } else if (width === '4px') {
                if (style === 'solid') return 'Thick';
              }
            }
            
            // 默认返回空字符串而不是Thin，避免意外显示边框
            return '';
          };
          
          // 从边框样式字符串中提取颜色
          const extractBorderColor = (borderStyle: string): string => {
            if (!borderStyle || borderStyle === '') return '#000000';
            
            // 如果已经是样式名称，返回默认颜色
            if (['Thin', 'Medium', 'Thick', 'Dashed', 'Dotted', 'Double', '1Point', '2Point', '4Point'].includes(borderStyle)) {
              return '#000000';
            }
            
            // 解析边框样式字符串，如 "1px solid #000000"
            const parts = borderStyle.split(' ');
            if (parts.length >= 3 && parts[2]) {
              return parts[2];
            }
            
            return '#000000';
          };
          
          // 为各边的pen设置边框样式
          // 处理pen属性，但不使用不存在的borderStyle
          if (element.box.topPen) {
            // 可以将pen属性的值转换后赋给topBorder
            element.box.topBorder = processPen(element.box.topPen);
          }
          if (element.box.leftPen) {
            // 可以将pen属性的值转换后赋给leftBorder
            element.box.leftBorder = processPen(element.box.leftPen);
          }
          // 处理pen属性，但不使用不存在的borderStyle
          if (element.box.bottomPen) {
            // 可以将pen属性的值转换后赋给bottomBorder
            element.box.bottomBorder = processPen(element.box.bottomPen);
          }
          if (element.box.rightPen) {
            // 可以将pen属性的值转换后赋给rightBorder
            element.box.rightBorder = processPen(element.box.rightPen);
          }
          
          // 处理border属性映射
          const borderMap: Record<string, string> = {
            'Thin': '1px',
            '1Point': '1px',
            '2Point': '2px',
            '4Point': '4px',
            'Dotted': '1px dotted',
            'Dashed': '1px dashed',
            'Double': '3px double'
          };
          
          // 应用边框属性
          const applyBorder = (borderAttr: string, colorAttr: string): string => {
            if (!borderAttr) return '';
            
            let borderValue = borderMap[borderAttr] || '1px';
            // 使用类型断言来解决索引问题
            let borderColor = (element.box as any)?.[colorAttr] || '#000000';
            
            // 如果borderAttr是样式名称（非像素值），添加完整的边框样式
            if (borderAttr !== 'Thin' && borderAttr !== '1Point' && borderAttr !== '2Point' && borderAttr !== '4Point') {
              if (borderValue.includes(' ')) {
                return borderValue + ' ' + borderColor;
              }
              return `${borderValue} solid ${borderColor}`;
            }
            
            return `${borderValue} solid ${borderColor}`;
          };
          
          // 设置各边的边框样式
          // 直接使用现有的border属性，不需要额外的borderStyle
          if (element.box.topBorder) {
            // 已经有topBorder属性，确保它的值正确
          }
          // 直接使用现有的border属性，不需要额外的borderStyle
          if (element.box.leftBorder) {
            // 已经有leftBorder属性，确保它的值正确
          }
          if (element.box.bottomBorder) {
            // 已经有bottomBorder属性，确保它的值正确
          }
          if (element.box.rightBorder) {
            // 已经有rightBorder属性，确保它的值正确
          }
          
          // 如果设置了全局border属性，应用到所有边
          if (element.box.border && (!element.box.topBorder || !element.box.leftBorder || !element.box.bottomBorder || !element.box.rightBorder)) {
            const globalBorder = applyBorder(element.box.border, 'borderColor');
            if (!element.box.topBorder) element.box.topBorder = globalBorder;
            if (!element.box.leftBorder) element.box.leftBorder = globalBorder;
            if (!element.box.bottomBorder) element.box.bottomBorder = globalBorder;
            if (!element.box.rightBorder) element.box.rightBorder = globalBorder;
          }
          
          // 将边框样式字符串转换为UI显示的边框样式名称
          if (element.box.border && typeof element.box.border === 'string' && element.box.border.includes(' ')) {
            element.box.border = convertBorderStyleToName(element.box.border);
          }
          if (element.box.topBorder && typeof element.box.topBorder === 'string' && element.box.topBorder.includes(' ')) {
            element.box.topBorderColor = extractBorderColor(element.box.topBorder);
            element.box.topBorder = convertBorderStyleToName(element.box.topBorder);
          }
          if (element.box.leftBorder && typeof element.box.leftBorder === 'string' && element.box.leftBorder.includes(' ')) {
            element.box.leftBorderColor = extractBorderColor(element.box.leftBorder);
            element.box.leftBorder = convertBorderStyleToName(element.box.leftBorder);
          }
          if (element.box.bottomBorder && typeof element.box.bottomBorder === 'string' && element.box.bottomBorder.includes(' ')) {
            element.box.bottomBorderColor = extractBorderColor(element.box.bottomBorder);
            element.box.bottomBorder = convertBorderStyleToName(element.box.bottomBorder);
          }
          if (element.box.rightBorder && typeof element.box.rightBorder === 'string' && element.box.rightBorder.includes(' ')) {
            element.box.rightBorderColor = extractBorderColor(element.box.rightBorder);
            element.box.rightBorder = convertBorderStyleToName(element.box.rightBorder);
          }
        }
        
        // 确保元素不超出纸张边界
        element.x = Math.max(0, element.x);
        element.y = Math.max(0, element.y);
        if (element.x + element.width > paperWidth.value) {
          element.width = paperWidth.value - element.x;
        }
      });
      
      // 确保band高度至少为最小高度
      const minHeight = BAND_CONSTANTS.MIN_HEIGHT;
      band.height = Math.max(band.height, minHeight);
    });
    
    // 保存到本地存储
    saveToLocalStorageWrapper();
    
    // 显示成功提示
    notification.success('JRXML编辑已保存，界面已更新');
  } catch (error: unknown) {
    console.error('保存JRXML失败:', error);
    notification.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 监听边框设置变化，实时更新边框样式
watch(() => currentElement.value?.box?.border, (newBorderStyle) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  const box = currentElement.value.box;
  
  // 如果边框样式为空字符串，清除所有边框
  if (!newBorderStyle || newBorderStyle === '') {
    box.topBorder = '';
    box.leftBorder = '';
    box.bottomBorder = '';
    box.rightBorder = '';
    // 更新JRXML
    updateJRXML();
    return;
  }
  
  const borderColor = box.borderColor || '#000000';
  
  // 边框样式映射
  const borderMap: Record<string, string> = {
    'Thin': '1px',
    '1Point': '1px',
    '2Point': '2px',
    '4Point': '4px',
    'Dotted': '1px dotted',
    'Dashed': '1px dashed',
    'Double': '3px double'
  };
  
  // 生成边框样式字符串
  const borderValue = borderMap[newBorderStyle] || '1px';
  const fullBorderStyle = `${borderValue} solid ${borderColor}`;
  
  // 立即应用到所有边
  box.topBorder = fullBorderStyle;
  box.leftBorder = fullBorderStyle;
  box.bottomBorder = fullBorderStyle;
  box.rightBorder = fullBorderStyle;
  
  // 更新JRXML
  updateJRXML();
});

// 监听边框宽度变化，确保pen对象中包含lineWidth属性
watch(() => currentElement.value?.box?.borderWidth, (newBorderWidth) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  const box = currentElement.value.box;
  
  // 如果边框宽度为0，自动将边框样式设置为"无"
  if (newBorderWidth === 0 || newBorderWidth === undefined || newBorderWidth === null) {
    box.borderStyle = '';
    
    // 删除pen对象
    delete box.pen;
  } else {
    // 确保pen对象存在
    if (!box.pen) {
      box.pen = {};
    }
    
    // 更新pen对象的lineWidth属性
    box.pen.lineWidth = newBorderWidth;
    
    // 如果没有设置边框样式，使用默认样式
    if (!box.pen.lineStyle) {
      box.pen.lineStyle = box.borderStyle || 'Solid';
    }
    
    // 如果没有设置边框颜色，使用默认颜色
    if (!box.pen.lineColor) {
      box.pen.lineColor = box.borderColor || '#000000';
    }
  }
  
  // 更新JRXML
  updateJRXML();
});

// 监听边框样式变化，确保pen对象中包含lineStyle属性
watch(() => currentElement.value?.box?.borderStyle, (newBorderStyle, oldBorderStyle) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  const box = currentElement.value.box;
  
  // 如果边框样式设置为"无"（空字符串），自动将边框粗细改为0
  if (newBorderStyle === undefined || newBorderStyle === null || newBorderStyle === '') {
    box.borderWidth = 0;
    
    // 删除pen对象
    delete box.pen;
  } else {
    // 当边框样式从"无"切换到其他选项时，如果边框粗细为0则自动设置为1
    if ((oldBorderStyle === '' || oldBorderStyle === undefined || oldBorderStyle === null) && 
        box.borderWidth === 0) {
      box.borderWidth = 1;
    }
    
    // 确保pen对象存在
    if (!box.pen) {
      box.pen = {};
    }
    
    // 更新pen对象的lineStyle属性
    box.pen.lineStyle = newBorderStyle;
    
    // 如果没有设置边框宽度，使用默认宽度
    if (!box.pen.lineWidth) {
      box.pen.lineWidth = box.borderWidth || 1;
    }
    
    // 如果没有设置边框颜色，使用默认颜色
    if (!box.pen.lineColor) {
      box.pen.lineColor = box.borderColor || '#000000';
    }
  }
  
  // 更新JRXML
  updateJRXML();
});

// 监听边框颜色变化，实时更新边框样式
watch(() => currentElement.value?.box?.borderColor, (newBorderColor) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  const box = currentElement.value.box;
  
  // 如果有边框样式，更新各边边框颜色
  if (box.border && box.border !== '') {
    const borderMap: Record<string, string> = {
      'Thin': '1px',
      '1Point': '1px',
      '2Point': '2px',
      '4Point': '4px',
      'Dotted': '1px dotted',
      'Dashed': '1px dashed',
      'Double': '3px double'
    };
    
    const borderValue = borderMap[box.border] || '1px';
    const fullBorderStyle = `${borderValue} solid ${newBorderColor || '#000000'}`;
    
    // 立即应用到所有边
    box.topBorder = fullBorderStyle;
    box.leftBorder = fullBorderStyle;
    box.bottomBorder = fullBorderStyle;
    box.rightBorder = fullBorderStyle;
    
    // 更新JRXML
    updateJRXML();
  }
});

// 监听上边框变化
watch(() => currentElement.value?.box?.topBorder, (newTopBorder) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  // 如果边框样式为空字符串，清除上边框
  if (!newTopBorder || newTopBorder === '') {
    // 边框已清除，更新JRXML
    updateJRXML();
    return;
  }
  
  // 如果边框是样式名称（如"Thin"），转换为完整的边框样式字符串
  if (['Thin', 'Medium', 'Thick', 'Dashed', 'Dotted', 'Double', '1Point', '2Point', '4Point'].includes(newTopBorder)) {
    const box = currentElement.value.box;
    const borderColor = box.topBorderColor || '#000000';
    
    const borderMap: Record<string, string> = {
      'Thin': '1px',
      '1Point': '1px',
      '2Point': '2px',
      '4Point': '4px',
      'Dotted': '1px dotted',
      'Dashed': '1px dashed',
      'Double': '3px double'
    };
    
    const borderValue = borderMap[newTopBorder] || '1px';
    box.topBorder = `${borderValue} solid ${borderColor}`;
    // 更新JRXML
    updateJRXML();
  }
});

// 监听左边框变化
watch(() => currentElement.value?.box?.leftBorder, (newLeftBorder) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  // 如果边框样式为空字符串，清除左边框
  if (!newLeftBorder || newLeftBorder === '') {
    // 边框已清除，更新JRXML
    updateJRXML();
    return;
  }
  
  // 如果边框是样式名称（如"Thin"），转换为完整的边框样式字符串
  if (['Thin', 'Medium', 'Thick', 'Dashed', 'Dotted', 'Double', '1Point', '2Point', '4Point'].includes(newLeftBorder)) {
    const box = currentElement.value.box;
    const borderColor = box.leftBorderColor || '#000000';
    
    const borderMap: Record<string, string> = {
      'Thin': '1px',
      '1Point': '1px',
      '2Point': '2px',
      '4Point': '4px',
      'Dotted': '1px dotted',
      'Dashed': '1px dashed',
      'Double': '3px double'
    };
    
    const borderValue = borderMap[newLeftBorder] || '1px';
    box.leftBorder = `${borderValue} solid ${borderColor}`;
    // 更新JRXML
    updateJRXML();
  }
});

// 监听下边框变化
watch(() => currentElement.value?.box?.bottomBorder, (newBottomBorder) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  // 如果边框样式为空字符串，清除下边框
  if (!newBottomBorder || newBottomBorder === '') {
    // 边框已清除，更新JRXML
    updateJRXML();
    return;
  }
  
  // 如果边框是样式名称（如"Thin"），转换为完整的边框样式字符串
  if (['Thin', 'Medium', 'Thick', 'Dashed', 'Dotted', 'Double', '1Point', '2Point', '4Point'].includes(newBottomBorder)) {
    const box = currentElement.value.box;
    const borderColor = box.bottomBorderColor || '#000000';
    
    const borderMap: Record<string, string> = {
      'Thin': '1px',
      '1Point': '1px',
      '2Point': '2px',
      '4Point': '4px',
      'Dotted': '1px dotted',
      'Dashed': '1px dashed',
      'Double': '3px double'
    };
    
    const borderValue = borderMap[newBottomBorder] || '1px';
    box.bottomBorder = `${borderValue} solid ${borderColor}`;
    // 更新JRXML
    updateJRXML();
  }
});

// 监听右边框变化
watch(() => currentElement.value?.box?.rightBorder, (newRightBorder) => {
  if (!currentElement.value || !currentElement.value.box) return;
  
  // 如果边框样式为空字符串，清除右边框
  if (!newRightBorder || newRightBorder === '') {
    // 边框已清除，更新JRXML
    updateJRXML();
    return;
  }
  
  // 如果边框是样式名称（如"Thin"），转换为完整的边框样式字符串
  if (['Thin', 'Medium', 'Thick', 'Dashed', 'Dotted', 'Double', '1Point', '2Point', '4Point'].includes(newRightBorder)) {
    const box = currentElement.value.box;
    const borderColor = box.rightBorderColor || '#000000';
    
    const borderMap: Record<string, string> = {
      'Thin': '1px',
      '1Point': '1px',
      '2Point': '2px',
      '4Point': '4px',
      'Dotted': '1px dotted',
      'Dashed': '1px dashed',
      'Double': '3px double'
    };
    
    const borderValue = borderMap[newRightBorder] || '1px';
    box.rightBorder = `${borderValue} solid ${borderColor}`;
    // 更新JRXML
    updateJRXML();
  }
});



// 开始调整band高度
const startResizingBand = (event: MouseEvent, bandIndex: number): void => {
  event.preventDefault();
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const startY = event.clientY;
  if (!bands.value || !bands.value[bandIndex]) return;
  
  // 获取当前缩放比例
  const currentZoom = zoomLevel.value;
  const startHeight = bands.value[bandIndex].height;
  
  // 获取paper元素的位置信息，用于更准确的坐标计算
  const paperElement = document.querySelector('.paper') as HTMLElement;
  let paperOffsetY = 0;
  
  if (paperElement) {
    const paperRect = paperElement.getBoundingClientRect();
    // 考虑缩放比例的偏移量
    paperOffsetY = paperRect.top;
  }
  
  const handleMouseMove = (e: MouseEvent): void => {
    if (!bands.value || !bands.value[bandIndex]) return;
    // 考虑缩放比例计算高度变化，使用paperOffsetY来更准确地计算
    const deltaY = (e.clientY - paperOffsetY) / currentZoom - (startY - paperOffsetY) / currentZoom;
    const newHeight = Math.max(BAND_CONSTANTS.MIN_HEIGHT, startHeight + deltaY);
    bands.value[bandIndex].height = newHeight;
    
    // 调整该区域内元素的位置，确保元素不会超出区域边界
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      band.elements.forEach(element => {
        // 考虑缩放比例的元素位置调整
        if ((element.y + element.height) * currentZoom > newHeight) {
          element.y = Math.max(0, (newHeight / currentZoom) - element.height);
        }
      });
    }
  };
  
  const handleMouseUp = (): void => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 获取指定Band的Y坐标偏移
const getBandOffsetY = (bandIndex: number): number => {
  let offset = 0;
  for (let i = 0; i < bandIndex; i++) {
    offset += bands.value[i]?.height || 0;
  }
  return offset;
};

// 开始调整元素大小
const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number): void => {
  event.preventDefault();
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const band = bands.value[bandIndex];
  const element = band?.elements[elementIndex];
  
  if (element) {
    // 获取当前缩放比例
    const currentZoom = zoomLevel.value;
    
    // 获取paper元素的位置信息，用于更准确的坐标计算
    const paperElement = document.querySelector('.paper') as HTMLElement;
    let paperOffsetX = 0;
    let paperOffsetY = 0;
    
    if (paperElement) {
      const paperRect = paperElement.getBoundingClientRect();
      // 考虑缩放比例的偏移量
      paperOffsetX = paperRect.left;
      paperOffsetY = paperRect.top;
    }
    
    resizingInfo.value = {
      bandIndex,
      elementIndex,
      startX: (event.clientX - paperOffsetX) / currentZoom,
      startY: (event.clientY - paperOffsetY) / currentZoom,
      startWidth: element.width,
      startHeight: element.height
    };
    
    isDraggingOrResizing.value = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingInfo.value) {
        const currentBand = bands.value[resizingInfo.value.bandIndex];
        const element = currentBand?.elements[resizingInfo.value.elementIndex];
        
        if (currentBand && element) {
          // 获取当前缩放比例
          const currentZoom = zoomLevel.value;
          
          // 获取paper元素的当前位置信息，用于更准确的坐标计算
          const paperEl = document.querySelector('.paper') as HTMLElement;
          let currentPaperOffsetX = 0;
          let currentPaperOffsetY = 0;
          
          if (paperEl) {
            const paperRect = paperEl.getBoundingClientRect();
            // 考虑缩放比例的偏移量
            currentPaperOffsetX = paperRect.left;
            currentPaperOffsetY = paperRect.top;
          }
          
          // 计算新的宽度和高度，考虑缩放比例
          let newWidth = resizingInfo.value.startWidth + ((e.clientX - currentPaperOffsetX) / currentZoom - resizingInfo.value.startX);
          let newHeight = resizingInfo.value.startHeight + ((e.clientY - currentPaperOffsetY) / currentZoom - resizingInfo.value.startY);
          
          // 限制最小尺寸
          newWidth = Math.max(20, newWidth);
          newHeight = Math.max(20, newHeight);
          
          // 获取报表边距设置
          // 注意：由于现在使用padding，元素坐标是相对于内容区域的
          const { leftMargin = 0, rightMargin = 0 } = reportProperties.value;
          // 限制不能超出纸张右边界（考虑右边距）和band底部边界
          // 修正计算：使用正确的缩放比例计算
          // 元素的x坐标是相对于内容区域的，所以最大宽度应该是页面宽度减去左右边距再减去元素的x坐标
          const maxElementWidth = paperWidth.value - leftMargin - rightMargin - element.x;
          const availableHeight = (currentBand.height - element.y);
          newWidth = Math.min(newWidth, maxElementWidth);
          newHeight = Math.min(newHeight, availableHeight);
          
          // 先应用基本的大小调整，确保尺寸为整数
          element.width = Math.round(newWidth);
          element.height = Math.round(newHeight);
          
          // 然后应用对齐线吸附功能（如果启用）
          if (enableSnapToAlignment.value) {
            // 创建临时元素对象用于检测对齐线
            const tempElement = { ...element, width: newWidth, height: newHeight };
            const snapInfo = detectAlignmentLines(tempElement, resizingInfo.value.bandIndex, true); // 更新对齐线状态
            
            // 应用水平吸附（调整宽度）- 只在接近对齐线时才吸附
            if (snapInfo.horizontal && Math.abs(snapInfo.horizontal.offset) < 3) {
              // 根据对齐线位置计算新的宽度
              // 注意：snapInfo.horizontal.position已经包含了leftMargin
              const targetPosition = snapInfo.horizontal.position - (reportProperties.value?.leftMargin || 0);
              
              // 判断是左边对齐还是右边对齐
              if (Math.abs(element.x - targetPosition) < 3) {
                // 左边对齐，保持x不变，调整宽度
                element.width = Math.round(element.width + (element.x - targetPosition));
              } else if (Math.abs((element.x + newWidth) - targetPosition) < 3) {
                // 右边对齐，调整宽度
                element.width = Math.round(targetPosition - element.x);
              } else if (Math.abs((element.x + newWidth/2) - targetPosition) < 3) {
                // 中心对齐，调整宽度
                element.width = Math.round((targetPosition - element.x) * 2);
              }
            }
            
            // 应用垂直吸附（调整高度）- 只在接近对齐线时才吸附
            if (snapInfo.vertical && Math.abs(snapInfo.vertical.offset) < 3) {
              // 根据对齐线位置计算新的高度
              // 注意：snapInfo.vertical.position已经包含了topMargin和band偏移
              const bandOffsetY = getBandOffsetY(resizingInfo.value.bandIndex);
              const targetPosition = snapInfo.vertical.position - (reportProperties.value?.topMargin || 0) - bandOffsetY;
              
              // 判断是顶部对齐还是底部对齐
              if (Math.abs(element.y - targetPosition) < 3) {
                // 顶部对齐，保持y不变，调整高度
                element.height = Math.round(element.height + (element.y - targetPosition));
              } else if (Math.abs((element.y + newHeight) - targetPosition) < 3) {
                // 底部对齐，调整高度
                element.height = Math.round(targetPosition - element.y);
              } else if (Math.abs((element.y + newHeight/2) - targetPosition) < 3) {
                // 中心对齐，调整高度
                element.height = Math.round((targetPosition - element.y) * 2);
              }
            }
          }
          
          // 使用最终尺寸再次检测对齐线（确保对齐线正确显示）
          if (enableSnapToAlignment.value) {
            detectAlignmentLines(element, resizingInfo.value.bandIndex);
          }
        }
      }
    };
    
    const handleMouseUp = () => {
      // 清除对齐线
      clearAlignmentLines();
      
      // 保存状态到历史记录
      saveStateToHistory();
      
      resizingInfo.value = null;
      isDraggingOrResizing.value = false;
      
      // 更新JRXML
      updateJRXML();
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
};

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if ((window as any).pdfDesignerKeydownListener) {
    document.removeEventListener('keydown', (window as any).pdfDesignerKeydownListener);
    delete (window as any).pdfDesignerKeydownListener;
  }
});

// 打赏相关
const showReward = ref(false);

// 使用说明相关
const showHelp = ref(false);

// 字段管理相关
const showFieldModal = ref(false);
const editingField = ref<ReportField | undefined>(undefined);

// 处理添加字段
const handleAddField = (): void => {
  editingField.value = undefined;
  showFieldModal.value = true;
};

// 处理编辑字段
const handleEditField = (field: ReportField): void => {
  editingField.value = { ...field };
  showFieldModal.value = true;
};

// 处理删除字段
const handleDeleteField = (fieldName: string): void => {
  if (confirm(`确定要删除字段 "${fieldName}" 吗？`)) {
    const fieldIndex = reportFields.value.findIndex(field => field.name === fieldName);
    if (fieldIndex !== -1) {
      reportFields.value.splice(fieldIndex, 1);
      saveStateToHistory();
      updateJRXML();
    }
  }
};

// 处理删除元素
const handleDeleteElement = (bandIndex: number, elementIndex: number): void => {
  const band = bands.value[bandIndex];
  if (band && band.elements) {
    band.elements.splice(elementIndex, 1);
    saveStateToHistory();
    updateJRXML();
    // 清除选中状态
    if (selectedElement.value && selectedElement.value.bandIndex === bandIndex && selectedElement.value.elementIndex === elementIndex) {
      selectedElement.value = null;
      selectedElements.value = [];
    }
  }
};

// 处理字段保存
const handleFieldSave = (field: ReportField): void => {
  const existingFieldIndex = reportFields.value.findIndex(f => f.name === field.name);
  
  if (existingFieldIndex !== -1 && editingField.value?.name !== field.name) {
    // 如果是编辑且字段名已存在，显示错误
    alert('字段名称已存在，请使用其他名称');
    return;
  }
  
  if (existingFieldIndex !== -1) {
    // 更新现有字段
    reportFields.value[existingFieldIndex] = field;
  } else {
    // 添加新字段
    reportFields.value.push(field);
  }
  
  saveStateToHistory();
  updateJRXML();
};

// 处理字段检查
const handleCheckFields = (fields: string[]): void => {
  let fieldsAdded = false;
  
  fields.forEach(fieldName => {
    // 检查字段是否已存在
    const existingFieldIndex = reportFields.value.findIndex(f => f.name === fieldName);
    
    if (existingFieldIndex === -1) {
      // 字段不存在，自动添加
      reportFields.value.push({
        name: fieldName,
        class: 'java.lang.String'
      });
      fieldsAdded = true;
    }
  });
  
  if (fieldsAdded) {
    // 保存状态到历史记录
    saveStateToHistory();
    // 更新JRXML
    updateJRXML();
  }
};

// 处理元素上下文菜单
const handleElementContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number): void => {
  // 可以在这里添加上下文菜单的处理逻辑
  // 例如：显示右键菜单，提供元素操作选项
  console.log('Context menu requested for element:', bandIndex, elementIndex);
  
  // 阻止默认上下文菜单
  event.preventDefault();
  
  // 选中元素
  selectElement(bandIndex, elementIndex);
};

// 处理Band选择变化
const handleBandSelectionChange = (): void => {
  // 获取当前选中的band类型
  const currentSelectedTypes = [...selectedBandTypes.value] as BandType[];
  
  // 获取当前bands中的类型
  const currentBandTypes = bands.value.map(band => band.type);
  
  // 找出需要添加的band（在selectedBandTypes中但不在currentBandTypes中）
  const bandsToAdd = currentSelectedTypes.filter(type => !currentBandTypes.includes(type));
  
  // 找出需要移除的band（在currentBandTypes中但不在selectedBandTypes中）
  const bandsToRemove = currentBandTypes.filter(type => !currentSelectedTypes.includes(type));
  
  // 移除不需要的band
  if (bandsToRemove.length > 0) {
    bands.value = bands.value.filter(band => !bandsToRemove.includes(band.type));
  }
  
  // 添加新的band
  if (bandsToAdd.length > 0) {
    const newBands = bandsToAdd.map(type => {
      const bandTypeConfig = allBandTypes.find(bt => bt.type === type);
      return {
        type: type as BandType,
        height: bandTypeConfig ? bandTypeConfig.defaultHeight : 50,
        elements: []
      };
    });
    
    // 按照allBandTypes的顺序插入新band
    allBandTypes.forEach(bandType => {
      if (bandsToAdd.includes(bandType.type as BandType)) {
        const newBand = newBands.find(b => b.type === bandType.type);
        if (newBand) {
          // 确保height属性不为undefined
          if (newBand.height === undefined) {
            newBand.height = BAND_HEIGHT_CONSTANTS[bandType.type] || 50;
          }
          // 找到合适的插入位置
          let insertIndex = bands.value.length;
          for (let i = 0; i < bands.value.length; i++) {
            const currentBandTypeIndex = allBandTypes.findIndex(bt => bt.type === bands.value[i]?.type);
            const newBandTypeIndex = allBandTypes.findIndex(bt => bt.type === bandType.type);
            if (newBandTypeIndex < currentBandTypeIndex) {
              insertIndex = i;
              break;
            }
          }
          // 使用类型断言确保newBand符合Band接口
          bands.value.splice(insertIndex, 0, newBand as Band);
        }
      }
    });
  }
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 更新JRXML
  updateJRXML();
};
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --primary-color: #1890ff;
  --primary-hover: #40a9ff;
  --text-color: #333;
  --border-color: #ddd;
  --hover-color: #f0f0f0;
  --font-size-medium: 14px;
}

.pdf-designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  height: 60px;
  flex-shrink: 0;
}

.designer-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.designer-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

/* 面板切换时的过渡样式 */
.element-panel {
  transition: width 0.3s ease;
  overflow: hidden;
}

.property-panel {
  overflow: hidden;
}

/* 底部面板的过渡样式 */
.tabs-container {
  overflow: hidden;
  border-top: 1px solid #ddd;
  background-color: #f5f5f5;
  position: relative;
  min-height: 0; /* 允许底部面板高度调整时不会影响整体布局 */
}

/* 标尺样式 */
.top-ruler-container {
  display: flex;
  height: 40px; /* 保持固定高度以容纳标签 */
  margin-bottom: 0;
  position: relative;
  width: 100%; /* 占满整个宽度 */
}

.corner-space {
  width: 40px; /* 保持固定宽度以匹配垂直标尺的标签 */
  height: 40px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-right: none;
  border-bottom: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner-space .unit-label {
  font-size: 10px;
  font-weight: bold;
  color: #666;
  text-transform: uppercase;
}

.horizontal-ruler {
  flex: 1;
  height: 40px; /* 保持固定高度 */
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-bottom: none;
  position: relative;
  overflow-x: auto; /* 允许水平滚动 */
  overflow-y: hidden; /* 禁止垂直滚动 */
  width: 100%; /* 确保占满剩余宽度 */
  min-width: 0; /* 允许flex子项收缩 */
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏Chrome, Safari和Opera的滚动条 */
.horizontal-ruler::-webkit-scrollbar {
  display: none;
}

.horizontal-ruler .tick {
  position: absolute;
  top: 20px; /* 调整刻度位置到中间 */
  width: 1px;
  background-color: #999;
  transform-origin: top center;
}

.horizontal-ruler .tick.major {
  height: 35px; /* 增加主刻度线长度，占满标尺高度 */
  background-color: #333;
}

.horizontal-ruler .tick.minor {
  height: 25px; /* 增加次刻度线长度，接近标尺底部 */
}

.horizontal-ruler .label {
  position: absolute;
  top: 5px; /* 将标签移到标尺上方（外侧） */
  font-size: 10px;
  color: #333;
  transform: translateX(-50%);
}

.main-content {
  display: flex;
  flex: 1;
  position: relative;
  height: 100%; /* 确保占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
}

.vertical-ruler-container {
  width: 40px; /* 保持固定宽度以容纳外侧的标签 */
  position: relative;
  height: 100%; /* 占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
}

.vertical-ruler {
  width: 40px; /* 保持固定宽度 */
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-right: none;
  position: relative;
  overflow-x: hidden; /* 禁止水平滚动 */
  overflow-y: auto; /* 允许垂直滚动 */
  height: 100%; /* 确保占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏Chrome, Safari和Opera的滚动条 */
.vertical-ruler::-webkit-scrollbar {
  display: none;
}

.vertical-ruler .tick {
  position: absolute;
  left: 20px; /* 调整刻度位置到中间 */
  height: 1px;
  background-color: #999;
  transform-origin: left center;
}

.vertical-ruler .tick.major {
  width: 35px; /* 增加主刻度线长度，占满标尺宽度 */
  background-color: #333;
}

.vertical-ruler .tick.minor {
  width: 25px; /* 增加次刻度线长度，接近标尺右侧 */
}

.vertical-ruler .label {
  position: absolute;
  left: 5px; /* 将标签移到标尺左侧（外侧） */
  font-size: 10px;
  color: #333;
  transform: translateY(-50%);
}

.paper-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center; /* 修改为居中对齐 */
  align-items: flex-start;
  padding: 20px; /* 添加内边距，确保纸张周围有空间 */
  background-color: #f0f0f0; /* 添加背景色，与DesignerCanvas保持一致 */
}

/* 底部面板调整手柄 */
.tabs-resize-handle {
  position: relative;
  height: 4px;
  cursor: ns-resize;
  background-color: transparent;
  z-index: 10;
  flex-shrink: 0; /* 确保调整手柄不会被压缩 */
}

.tabs-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.tabs-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 2px;
  background-color: #1976d2;
  opacity: 0;
}

.tabs-resize-handle:hover::before {
  opacity: 1;
}

.element-panel {
  /* 移除固定宽度，使用动态宽度 */
  padding: 1rem;
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  position: relative; /* 为调整手柄提供定位上下文 */
}

/* 左侧面板内容容器 */
.left-panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.element-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

/* 左侧面板调整手柄 */
.left-panel-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  background-color: transparent;
  z-index: 10;
}

.left-panel-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.left-panel-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background-color: #1976d2;
  opacity: 0;
}

.left-panel-resize-handle:hover::before {
  opacity: 1;
}

.element-item {
  padding: 0.5rem;
  margin: 0.25rem;
  background-color: #e6f3ff; /* 浅蓝色背景 */
  border: 1px solid #b3d9ff; /* 蓝色边框 */
  border-radius: 4px;
  cursor: grab;
  text-align: left; /* 修改文本对齐为左对齐 */
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 修改为左对齐 */
  gap: 0.5rem;
  width: calc(50% - 0.5rem); /* 两列布局，减去边距 */
  box-sizing: border-box;
}

.element-item:hover {
  background-color: #cce7ff; /* 悬停时更深的蓝色 */
  border-color: #80c0ff; /* 悬停时更深的边框 */
}

.element-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #f0f8ff; /* 更浅的蓝色背景 */
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  color: #1890ff;
  flex-shrink: 0;
}

.paper {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
  position: relative;
  overflow: visible;
  border-radius: 2px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  transform-origin: center top;
}

.paper.focused {
  box-shadow: 0 6px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1);
}

.paper:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08);
}

.band {
  background-color: #fff;
  border-bottom: 1px dashed #ccc;
  position: relative;
  min-height: 20px;
}

.band.dragging-target {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.band.drag-over {
  background-color: #e6f7ff;
}

.band-resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
  background-color: transparent;
}

.band-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.band-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 2px;
  background-color: #1976d2;
  opacity: 0;
}

.band-resize-handle:hover::before {
  opacity: 1;
}

.band.selected {
  background-color: #e3f2fd;
}

.band-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: transparent;
  font-size: 0.8rem;
  font-weight: bold;
  color: #666;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.band-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.design-element {
  position: absolute;
  cursor: move;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

/* 内联编辑输入框样式 */
.inline-edit-input {
  width: 100%;
  height: 100%;
  padding: 5px;
  border: 1px solid #4a90e2;
  border-radius: 2px;
  background-color: white;
  font-size: inherit;
  font-family: inherit;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  cursor: text;
}

.design-element.selected {
  border: 2px solid #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

/* 调整大小手柄样式 */
.resize-handle {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background-color: #1976d2;
  border: 1px solid white;
  border-radius: 2px;
  cursor: se-resize;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.resize-handle:hover {
  background-color: #1565c0;
}

.property-panel {
  width: 300px;
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 1px solid #ddd;
  overflow-y: auto;
  position: relative;
}

/* 属性面板调整手柄 */
.property-panel-resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
  background-color: transparent;
  z-index: 10;
}

.property-panel-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.property-panel-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background-color: #1976d2;
  opacity: 0;
}

.property-panel-resize-handle:hover::before {
  opacity: 1;
}

.property-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.form-group {
    margin-bottom: 0.75rem;
  }

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.margin-inputs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.3rem;
  }
  
  .margin-inputs input {
    padding: 0.3rem;
    font-size: 0.85rem;
    text-align: center;
  }

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.3rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  
  /* 按钮在标签导航中的样式 */
  .tab-navigation .btn-danger.btn-small {
    margin-left: auto;
    margin-right: 10px;
    align-self: center;
  }
  
  /* 高度输入框样式 */
  .band-height-input {
    width: 60px;
    padding: 2px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
  }
  
  .unit-label {
    margin-left: 5px;
    font-size: 12px;
    color: #666;
  }
  
  /* Band高度设置部分样式 */
  .band-settings-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }
  
  .band-heights-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .band-height-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .band-height-item label {
    font-size: 0.85rem;
    font-weight: bold;
    color: #333;
  }
  
  .band-height-control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .band-height-unit {
    font-size: 0.8rem;
    color: #666;
  }
  
  .band-height-hint {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.25rem;
  }
  
  /* 右侧面板中的 band 高度设置样式 */
  .property-section .band-heights-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  
  .property-section .band-height-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .property-section .band-height-item label {
    margin-bottom: 0;
    flex: 1;
  }
  
  .property-section .band-height-control {
    flex: 0 0 auto;
  }
  
  /* Band选择样式 */
  .band-selection-section {
    grid-column: span 1;
  }
  
  .band-selection-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .band-selection-item {
    display: flex;
    align-items: center;
  }
  
  .band-selection-item label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    margin-bottom: 0;
  }
  
  .band-selection-item input[type="checkbox"] {
    margin: 0;
  }
  
  .band-selection-note {
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #e0e0e0;
  }

.field-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.field-item input {
  flex: 1;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #666;
}

.line-element {
  width: 100%;
  height: 1px;
  background-color: #333;
}

.rectangle-element {
  width: 100%;
  height: 100%;
}



/* 元素标签页样式 */
.element-tabs {
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  overflow: hidden;
}

.element-tab-navigation {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
}

.element-tab-button {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border: none;
  background: none;
  cursor: pointer;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  color: #666;
  transition: all 0.2s;
}

.element-tab-button:hover {
  background-color: #e9e9e9;
  color: #333;
}

.element-tab-button.active {
  background-color: #fff;
  color: #1890ff;
  border-bottom: v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') solid #1890ff;
}

.element-tab-content {
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
  min-height: v-bind('(UI_CONSTANTS.LARGE_MARGIN * 5) + "px"');
  overflow: auto;
}

/* 左侧报表参数区域样式 */
.data-parameters-section {
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: 200px;
}

.data-parameters-section h4 {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  color: #666;
}

.parameters-mini-view {
  flex: 1;
  min-height: 150px;
  overflow-y: auto;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
}

/* 左侧数据字段区域样式 */
.data-fields-section {
  margin-top: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  padding-top: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-top: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: 200px;
}

.data-fields-section h4 {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  color: #666;
}

.fields-mini-view {
  flex: 1;
  min-height: 150px;
  overflow-y: auto;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
}

.field-mini-item {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  background-color: #f5f5f5;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  display: flex;
  flex-direction: column;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
}

.field-name {
  color: #1890ff;
  font-weight: 500;
}

.field-type {
  color: #666;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
}

/* Box设置相关样式 */
.box-section {
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  padding-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #eee;
}

.box-section:last-child {
  border-bottom: none;
}

.box-section h5 {
  margin-top: 0;
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  color: #333;
  font-weight: 600;
}

.border-side-group {
  display: flex;
  align-items: center;
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
}

.side-label {
  min-width: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
}

.side-control {
  flex: 1;
  max-width: 200px;
}

.width-control {
  width: 60px;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  padding: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
}

.color-control {
  width: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2.5) + "px"');
  height: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"');
  padding: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
}

.hint {
  display: block;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
  color: #666;
  font-style: italic;
  margin-top: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.init-box-section {
  padding: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  text-align: center;
  background-color: #f9f9f9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
}

.padding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
}

/* 按钮样式 */
.btn-small {
  padding: 3px 8px;
  font-size: 12px;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #666;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-secondary:hover {
  background-color: #e6e6e6;
  color: #333;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #1890ff;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ff4d4f;
}

.btn-danger:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 缩放控制区域样式 */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

/* 自动吸附开关样式 */
.snap-toggle {
  display: flex;
  align-items: center;
  margin-right: 8px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

.snap-toggle label {
  display: flex;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  margin: 0;
}

.snap-toggle input[type="checkbox"] {
  margin-right: 4px;
}

/* 缩放按钮样式 */
.btn-zoom {
  padding: 3px 6px;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  font-size: 12px;
  background-color: #f0f0f0;
  color: #666;
  min-width: 24px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-zoom:hover {
  background-color: #e6e6e6;
  color: #333;
}

/* 缩放选择框样式 */
.zoom-select {
  padding: 3px 6px;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  background-color: white;
  font-size: 12px;
}

.element-actions {
  margin-top: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  text-align: right;
}

/* 对齐控制样式 */
.alignment-controls {
  display: flex;
  gap: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  margin-top: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.align-button {
  flex: 1;
  padding: v-bind('(UI_CONSTANTS.SMALL_MARGIN + 2) + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  background: #fff;
  cursor: pointer;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  transition: all 0.2s;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
}

.align-button:hover {
  background: #f0f0f0;
}

.align-button.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

/* JRXML内容区域高度最大化 */
.jrxml-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.jrxml-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.jrxml-header {
  display: flex;
  justify-content: flex-end;
  padding: v-bind('(UI_CONSTANTS.SMALL_MARGIN + 2) + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #eee;
}

.jrxml-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}



.jrxml-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  background-color: #fafafa;
}


.selection-box {
  position: absolute;
  background-color: rgba(24, 144, 255, 0.2);
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #1890ff;
  pointer-events: none;
  z-index: 1000;
}

/* 选中元素高亮样式 */
.design-element.selected {
  box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') #1890ff;
  position: relative;
}

/* 选择动画效果 */
.design-element.select-animation {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') #1890ff;
  }
  50% {
    box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_THICK + "px"') rgba(24, 144, 255, 0.5);
  }
  100% {
    box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') #1890ff;
  }
}

/* 提高鼠标选择的精确度 */
.design-element {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
/* 文件管理相关样式 */
.current-file-name {
  margin: 0 v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #f0f0f0;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  color: #666;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 报表边距容器样式 */
.pager {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"'),
    rgba(200, 200, 200, 0.2) v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"'),
    rgba(200, 200, 200, 0.2) v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"')
  );
  background-size: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"') v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"');
}

/* 坐标显示样式 */
.coordinates-display {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}

/* 字体提示样式 */
.font-hint {
  display: block;
  margin-top: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
  color: #666;
}

/* 报表元素列表样式 */
.report-elements-section {
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.report-elements-section h4 {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  color: #666;
}

.filter-input-container {
  position: relative;
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.filter-input {
  width: 100%;
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  outline: none;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: #1890ff;
}

.clear-filter-btn {
  position: absolute;
  right: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  padding: 2px;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filter-btn:hover {
  background-color: #f0f0f0;
  color: #666;
}

.report-elements-list {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  background-color: #fafafa;
}

.band-group {
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.band-group:last-child {
  margin-bottom: 0;
}

.band-group-header {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #e0e0e0;
  font-weight: 500;
  color: #333;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d0d0d0;
}

.report-element-item {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  justify-content: flex-start;
}

.report-element-item:last-child {
  border-bottom: none;
}

.report-element-item:hover {
  background-color: #f0f0f0;
}

.report-element-item.selected {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.element-type-info {
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  flex: 1;
}

.element-type-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 3px;
  color: #1890ff;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  font-weight: bold;
  flex-shrink: 0;
}

.element-type-name {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.element-content-preview {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  flex-shrink: 0;
}

.element-band-info {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
  color: #999;
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  flex-shrink: 0;
}

.band-tag {
  background-color: #f0f0f0;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
}

/* 文件管理弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.file-manager-modal {
  background-color: white;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_MEDIUM + "px"');
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"') v-bind('UI_CONSTANTS.LARGE_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  background-color: #fafafa;
}

.modal-header h3 {
  margin: 0;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_HEADER + "px"');
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f0f0f0;
  color: #666;
}

.modal-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

/* 文件菜单样式 */
.file-menu-container {
  position: relative;
  display: inline-block;
}

.file-menu-button {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.file-menu-button:hover {
  background-color: #40a9ff;
}

.file-menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  margin-top: 4px;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.menu-item i {
  width: 16px;
  text-align: center;
  color: #1890ff;
}

.menu-divider {
  height: 1px;
  background-color: #ddd;
  margin: 4px 0;
}

/* 文件列表二级菜单样式 */
.file-submenu-container {
  position: relative;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.2s;
}

.file-submenu-container:hover .submenu-arrow {
  transform: rotate(90deg);
}

.file-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  width: 300px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.submenu-header {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.submenu-header h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.file-filter {
  display: flex;
  align-items: center;
}

.filter-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.clear-filter-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  margin-left: 4px;
  font-size: 12px;
}

.clear-filter-btn:hover {
  color: #666;
}

.submenu-file-list {
  flex: 1;
  overflow-y: auto;
  padding: 5px 0;
}

.submenu-file-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submenu-file-item:hover {
  background-color: #f5f5f5;
}

.submenu-file-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.file-item-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-danger:hover {
  color: #ff4d4f;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 0 0 10px 0;
}

.submenu-footer {
  padding: 8px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 文件列表弹窗样式 */
.file-list-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 1001;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>