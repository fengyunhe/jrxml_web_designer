<template>
  <div class="pdf-designer">
    <div class="designer-header">
      <div class="header-left">
        <h1>{{ t('app.title') }}</h1>
        <div class="header-undo-redo">
          <n-button @click="undo" type="default" quaternary circle :title="t('actions.undo')">↩️</n-button>
          <n-button @click="redo" type="default" quaternary circle :title="t('actions.redo')">↪️</n-button>
        </div>
      </div>
      <div class="header-actions">
        <!-- 文件管理组件 -->
        <FileManager 
          :current-file-name="currentFileName"
          :current-file-id="currentFileId"
          @create-new-file="createNewFile"
          @load-file="loadFile"
          @save-current-file="saveCurrentFileToStorage"
          @save-as-file="saveAsLocalFile"
          @update:currentFileName="currentFileName = $event"
          @update:currentFileId="currentFileId = $event"
        />
        
        <n-button @click="toggleLeftPanel" type="default">
          {{ showLeftPanel ? t('actions.hideLeftPanel') : t('actions.showLeftPanel') }}
        </n-button>
        <n-button @click="toggleRightPanel" type="default">
          {{ showRightPanel ? t('actions.hideRightPanel') : t('actions.showRightPanel') }}
        </n-button>
        <n-button @click="toggleBottomPanel" type="default">
          {{ showBottomPanel ? t('actions.hideBottomPanel') : t('actions.showBottomPanel') }}
        </n-button>
        

        
        <SplitButton 
          :actions="[
            { label: t('actions.previewPDF'), handler: openPdfPreview, class: 'btn-primary' },
            { label: t('actions.downloadJRXML'), handler: downloadJRXML, class: 'btn-primary' },
            { label: t('actions.setPreviewServer'), handler: openPreviewServerSettings, class: 'btn-primary' }
          ]" 
        />
        <n-button @click="showReward = true" type="default">{{ t('actions.donate') }}</n-button>
        <n-button @click="showHelp = true" type="default">{{ t('actions.help') }}</n-button>
        <LanguageSwitcher />
      </div>
    </div>
    
    <!-- 坐标显示元素 -->
      <div 
        v-if="dragCoordinates.visible" 
        class="coordinates-display"
      >
        {{ t('designer.coordinates', { bandName: dragCoordinates.bandName, x: dragCoordinates.x, y: dragCoordinates.y }) }}
      </div>
      
      <!-- Band高度调整提示 -->
      <div 
        v-if="resizingBandInfo.visible" 
        class="band-height-display"
      >
        {{ resizingBandInfo.bandName }} Height: {{ resizingBandInfo.height }}px
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
          :sub-datasets="subDatasets"
          @drag-start="handleDragStart"
          @element-double-click="handleElementDoubleClick"
          @select-element="selectElement"
          @add-field="handleAddField"
          @edit-field="handleEditField"
          @delete-field="handleDeleteField"
          @add-parameter="handleAddParameter"
          @edit-parameter="handleEditParameter"
          @delete-parameter="handleDeleteParameter"
          @delete-element="deleteElement"
          @add-sub-dataset="handleAddSubDataset"
          @edit-sub-dataset="handleEditSubDataset"
          @delete-sub-dataset="handleDeleteSubDataset"
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
        :enable-snap-to-grid="enableSnapToGrid"
        :enable-snap-to-alignment="enableSnapToAlignment"
        :show-grid="showGrid"
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
        @zoom-change="(newZoom) => zoomLevel = newZoom"
        @select-elements-in-rect="selectElementsInRect"
        @clear-selection="clearSelection"
        @check-fields="handleCheckFields"
        @contextmenu="handleElementContextMenu"
        @reset-zoom="resetZoom"
        @move-column="handleMoveColumn"
        @add-columns-to-group="handleAddColumnsToGroup"
        @join-columns-to-existing-group="handleJoinColumnsToExistingGroup"
        @update:enable-snap-to-grid="enableSnapToGrid = $event"
        @update:enable-snap-to-alignment="enableSnapToAlignment = $event"
        @update:show-grid="showGrid = $event"
      />
      
      <!-- 右侧属性面板 -->
      <ResizablePanel 
        v-show="showRightPanel"
        position="right"
        :initial-size="propertyPanelWidth"
        :min-size="200"
        :max-size="700"
        :collapsible="false"
        @size-change="handlePropertyPanelSizeChange"
      >
        <!-- 元素属性组件 -->
        <ElementProperties
          :selected-band-index="selectedBandIndex"
          :selected-element="selectedElement"
          :bands="bands"
          :report-properties="reportProperties"
          :sub-datasets="subDatasets"
          @update:bands="bands = $event"
          @delete-element="deleteElement"
          @update-jrxml="updateJRXML"
          @save-state="saveStateToHistory"
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
      :preview-server-url="previewServerUrl"
      @update:visible="showBottomPanel = $event"
      @size-change="handleBottomPanelSizeChange"
      @update:report-properties="reportProperties = $event"
      @update:selected-band-types="selectedBandTypes = $event"
      @update:jrxml-content="jrxmlContent = $event"
      @copy-jrxml="copyJRXML"
      @save-jrxml="saveJRXML"
      @regenerate-jrxml="regenerateJRXML"
      @download-jrxml="downloadJRXML"
      @band-selection-change="handleBandSelectionChange"
    />
    
    <!-- 打赏弹窗 -->
    <RewardModal v-if="locale === 'zh'" v-model:visible="showReward" />
    <RewardModalEn v-else v-model:visible="showReward" />
    
    <!-- 使用说明弹窗 -->
    <HelpModal v-if="locale === 'zh'" v-model:visible="showHelp" />
    <HelpModalEn v-else v-model:visible="showHelp" />
    
    <!-- 字段管理弹窗 -->
    <FieldManagementModal 
      v-model:visible="showFieldModal" 
      :field="isEditingParameter ? editingParameter : editingField" 
      :is-parameter="isEditingParameter"
      @save="handleFieldSave" 
    />
    
    <!-- PDF预览弹窗 -->
    <PdfPreviewModal
      :visible="showPdfPreview"
      :jrxml-content="jrxmlContent"
      :report-parameters="reportParameters"
      :report-fields="reportFields"
      :preview-server-url="previewServerUrl"
      @update:visible="showPdfPreview = $event"
    />
    
    <!-- 预览服务器设置弹窗 -->
    <PreviewServerSettingsModal
      :visible="showPreviewServerSettings"
      :current-url="previewServerUrl"
      @update:visible="showPreviewServerSettings = $event"
      @update:url="updatePreviewServerUrl"
    />
    
    <!-- 子数据集管理弹窗 -->
    <SubDatasetManagementModal
      :visible="showSubDatasetModal"
      :dataset="editingSubDataset"
      @update:visible="showSubDatasetModal = $event"
      @save="handleSubDatasetSave"
    />
    
    <!-- 组名称输入对话框 -->
    <BaseModal
      v-model:visible="showGroupDialog"
      title="将列加入组"
      :contentClass="'group-dialog'"
      :useVShow="true"
      @confirm="confirmJoinColumnsToGroup"
    >
      <div class="group-dialog-content">
        <div class="form-group">
          <label>选择现有组或输入新组名称：</label>
          <n-select
            v-model:value="groupDialogState.selectedGroupName"
            :options="groupDialogState.existingGroups.map(group => ({ label: group.name, value: group.name }))"
            placeholder="选择现有组或输入新名称"
            filterable
            tag
            style="width: 100%; margin-top: 8px;"
          />
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import ResizablePanel from './panels/ResizablePanel.vue';
import DesignerCanvas from './designer/DesignerCanvas.vue';
import RewardModal from './modals/RewardModal.vue';
import RewardModalEn from './modals/RewardModalEn.vue';
import HelpModal from './modals/HelpModal.vue';
import HelpModalEn from './modals/HelpModalEn.vue';
import FieldManagementModal from './modals/FieldManagementModal.vue';
import PdfPreviewModal from './modals/PdfPreviewModal.vue';
import PreviewServerSettingsModal from './modals/PreviewServerSettingsModal.vue';
import SubDatasetManagementModal from './modals/SubDatasetManagementModal.vue';
import BaseModal from './modals/BaseModal.vue';
import BottomPanel from './panels/BottomPanel.vue';
import ElementLibrary from './ElementLibrary.vue';
import FileManager from './designer/controls/FileManager.vue';
import ElementProperties from './designer/properties/ElementProperties.vue';
import LanguageSwitcher from './common/LanguageSwitcher.vue';
import SplitButton from './common/SplitButton.vue';
import {NButton, NSelect} from 'naive-ui';
import type {
  Band,
  BandType,
  DesignElement,
  DraggingInfo,
  EditingElementInfo,
  FrameElement,
  ReportField,
  ReportParameter,
  SelectedElementInfo,
  TableDataset
} from '../types';
import type {DesignerFile} from '@/types/designerFile';
import {computed, onMounted, onUnmounted, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useDesignerFiles} from '@/composables/useDesignerFiles';
import {useUndoRedo} from '@/composables/useUndoRedo';
import {useZoom} from '@/composables/useZoom';
import {useSnapAlignment} from '@/composables/useSnapAlignment';
import {
  BAND_CONSTANTS,
  BAND_HEIGHT_CONSTANTS,
  BAND_TYPE_CONSTANTS,
  ELEMENT_CONSTANTS,
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

import {loadFromLocalStorage, saveToLocalStorage} from '../utils/fileUtils';

// 导入元素边界验证工具
import {getOutOfBoundsElements} from '../utils/elementBoundsValidator';

// 确保浏览器环境中DOMParser可用
// 移除未使用的getDOMParser函数
import {generateJRXMLContent, parseJRXMLContent} from '../utils/jrxmlGenerator';

// 导入通知管理器
import notification from '../utils/notification';
import {createElement, getAllElements as getAllElementConfigs} from '@/components/elements/ElementRegistry';

// 导入默认JRXML示例文件
import defaultJrxmlContent from '../../tests/build_by_jasper_studio_jrxml/grouped_header_column_table_example.jrxml?raw';

const { t, locale } = useI18n();

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

// DesignerCanvas组件引用
const designerCanvasRef = ref<any>(null);

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
    name: FONT_CONSTANTS.DEFAULT_FONT_FAMILY,
    size: REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
    isBold: false,
    isItalic: false,
    isUnderline: false
  },
  
});

