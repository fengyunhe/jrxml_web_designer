<template>
  <div v-if="visible" class="pdf-preview-modal" @click.self="closeModal">
    <div class="pdf-preview-content">
      <div class="pdf-preview-header">
        <h3>PDF 预览</h3>
        <div class="pdf-preview-actions">
          <button @click="downloadPDF" class="btn-download">下载 PDF</button>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
      </div>
      <div class="pdf-preview-body">
        <div v-if="loading" class="pdf-loading">
          <div class="loading-spinner"></div>
          <p>正在生成 PDF...</p>
        </div>
        <div v-else-if="error" class="pdf-error">
          <p>{{ error }}</p>
          <button @click="retry" class="btn-retry">重试</button>
        </div>
        <iframe
          v-else-if="pdfUrl"
          :src="pdfUrl"
          class="pdf-iframe"
          title="PDF Preview"
        ></iframe>
        <div v-else class="pdf-empty">
          <p>暂无预览内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  jrxmlContent: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const error = ref<string | null>(null);
const pdfUrl = ref<string | null>(null);
const pdfBlob = ref<Blob | null>(null);

const PDF_PREVIEW_API = 'http://43.133.226.50/api/pdf/generateForm';

const generatePDF = async () => {
  if (!props.jrxmlContent) {
    error.value = '请先生成 JRXML 内容';
    return;
  }

  loading.value = true;
  error.value = null;
  pdfUrl.value = null;

  try {
    // 创建动态表单
    const form = document.createElement('form');
    form.action = PDF_PREVIEW_API;
    form.method = 'POST';
    form.target = 'pdfPreviewFrame';
    form.style.display = 'none';
    
    // 添加JRXML内容字段
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'jrxml';
    input.value = props.jrxmlContent;
    
    form.appendChild(input);
    document.body.appendChild(form);
    
    // 创建隐藏的iframe用于接收响应
    const iframe = document.createElement('iframe');
    iframe.name = 'pdfPreviewFrame';
    iframe.style.display = 'none';
    iframe.onload = async () => {
      try {
        // 尝试获取iframe内容
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // 检查是否为PDF
          const contentType = iframeDoc.contentType || iframeDoc.mimeType;
          if (contentType?.includes('pdf')) {
            // 从iframe中获取PDF数据
            const response = await fetch(PDF_PREVIEW_API, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `jrxml=${encodeURIComponent(props.jrxmlContent)}`
            });
            
            if (!response.ok) {
              throw new Error(`请求失败: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            pdfBlob.value = blob;
            pdfUrl.value = URL.createObjectURL(blob);
          } else {
            // 可能是错误页面
            const errorText = iframeDoc.body?.textContent || '生成 PDF 失败';
            error.value = errorText;
          }
        } else {
          error.value = '无法加载 PDF 内容';
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : '生成 PDF 失败';
      } finally {
        loading.value = false;
        // 清理
        setTimeout(() => {
          document.body.removeChild(form);
          document.body.removeChild(iframe);
        }, 100);
      }
    };
    
    iframe.onerror = () => {
      error.value = '加载 PDF 时发生错误';
      loading.value = false;
      // 清理
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 100);
    };
    
    document.body.appendChild(iframe);
    
    // 提交表单
    form.submit();
    
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('CORS') || err.message.includes('Access-Control')) {
        error.value = 'CORS 错误：服务器配置问题，请联系管理员检查服务器的 Access-Control-Allow-Origin 头配置';
      } else if (err.message.includes('405')) {
        error.value = '请求方法错误：服务器可能不支持 POST 请求，请检查 API 配置';
      } else {
        error.value = err.message;
      }
    } else {
      error.value = '生成 PDF 失败';
    }
    loading.value = false;
  }
};

const downloadPDF = () => {
  if (pdfBlob.value && pdfUrl.value) {
    const link = document.createElement('a');
    link.href = pdfUrl.value;
    link.download = 'report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const retry = () => {
  generatePDF();
};

const closeModal = () => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
  }
  pdfBlob.value = null;
  emit('update:visible', false);
};

watch(() => props.visible, (newVisible) => {
  if (newVisible && props.jrxmlContent) {
    generatePDF();
  }
});
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

.pdf-preview-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-download {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-download:hover {
  background-color: #45a049;
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

.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pdf-loading p {
  color: #666;
  font-size: 14px;
}

.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.pdf-error p {
  color: #e74c3c;
  font-size: 14px;
}

.btn-retry {
  padding: 8px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #2980b9;
}

.pdf-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.pdf-empty p {
  color: #999;
  font-size: 14px;
}
</style>
