<template>
  <div v-if="visible" class="pdf-preview-modal" @click.self="closeModal">
    <div class="pdf-preview-content">
      <div class="pdf-preview-header">
        <h3>PDF 预览</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="pdf-preview-body">
        <iframe
          :src="previewUrl"
          class="pdf-iframe"
          title="PDF Preview"
          @load="handleIframeLoad"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PDF_PREVIEW_API } from '../../config/apiConfig';

interface Props {
  visible: boolean;
  jrxmlContent: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算预览URL
const previewUrl = computed(() => {
  // 创建一个包含表单的HTML
  const formHtml = `
    <html>
    <body onload="document.getElementById('pdfForm').submit()">
      <form id="pdfForm" action="${PDF_PREVIEW_API}" method="POST" target="_self">
        <input type="hidden" name="jrxml" value="${props.jrxmlContent.replace(/"/g, '&quot;')}">
      </form>
    </body>
    </html>
  `;
  return `data:text/html;charset=utf-8,${encodeURIComponent(formHtml)}`;
});

const closeModal = () => {
  emit('update:visible', false);
};

const handleIframeLoad = () => {
  // 可以在这里添加加载完成的处理
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
  z-index: 2000;
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