// 文件管理相关状态
const {
  currentFileName,
  currentFileId,
  loadFilesFromStorage,
  loadLastFile,
  findFileById,
  saveCurrentFileContent,
  setLastFile
} = useDesignerFiles({
  defaultFileName: t('fileManager.untitledReport')
});

// 更新网页标题
watch(currentFileName, (newName) => {
  document.title = newName ? `${newName} - ${t('app.title')}` : t('app.title');
}, { immediate: true });

// 监听语言变化，更新标题
watch(() => t('app.title'), () => {
  const name = currentFileName.value;
  document.title = name ? `${name} - ${t('app.title')}` : t('app.title');
});



function createNewFile() {
  // 创建新文件的逻辑
  const timestamp = new Date().getTime();
  currentFileName.value = `${t('fileManager.untitledReport')}${timestamp}`;
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
      name: FONT_CONSTANTS.DEFAULT_FONT_FAMILY,
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
  subDatasets.value = [];
  jrxmlContent.value = '';
  
  // 清除当前选中的元素
  selectedElement.value = null;
  selectedBandIndex.value = null;
}

function saveCurrentFileToStorage() {
  const fileData = saveCurrentFile();

  const ok = saveCurrentFileContent(fileData);
  if (ok) {
    notification.success(t('notifications.fileSavedSuccess'));
  } else {
    notification.error(t('notifications.fileSaveFailed'));
  }
}

function loadFile(fileData: DesignerFile | any) {
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
    
    if (fileContent.subDatasets) {
      subDatasets.value = fileContent.subDatasets;
    }
    
    if (fileContent.jrxmlContent) {
      jrxmlContent.value = fileContent.jrxmlContent;
    }
    
    // 更新当前文件信息
    currentFileName.value = fileData.name || t('fileManager.untitledReport');
    currentFileId.value = fileData.id || null;
    if (fileData.id) {
      setLastFile({ id: fileData.id, name: fileData.name });
    }
    
    // 清除当前选中的元素
    selectedElement.value = null;
    selectedBandIndex.value = null;
  } catch (error) {
    console.error('加载文件失败:', error);
    notification.error(t('fileManager.invalidFileFormat'));
  }
}

function saveAsLocalFile() {
  const newName = prompt(t('fileManager.enterNewFileName'), currentFileName.value);
  if (!newName) return;
  const timestamp = Date.now();
  currentFileName.value = newName;
  currentFileId.value = `file_${timestamp}`;
  saveCurrentFileToStorage();
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
    subDatasets: subDatasets.value,
    jrxmlContent: jrxmlContent.value,
    lastModified: new Date().toISOString()
  };
  
  // 返回文件数据
  return fileData;
}

// 可用元素
const elements = computed(() => getAllElementConfigs().map(config => ({ type: config.type, name: config.name })));

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

// 子数据集
const subDatasets = ref<TableDataset[]>([]);

// 子数据集管理弹窗状态
const showSubDatasetModal = ref(false);
const editingSubDataset = ref<TableDataset | undefined>(undefined);

// 处理添加子数据集
const handleAddSubDataset = () => {
  editingSubDataset.value = undefined;
  showSubDatasetModal.value = true;
};

// 处理编辑子数据集
const handleEditSubDataset = (dataset: TableDataset, index: number) => {
  editingSubDataset.value = dataset;
  showSubDatasetModal.value = true;
};

// 处理删除子数据集
const handleDeleteSubDataset = (index: number) => {
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 删除子数据集
  subDatasets.value.splice(index, 1);
  
  // 更新JRXML
  updateJRXML();
};

// 处理子数据集保存
const handleSubDatasetSave = (dataset: TableDataset) => {
  // 保存状态到历史记录
  saveStateToHistory();
  
  const existingIndex = subDatasets.value.findIndex((d: TableDataset) => d.uuid === dataset.uuid);
  
  if (existingIndex >= 0) {
    // 更新现有子数据集
    subDatasets.value[existingIndex] = dataset;
  } else {
    // 添加新子数据集
    subDatasets.value.push(dataset);
  }
  
  // 更新JRXML
  updateJRXML();
  
  // 关闭模态框
  showSubDatasetModal.value = false;
};

// 检查并创建默认表格数据集
const checkAndCreateDefaultTableDataset = (datasetName: string = 'tableDataset') => {
  // 检查是否已存在同名数据集
  const existingDataset = subDatasets.value.find((d: TableDataset) => d.name === datasetName);
  if (existingDataset) {
    return;
  }
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 创建默认数据集
  const defaultDataset: TableDataset = {
    uuid: crypto.randomUUID(),
    name: datasetName,
    fields: [
      { name: 'FIELD_NAME', class: 'java.lang.String' },
      { name: 'FIELD_NAME2', class: 'java.lang.String' },
      { name: 'FIELD_NAME3', class: 'java.lang.String' }
    ]
  };
  
  // 添加到子数据集列表
  subDatasets.value.push(defaultDataset);
  
  // 更新JRXML
  updateJRXML();
};

// 元素创建事件处理函数
const handleElementCreated = (element: DesignElement, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  // 触发元素创建事件，提供必要的参数
  console.log('元素已创建:', {
    element,
    bandIndex,
    elementIndex,
    parentFrameIndex,
    position: {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    }
  });
  
  // 可以在这里添加其他元素创建后的处理逻辑
  // 例如：根据元素类型执行特定的初始化操作
  switch (element.type) {
    case 'textField':
      // 文本字段元素的初始化逻辑
      break;
    // 其他元素类型的初始化逻辑
  }
};

// 历史记录栈 - 用于撤销功能
type HistoryState = {
  reportProperties: typeof reportProperties.value;
  bands: typeof bands.value;
  reportFields: typeof reportFields.value;
  reportParameters: typeof reportParameters.value;
  subDatasets: typeof subDatasets.value;
};

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

const {
  historyStack,
  redoStack,
  saveStateToHistory,
  undo,
  redo
} = useUndoRedo<HistoryState>({
  maxHistorySize: HISTORY_CONSTANTS.MAX_HISTORY_SIZE,
  getState: () => ({
    reportProperties: reportProperties.value,
    bands: bands.value,
    reportFields: reportFields.value,
    reportParameters: reportParameters.value,
    subDatasets: subDatasets.value
  }),
  applyState: (state) => {
    reportProperties.value = state.reportProperties;
    bands.value = state.bands;
    reportFields.value = state.reportFields;
    reportParameters.value = state.reportParameters;
    subDatasets.value = state.subDatasets;
  },
  onAfterRestore: () => {
    updateJRXML();
  }
});

