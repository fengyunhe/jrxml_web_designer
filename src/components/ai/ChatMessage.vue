<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChatMessage } from '@/composables/useAIChat';
import ToolCallDisplay from './ToolCallDisplay.vue';

// Props
const props = defineProps<{
  message: ChatMessage;
}>();

// 状态
const copied = ref(false);

// 样式计算
const messageClass = computed(() => ({
  'chat-message': true,
  'user-message': props.message.role === 'user',
  'assistant-message': props.message.role === 'assistant',
  'tool-message': props.message.role === 'tool',
  'error-message': props.message.role === 'error',
  'system-message': props.message.role === 'system',
  'is-loading': props.message.isLoading
}));

// 图标映射
const roleIcon = computed(() => {
  switch (props.message.role) {
    case 'user': return '👤';
    case 'assistant': return '🤖';
    case 'tool': return '🔧';
    case 'error': return '❌';
    case 'system': return 'ℹ️';
    default: return '💬';
  }
});

// 格式化时间
const formattedTime = computed(() => {
  return props.message.timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// 复制消息内容
async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message.content);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy message:', error);
  }
}
</script>

<template>
  <div :class="messageClass">
    <!-- 加载指示器 -->
    <div v-if="message.isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <span>{{ message.content }}</span>
    </div>

    <!-- 消息内容 -->
    <div v-else class="message-content">
      <!-- 头部 -->
      <div class="message-header">
        <span class="role-icon">{{ roleIcon }}</span>
        <span class="role-name">{{ message.role === 'user' ? '你' : 'AI助手' }}</span>
        <span class="timestamp">{{ formattedTime }}</span>
        <button
          v-if="message.role === 'assistant' && message.content"
          class="copy-btn"
          @click="copyMessage"
          :title="copied ? '已复制' : '复制消息'"
        >
          <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span v-else>✓</span>
        </button>
      </div>

      <!-- 消息正文 -->
      <div class="message-body">
        {{ message.content }}
      </div>

      <!-- 工具调用显示 -->
      <ToolCallDisplay
        v-if="message.toolCall"
        :tool-call="message.toolCall"
        :tool-result="message.toolResult"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.user-message {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.assistant-message {
  background-color: #f1f8e9;
  border-left: 3px solid #4caf50;
}

.tool-message {
  background-color: #fff3e0;
  border-left: 3px solid #ff9800;
  font-size: 0.9em;
}

.error-message {
  background-color: #ffebee;
  border-left: 3px solid #f44336;
}

.system-message {
  background-color: #f5f5f5;
  border-left: 3px solid #9e9e9e;
  font-style: italic;
  font-size: 0.9em;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top-color: #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85em;
  color: #666;
}

.role-icon {
  font-size: 1.1em;
}

.role-name {
  font-weight: 600;
}

.timestamp {
  margin-left: auto;
  font-size: 0.85em;
  color: #999;
}

.copy-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  opacity: 0.6;
}

.copy-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
  opacity: 1;
}

.message-body {
  line-height: 1.5;
  white-space: pre-wrap;
  user-select: text;
  cursor: text;
}
</style>
