<template>
  <BaseModal
    :visible="visible"
    :title="t('pdfPreview.title')"
    :showFooter="false"
    @update:visible="$emit('update:visible', $event)"
    @cancel="closeModal"
    :contentClass="'pdf-preview-modal'"
    :bodyHeight="'90vh'"
    :contentStyle="{ width: '98vw', maxWidth: 'none', height: '98vh', maxHeight: '98vh' }"
    :bodyStyle="{ padding: '0', overflow: 'hidden', display: 'flex' }"
  >
    <div class="pdf-preview-body">
      <!-- Editor Panel -->
      <div class="editor-panel" v-show="showEditor">
        <div class="editor-header">
          <n-button size="small" quaternary @click="regenerateAll">
            {{ t('pdfPreview.dataSource.regenerate') }}
          </n-button>
        </div>
        <n-tabs type="line" animated class="editor-tabs">
          <!-- Parameters Tab -->
          <n-tab-pane :tab="t('pdfPreview.parameters.title')" name="params">
            <div class="tab-content">
              <div v-if="!props.reportParameters?.length" class="empty-hint">
                {{ t('pdfPreview.parameters.noParameters') }}
              </div>
              <div v-else class="param-list">
                <div v-for="param in props.reportParameters" :key="param.name" class="param-row">
                  <div class="param-label">
                    <span class="param-name">{{ param.name }}</span>
                    <n-tag size="tiny" :bordered="false" type="info">{{ shortType(param.class) }}</n-tag>
                  </div>
                  <input
                    v-if="param.class === 'java.lang.Boolean'"
                    type="checkbox"
                    :checked="editableParams[param.name]"
                    @change="editableParams[param.name] = ($event.target as HTMLInputElement).checked"
                    class="param-checkbox"
                  />
                  <input
                    v-else
                    class="param-input"
                    :value="editableParams[param.name]"
                    @input="editableParams[param.name] = ($event.target as HTMLInputElement).value"
                    :placeholder="param.defaultValue || ''"
                  />
                </div>
              </div>
            </div>
          </n-tab-pane>

          <!-- DataSource Tab -->
          <n-tab-pane :tab="t('pdfPreview.dataSource.title')" name="dataSource">
            <div class="tab-content">
              <div v-if="!props.reportFields?.length" class="empty-hint">
                {{ t('pdfPreview.dataSource.noFields') }}
              </div>
              <div v-else>
                <div class="ds-toolbar">
                  <label class="row-count-label">
                    {{ t('pdfPreview.dataSource.rowCount') }}
                    <input
                      type="number"
                      class="row-count-input"
                      :value="editableDataSource.length"
                      min="1"
                      max="100"
                      @change="onRowCountChange($event)"
                    />
                  </label>
                  <n-button size="small" quaternary @click="addRow">
                    {{ t('pdfPreview.dataSource.addRow') }}
                  </n-button>
                </div>
                <div class="ds-table-wrapper">
                  <table class="ds-table">
                    <thead>
                      <tr>
                        <th v-for="field in props.reportFields" :key="field.name" class="ds-th">
                          <div class="th-inner">
                            <span>{{ field.name }}</span>
                            <n-tag size="tiny" :bordered="false">{{ shortType(field.class) }}</n-tag>
                          </div>
                        </th>
                        <th class="ds-th ds-th-actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, rowIdx) in editableDataSource" :key="rowIdx">
                        <td v-for="field in props.reportFields" :key="field.name" class="ds-td">
                          <input
                            class="ds-cell-input"
                            :value="row[field.name]"
                            @input="row[field.name] = ($event.target as HTMLInputElement).value"
                          />
                        </td>
                        <td class="ds-td ds-td-actions">
                          <button class="remove-row-btn" @click="removeRow(rowIdx)" title="×">×</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <!-- Sub Dataset Tabs -->
          <n-tab-pane
            v-for="ds in visibleSubDatasets"
            :key="ds.name"
            :tab="ds.name"
            :name="'sub_' + ds.name"
          >
            <div class="tab-content">
              <div class="ds-toolbar">
                <label class="row-count-label">
                  {{ t('pdfPreview.dataSource.rowCount') }}
                  <input
                    type="number"
                    class="row-count-input"
                    :value="(editableSubDataSources[ds.name] || []).length"
                    min="1"
                    max="100"
                    @change="onSubRowCountChange(ds.name, $event)"
                  />
                </label>
                <n-button size="small" quaternary @click="addSubRow(ds.name)">
                  {{ t('pdfPreview.dataSource.addRow') }}
                </n-button>
              </div>
              <div class="ds-table-wrapper">
                <table class="ds-table">
                  <thead>
                    <tr>
                      <th v-for="field in ds.fields" :key="field.name" class="ds-th">
                        <div class="th-inner">
                          <span>{{ field.name }}</span>
                          <n-tag size="tiny" :bordered="false">{{ shortType(field.class) }}</n-tag>
                        </div>
                      </th>
                      <th class="ds-th ds-th-actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIdx) in (editableSubDataSources[ds.name] || [])" :key="rowIdx">
                      <td v-for="field in ds.fields" :key="field.name" class="ds-td">
                        <input
                          class="ds-cell-input"
                          :value="row[field.name]"
                          @input="row[field.name] = ($event.target as HTMLInputElement).value"
                        />
                      </td>
                      <td class="ds-td ds-td-actions">
                        <button class="remove-row-btn" @click="removeSubRow(ds.name, rowIdx)" title="×">×</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>

      <!-- Toggle Button -->
      <button class="panel-toggle" @click="showEditor = !showEditor" :title="showEditor ? t('pdfPreview.editor.hidePanel') : t('pdfPreview.editor.showPanel')">
        {{ showEditor ? '◀' : '▶' }}
      </button>

      <!-- PDF Preview -->
      <div class="pdf-panel">
        <div class="pdf-toolbar">
          <n-button type="primary" size="small" @click="generatePreview" :loading="isGenerating">
            {{ t('pdfPreview.generateBtn') }}
          </n-button>
        </div>
        <iframe
          ref="iframeRef"
          class="pdf-iframe"
          :src="previewUrl"
          @load="handleIframeLoad"
        ></iframe>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NTabs, NTabPane, NTag } from 'naive-ui';
