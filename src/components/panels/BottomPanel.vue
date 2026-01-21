<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';
import ResizablePanel from './ResizablePanel.vue';
import PdfPreviewModal from '../modals/PdfPreviewModal.vue';
import {
  UI_CONSTANTS,
  PANEL_CONSTANTS
} from '../../constants/constants';
import { getAvailableFonts } from '../../utils/fontUtils';
import type { Band, BandType } from '../../types';

const { t } = useI18n();

// 获取Band显示名称
function getBandDisplayName(bandType: string): string {
  // Assuming keys exist in bandNames section of locale files.
  return t(`bandNames.${bandType}`);
}

// 定义组件属性
interface Props {
  visible: boolean;
  initialHeight?: number;
  reportProperties: any;
  bands: Band[];
  allBandTypes: any[];
  selectedBandTypes: BandType[];
  jrxmlContent: string;
  previewServerUrl?: string;
}

// 定义组件事件
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'size-change', value: number): void;
  (e: 'update:report-properties', value: any): void;
  (e: 'update:selected-band-types', value: BandType[]): void;
  (e: 'update:jrxml-content', value: string): void;
  (e: 'copy-jrxml'): void;
  (e: 'save-jrxml'): void;
  (e: 'regenerate-jrxml'): void;
  (e: 'generate-jrxml'): void;
  (e: 'band-selection-change'): void;
}

// 使用defineProps和defineEmits
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialHeight: PANEL_CONSTANTS.DEFAULT_BOTTOM_PANEL_HEIGHT
});

const emit = defineEmits<Emits>();

// 标签页相关
const activeTab = ref('pageSettings');
const tabs = ref([
  { id: 'pageSettings', name: '页面设置' },
  { id: 'jrxml', name: 'JRXML内容' }
]);

// 底部面板高度
const bottomPanelHeight = ref(props.initialHeight);

// 纸张规格定义
const PAPER_SIZES = [
  { name: 'Letter', width: 612, height: 792 },
  { name: 'Legal', width: 612, height: 1008 },
  { name: 'A0', width: 2384, height: 3370 },
  { name: 'A1', width: 1684, height: 2384 },
  { name: 'A2', width: 1191, height: 1684 },
  { name: 'A3', width: 842, height: 1190 },
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'A6', width: 298, height: 420 },
  { name: 'A7', width: 210, height: 298 },
  { name: 'A8', width: 147, height: 210 },
  { name: 'A9', width: 105, height: 147 },
  { name: 'A10', width: 74, height: 105 },
  { name: 'B0', width: 2835, height: 4008 },
  { name: 'B1', width: 2004, height: 2835 },
  { name: 'B2', width: 1417, height: 2004 },
  { name: 'B3', width: 1001, height: 1417 },
  { name: 'B4', width: 708, height: 1000 },
  { name: 'B5', width: 498, height: 708 },
  { name: 'B6', width: 354, height: 499 },
  { name: 'B7', width: 249, height: 354 },
  { name: 'B8', width: 176, height: 249 },
  { name: 'B9', width: 125, height: 176 },
  { name: 'B10', width: 88, height: 125 },
  { name: 'C0', width: 2599, height: 3676 },
  { name: 'C1', width: 1837, height: 2599 },
  { name: 'C2', width: 1298, height: 1837 },
  { name: 'C3', width: 918, height: 1298 },
  { name: 'C4', width: 649, height: 918 },
  { name: 'C5', width: 459, height: 649 },
  { name: 'C6', width: 323, height: 459 },
  { name: 'C7', width: 230, height: 323 },
  { name: 'C8', width: 162, height: 230 },
  { name: 'C9', width: 113, height: 162 },
  { name: 'C10', width: 79, height: 113 },
  { name: 'RA0', width: 2437, height: 3458 },
  { name: 'RA1', width: 1729, height: 2437 },
  { name: 'RA2', width: 1218, height: 1729 },
  { name: 'SRA0', width: 2551, height: 3628 },
  { name: 'SRA1', width: 1814, height: 2551 },
  { name: 'SRA2', width: 1275, height: 1814 },
  { name: 'Executive', width: 522, height: 756 },
  { name: 'Statement', width: 396, height: 612 },
  { name: 'Tabloid', width: 792, height: 1224 },
  { name: 'Ledger', width: 1224, height: 792 },
  { name: 'Note', width: 540, height: 780 },
  { name: 'Folio', width: 612, height: 936 },
  { name: 'Quarto', width: 610, height: 780 },
  { name: '10x14', width: 720, height: 1008 },
  { name: 'Custom', width: 0, height: 0 }
];

const selectedPaperSize = ref('A4');
const orientation = ref('Portrait');

// 可用字体列表
const availableFonts = ref<string[]>([]);