const isDraggingOrResizing = ref(false); // 标记是否正在拖动或调整大小

// 添加新参数
// 移除未使用的参数管理函数

// 选中状态
const selectedBandIndex = ref<number | null>(null);
const selectedElement = ref<SelectedElementInfo | null>(null);
const selectedElements = ref<SelectedElementInfo[]>([]); // 元素编辑状态
const editingElement = ref<EditingElementInfo | null>(null);

// 组名称输入对话框状态
const showGroupDialog = ref(false);
const groupDialogState = ref({
  elementIndex: 0,
  columnIndices: [] as number[],
  bandIndex: 0,
  parentFrameIndex: undefined as number | undefined,
  existingGroups: [] as any[],
  selectedGroupName: ''
});



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
const { zoomLevel, resetZoom, calculateOptimalZoom, handleZoomChange } = useZoom({
  paperWidth,
  zoomConstants: ZOOM_CONSTANTS
});
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
const draggingInfo = ref<DraggingInfo | null>(null);
const highlightedBandIndex = ref<number | null>(null); // 高亮显示的目标band索引
const {
  enableSnapToGrid,
  enableSnapToAlignment,
  alignmentLines,
  detectAlignmentLines,
  clearAlignmentLines
} = useSnapAlignment({
  bands,
  reportProperties,
  highlightedBandIndex,
  bandSpacing: BAND_CONSTANTS.SPACING
});

// 控制网格显示/隐藏
const showGrid = ref(true);
// 拖动时显示的坐标信息
const dragCoordinates = ref<{x: number, y: number, visible: boolean, bandName: string}>({ x: 0, y: 0, visible: false, bandName: '' });
// Band调整高度时的信息
const resizingBandInfo = reactive({ visible: false, bandName: '', height: 0 });
// Expose it as a ref for template reactivity
const resizingBandInfoRef = ref(resizingBandInfo);
// 调整大小相关
const resizingInfo = ref<{bandIndex: number, elementIndex: number, startX: number, startY: number, startWidth: number, startHeight: number, parentFrameIndex?: number} | null>(null);

// 跟踪最后点击的band
const lastClickedBandIndex = ref<number>(3); // 默认为DETAIL区域（索引3）

// 跟踪从组件库拖拽的元素（修复Mac Tauri环境下dataTransfer可能失效的问题）
const draggedLibraryElement = ref<any>(null);

// 辅助函数：根据数据集生成表格列
function generateTableColumnsFromDataset(defaultTableWidth: number = 555) {
  // 优先使用子数据集
  if (subDatasets.value.length > 0) {
    const dataset = subDatasets.value[0];
    if (dataset && dataset.fields && dataset.fields.length > 0) {
      const fieldCount = dataset.fields.length;
      const columnWidth = Math.round(defaultTableWidth / fieldCount); // 根据表格宽度均分列宽
      return dataset.fields.map(field => {
        return {
          uuid: crypto.randomUUID(),
          width: columnWidth,
          name: field.name,
          tableHeader: {
            type: 'staticText',
            x: 0,
            y: 0,
            width: columnWidth,
            height: 30,
            text: field.name,
            forecolor: '#006699',
            backcolor: '#E6E6E6',
            fontFamily: 'SansSerif',
            fontSize: 19,
            isBold: true,
            textAlignment: 'Center',
            verticalAlignment: 'Middle'
          },
          columnHeader: {
            type: 'staticText',
            x: 0,
            y: 0,
            width: columnWidth,
            height: 30,
            text: field.name,
            textAlignment: 'Center',
            verticalAlignment: 'Middle'
          },
          detailCell: {
            type: 'textField',
            x: 0,
            y: 0,
            width: columnWidth,
            height: 30,
            expression: `$F{${field.name}}`,
            textAlignment: 'Center',
            verticalAlignment: 'Middle'
          }
        };
      });
    }
  }
  // 默认返回空数组，使用ElementRegistry中的默认列
  return [];
}