import type { ReportParameter, ReportField, TableDataset } from '../../types';
import { generateMockValue, generateMockParameters, generateMockDataSource } from '../../utils/mockDataGenerator';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  jrxmlContent: string;
  reportParameters?: ReportParameter[];
  reportFields?: ReportField[];
  subDatasets?: TableDataset[];
  previewServerUrl?: string;
}>();

const emit = defineEmits(['update:visible']);

const editableParams = ref<Record<string, any>>({});
const editableDataSource = ref<Record<string, any>[]>([]);
const editableSubDataSources = ref<Record<string, Record<string, any>[]>>({});
const resolvedSubDatasets = ref<TableDataset[]>([]);
const showEditor = ref(true);
const isGenerating = ref(false);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const previewUrl = ref<string>('about:blank');

const API_URL_DEFAULT = 'https://jrxml-pdf-preview.firegod.cn/api/pdf/generateForm';

function shortType(className: string): string {
  const parts = className.split('.');
  return parts[parts.length - 1] || className;
}

function initializeEditor() {
  previewUrl.value = 'about:blank';
  isGenerating.value = false;

  const params = props.reportParameters || [];
  let fields = props.reportFields || [];
  let subDatasets = props.subDatasets || [];

  // 如果subDatasets为空，从JRXML中解析
  if (subDatasets.length === 0 && props.jrxmlContent) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(props.jrxmlContent, 'text/xml');
      // JRXML使用subDataset标签定义子数据集
      const subDatasetEls = doc.querySelectorAll('subDataset');
      for (const dsEl of subDatasetEls) {
        const dsName = dsEl.getAttribute('name') || 'unknown';
        const fieldEls = dsEl.querySelectorAll('field');
        if (fieldEls.length > 0) {
          const dsFields = [...fieldEls].map(f => ({
            name: f.getAttribute('name') || '',
            class: f.getAttribute('class') || 'java.lang.String',
          }));
          subDatasets.push({ uuid: crypto.randomUUID(), name: dsName, fields: dsFields });
        }
      }
    } catch (e) {
      console.warn('Failed to parse JRXML for sub-datasets:', e);
    }
  }

  // 如果fields为空，从JRXML中解析
  if (fields.length === 0 && props.jrxmlContent) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(props.jrxmlContent, 'text/xml');
      const fieldEls = doc.querySelectorAll('jasperReport > field');
      if (fieldEls.length > 0) {
        fields = [...fieldEls].map(f => ({
          name: f.getAttribute('name') || '',
          class: f.getAttribute('class') || 'java.lang.String',
        }));
      }
    } catch (e) {
      // ignore
    }
  }

  editableParams.value = generateMockParameters(params);
  editableDataSource.value = generateMockDataSource(fields, 1);

  // 为每个表格数据集生成mock数据
  const subDataSources: Record<string, Record<string, any>[]> = {};
  for (const ds of subDatasets) {
    if (ds.fields && ds.fields.length > 0) {
      const rows: Record<string, any>[] = [];
      for (let i = 0; i < 5; i++) {
        const row: Record<string, any> = {};
        for (const f of ds.fields) {
          row[f.name] = generateMockValue(f.name, f.class);
        }
        rows.push(row);
      }
      subDataSources[ds.name] = rows;
    }
  }
  editableSubDataSources.value = subDataSources;
  resolvedSubDatasets.value = subDatasets;
}

