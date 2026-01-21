<template>
  <BaseModal
    :visible="visible"
    :title="t('previewServerSettings.title')"
    @update:visible="$emit('update:visible', $event)"
    @confirm="saveSettings"
    @cancel="closeModal"
  >
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
    <template #footer>
      <n-button type="default" @click="closeModal">{{ t('common.cancel') }}</n-button>
      <n-button type="primary" @click="saveSettings">{{ t('common.save') }}</n-button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';
import { NButton } from 'naive-ui';
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
/* Preview Server Settings Modal Specific Styles */
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
</style>