// PDF预览Modal显示状态
const showPdfPreview = ref(false);

onMounted(async () => {
  availableFonts.value = await getAvailableFonts();
});

// 打开PDF预览
const openPdfPreview = (): void => {
  if (!localJrxmlContent.value) {
    alert('请先生成 JRXML 内容');
    return;
  }
  showPdfPreview.value = true;
};

// 计算属性：本地绑定的reportProperties
const localReportProperties = computed({
  get: () => props.reportProperties,
  set: (value) => emit('update:report-properties', value)
});

// 检测纸张大小和方向
const detectPaperSizeAndOrientation = () => {
  if (!props.reportProperties) return;
  
  const w = props.reportProperties.pageWidth;
  const h = props.reportProperties.pageHeight;
  const isLandscape = w > h;
  
  // 只有在非手动更改方向时才更新方向（为了避免循环更新），但这里主要是初始化检测
  // 实际上我们应该总是信任当前的宽高比
  orientation.value = isLandscape ? 'Landscape' : 'Portrait';
  
  // 检查是否匹配预设尺寸
  // 如果是横向，宽是长边；如果是纵向，高是长边
  // 预设尺寸中 width 是短边，height 是长边
  const checkW = isLandscape ? h : w;
  const checkH = isLandscape ? w : h;
  
  const match = PAPER_SIZES.find(s => s.name !== 'Custom' && s.width === checkW && s.height === checkH);
  selectedPaperSize.value = match ? match.name : 'Custom';
};

// 监听 reportProperties 变化，更新选中状态
// 使用 deep: true 监听内部属性变化
watch(() => props.reportProperties, () => {
  // 当宽高发生变化时，重新检测
  // 注意：这可能会在我们将要修改宽高时触发，所以需要小心处理
  // 这里我们只在宽高不匹配当前选中的规格时更新
  detectPaperSizeAndOrientation();
}, { deep: true, immediate: true });

// 处理纸张规格变化
const handlePaperSizeChange = () => {
  if (selectedPaperSize.value === 'Custom') return;
  
  const size = PAPER_SIZES.find(s => s.name === selectedPaperSize.value);
  if (!size) return;
  
  // 根据当前方向应用尺寸
  if (orientation.value === 'Landscape') {
    localReportProperties.value.pageWidth = size.height;
    localReportProperties.value.pageHeight = size.width;
  } else {
    localReportProperties.value.pageWidth = size.width;
    localReportProperties.value.pageHeight = size.height;
  }
};

// 处理方向变化
const handleOrientationChange = () => {
  const w = localReportProperties.value.pageWidth;
  const h = localReportProperties.value.pageHeight;
  
  if (orientation.value === 'Landscape') {
    // 切换到横向：如果当前是纵向（宽 < 高），则交换
    if (w < h) {
      localReportProperties.value.pageWidth = h;
      localReportProperties.value.pageHeight = w;
    }
  } else {
    // 切换到纵向：如果当前是横向（宽 > 高），则交换
    if (w > h) {
      localReportProperties.value.pageWidth = h;
      localReportProperties.value.pageHeight = w;
    }
  }
};

// 计算属性：本地绑定的selectedBandTypes
const localSelectedBandTypes = computed({
  get: () => props.selectedBandTypes,
  set: (value) => emit('update:selected-band-types', value)
});

// 计算属性：本地绑定的jrxmlContent
const localJrxmlContent = computed({
  get: () => props.jrxmlContent,
  set: (value) => emit('update:jrxml-content', value)
});

// 计算行号
const lineNumbers = computed(() => {
  if (!localJrxmlContent.value) return '';
  const lines = localJrxmlContent.value.split('\n').length;
  return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
});

// 引用
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const lineNumbersRef = ref<HTMLDivElement | null>(null);

// 同步滚动
const syncScroll = () => {
  if (textareaRef.value && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop;
  }
};

// 处理底部面板大小变化
const handleBottomPanelSizeChange = (newSize: number) => {
  bottomPanelHeight.value = newSize;
  emit('size-change', newSize);
};

// 处理Band选择变化
const handleBandSelectionChange = () => {
  // localSelectedBandTypes是计算属性，已经通过v-model自动更新到父组件
  // 这里只需要触发band-selection-change事件，让父组件执行相关逻辑
  emit('band-selection-change');
};

// 复制JRXML内容到剪贴板
const copyJRXML = async (): Promise<void> => {
  emit('copy-jrxml');
};

// 重新生成JRXML内容
const regenerateJRXML = (): void => {
  emit('regenerate-jrxml');
};

// 生成JRXML内容并下载
const generateJRXML = (): void => {
  // 切换到JRXML标签页
  activeTab.value = 'jrxml';
  emit('generate-jrxml');
};