function regenerateAll() {
  initializeEditor();
}

function addRow() {
  const fields = props.reportFields || [];
  const newRow: Record<string, any> = {};
  for (const field of fields) {
    newRow[field.name] = generateMockValue(field.name, field.class);
  }
  editableDataSource.value.push(newRow);
}

function removeRow(index: number) {
  if (editableDataSource.value.length > 1) {
    editableDataSource.value.splice(index, 1);
  }
}

function onRowCountChange(event: Event) {
  const input = event.target as HTMLInputElement;
  let count = parseInt(input.value, 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 100) count = 100;

  const fields = props.reportFields || [];
  const current = editableDataSource.value;

  if (count > current.length) {
    for (let i = current.length; i < count; i++) {
      const row: Record<string, any> = {};
      for (const field of fields) {
        row[field.name] = generateMockValue(field.name, field.class);
      }
      current.push(row);
    }
  } else if (count < current.length) {
    editableDataSource.value = current.slice(0, count);
  }
}

const visibleSubDatasets = computed(() => {
  return resolvedSubDatasets.value.filter(ds => ds.fields && ds.fields.length > 0);
});

function addSubRow(dsName: string) {
  const ds = resolvedSubDatasets.value.find(d => d.name === dsName);
  if (!ds?.fields) return;
  const rows = editableSubDataSources.value[dsName] || [];
  const newRow: Record<string, any> = {};
  for (const field of ds.fields) {
    newRow[field.name] = generateMockValue(field.name, field.class);
  }
  rows.push(newRow);
  editableSubDataSources.value[dsName] = rows;
}

function removeSubRow(dsName: string, index: number) {
  const rows = editableSubDataSources.value[dsName] || [];
  if (rows.length > 1) {
    rows.splice(index, 1);
    editableSubDataSources.value[dsName] = rows;
  }
}

function onSubRowCountChange(dsName: string, event: Event) {
  const input = event.target as HTMLInputElement;
  let count = parseInt(input.value, 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 100) count = 100;

  const ds = resolvedSubDatasets.value.find(d => d.name === dsName);
  if (!ds?.fields) return;
  const current = editableSubDataSources.value[dsName] || [];

  if (count > current.length) {
    for (let i = current.length; i < count; i++) {
      const row: Record<string, any> = {};
      for (const field of ds.fields) {
        row[field.name] = generateMockValue(field.name, field.class);
      }
      current.push(row);
    }
  } else if (count < current.length) {
    editableSubDataSources.value[dsName] = current.slice(0, count);
  }
}

function convertSubDataSourcesTypes(): Record<string, Record<string, any>[]> {
  const result: Record<string, Record<string, any>[]> = {};
  for (const [dsName, rows] of Object.entries(editableSubDataSources.value)) {
    const ds = resolvedSubDatasets.value.find(d => d.name === dsName);
    if (!ds?.fields) { result[dsName] = rows; continue; }
    const fieldMap = new Map(ds.fields.map(f => [f.name, f.class || '']));
    result[dsName] = rows.map(row => {
      const converted: Record<string, any> = {};
      for (const [key, val] of Object.entries(row)) {
        const cls = fieldMap.get(key) || '';
        if (cls === 'java.lang.Integer' || cls === 'java.lang.Short' || cls === 'java.lang.Byte') {
          converted[key] = parseInt(String(val), 10);
        } else if (cls === 'java.lang.Double' || cls === 'java.lang.Float' || cls === 'java.lang.BigDecimal') {
          converted[key] = parseFloat(String(val));
        } else if (cls === 'java.lang.Boolean') {
          converted[key] = String(val) === 'true';
        } else {
          converted[key] = val;
        }
      }
      return converted;
    });
  }
  return result;
}

