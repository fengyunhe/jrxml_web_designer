<template>
  <div v-if="visible" class="preview-server-settings-modal" @click.self="closeModal">
    <div class="preview-server-settings-content">
      <div class="preview-server-settings-header">
        <h3>{{ t('previewServerSettings.title') }}</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="preview-server-settings-body">
        <div class="setting-item">
          <label for="serverUrl">{{ t('previewServerSettings.serverUrl') }}:</label>
          <input 
            type="url" 
            id="serverUrl" 
            v-model="serverUrl" 
            class="server-url-input"
            placeholder="https://example.com/api/pdf/generateForm"
          />
        </div>
        <div class="source-info">
          <p>{{ t('previewServerSettings.sourceInfo') }}</p>
          <a 
            href="https://github.com/fengyunhe/jrxml_preview_server" 
            target="_blank" 
            rel="noopener noreferrer"
            class="source-link"
          >
            https://github.com/fengyunhe/jrxml_preview_server
          </a>
        </div>
      </div>
      <div class="preview-server-settings-footer">
        <button @click="closeModal" class="btn-secondary">{{ t('common.cancel') }}</button>
        <button @click="saveSettings" class="btn-primary">{{ t('common.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  currentUrl: string;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'update:url': [url: string];
}>();

const serverUrl = ref(props.currentUrl);

// 监听currentUrl变化，更新输入框值
watch(() => props.currentUrl, (newUrl) => {
  serverUrl.value = newUrl;
});

const closeModal = () => {
  emit('update:visible', false);
};

const saveSettings = () => {
  emit('update:url', serverUrl.value);
  emit('update:visible', false);
};
</script>

<style scoped>
.preview-server-settings-modal {
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

.preview-server-settings-content {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 95%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10000;
}

.preview-server-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.preview-server-settings-header h3 {
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

.preview-server-settings-body {
  padding: 20px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.server-url-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.server-url-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.source-info {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}

.source-info p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.source-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
}

.source-link:hover {
  text-decoration: underline;
}

.preview-server-settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Button styles */
button {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}
</style>