// 保存编辑后的JRXML内容
const saveJRXML = (): void => {
  emit('save-jrxml');
};
</script>

<template>
  <ResizablePanel 
    v-show="visible"
    position="bottom"
    :initial-size="bottomPanelHeight"
    :min-size="150"
    :max-size="400"
    :collapsible="true"
    @size-change="handleBottomPanelSizeChange"
  >
    <div class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-button" 
        :class="{ 'active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <!-- 页面设置标签 -->
    <div class="tab-content page-settings-tab" v-show="activeTab === 'pageSettings'">
      <div class="settings-grid">
        <div class="settings-section">
          <h4>{{ t('bottomPanel.basicInfo') }}</h4>
          <div class="form-group">
            <label>{{ t('bottomPanel.reportName') }}</label>
            <input v-model="localReportProperties.name" type="text" />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ t('bottomPanel.paperSize') }}</label>
              <select v-model="selectedPaperSize" @change="handlePaperSizeChange">
                <option v-for="size in PAPER_SIZES" :key="size.name" :value="size.name">
                  {{ size.name }}
                </option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>{{ t('bottomPanel.paperOrientation') }}</label>
              <select v-model="orientation" @change="handleOrientationChange">
                <option value="Portrait">{{ t('bottomPanel.portrait') }}</option>
                <option value="Landscape">{{ t('bottomPanel.landscape') }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ t('bottomPanel.pageWidth') }}</label>
              <input v-model.number="localReportProperties.pageWidth" type="number" />
            </div>
            <div class="form-group flex-1">
              <label>{{ t('bottomPanel.pageHeight') }}</label>
              <input v-model.number="localReportProperties.pageHeight" type="number" />
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>{{ t('bottomPanel.pageMargins') }}</h4>
          <div class="form-group">
            <label>{{ t('bottomPanel.marginsPx') }}</label>
            <div class="margin-inputs">
              <input v-model.number="localReportProperties.leftMargin" type="number" :placeholder="t('properties.leftSide')" />
              <input v-model.number="localReportProperties.rightMargin" type="number" :placeholder="t('properties.rightSide')" />
              <input v-model.number="localReportProperties.topMargin" type="number" :placeholder="t('properties.topSide')" />
              <input v-model.number="localReportProperties.bottomMargin" type="number" :placeholder="t('properties.bottomSide')" />
            </div>
          </div>
        </div>

        <!-- 字体设置 - 紧凑布局 -->
        <div class="settings-section font-settings-compact">
          <h4>{{ t('bottomPanel.defaultFontSettings') }}</h4>
          <div class="font-settings-row">
            <div class="font-setting-item">
              <label>{{ t('properties.fontName') }}</label>
              <select v-model="localReportProperties.defaultFont.name">
                <option v-for="font in availableFonts" :key="font" :value="font">{{ font }}</option>
              </select>
            </div>
            <div class="font-setting-item">
              <label>{{ t('properties.fontSize') }}</label>
              <input v-model.number="localReportProperties.defaultFont.size" type="number" />
            </div>
          </div>
          <div class="font-style-options">
            <label>
              <input v-model="localReportProperties.defaultFont.isBold" type="checkbox" />
              {{ t('properties.bold') }}
            </label>
            <label>
              <input v-model="localReportProperties.defaultFont.isItalic" type="checkbox" />
              {{ t('properties.italic') }}
            </label>
            <label>
              <input v-model="localReportProperties.defaultFont.isUnderline" type="checkbox" />
              {{ t('properties.underline') }}
            </label>
          </div>
        </div>
        
        <!-- Band选择 -->
        <div class="settings-section band-selection-section">
          <h4>{{ t('bottomPanel.bandSelection') }}</h4>
          <div class="band-selection-grid">
            <div v-for="bandType in allBandTypes" :key="bandType.type" class="band-selection-item">
              <label>
                <input 
                  type="checkbox" 
                  :value="bandType.type"
                  v-model="localSelectedBandTypes"
                  @change="handleBandSelectionChange"
                />
                {{ getBandDisplayName(bandType.type) }}
              </label>
            </div>
          </div>
          <div class="band-selection-note">
            <small>{{ t('bottomPanel.bandSelectionHint') }}</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- JRXML内容标签 -->
    <div class="tab-content jrxml-tab" v-show="activeTab === 'jrxml'">
      <div class="jrxml-container">
        <div class="jrxml-header">
          <div class="jrxml-actions">
            <n-button @click="copyJRXML" type="default" size="small">{{ t('bottomPanel.copy') }}</n-button>
            <n-button @click="saveJRXML" type="primary" size="small">{{ t('bottomPanel.apply') }}</n-button>
            <n-button @click="regenerateJRXML" type="default" size="small">{{ t('bottomPanel.regenerate') }}</n-button>
            <n-button @click="generateJRXML" type="primary" size="small">{{ t('bottomPanel.generateJRXML') }}</n-button>
            <n-button @click="openPdfPreview" type="info" size="small">{{ t('bottomPanel.previewPDF') }}</n-button>
          </div>
        </div>
        <div class="jrxml-content">
          <div v-if="localJrxmlContent" class="editor-container">
            <div class="line-numbers" ref="lineNumbersRef">{{ lineNumbers }}</div>
            <textarea 
              ref="textareaRef"
              v-model="localJrxmlContent" 
              class="jrxml-editor" 
              spellcheck="false"
              @keyup.ctrl.s.prevent="saveJRXML"
              @scroll="syncScroll"
              @input="syncScroll" 
            ></textarea>
          </div>
          <div v-else class="jrxml-placeholder">{{ t('bottomPanel.clickToGenerate') }}</div>
        </div>
      </div>
    </div>
  </ResizablePanel>

  <PdfPreviewModal
    :visible="showPdfPreview"
    :jrxml-content="localJrxmlContent"
    :preview-server-url="props.previewServerUrl"
    @update:visible="showPdfPreview = $event"
  />
