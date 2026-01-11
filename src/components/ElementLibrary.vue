<template>
  <div class="element-library">
    <!-- 基础元素库 -->
    <div class="element-list-container">
      <h3>元素库</h3>
      <div class="element-list">
        <div 
          v-for="element in elements" 
          :key="element.type"
          class="element-item"
          @dragstart="handleDragStart($event, element)"
          @dblclick="handleElementDoubleClick(element)"
          draggable="true"
        >
          <span class="element-icon">{{ getElementIcon(element.type) }}</span>
          <span class="element-name">{{ element.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 报表元素区域 -->
    <div class="report-elements-section">
      <h4>报表元素</h4>
      <div class="filter-input-container">
        <input 
          v-model="elementFilterText" 
          type="text" 
          placeholder="过滤元素..." 
          class="filter-input"
        />
        <button 
          v-if="elementFilterText" 
          @click="elementFilterText = ''" 
          class="clear-filter-btn"
          title="清除过滤"
        >
          ✕
        </button>
      </div>
      <div class="report-elements-list">
        <div v-for="(elements, bandName) in groupedReportElements" :key="bandName" class="band-group">
          <div class="band-group-header">{{ bandName }}</div>
          <div 
            v-for="element in elements" 
            :key="getElementKey(element)"
            class="report-element-item"
            :class="{ 'selected': isElementSelected(element, selectedElement) }"
            @click="selectElementFromList(element, selectElement)"
          >
            <span class="element-icon">{{ getElementIcon(element.element.type) }}</span>
            <span class="element-info">{{ getElementDisplayInfoWithoutBand(element.element) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 报表参数区域 -->
    <div class="data-parameters-section">
      <h4>报表参数</h4>
      <div class="parameters-mini-view">
        <div 
          v-for="(param, index) in reportParameters" 
          :key="index" 
          class="field-mini-item"
          @click="selectElementsByParameterWrapper(param.name)"
        >
          <span class="field-name">$P{ {{ param.name }} }</span>
          <span class="field-type">({{ param.class }})</span>
        </div>
      </div>
    </div>
    
    <!-- 数据字段区域 -->
    <div class="data-fields-section">
      <div class="section-header">
        <h4>数据字段</h4>
        <button class="add-button" @click="handleAddField" title="添加数据字段">+</button>
      </div>
      <div class="fields-mini-view">
        <div 
          v-for="(field, index) in reportFields" 
          :key="field.name" 
          class="field-mini-item"
        >
          <div class="field-info" @click="selectElementsByFieldWrapper(field.name)">
            <span class="field-name">$F{ {{ field.name }} }</span>
            <span class="field-type">({{ field.class }})</span>
          </div>
          <div class="field-actions">
            <button class="action-button edit-button" @click.stop="handleEditField(field)" title="编辑字段">✏️</button>
            <button class="action-button delete-button" @click.stop="handleDeleteField(field.name)" title="删除字段">🗑️</button>
          </div>
        </div>
        <div v-if="reportFields.length === 0" class="empty-state">
          <p>暂无数据字段</p>
          <p class="empty-hint">点击上方「+」按钮添加字段</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DesignElement, StaticTextElement, TextFieldElement, ReportField, ReportParameter } from '../types';
import {
  getElementDisplayInfoWithoutBand,
  getElementIcon,
  getElementKey,
  isElementSelected,
  selectElementFromList,
  selectElementsByField,
  selectElementsByParameter
} from '../utils/elementUtils';

// 定义组件属性
interface Props {
  elements: Array<{ type: string; name: string }>;
  reportFields: ReportField[];
  reportParameters: ReportParameter[];
  bands: Array<{ type: string; name?: string; elements: DesignElement[] }>;
  selectedElement: any;
}

// 定义组件事件
interface Emits {
  (e: 'drag-start', event: DragEvent, element: any): void;
  (e: 'element-double-click', element: any): void;
  (e: 'select-element', bandIndex: number, elementIndex: number): void;
  (e: 'add-field'): void;
  (e: 'edit-field', field: ReportField): void;
  (e: 'delete-field', fieldName: string): void;
}

// 使用默认值
const props = withDefaults(defineProps<Props>(), {
  elements: () => [],
  reportFields: () => [],
  reportParameters: () => [],
  bands: () => [],
  selectedElement: null
});

const emit = defineEmits<Emits>();

// 元素过滤文本
const elementFilterText = ref('');

// 计算属性：按band分组的报表元素
const groupedReportElements = computed(() => {
  const grouped: Record<string, any[]> = {};
  
  props.bands.forEach((band, bandIndex) => {
    if (band.elements && band.elements.length > 0) {
      const bandName = band.name || getBandDisplayName(band.type);
      if (!grouped[bandName]) {
        grouped[bandName] = [];
      }
      
      band.elements.forEach((element, elementIndex) => {
        if (!elementFilterText.value || 
            element.type.toLowerCase().includes(elementFilterText.value.toLowerCase()) ||
            (element.type === 'staticText' && (element as StaticTextElement).text && ((element as StaticTextElement).text || '').toLowerCase().includes(elementFilterText.value.toLowerCase())) ||
            (element.type === 'textField' && ((element as TextFieldElement).fieldName && ((element as TextFieldElement).fieldName || '').toLowerCase().includes(elementFilterText.value.toLowerCase()) || 
             (element as TextFieldElement).expression && ((element as TextFieldElement).expression || '').toLowerCase().includes(elementFilterText.value.toLowerCase())))
        ) {
          grouped[bandName]?.push({
            element,
            bandIndex,
            elementIndex
          });
        }
      });
    }
  });
  
  return grouped;
});

// 获取band显示名称
function getBandDisplayName(bandType: string): string {
  const bandNames: Record<string, string> = {
    'TITLE': '标题',
    'PAGE_HEADER': '页眉',
    'COLUMN_HEADER': '列标题',
    'DETAIL': '详细数据',
    'COLUMN_FOOTER': '列脚',
    'PAGE_FOOTER': '页脚',
    'SUMMARY': '汇总',
    'BACKGROUND': '背景',
    'LAST_PAGE_FOOTER': '末页页脚',
    'NO_DATA': '无数据'
  };
  
  return bandNames[bandType] || bandType;
}

// 处理拖拽开始
function handleDragStart(event: DragEvent, element: any): void {
  emit('drag-start', event, element);
}

// 处理元素双击
function handleElementDoubleClick(element: any): void {
  emit('element-double-click', element);
}

// 选择元素
function selectElement(bandIndex: number, elementIndex: number): void {
  emit('select-element', bandIndex, elementIndex);
}

// 通过参数选择元素（包装函数）
function selectElementsByParameterWrapper(paramName: string): void {
  selectElementsByParameter( props.bands, paramName,selectElement);
}

// 通过字段选择元素（包装函数）
function selectElementsByFieldWrapper(fieldName: string): void {
  selectElementsByField( props.bands,fieldName, selectElement);
}

// 处理添加字段
function handleAddField(): void {
  emit('add-field');
}

// 处理编辑字段
function handleEditField(field: ReportField): void {
  emit('edit-field', field);
}

// 处理删除字段
function handleDeleteField(fieldName: string): void {
  emit('delete-field', fieldName);
}
</script>

<style scoped>
.element-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  gap: 16px;
}

.element-list-container h3,
.report-elements-section h4,
.data-parameters-section h4,
.data-fields-section h4 {
  margin-top: 0;
  margin-bottom: 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.add-button {
  width: 20px;
  height: 20px;
  border: none;
  background-color: #4a90e2;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.add-button:hover {
  background-color: #3a80d2;
  transform: scale(1.1);
}

.element-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  /* margin-bottom: 16px; */
}

.element-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s ease;
  min-height: 80px;
}

.element-item:hover {
  background-color: #e0e0e0;
  border-color: #999;
  transform: translateY(-1px);
}

.element-item:active {
  cursor: grabbing;
}

.element-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.element-name {
  font-size: 12px;
  text-align: center;
  word-break: break-word;
}

.report-elements-section,
.data-parameters-section,
.data-fields-section {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.filter-input-container {
  position: relative;
  margin-bottom: 12px;
}

.filter-input {
  width: 100%;
  padding: 6px 30px 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.clear-filter-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filter-btn:hover {
  color: #333;
}

.report-elements-list {
  max-height: 200px;
  overflow-y: auto;
}

.band-group {
  margin-bottom: 12px;
}

.band-group-header {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
}

.report-element-item {
  display: flex;
  align-items: center;
  padding: 6px;
  margin-bottom: 4px;
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.report-element-item:hover {
  background-color: #e0e0e0;
}

.report-element-item.selected {
  background-color: #d0e6ff;
  border-color: #4a90e2;
}

.report-element-item .element-icon {
  font-size: 16px;
  margin-right: 8px;
  margin-bottom: 0;
}

.report-element-item .element-info {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.parameters-mini-view,
.fields-mini-view {
  max-height: 150px;
  overflow-y: auto;
}

.field-mini-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  margin-bottom: 4px;
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.field-mini-item:hover {
  background-color: #e0e0e0;
}

.field-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.field-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.field-type {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.field-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.action-button {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}

.edit-button {
  background-color: #f0f0f0;
  color: #333;
}

.edit-button:hover {
  background-color: #e0e0e0;
}

.delete-button {
  background-color: #f0f0f0;
  color: #e74c3c;
}

.delete-button:hover {
  background-color: #ffe6e6;
}

.empty-state {
  padding: 20px 10px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.empty-hint {
  font-size: 10px;
  margin-top: 4px;
  color: #ccc;
}

/* 滚动条样式 */
.report-elements-list::-webkit-scrollbar,
.parameters-mini-view::-webkit-scrollbar,
.fields-mini-view::-webkit-scrollbar {
  width: 6px;
}

.report-elements-list::-webkit-scrollbar-track,
.parameters-mini-view::-webkit-scrollbar-track,
.fields-mini-view::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.report-elements-list::-webkit-scrollbar-thumb,
.parameters-mini-view::-webkit-scrollbar-thumb,
.fields-mini-view::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.report-elements-list::-webkit-scrollbar-thumb:hover,
.parameters-mini-view::-webkit-scrollbar-thumb:hover,
.fields-mini-view::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>