function generatePreview() {
  const apiUrl = props.previewServerUrl || API_URL_DEFAULT;
  isGenerating.value = true;

  const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const typedSubDataSources = convertSubDataSourcesTypes();
  const formHtml = `<!DOCTYPE html><html><body onload="document.getElementById('pdfForm').submit()">
    <form id="pdfForm" action="${escapeHtml(apiUrl)}" method="POST" target="_self">
      <input type="hidden" name="jrxml" value="${escapeHtml(props.jrxmlContent)}">
      <input type="hidden" name="parameters" value="${escapeHtml(JSON.stringify(editableParams.value))}">
      <input type="hidden" name="dataSource" value="${escapeHtml(JSON.stringify(editableDataSource.value))}">
      ${Object.keys(typedSubDataSources).length > 0
        ? `<input type="hidden" name="subDataSources" value="${escapeHtml(JSON.stringify(typedSubDataSources))}">`
        : ''}
    </form></body></html>`;

  previewUrl.value = `data:text/html;charset=utf-8,${encodeURIComponent(formHtml)}`;
}

const closeModal = () => {
  emit('update:visible', false);
};

const handleIframeLoad = () => {
  isGenerating.value = false;
};

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    initializeEditor();
  }
});
</script>

<style scoped>
:deep(.modal-header) {
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  align-items: center;
  gap: 12px;
}

.pdf-preview-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: 100%;
}

/* Editor Panel */
.editor-panel {
  width: 420px;
  min-width: 420px;
  border-right: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  justify-content: flex-end;
}

.editor-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.editor-tabs .n-tabs-tab) {
  font-size: 13px;
}

:deep(.editor-tabs .n-tab-pane) {
  flex: 1;
  overflow: hidden;
}

:deep(.editor-tabs .n-tabs-content) {
  flex: 1;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 8px 12px;
}

.empty-hint {
  color: var(--text-color-3, #999);
  text-align: center;
  padding: 40px 20px;
  font-size: 13px;
}

/* Parameters */
.param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2, #666);
}

.param-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-color, #d9d9d9);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.param-input:focus {
  border-color: var(--primary-color, #1890ff);
}

.param-checkbox {
  margin: 4px 0;
}

/* DataSource */
.ds-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.row-count-label {
  font-size: 12px;
  color: var(--text-color-2, #666);
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-count-input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid var(--border-color, #d9d9d9);
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.ds-table-wrapper {
  overflow: auto;
  max-height: calc(90vh - 120px);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
}

.ds-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: max-content;
}

.ds-th {
  position: sticky;
  top: 0;
  background: var(--bg-color, #fafafa);
  padding: 6px 4px;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
  text-align: left;
  white-space: nowrap;
  z-index: 1;
}

.th-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ds-th-actions {
  width: 32px;
  min-width: 32px;
}

.ds-td {
  padding: 2px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.ds-td-actions {
  text-align: center;
  width: 32px;
  min-width: 32px;
}

.ds-cell-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 3px;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.ds-cell-input:hover {
  border-color: var(--border-color, #d9d9d9);
}

.ds-cell-input:focus {
  border-color: var(--primary-color, #1890ff);
}

.remove-row-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color-3, #999);
  font-size: 16px;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1;
}

.remove-row-btn:hover {
  color: var(--error-color, #ff4d4f);
  background: rgba(255, 77, 79, 0.06);
}

/* Panel Toggle */
.panel-toggle {
  width: 18px;
  min-width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--bg-color, #fafafa);
  border: none;
  border-left: 1px solid var(--border-color, #e0e0e0);
  border-right: 1px solid var(--border-color, #e0e0e0);
  color: var(--text-color-3, #999);
  font-size: 10px;
  transition: background 0.2s;
}

.panel-toggle:hover {
  background: var(--hover-color, #f0f0f0);
}

/* PDF Panel */
.pdf-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pdf-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  justify-content: flex-end;
}

.pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
}
</style>