// 处理拖放
const handleDragStart = (event: DragEvent, element: any) => {
  draggedLibraryElement.value = element;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
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
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 创建新元素
  let newElement: DesignElement = {
    ...createElement(element.type),
    uuid: crypto.randomUUID(), // 生成 UUID
    x: 50, // 默认位置
    y: 20, // 默认位置
    ...getDefaultElementProperties(element.type)
  } as DesignElement;
  
  // 如果是表格元素，检查并创建默认数据集，然后生成对应的列
  if (element.type === 'table') {
    // 获取表格默认宽度
    const defaultTableWidth = (newElement as any).width || 555;
    
    // 检查并创建默认数据集
    const datasetName = (newElement as any).dataset?.name || 'tableDataset';
    checkAndCreateDefaultTableDataset(datasetName);
    
    // 使用数据集生成表格列
    const columns = generateTableColumnsFromDataset(defaultTableWidth);
    if (columns.length > 0) {
      (newElement as any).columns = columns;
      // 计算表格总宽度
      const totalWidth = columns.reduce((sum, column) => sum + (column.width || 150), 0);
      newElement.width = totalWidth;
    }
  }
  
  // 为矩形、椭圆、容器和图片设置默认高度为band高度的一半
  if (['rectangle', 'ellipse', 'frame', 'image'].includes(element.type)) {
    newElement.height = Math.round(targetBand.height / 2);
  }
  
  // 确保band有elements数组
  if (!targetBand.elements) {
    targetBand.elements = [];
  }
  
  // 添加元素到目标band
  targetBand.elements.push(newElement);
  
  // 选中新添加的元素
  const newElementIndex = targetBand.elements.length - 1;
  selectElement(lastClickedBandIndex.value, newElementIndex);
  
  // 触发元素创建事件
  handleElementCreated(newElement, lastClickedBandIndex.value, newElementIndex);
  
  // 更新JRXML
  updateJRXML();
  
  console.log('元素已添加到band:', newElement);
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  
  let elementData = null;
  
  // 优先从内部状态获取（解决Mac Tauri环境下可能获取不到dataTransfer的问题）
  if (draggedLibraryElement.value) {
    elementData = draggedLibraryElement.value;
    draggedLibraryElement.value = null; // 重置状态
  } else if (event.dataTransfer) {
    try {
      const data = event.dataTransfer.getData('application/json');
      if (data) {
        elementData = JSON.parse(data);
      }
    } catch (e) {
      console.error('解析拖拽数据失败:', e);
    }
  }
  
  if (elementData) {
    
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
    let newElement: DesignElement = {
      ...createElement(elementData.type),
      uuid: crypto.randomUUID(), // 生成 UUID
      x: Math.round(Math.max(0, scaledX - 50)), // 减去元素宽度的一半以居中，并确保为整数
      y: Math.round(Math.max(0, scaledY - currentY)), // 相对于band的位置，并确保为整数
      ...getDefaultElementProperties(elementData.type)
    } as DesignElement;
    
    // 如果是表格元素，检查并创建默认数据集，然后生成对应的列
    if (elementData.type === 'table') {
      // 获取表格默认宽度
      const defaultTableWidth = (newElement as any).width || 555;
      
      // 检查并创建默认数据集
      const datasetName = (newElement as any).dataset?.name || 'tableDataset';
      checkAndCreateDefaultTableDataset(datasetName);
      
      // 使用数据集生成表格列
      const columns = generateTableColumnsFromDataset(defaultTableWidth);
      if (columns.length > 0) {
        (newElement as any).columns = columns;
        // 计算表格总宽度
        const totalWidth = columns.reduce((sum, column) => sum + (column.width || 150), 0);
        newElement.width = totalWidth;
        // 更新x坐标，使其居中
        newElement.x = Math.round(Math.max(0, scaledX - totalWidth / 2));
      }
    }
    
    const targetBand = bands.value[bandIndex];
    if (targetBand && targetBand.elements) {
      // 为矩形、椭圆、容器和图片设置默认高度为band高度的一半
      if (['rectangle', 'ellipse', 'frame', 'image'].includes(elementData.type)) {
        newElement.height = Math.round(targetBand.height / 2);
      }
      // 保存状态到历史记录
      saveStateToHistory();
      
      // 检测是否在 Frame 上
      let targetFrameIndex = -1;
      
      // 遍历 Band 中的 Frame，检测新元素是否落在 Frame 上
      for (let i = targetBand.elements.length - 1; i >= 0; i--) {
        const el = targetBand.elements[i];
        if (!el) continue;
        if (el.type === 'frame') {
          // 检查新元素的中心点是否在 Frame 内
          const centerX = newElement.x + newElement.width / 2;
          const centerY = newElement.y + newElement.height / 2;
          
          if (centerX >= el.x && centerX <= el.x + el.width &&
              centerY >= el.y && centerY <= el.y + el.height) {
             targetFrameIndex = i;
             break;
          }
        }
      }
      
      if (targetFrameIndex !== -1) {
         // 添加到 Frame
         const frame = targetBand.elements[targetFrameIndex] as FrameElement;
         if (!frame.elements) frame.elements = [];
         
         // 转换为相对于 Frame 的坐标
         newElement.x -= frame.x;
         newElement.y -= frame.y;
         
         // Frame 内边界检查
         if (newElement.x < 0) newElement.x = 0;
         if (newElement.y < 0) newElement.y = 0;
         if (newElement.x + newElement.width > frame.width) newElement.x = Math.max(0, frame.width - newElement.width);
         if (newElement.y + newElement.height > frame.height) newElement.y = Math.max(0, frame.height - newElement.height);
         
         frame.elements.push(newElement);
         // 选中新添加的元素，注意传递 parentFrameIndex
         const frameElementIndex = frame.elements.length - 1;
         selectElement(bandIndex, frameElementIndex, false, targetFrameIndex);
         
         // 触发元素创建事件，添加到Frame时需要传递parentFrameIndex
         handleElementCreated(newElement, bandIndex, frameElementIndex, targetFrameIndex);
         
      } else {
        // 添加到 Band (原有逻辑)
        // 确保元素不会超出边距限制
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
        const newElementIndex = targetBand.elements.length - 1;
        selectElement(bandIndex, newElementIndex);
        
        // 触发元素创建事件
        handleElementCreated(newElement, bandIndex, newElementIndex);
      }
      
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
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
  
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

const getDefaultElementProperties = (type: string): Partial<DesignElement> => {
  // 使用报表的默认字体设置
  const defaultFontProps = {
    fontFamily: reportProperties.value?.defaultFont?.name || FONT_CONSTANTS.DEFAULT_FONT_FAMILY,
    fontSize: reportProperties.value?.defaultFont?.size || REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
    isBold: reportProperties.value?.defaultFont?.isBold || false,
    isItalic: reportProperties.value?.defaultFont?.isItalic || false,
    isUnderline: reportProperties.value?.defaultFont?.isUnderline || false
  };
  
  // 计算报表页面的可用宽度
  const calculateAvailableWidth = () => {
    const pageWidth = reportProperties.value?.pageWidth || REPORT_CONSTANTS.DEFAULT_PAGE_WIDTH;
    const leftMargin = reportProperties.value?.leftMargin || REPORT_CONSTANTS.DEFAULT_MARGIN;
    const rightMargin = reportProperties.value?.rightMargin || REPORT_CONSTANTS.DEFAULT_MARGIN;
    return Math.round(pageWidth - leftMargin - rightMargin);
  };
  
  switch (type) {
    case 'staticText':
      return { 
        text: t('properties.defaultStaticText'), 
        ...defaultFontProps
      };
    case 'textField':
      return {
        expression: `"${t('properties.defaultTextFieldExpression')}"`,
        isStretchWithOverflow: false,
        evaluationTime: 'Now',
        pattern: '',
        isBlankWhenNull: false,
        ...defaultFontProps,
        textAlignment: 'Left',
        verticalAlignment: 'Top'
      };
    case 'image':
      return { imageExpression: '"https://raw.githubusercontent.com/fengyunhe/jrxml_web_designer/refs/heads/master/src/assets/FIREGOD_CN.jpg"' };
    case 'line':
      return { lineDirection: 'TopDown', lineWidth: 1 };
    case 'rectangle':
      return { 
        mode: 'Transparent',
        border: '1px solid #ccc' // 为矩形元素默认添加边框
      };
    case 'table':
      return {
        width: calculateAvailableWidth()
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
const selectElement = (bandIndex: number, elementIndex: number, isMultiSelect = false, parentFrameIndex?: number) => {
  // 获取元素引用以获取 UUID
  const band = bands.value[bandIndex];
  let element;
  
  if (parentFrameIndex !== undefined) {
    const frame = band?.elements[parentFrameIndex] as FrameElement;
    if (frame && frame.type === 'frame' && frame.elements) {
      element = frame.elements[elementIndex];
    }
  } else {
    element = band?.elements[elementIndex];
  }
  
  const uuid = element?.uuid;

  // 快速更新选中状态，避免不必要的DOM操作
  if (isMultiSelect) {
    // 多选模式
    const existingIndex = selectedElements.value.findIndex(
      el => el.bandIndex === bandIndex && el.elementIndex === elementIndex && el.parentFrameIndex === parentFrameIndex
    );
    
    if (existingIndex !== -1) {
      // 如果元素已选中，则取消选中
      selectedElements.value.splice(existingIndex, 1);
    } else {
      // 添加到多选列表
      selectedElements.value.push({ bandIndex, elementIndex, parentFrameIndex, uuid });
    }
    
    // 如果没有选中任何元素，则清空selectedElement
    if (selectedElements.value.length === 0) {
      selectedElement.value = null;
    } else {
      // 将最后一个选中的元素作为当前选中的元素
      const lastSelected = selectedElements.value[selectedElements.value.length - 1];
      if (lastSelected) {
        selectedElement.value = { 
          bandIndex: lastSelected.bandIndex, 
          elementIndex: lastSelected.elementIndex,
          parentFrameIndex: lastSelected.parentFrameIndex,
          uuid: lastSelected.uuid
        };
      }
    }
  } else {
    // 单选模式
    selectedElement.value = { bandIndex, elementIndex, parentFrameIndex, uuid };
    selectedElements.value = [{ bandIndex, elementIndex, parentFrameIndex, uuid }]; // 清空多选列表，只保留当前选中的元素
  }
  
  selectedBandIndex.value = null;
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
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
        selectedElements.value.push({ bandIndex, elementIndex, uuid: element.uuid });
      }
    });
    
    // 更新band的Y坐标偏移
    bandOffsetY += band.height;
  });
  
  // 如果有选中的元素，将最后一个选中的元素作为当前选中的元素
  if (selectedElements.value.length > 0) {
    const lastSelected = selectedElements.value[selectedElements.value.length - 1];
    if (lastSelected) {
      selectedElement.value = { 
        bandIndex: lastSelected.bandIndex, 
        elementIndex: lastSelected.elementIndex,
        uuid: lastSelected.uuid
      };
    }
  }
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
};

// 缓存事件处理函数，避免重复创建
let cachedMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let cachedMouseUpHandler: ((e: MouseEvent) => void) | null = null;

// 开始拖拽元素
const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  event.stopPropagation();
  selectElement(bandIndex, elementIndex, false, parentFrameIndex);
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const band = bands.value[bandIndex];
  let draggedElement;
  
  if (parentFrameIndex !== undefined) {
    const frame = band?.elements[parentFrameIndex] as FrameElement;
    if (frame && frame.type === 'frame' && frame.elements) {
      draggedElement = frame.elements[elementIndex];
    }
  } else {
    draggedElement = band?.elements[elementIndex];
  }
  
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
      parentFrameIndex,
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
          let currentElement;
          let containerWidth = (paperWidth.value - (reportProperties.value?.leftMargin || 0) - (reportProperties.value?.rightMargin || 0));
          let containerHeight = null; // Frame height limit

          if (draggingInfo.value.parentFrameIndex !== undefined) {
             const frame = currentBand?.elements[draggingInfo.value.parentFrameIndex];
             if (frame && frame.type === 'frame' && frame.elements) {
               currentElement = frame.elements[draggingInfo.value.elementIndex];
               containerWidth = frame.width;
               containerHeight = frame.height;
             }
          } else {
             currentElement = currentBand?.elements[draggingInfo.value.elementIndex];
          }
          
          if (currentBand && currentElement) {
            // 获取当前缩放比例
            const currentZoom = zoomLevel.value;
            
            // 计算元素相对于paper的位置，考虑缩放比例
            // 注意：由于现在使用padding，元素坐标是相对于内容区域的
            // 计算可用宽度，不除以currentZoom因为newX计算已经考虑了缩放
            // const availableWidth = ... (已在上面计算为 containerWidth)
            
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
            let newX = ((e.clientX - paperOffsetX) / currentZoom) - draggingInfo.value.startX;
            let newY = ((e.clientY - paperOffsetY) / currentZoom) - draggingInfo.value.startY; // 移除y坐标的下限限制
            
            // 如果在 Frame 中，不限制坐标，允许移出 Frame
            if (draggingInfo.value.parentFrameIndex !== undefined) {
               // 不做限制
            } else {
               // 在 Band 中，限制 X 坐标
               newX = Math.max(0, Math.min(newX, containerWidth - currentElement.width));

                // 原有的 Band Y 限制逻辑
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
          let currentElement;
          
          if (draggingInfo.value.parentFrameIndex !== undefined) {
            // 增加安全检查
            if (currentBand && currentBand.elements && currentBand.elements[draggingInfo.value.parentFrameIndex]) {
              const frame = currentBand.elements[draggingInfo.value.parentFrameIndex];
              if (frame && frame.type === 'frame' && frame.elements) {
                currentElement = frame.elements[draggingInfo.value.elementIndex];
              }
            }
          } else {
            if (currentBand && currentBand.elements) {
              currentElement = currentBand.elements[draggingInfo.value.elementIndex];
            }
          }
          
          if (currentBand && currentElement) {
            // 1. 获取目标 Band
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
                const bandElements = document.querySelectorAll('.band');
                for (let i = 0; i < bandElements.length; i++) {
                  const bandElement = bandElements[i] as HTMLElement;
                  const bandRect = bandElement.getBoundingClientRect();
                  if (e.clientY >= bandRect.top && e.clientY <= bandRect.bottom) {
                    targetBandIndex = i;
                    break;
                  }
                }
              }
            }
            
            const targetBand = bands.value[targetBandIndex];
            
            // 2. 计算元素在页面上的绝对坐标（或者相对于目标 Band 的坐标）
            // 计算 Source Parent 相对于 Source Band 的坐标
            let sourceParentRelX = 0;
            let sourceParentRelY = 0;
            if (draggingInfo.value.parentFrameIndex !== undefined) {
               const frame = bands.value[draggingInfo.value.bandIndex]?.elements[draggingInfo.value.parentFrameIndex];
               if (frame) {
                 sourceParentRelX = frame.x;
                 sourceParentRelY = frame.y;
               }
            }
            
            // 计算元素相对于 Source Band 的坐标
            const elementRelSourceBandX = sourceParentRelX + currentElement.x;
            const elementRelSourceBandY = sourceParentRelY + currentElement.y;
            
            // 计算 Source Band 相对于 Target Band 的偏移
            const sourceBandEl = document.querySelectorAll('.band')[draggingInfo.value.bandIndex];
            const targetBandEl = document.querySelectorAll('.band')[targetBandIndex];
            
            if (!sourceBandEl || !targetBandEl) return;
            
            const sourceBandElement = sourceBandEl.getBoundingClientRect();
            const targetBandElement = targetBandEl.getBoundingClientRect();
            const currentZoom = zoomLevel.value;
            const bandOffsetY = (sourceBandElement.top - targetBandElement.top) / currentZoom;
            
            const elementRelTargetBandX = elementRelSourceBandX;
            const elementRelTargetBandY = elementRelSourceBandY + bandOffsetY;
            
            // 3. 在 Target Band 中查找目标 Frame
            let targetFrameIndex = -1;
            if (targetBand && targetBand.elements) {
              // 遍历 Target Band 中的 Frame
              for (let i = targetBand.elements.length - 1; i >= 0; i--) {
                  // 避免将 Frame 放入自身：如果是在同一个 Band，且当前遍历到的 Frame 就是正在拖拽的元素，则跳过
                  if (targetBandIndex === draggingInfo.value.bandIndex && 
                      draggingInfo.value.parentFrameIndex === undefined && 
                      i === draggingInfo.value.elementIndex) {
                    continue;
                  }

                  const el = targetBand.elements[i];
                  if (!el) continue;
                  if (el.type === 'frame') {
                      // Check intersection using element center
                      const centerX = elementRelTargetBandX + currentElement.width / 2;
                      const centerY = elementRelTargetBandY + currentElement.height / 2;
                      
                      if (centerX >= el.x && centerX <= el.x + el.width &&
                          centerY >= el.y && centerY <= el.y + el.height) {
                         targetFrameIndex = i;
                         break;
                      }
                  }
              }
            }
            
            // 4. 判断是否改变了容器
            const isSameBand = draggingInfo.value.bandIndex === targetBandIndex;
            const isSameFrame = draggingInfo.value.parentFrameIndex === (targetFrameIndex === -1 ? undefined : targetFrameIndex);
            
            if ((!isSameBand || !isSameFrame) && targetBand) {
               // Reparenting
               
               // Remove from Source
               let element;
               if (draggingInfo.value.parentFrameIndex !== undefined) {
                   const frame = bands.value[draggingInfo.value.bandIndex]?.elements[draggingInfo.value.parentFrameIndex] as FrameElement;
                   if (frame && frame.elements) {
                     element = frame.elements.splice(draggingInfo.value.elementIndex, 1)[0];
                   }
               } else {
                   element = bands.value[draggingInfo.value.bandIndex]?.elements.splice(draggingInfo.value.elementIndex, 1)[0];
               }
               
               if (element) {
                 // Add to Target
                 if (targetFrameIndex !== -1) {
                     const frame = targetBand.elements[targetFrameIndex] as FrameElement;
                     if (!frame.elements) frame.elements = [];
                     
                     // Convert to Frame Rel Coords
                     element.x = Math.round(elementRelTargetBandX - frame.x);
                     element.y = Math.round(elementRelTargetBandY - frame.y);
                     
                     // Limit
                     element.x = Math.max(0, element.x);
                     element.y = Math.max(0, element.y);
                     if (element.x + element.width > frame.width) element.x = Math.max(0, frame.width - element.width);
                     if (element.y + element.height > frame.height) element.y = Math.max(0, frame.height - element.height);
                     
                     frame.elements.push(element);
                     selectElement(targetBandIndex, frame.elements.length - 1, false, targetFrameIndex);
                 } else {
                     // Add to Band
                     element.x = Math.round(elementRelTargetBandX);
                     element.y = Math.round(elementRelTargetBandY);
                     
                     // Limit Y >= 0
                     element.y = Math.max(0, element.y);
                     
                     targetBand.elements.push(element);
                     selectElement(targetBandIndex, targetBand.elements.length - 1);
                 }
               }
            } else {
              // 同容器移动，使用拖拽过程中显示的坐标值
              // 注意：dragCoordinates 可能只更新了显示值，实际值已经在 mousemove 中通过 currentElement 引用更新了
              // 这里主要是确保整数和边界
              currentElement.x = Math.round(currentElement.x);
              currentElement.y = Math.round(currentElement.y);
              if (currentElement.y < 0) currentElement.y = 0;
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
    sortedElements.forEach(({ bandIndex, elementIndex, parentFrameIndex }) => {
      const band = bands.value[bandIndex];
      if (band && band.elements) {
        if (parentFrameIndex !== undefined) {
           // 删除 Frame 内的元素
           const frame = band.elements[parentFrameIndex];
           if (frame && frame.type === 'frame' && frame.elements) {
             frame.elements.splice(elementIndex, 1);
           }
        } else {
           // 删除 Band 内的元素
           band.elements.splice(elementIndex, 1);
        }
      }
    });
    
    // 清空选中列表
    selectedElements.value = [];
    selectedElement.value = null;
  } else if (selectedElement.value) {
    // 删除单个选中的元素（保持原有逻辑）
    saveStateToHistory();
    const { bandIndex, elementIndex, parentFrameIndex } = selectedElement.value;
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      if (parentFrameIndex !== undefined) {
         // 删除 Frame 内的元素
         const frame = band.elements[parentFrameIndex];
         if (frame && frame.type === 'frame' && frame.elements) {
           frame.elements.splice(elementIndex, 1);
         }
      } else {
         band.elements.splice(elementIndex, 1);
      }
      selectedElement.value = null;
    }
  }
};

