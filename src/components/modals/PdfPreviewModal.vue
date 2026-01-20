<template>
  <div v-if="visible" class="pdf-preview-modal" @click.self="closeModal">
    <div class="pdf-preview-content">
      <div class="pdf-preview-header">
        <h3>{{ t('pdfPreview.title') }}</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="pdf-preview-body">
        <iframe
          :src="previewUrl"
          class="pdf-iframe"
          :title="t('pdfPreview.title')"
          @load="handleIframeLoad"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ReportParameter, ReportField } from '../../types';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  jrxmlContent: string;
  reportParameters?: ReportParameter[];
  reportFields?: ReportField[];
  previewServerUrl?: string;
}>();

const emit = defineEmits(['update:visible']);

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  console.log('PdfPreviewModal visible变化:', newVisible);
});

// 生成MOCK值的函数
const generateMockValue = (className: string): any => {
  switch (className) {
    case 'java.lang.String':
      return 'Test String';
    case 'java.lang.Integer':
    case 'java.lang.Long':
      return 123;
    case 'java.lang.Double':
    case 'java.lang.Float':
      return 123.45;
    case 'java.lang.Boolean':
      return true;
    case 'java.util.Date':
      return new Date().toISOString().split('T')[0];
    default:
      return 'Test Value';
  }
};

// 计算预览URL
const previewUrl = computed(() => {
  console.log('生成预览URL，jrxml长度:', props.jrxmlContent.length);
  
  // 使用传入的预览服务器地址或默认地址
  const apiUrl = props.previewServerUrl || 'https://jrxml-pdf-preview.firegod.cn/api/pdf/generateForm';
  
  // 生成parameters JSON对象
  const parameters: Record<string, any> = {};
  (props.reportParameters || []).forEach(param => {
    parameters[param.name] = generateMockValue(param.class);
  });
  
  // 生成dataSource JSON数组（包含1行MOCK数据）
  const dataSource: Record<string, any>[] = [];
  for (let i = 0; i < 1; i++) {
    const row: Record<string, any> = {};
    (props.reportFields || []).forEach(field => {
      row[field.name] = generateMockValue(field.class);
    });
    dataSource.push(row);
  }
  
  // 输出发送给后端的完整参数到控制台
  console.log('发送给后端的完整参数:', {
    parameters,
    dataSource,
    jrxml: props.jrxmlContent,
    apiUrl
  });
  
  // 创建一个包含表单的HTML
  const formHtml = `
    <html>
    <body onload="document.getElementById('pdfForm').submit()">
      <form id="pdfForm" action="${apiUrl}" method="POST" target="_self">
        <input type="hidden" name="jrxml" value="${props.jrxmlContent.replace(/"/g, '&quot;')}">
        <input type="hidden" name="parameters" value="${JSON.stringify(parameters).replace(/"/g, '&quot;')}">
        <input type="hidden" name="dataSource" value="${JSON.stringify(dataSource).replace(/"/g, '&quot;')}">
      </form>
    </body>
    </html>
  `;
  return `data:text/html;charset=utf-8,${encodeURIComponent(formHtml)}`;
});

const closeModal = () => {
  emit('update:visible', false);
  console.log('关闭PDF预览');
};

const handleIframeLoad = () => {
  console.log('PDF预览iframe加载完成');
};
</script>

<style scoped>
.pdf-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: auto;
}

.pdf-preview-content {
  background-color: white;
  border-radius: 8px;
  width: 95%;
  height: 90%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10000;
}

.pdf-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.pdf-preview-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.pdf-preview-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
