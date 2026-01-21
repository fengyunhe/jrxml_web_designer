<template>
  <BaseModal
    :visible="visible"
    :title="t('pdfPreview.title')"
    :showFooter="false"
    @update:visible="$emit('update:visible', $event)"
    @cancel="closeModal"
    :contentClass="'pdf-preview-modal'"
    :bodyHeight="'90vh'"
  >
    <div class="pdf-preview-body">
      <iframe
        :src="previewUrl"
        class="pdf-iframe"
        :title="t('pdfPreview.title')"
        @load="handleIframeLoad"
      ></iframe>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';
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
/* PDF Preview Modal Specific Styles */
.pdf-preview-modal {
  width: 100%;
  height: 98%;
  max-height: 98vh;
}

:deep(.modal-header) {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.modal-title) {
  margin: 0;
  color: #333;
  font-size: 18px;
}

:deep(.modal-body) {
  padding: 0;
  overflow: hidden;
  flex: 1;
  height: 0;
}

.pdf-preview-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
}

.pdf-iframe {
  width: 100%;
  height: 90vh;
  border: none;
}
</style>