</template>

<style scoped>
.tabs-container {
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 70vh; /* 限制最大高度，避免占用过多屏幕空间 */
}

.tab-navigation {
  display: flex;
  background-color: #e9e9e9;
  border-bottom: 1px solid #ddd;
  padding: 0 10px;
  flex-shrink: 0; /* 确保导航栏不会被压缩 */
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-button.active {
  border-bottom-color: #4a90e2;
  color: #4a90e2;
  font-weight: bold;
}

.tab-button:hover:not(.active) {
  background-color: #f0f0f0;
}

.tab-content {
  flex: 1;
  overflow: auto;
  min-height: 0; /* 确保flex子元素可以收缩 */
  padding: 15px;
  box-sizing: border-box;
}

.jrxml-tab {
  background-color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-settings-tab {
  background-color: white;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 15px;
}

.settings-section {
  background-color: #f9f9f9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_MEDIUM + "px"');
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e8e8e8;
}

.settings-section h4 {
  margin-top: 0;
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  color: #333;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MEDIUM + "px"');
  font-weight: 600;
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  padding-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

/* 表单行布局 */
.form-row {
  display: flex;
  gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  margin-bottom: 0.75rem;
}

.flex-1 {
  flex: 1;
}

/* 紧凑字体设置样式 */
.font-settings-compact {
  grid-column: span 1;
}

.font-settings-row {
  display: flex;
  gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
}

.font-setting-item {
  flex: 1;
}

.font-setting-item select,
.font-setting-item input {
  width: 100%;
  padding: v-bind('UI_CONSTANTS.INPUT_PADDING_SMALL');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
}

.font-style-options {
  display: flex;
  gap: v-bind('UI_CONSTANTS.MEDIUM_GAP + "px"');
  flex-wrap: wrap;
}

.font-style-options label {
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  margin-bottom: 0;
  font-weight: normal;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
}

.checkbox-group {
  display: flex;
  gap: v-bind('UI_CONSTANTS.MEDIUM_GAP + "px"');
  flex-wrap: wrap;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  margin-bottom: 0;
  font-weight: normal;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
}

.jrxml-container {
  background-color: #f5f5f5;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.jrxml-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #e9e9e9;
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  flex-shrink: 0;
}

.jrxml-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
}

.editor-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.line-numbers {
  flex-shrink: 0;
  width: 40px;
  background-color: #f0f0f0;
  color: #999;
  text-align: right;
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"') 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  line-height: 1.5;
  overflow: hidden;
  user-select: none;
  border-right: 1px solid #ddd;
  white-space: pre;
  box-sizing: border-box;
}

.jrxml-editor {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
  background-color: #f8f9fa;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  line-height: 1.5;
  white-space: pre; /* 保持 pre，不换行，以保持行号对应 */
  word-wrap: normal; /* 不自动换行 */
  overflow-x: auto; /* 允许横向滚动 */
  border: none;
  outline: none;
  resize: none;
  tab-size: 2;
  box-sizing: border-box;
  color: #333;
}

.jrxml-editor:focus {
  border: none;
  outline: none;
}

.jrxml-actions {
  display: flex;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
}

.jrxml-placeholder {
  padding: v-bind('UI_CONSTANTS.LARGE_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  text-align: center;
  color: #999;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.band-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.band-selection-item {
  margin: 0;
}

.band-selection-note {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #e0e0e0;
}

.margin-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: v-bind('UI_CONSTANTS.INPUT_PADDING_SMALL');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #4a90e2;
  outline: none;
}


</style>