// 开始编辑静态文本
const startEditing = (bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
  editingElement.value = { bandIndex, elementIndex, parentFrameIndex };
  // 选择该元素
  selectElement(bandIndex, elementIndex, false, parentFrameIndex);
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
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
    return true;
  }
  return false;
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

// 下载JRXML文件
const downloadJRXML = () => {
  const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value, subDatasets.value);
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

// 暴露给测试的属性和方法
defineExpose({
  bands,
  reportProperties,
  createNewFile,
  loadFile,
  loadFromLocalStorageWrapper,
  lastClickedBandIndex,
  handleElementDoubleClick,
  selectElement,
  deleteElement,
  undo,
  redo
});

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
    
    const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value, subDatasets.value);
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
        
        // 生成新的 UUID，避免复制 UUID
        elementData.uuid = crypto.randomUUID();
        
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
  const hasLocalData = loadFromLocalStorageWrapper();
  console.log('本地数据加载完成');
  
  // 尝试加载最后编辑的文件
  loadFilesFromStorage();
  const lastFile = loadLastFile();
  let hasFileData = false;
  if (lastFile) {
    const lastFileInList = findFileById(lastFile.id);
    if (lastFileInList) {
      loadFile(lastFileInList);
      hasFileData = true;
    }
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
    notification.success(t('notifications.jrxmlCopiedSuccess'));
  } catch (err: unknown) {
    console.error('复制失败:', err);
    notification.error(t('notifications.jrxmlCopyFailed'));
  }
};

