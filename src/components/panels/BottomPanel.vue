<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ResizablePanel from './ResizablePanel.vue';
import {
  UI_CONSTANTS,
  PANEL_CONSTANTS
} from '../../constants/constants';
import { getAvailableFonts } from '../../utils/fontUtils';
import type { Band, BandType } from '../../types';

// 定义组件属性
interface Props {
  visible: boolean;
  initialHeight?: number;
  reportProperties: any;
  bands: Band[];
  allBandTypes: any[];
  selectedBandTypes: BandType[];
  jrxmlContent: string;
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

// 可用字体列表
const availableFonts = ref<string[]>([]);

// PDF预览Modal显示状态
const showPdfPreview = ref(false);

onMounted(async () => {
  availableFonts.value = await getAvailableFonts();
});

// 打开PDF预览（新标签页）
const openPdfPreview = (): void => {
  if (!localJrxmlContent.value) {
    alert('请先生成 JRXML 内容');
    return;
  }

  const PDF_PREVIEW_API = 'http://43.133.226.50/api/pdf/generateForm';
  
  // 创建动态表单
  const form = document.createElement('form');
  form.action = PDF_PREVIEW_API;
  form.method = 'POST';
  form.target = '_blank';
  form.style.display = 'none';
  
  // 添加JRXML内容字段
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'jrxml';
  input.value = localJrxmlContent.value;
  
  form.appendChild(input);
  document.body.appendChild(form);
  
  // 提交表单
  form.submit();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(form);
  }, 100);
};

// 计算属性：本地绑定的reportProperties
const localReportProperties = computed({
  get: () => props.reportProperties,
  set: (value) => emit('update:report-properties', value)
});

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
          <h4>基本信息</h4>
          <div class="form-group">
            <label>报表名称</label>
            <input v-model="localReportProperties.name" type="text" />
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>页面宽度</label>
              <input v-model.number="localReportProperties.pageWidth" type="number" />
            </div>
            <div class="form-group flex-1">
              <label>页面高度</label>
              <input v-model.number="localReportProperties.pageHeight" type="number" />
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>页边距设置</h4>
          <div class="form-group">
            <label>页边距 (px)</label>
            <div class="margin-inputs">
              <input v-model.number="localReportProperties.leftMargin" type="number" placeholder="左" />
              <input v-model.number="localReportProperties.rightMargin" type="number" placeholder="右" />
              <input v-model.number="localReportProperties.topMargin" type="number" placeholder="上" />
              <input v-model.number="localReportProperties.bottomMargin" type="number" placeholder="下" />
            </div>
          </div>
        </div>

        <!-- 字体设置 - 紧凑布局 -->
        <div class="settings-section font-settings-compact">
          <h4>默认字体设置</h4>
          <div class="font-settings-row">
            <div class="font-setting-item">
              <label>字体名称</label>
              <select v-model="localReportProperties.defaultFont.name">
                <option v-for="font in availableFonts" :key="font" :value="font">{{ font }}</option>
              </select>
            </div>
            <div class="font-setting-item">
              <label>字体大小</label>
              <input v-model.number="localReportProperties.defaultFont.size" type="number" />
            </div>
          </div>
          <div class="font-style-options">
            <label>
              <input v-model="localReportProperties.defaultFont.isBold" type="checkbox" />
              粗体
            </label>
            <label>
              <input v-model="localReportProperties.defaultFont.isItalic" type="checkbox" />
              斜体
            </label>
            <label>
              <input v-model="localReportProperties.defaultFont.isUnderline" type="checkbox" />
              下划线
            </label>
          </div>
        </div>
        
        <!-- Band选择 -->
        <div class="settings-section band-selection-section">
          <h4>Band选择</h4>
          <div class="band-selection-grid">
            <div v-for="bandType in allBandTypes" :key="bandType.type" class="band-selection-item">
              <label>
                <input 
                  type="checkbox" 
                  :value="bandType.type"
                  v-model="localSelectedBandTypes"
                  @change="handleBandSelectionChange"
                />
                {{ bandType.name }}
              </label>
            </div>
          </div>
          <div class="band-selection-note">
            <small>勾选的band将自动添加到报表中，取消勾选的band将从报表中移除</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- JRXML内容标签 -->
    <div class="tab-content jrxml-tab" v-show="activeTab === 'jrxml'">
      <div class="jrxml-container">
        <div class="jrxml-header">
          <div class="jrxml-actions">
            <button @click="copyJRXML" class="btn-secondary btn-small">复制</button>
            <button @click="saveJRXML" class="btn-primary btn-small">应用</button>
            <button @click="regenerateJRXML" class="btn-secondary btn-small">重新生成</button>
            <button @click="generateJRXML" class="btn-primary btn-small">生成JRXML</button>
            <button @click="openPdfPreview" class="btn-preview btn-small">预览PDF</button>
          </div>
        </div>
        <div class="jrxml-content">
          <textarea 
            v-if="localJrxmlContent" 
            v-model="localJrxmlContent" 
            class="jrxml-editor" 
            spellcheck="false"
            @keyup.ctrl.s.prevent="saveJRXML"
          ></textarea>
          <div v-else class="jrxml-placeholder">点击"生成JRXML"按钮查看内容</div>
        </div>
      </div>
    </div>
  </ResizablePanel>
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

.jrxml-editor {
  width: 100%;
  height: 100%;
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
  background-color: #f8f9fa;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: none;
  outline: none;
  resize: none;
  tab-size: 2;
  box-sizing: border-box;
  /* 优化代码显示效果 */
  color: #333;
  text-shadow: 0 1px 0 rgba(255,255,255,.8);
  /* 增加行号效果的背景 */
  background-image: linear-gradient(transparent 19px, #eee 19px, #eee 20px, transparent 20px);
  background-size: 100% v-bind('UI_CONSTANTS.LINE_HEIGHT_PX + "px"');
  background-position: 0 1em;
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

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-secondary {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  color: #333;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-primary {
  background-color: #4a90e2;
  border: 1px solid #4a90e2;
  color: white;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #3a80d2;
}

.btn-preview {
  background-color: #9b59b6;
  border: 1px solid #9b59b6;
  color: white;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover {
  background-color: #8e44ad;
}
</style>