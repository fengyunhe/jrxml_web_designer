import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkStyleUsage() {
  // 定义要检查的文件和样式
  const filesToCheck = [
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/common/Notification.vue',
      styles: ['info']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/common/SplitButton.vue',
      styles: ['btn-secondary']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/designer/properties/ElementProperties.vue',
      styles: ['element-tabs', 'element-tab-navigation', 'element-tab-button', 'active', 'element-tab-content', 'box-section', 'border-quick-actions', 'border-side-group', 'side-label', 'side-control', 'width-control', 'color-control', 'padding-grid', 'alignment-controls', 'element-actions', 'font-hint', 'table-columns-list', 'table-column-item', 'table-column-header', 'table-column-properties', 'small', 'full-width', 'small-input', 'table-column-actions', 'dragging', 'drag-over', 'drag-handle', 'field-selection-content', 'selected-fields', 'fields-list', 'field-item', 'field-name', 'field-type']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/elements/FrameElement.vue',
      styles: ['frame-placeholder', 'frame-label']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/elements/TableElement.vue',
      styles: ['design-element', 'table-footer', 'column-header', 'detail-row', 'column-footer', 'empty', 'text-field', 'column-name']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/modals/BaseModal.vue',
      styles: ['close-button']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/modals/FieldManagementModal.vue',
      styles: ['close-button', 'btn-secondary', 'btn-primary']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/modals/SubDatasetManagementModal.vue',
      styles: ['btn-small', 'btn-primary', 'btn-danger', 'form-select']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/panels/BottomPanel.vue',
      styles: ['tabs-container', 'checkbox-group']
    },
    {
      path: '/Users/yan.yang/open/jrxml_web_designer/src/components/panels/ResizablePanel.vue',
      styles: ['resizable-panel--left', 'resizable-panel--right', 'resizable-panel--bottom', 'panel-collapse-button--left', 'panel-collapse-button--right', 'panel-collapse-button--bottom', 'panel-resize-handle--left', 'panel-resize-handle--right', 'panel-resize-handle--bottom']
    }
  ];

  for (const file of filesToCheck) {
    console.log(`\n检查文件: ${file.path}`);
    const content = await fs.readFile(file.path, 'utf8');
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    
    if (!templateMatch) {
      console.log('  未找到模板内容');
      continue;
    }
    
    const template = templateMatch[1];
    
    for (const style of file.styles) {
      // 检查样式是否在模板中被使用
      const isUsed = template.includes(style);
      console.log(`  .${style}: ${isUsed ? '被使用' : '未被使用'}`);
    }
  }
}

checkStyleUsage();