// 重新生成JRXML内容
const regenerateJRXML = (): void => {
  updateJRXML();
  // 显示提示信息
  notification.info('JRXML已重新生成');
};

// 打开PDF预览
const openPdfPreview = (): void => {
  try {
    if (!jrxmlContent.value) {
      // 直接生成JRXML内容，不下载
      const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value, subDatasets.value);
      jrxmlContent.value = content;
    }
    showPdfPreview.value = true;
    console.log('打开PDF预览:', { showPdfPreview: showPdfPreview.value, jrxmlContentLength: jrxmlContent.value.length });
  } catch (error) {
    console.error('预览PDF失败:', error);
    alert('预览PDF失败，请检查控制台错误信息');
  }
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
        name: FONT_CONSTANTS.DEFAULT_FONT_FAMILY,
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
    
    // 更新子数据集
    if (parsedData.datasets) {
      subDatasets.value = parsedData.datasets.map(dataset => ({
        uuid: crypto.randomUUID(),
        name: dataset.name,
        fields: dataset.fields,
        parameters: dataset.parameters,
        query: dataset.query
      }));
    }
    
    // 更新bands
    bands.value = parsedData.bands;
    
    // 更新选中的band类型
    selectedBandTypes.value = parsedData.bands.map(band => band.type);
    
    // 为矩形元素添加默认边框，确保显示效果
    bands.value.forEach(band => {
      band.elements.forEach(element => {
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

    // 重新生成JRXML内容，确保参数被包含
    updateJRXML();
    
    // 保存到本地存储
    saveToLocalStorageWrapper();
    
    // 显示成功提示
    notification.success(t('notifications.jrxmlEditSaved'));
  } catch (error: unknown) {
    console.error('保存JRXML失败:', error);
    notification.error(t('notifications.jrxmlEditSaveFailed', { error: error instanceof Error ? error.message : 'Unknown error' }));
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
  
  // 显示band高度调整提示
  const band = bands.value[bandIndex];
  resizingBandInfo.visible = true;
  resizingBandInfo.bandName = getBandDisplayName(band.type);
  resizingBandInfo.height = startHeight;
  
  const handleMouseMove = (e: MouseEvent): void => {
    if (!bands.value || !bands.value[bandIndex]) return;
    // 考虑缩放比例计算高度变化，使用paperOffsetY来更准确地计算
    const deltaY = (e.clientY - paperOffsetY) / currentZoom - (startY - paperOffsetY) / currentZoom;
    const newHeight = Math.max(BAND_CONSTANTS.MIN_HEIGHT, Math.round(startHeight + deltaY));
    
    // 更新band高度
    bands.value = bands.value.map((b, i) => {
      if (i === bandIndex) {
        return { ...b, height: newHeight };
      }
      return b;
    });
    
    // 更新band高度调整提示
    resizingBandInfo.bandName = bands.value[bandIndex] ? getBandDisplayName(bands.value[bandIndex].type) : '';
    resizingBandInfo.height = newHeight;
    
    // 定位band高度显示元素，使其跟随鼠标
    const bandHeightElement = document.querySelector('.band-height-display') as HTMLElement;
    if (bandHeightElement) {
      bandHeightElement.style.left = (e.clientX + 10) + 'px';
      bandHeightElement.style.top = (e.clientY - 30) + 'px';
    }
    
    // 调整该区域内元素的位置，确保元素不会超出区域边界
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      band.elements.forEach(element => {
        // 考虑缩放比例的元素位置调整
        if ((element.y + element.height) > newHeight) {
          element.y = Math.max(0, newHeight - element.height);
        }
      });
    }
  };
  
  const handleMouseUp = (): void => {
    // 隐藏band高度调整提示
    resizingBandInfo.visible = false;
    resizingBandInfo.bandName = '';
    resizingBandInfo.height = 0;
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
const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number, direction: string, parentFrameIndex?: number): void => {
  event.preventDefault();
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const band = bands.value[bandIndex];
  let element;
  
  if (parentFrameIndex !== undefined) {
    const frame = band?.elements[parentFrameIndex];
    if (frame && frame.type === 'frame' && frame.elements) {
      element = frame.elements[elementIndex];
    }
  } else {
    element = band?.elements[elementIndex];
  }
  
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
      startHeight: element.height,
      parentFrameIndex
    };
    
    isDraggingOrResizing.value = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingInfo.value) return;
      
      const currentBand = bands.value[resizingInfo.value.bandIndex];
      if (!currentBand) return;

      let element: DesignElement | undefined;
      let containerWidth = (paperWidth.value - (reportProperties.value?.leftMargin || 0) - (reportProperties.value?.rightMargin || 0));
      let containerHeight = currentBand.height;

      if (resizingInfo.value.parentFrameIndex !== undefined) {
        const frame = currentBand.elements[resizingInfo.value.parentFrameIndex];
        if (frame && frame.type === 'frame' && frame.elements) {
          element = frame.elements[resizingInfo.value.elementIndex];
          containerWidth = frame.width;
          containerHeight = frame.height;
        }
      } else {
        element = currentBand.elements[resizingInfo.value.elementIndex];
      }
      
      if (!element) return;
      
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
      const { leftMargin = 0, rightMargin = 0 } = reportProperties.value;
      // 限制不能超出纸张右边界和band底部边界
      let maxElementWidth;
      if (resizingInfo.value.parentFrameIndex !== undefined) {
         maxElementWidth = containerWidth - element.x;
      } else {
         maxElementWidth = paperWidth.value - leftMargin - rightMargin - element.x;
      }
      
      const availableHeight = (containerHeight - element.y);
      newWidth = Math.min(newWidth, maxElementWidth);
      newHeight = Math.min(newHeight, availableHeight);
      
      // 如果按下SHIFT键，保持原始宽高比
      if (e.shiftKey) {
        // 计算原始宽高比
        const aspectRatio = resizingInfo.value.startWidth / resizingInfo.value.startHeight;
        
        // 计算基于宽度的高度和基于高度的宽度
        const heightBasedOnWidth = newWidth / aspectRatio;
        const widthBasedOnHeight = newHeight * aspectRatio;
        
        // 选择更接近原始比例的尺寸
        if (Math.abs(newHeight - heightBasedOnWidth) < Math.abs(newWidth - widthBasedOnHeight)) {
          // 以宽度为基准，调整高度
          newHeight = heightBasedOnWidth;
        } else {
          // 以高度为基准，调整宽度
          newWidth = widthBasedOnHeight;
        }
        
        // 再次限制尺寸，确保不超出边界
        newWidth = Math.max(20, Math.min(newWidth, maxElementWidth));
        newHeight = Math.max(20, Math.min(newHeight, availableHeight));
      }
      
      // 先保存临时尺寸
      const tempWidth = Math.round(newWidth);
      const tempHeight = Math.round(newHeight);
      
      // 特殊处理表格元素：调整表格宽度时自动调整列宽
      if (element.type === 'table') {
        // 在children数组中查找对应的列（递归查找）
        const findColumnInChildren = (children: any[], targetColumn: any): any | null => {
          for (const child of children) {
            if (child.uuid === targetColumn.uuid) {
              return child;
            }
            if (child.children) {
              const found = findColumnInChildren(child.children, targetColumn);
              if (found) {
                return found;
              }
            }
          }
          return null;
        };
        
        if (element.columns && element.columns.length > 0) {
          // 获取所有列的当前宽度
          const columnWidths = element.columns.map(col => col.width || 0);
          const totalColumnWidth = columnWidths.reduce((sum, width) => sum + width, 0);
          
          if (totalColumnWidth > 0) {
            // 计算每列应分配的宽度比例
            const ratios = columnWidths.map(width => width / totalColumnWidth);
            
            // 根据新的表格宽度按比例分配列宽
            const newColumnWidths = ratios.map(ratio => {
              // 按比例分配新宽度
              const newColWidth = tempWidth * ratio;
              // 确保每列至少有一个最小宽度
              return Math.max(10, Math.round(newColWidth));
            });
            
            // 调整最后一列宽度，确保总和等于表格宽度
            const sumNewWidths = newColumnWidths.reduce((sum, width) => sum + width, 0);
            if (sumNewWidths !== tempWidth && newColumnWidths.length > 0) {
              const diff = tempWidth - sumNewWidths;
              const lastIndex = newColumnWidths.length - 1;
              // 确保newColumnWidths[lastIndex]不是undefined
              newColumnWidths[lastIndex] = (newColumnWidths[lastIndex] || 0) + diff;
            }
            
            // 更新所有列的宽度
            element.columns.forEach((col, index) => {
              const newColWidth = newColumnWidths[index]!;
              col.width = newColWidth;
              
              // 同时更新列中所有单元格的宽度
              if (col.tableHeader) {
                col.tableHeader.width = newColWidth;
              }
              if (col.columnHeader) {
                col.columnHeader.width = newColWidth;
              }
              if (col.detailCell) {
                col.detailCell.width = newColWidth;
              }
              if (col.columnFooter) {
                col.columnFooter.width = newColWidth;
              }
              if (col.tableFooter) {
                col.tableFooter.width = newColWidth;
              }
              
              // 如果表格有children属性，同时更新children属性中对应列的宽度
              if (element.children) {
                const childColumn = findColumnInChildren(element.children, col);
                if (childColumn) {
                  childColumn.width = newColWidth;
                  
                  // 同时更新childColumn中所有相关单元格的宽度
                  if (childColumn.tableHeader) {
                    childColumn.tableHeader.width = newColWidth;
                  }
                  if (childColumn.columnHeader) {
                    childColumn.columnHeader.width = newColWidth;
                  }
                  if (childColumn.detailCell) {
                    childColumn.detailCell.width = newColWidth;
                  }
                  if (childColumn.columnFooter) {
                    childColumn.columnFooter.width = newColWidth;
                  }
                  if (childColumn.tableFooter) {
                    childColumn.tableFooter.width = newColWidth;
                  }
                }
              }
            });
          }
        }
        
        // 设置表格最终宽度和高度
        element.width = tempWidth;
      } else {
        // 非表格元素，直接应用大小调整
        element.width = tempWidth;
      }
      
      // 应用高度调整
      element.height = tempHeight;
      
      // 使用最终尺寸再次检测对齐线（确保对齐线正确显示）
      if (enableSnapToAlignment.value) {
        detectAlignmentLines(element, resizingInfo.value.bandIndex);
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
}

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

// PDF预览相关
const showPdfPreview = ref(false);

// 预览服务器设置相关
const showPreviewServerSettings = ref(false);
const previewServerUrl = ref(localStorage.getItem('previewServerUrl') || 'https://jrxml-pdf-preview.firegod.cn/api/pdf/generateForm');

// 字段管理相关
const showFieldModal = ref(false);
const editingField = ref<ReportField | undefined>(undefined);
const editingParameter = ref<ReportParameter | undefined>(undefined);

// 打开预览服务器设置
const openPreviewServerSettings = (): void => {
  showPreviewServerSettings.value = true;
};

// 更新预览服务器地址
const updatePreviewServerUrl = (url: string): void => {
  previewServerUrl.value = url;
  localStorage.setItem('previewServerUrl', url);
};
const isEditingParameter = ref(false);

// 处理添加字段
const handleAddField = (): void => {
  editingField.value = undefined;
  isEditingParameter.value = false;
  showFieldModal.value = true;
};

// 处理编辑字段
const handleEditField = (field: ReportField): void => {
  editingField.value = { ...field };
  isEditingParameter.value = false;
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

// 处理添加报表参数
const handleAddParameter = (): void => {
  // 使用字段管理模态框，因为参数和字段的结构相似
  editingParameter.value = undefined;
  showFieldModal.value = true;
  isEditingParameter.value = true;
};

// 处理编辑报表参数
const handleEditParameter = (parameter: ReportParameter): void => {
  editingParameter.value = { ...parameter };
  showFieldModal.value = true;
  isEditingParameter.value = true;
};

// 处理删除报表参数
const handleDeleteParameter = (parameterName: string): void => {
  if (confirm(`确定要删除参数 "${parameterName}" 吗？`)) {
    const parameterIndex = reportParameters.value.findIndex(param => param.name === parameterName);
    if (parameterIndex !== -1) {
      reportParameters.value.splice(parameterIndex, 1);
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
const handleFieldSave = (fieldOrParam: ReportField | ReportParameter): void => {
  if (isEditingParameter.value) {
    // 处理参数保存
    const existingParamIndex = reportParameters.value.findIndex(p => p.name === fieldOrParam.name);
    
    if (existingParamIndex !== -1 && editingParameter.value?.name !== fieldOrParam.name) {
      // 如果是编辑且参数名已存在，显示错误
      alert('参数名称已存在，请使用其他名称');
      return;
    }
    
    if (existingParamIndex !== -1) {
      // 更新现有参数
      reportParameters.value[existingParamIndex] = fieldOrParam as ReportParameter;
    } else {
      // 添加新参数
      reportParameters.value.push(fieldOrParam as ReportParameter);
    }
  } else {
    // 处理字段保存
    const existingFieldIndex = reportFields.value.findIndex(f => f.name === fieldOrParam.name);
    
    if (existingFieldIndex !== -1 && editingField.value?.name !== fieldOrParam.name) {
      // 如果是编辑且字段名已存在，显示错误
      alert('字段名称已存在，请使用其他名称');
      return;
    }
    
    if (existingFieldIndex !== -1) {
      // 更新现有字段
      reportFields.value[existingFieldIndex] = fieldOrParam as ReportField;
    } else {
      // 添加新字段
      reportFields.value.push(fieldOrParam as ReportField);
    }
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

// 处理表格列移动
const handleMoveColumn = (elementIndex: number, fromIndex: number, toIndex: number, bandIndex: number, parentFrameIndex?: number): void => {
  // 获取当前band
  const band = bands.value[bandIndex];
  if (!band) return;
  
  // 获取要操作的元素
  let element;
  if (parentFrameIndex !== undefined) {
    // 处理Frame内的元素
    const frame = band.elements[parentFrameIndex];
    if (frame && frame.type === 'frame' && frame.elements) {
      element = frame.elements[elementIndex];
    }
  } else {
    // 处理直接在Band中的元素
    element = band.elements[elementIndex];
  }
  
  // 确保是表格元素
  if (!element || element.type !== 'table') return;
  
  const tableElement = element as any;
  if (!tableElement.columns || !Array.isArray(tableElement.columns)) return;
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 执行列移动
  const columns = [...tableElement.columns];
  const [movedColumn] = columns.splice(fromIndex, 1);
  columns.splice(toIndex, 0, movedColumn);
  
  // 更新表格的列
  tableElement.columns = columns;
  
  // 更新JRXML
  updateJRXML();
};

// 处理将选中的列加入组
const handleAddColumnsToGroup = (elementIndex: number, columnIndices: number[], bandIndex: number, parentFrameIndex?: number): void => {
  // 获取当前band
  const band = bands.value[bandIndex];
  if (!band) return;
  
  // 获取要操作的元素
  let element;
  if (parentFrameIndex !== undefined) {
    // 处理Frame内的元素
    const frame = band.elements[parentFrameIndex];
    if (frame && frame.type === 'frame' && frame.elements) {
      element = frame.elements[elementIndex];
    }
  } else {
    // 处理直接在Band中的元素
    element = band.elements[elementIndex];
  }
  
  // 确保是表格元素
  if (!element || element.type !== 'table') return;
  
  const tableElement = element as any;
  if (!tableElement.columns || !Array.isArray(tableElement.columns)) return;
  
  // 确保至少选择了2列
  if (columnIndices.length < 2) return;
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 排序选中的列索引，确保从左到右处理
  const sortedIndices = [...columnIndices].sort((a, b) => a - b);
  
  // 确保sortedIndices不为空
  if (sortedIndices.length === 0) return;
  
  // 获取选中的列
  const selectedColumns = sortedIndices.map(index => tableElement.columns[index]);
  
  // 计算分组宽度
  const groupWidth = selectedColumns.reduce((sum, column) => sum + column.width, 0);
  
  // 创建新的列分组
  const newGroup = {
    uuid: crypto.randomUUID(),
    name: `Group_${Date.now()}`,
    width: groupWidth,
    hasTableHeader: true,
    children: selectedColumns
  };
  
  // 初始化children属性（如果不存在）
  if (!tableElement.children) {
    tableElement.children = [...tableElement.columns];
  }
  
  // 更新children数组，移除选中的列并添加新分组
  const newChildren = [...tableElement.children];
  
  // 从后往前移除选中的列，避免索引偏移
  for (let i = sortedIndices.length - 1; i >= 0; i--) {
    const index = sortedIndices[i] as number;
    newChildren.splice(index, 1);
  }
  
  // 在第一个选中列的位置插入新分组
  const firstIndex = sortedIndices[0] as number;
  newChildren.splice(firstIndex, 0, newGroup);
  
  // 更新表格元素
  tableElement.children = newChildren;
  
  // 更新JRXML
  updateJRXML();
};

// 处理将选中的列加入现有组
const handleJoinColumnsToExistingGroup = (elementIndex: number, columnIndices: number[], bandIndex: number, parentFrameIndex?: number): void => {
  // 获取当前band
  const band = bands.value[bandIndex];
  if (!band) return;
  
  // 获取要操作的元素
  let element;
  if (parentFrameIndex !== undefined) {
    // 处理Frame内的元素
    const frame = band.elements[parentFrameIndex];
    if (frame && frame.type === 'frame' && frame.elements) {
      element = frame.elements[elementIndex];
    }
  } else {
    // 处理直接在Band中的元素
    element = band.elements[elementIndex];
  }
  
  // 确保是表格元素
  if (!element || element.type !== 'table') return;
  
  const tableElement = element as any;
  if (!tableElement.columns || !Array.isArray(tableElement.columns)) return;
  
  // 确保至少选择了1列
  if (columnIndices.length < 1) return;
  
  // 收集所有现有的列分组
  const existingGroups: any[] = [];
  
  // 递归收集所有分组
  const collectGroups = (items: any[]): void => {
    items.forEach(item => {
      if (item.children) {
        existingGroups.push(item);
        collectGroups(item.children);
      }
    });
  };
  
  // 初始化children属性（如果不存在）
  if (!tableElement.children) {
    tableElement.children = [...tableElement.columns];
  }
  
  // 收集现有分组
  collectGroups(tableElement.children);
  
  // 更新对话框状态
  groupDialogState.value = {
    elementIndex,
    columnIndices,
    bandIndex,
    parentFrameIndex,
    existingGroups,
    selectedGroupName: ''
  };
  
  // 显示对话框
  showGroupDialog.value = true;
};

// 确认将列加入组
const confirmJoinColumnsToGroup = (): void => {
  const { elementIndex, columnIndices, bandIndex, parentFrameIndex, existingGroups, selectedGroupName } = groupDialogState.value;
  
  if (!selectedGroupName) {
    // 如果用户没有输入组名称，直接返回
    return;
  }
  
  // 获取当前band
  const band = bands.value[bandIndex];
  if (!band) return;
  
  // 获取要操作的元素
  let element;
  if (parentFrameIndex !== undefined) {
    // 处理Frame内的元素
    const frame = band.elements[parentFrameIndex];
    if (frame && frame.type === 'frame' && frame.elements) {
      element = frame.elements[elementIndex];
    }
  } else {
    // 处理直接在Band中的元素
    element = band.elements[elementIndex];
  }
  
  // 确保是表格元素
  if (!element || element.type !== 'table') return;
  
  const tableElement = element as any;
  if (!tableElement.columns || !Array.isArray(tableElement.columns)) return;
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 排序选中的列索引，确保从左到右处理
  const sortedIndices = [...columnIndices].sort((a, b) => a - b);
  
  // 获取选中的列
  const selectedColumns = sortedIndices.map(index => tableElement.columns[index]);
  
  // 初始化children数组（如果不存在）
  if (!tableElement.children) {
    // 从columns数组创建初始children数组
    tableElement.children = [...tableElement.columns];
  }
  
  // 查找用户指定的组
  let targetGroup = existingGroups.find(group => group.name === selectedGroupName);
  
  // 先创建新的children数组，避免索引偏移问题
  const newChildren = [...tableElement.children];
  
  // 从后往前移除选中的列，避免索引偏移
  for (let i = sortedIndices.length - 1; i >= 0; i--) {
    const index = sortedIndices[i] as number;
    newChildren.splice(index, 1);
  }
  
  if (!targetGroup) {
    // 如果组不存在，创建新组
    const groupWidth = selectedColumns.reduce((sum, column) => sum + column.width, 0);
    
    // 获取选中列中第一个列的头部高度，作为新组的默认高度
    let defaultTableHeaderHeight = 30;
    let defaultColumnHeaderHeight = 30;
    if (selectedColumns.length > 0 && selectedColumns[0]) {
      const firstColumn = selectedColumns[0];
      defaultTableHeaderHeight = firstColumn.tableHeader?.height || 30;
      defaultColumnHeaderHeight = firstColumn.columnHeader?.height || 30;
    }
    
    targetGroup = {
      uuid: crypto.randomUUID(),
      name: selectedGroupName,
      width: groupWidth,
      hasTableHeader: true,
      // 添加必要的头部属性，确保在UI中可见
      tableHeader: {
        type: 'staticText',
        text: selectedGroupName,
        x: 0,
        y: 0,
        width: groupWidth,
        height: defaultTableHeaderHeight,
        textAlignment: 'Center',
        verticalAlignment: 'Middle'
      },
      children: []
    };
    
    // 在第一个选中列的位置插入新分组
    const firstIndex = sortedIndices[0] as number;
    newChildren.splice(firstIndex, 0, targetGroup);
  }
  
  // 将选中的列添加到目标组
  targetGroup.children.push(...selectedColumns);
  
  // 重新计算目标组的宽度
  targetGroup.width = targetGroup.children.reduce((sum: number, item: any) => sum + item.width, 0);
  
  // 更新目标组的头部宽度
  if (targetGroup.tableHeader) {
    targetGroup.tableHeader.width = targetGroup.width;
  }
  if (targetGroup.columnHeader) {
    targetGroup.columnHeader.width = targetGroup.width;
  }
  
  // 更新表格元素
  tableElement.children = newChildren;
  
  // 不再从columns数组中移除列，而是让generateTableXML函数通过uuid来避免重复处理
  // 这样可以确保JRXML生成正确，同时保持数据结构的一致性
  // 表格渲染时会优先使用children数组中的分组结构
  
  // 更新JRXML
  updateJRXML();
  
  // 关闭对话框
  showGroupDialog.value = false;
};

// 处理元素上下文菜单
const handleElementContextMenu = (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number): void => {
  // 可以在这里添加上下文菜单的处理逻辑
  // 例如：显示右键菜单，提供元素操作选项
  console.log('Context menu requested for element:', bandIndex, elementIndex, parentFrameIndex);
  
  // 阻止默认上下文菜单
  event.preventDefault();
  
  // 选中元素
  selectElement(bandIndex, elementIndex, false, parentFrameIndex);
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
/* 组名称输入对话框样式 */
.group-dialog {
  width: 400px;
}

.existing-groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.existing-group-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.existing-group-tag:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-undo-redo {
  display: flex;
  gap: 6px;
  align-items: center;
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

/* 坐标显示样式 */
.coordinates-display, .band-height-display {
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

.empty-state p {
  margin: 0 0 10px 0;
}

</style>
  