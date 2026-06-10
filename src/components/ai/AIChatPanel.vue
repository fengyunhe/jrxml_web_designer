<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAIChat } from '@/composables/useAIChat';
import { useAIConfigManager, type AIConfiguration } from '@/composables/useAIConfigManager';
import { checkWebMCPSupport, type BrowserSupportResult } from '@/utils/browserCompatibility';
import type { MCPContext } from '@/mcp';
import ChatMessage from './ChatMessage.vue';
import ChatInput from './ChatInput.vue';

const { t } = useI18n();

// Props
const props = withDefaults(defineProps<{
  visible?: boolean;
  initialHeight?: number;
  mcpContext?: MCPContext;
  onUpdate?: () => void;
  embedded?: boolean; // 是否嵌入模式（隐藏header）
  showSettings?: boolean; // 外部控制设置面板显示
}>(), {
  visible: false,
  initialHeight: 300,
  mcpContext: undefined,
  onUpdate: undefined,
  embedded: false,
  showSettings: false
});

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:showSettings', value: boolean): void;
}>();

// AI对话
const {
  messages,
  isLoading,
  sendMessage,
  clearHistory
} = useAIChat(() => props.mcpContext, props.onUpdate);

// AI配置管理
const {
  config,
  updateConfig,
  resetConfig,
  getConfigFromStorage
} = useAIConfigManager();

// 状态
const panelHeight = ref(props.initialHeight);
const isExpanded = ref(true);
const messagesContainer = ref<HTMLDivElement | null>(null);

// 配置表单（requestTimeout在UI中显示为秒，保存时转换为毫秒）
const configForm = ref<AIConfiguration & { requestTimeoutSeconds: number }>({
  ...config,
  requestTimeoutSeconds: Math.round(config.requestTimeout / 1000)
} as AIConfiguration & { requestTimeoutSeconds: number });

// 计算属性
const panelStyle = computed(() => ({
  height: props.embedded ? '100%' : (isExpanded.value ? `${panelHeight.value}px` : '40px')
}));

// 计算showSettings（支持外部控制）
const showSettings = computed({
  get: () => props.showSettings,
  set: (value: boolean) => emit('update:showSettings', value)
});

// 切换展开/折叠
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

// 关闭面板
function close() {
  emit('update:visible', false);
}

// 切换设置界面
function toggleSettings() {
  showSettings.value = !showSettings.value;
  if (showSettings.value) {
    configForm.value = {
      ...config,
      requestTimeoutSeconds: Math.round(config.requestTimeout / 1000)
    };
  }
}

// 保存配置
function saveConfig() {
  // 将秒转换为毫秒
  const configToSave = {
    ...configForm.value,
    requestTimeout: (configForm.value as any).requestTimeoutSeconds * 1000
  };
  updateConfig(configToSave);
  showSettings.value = false;
}

// 重置配置
function handleResetConfig() {
  resetConfig();
  const freshConfig = getConfigFromStorage();
  configForm.value = {
    ...freshConfig,
    requestTimeoutSeconds: Math.round(freshConfig.requestTimeout / 1000)
  } as AIConfiguration & { requestTimeoutSeconds: number };
  showSettings.value = false;
}

// 发送消息
async function handleSendMessage(content: string) {
  await sendMessage(content);
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 监听消息变化，自动滚动
watch(
  () => messages.length,
  () => {
    scrollToBottom();
  }
);

// 初始化
onMounted(() => {
  configForm.value = {
    ...config,
    requestTimeoutSeconds: Math.round(config.requestTimeout / 1000)
  } as AIConfiguration & { requestTimeoutSeconds: number };
  browserSupport.value = checkWebMCPSupport();

  // 添加键盘快捷键监听器
  document.addEventListener('keydown', handleKeyDown);
});

// 键盘快捷键处理
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl+K 或 Cmd+K (Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    clearHistory();
  }
}

// 浏览器兼容性检查
const browserSupport = ref<BrowserSupportResult | null>(null);
const isSupported = computed(() => browserSupport.value?.isSupported ?? false);
</script>

<template>
  <div class="ai-chat-panel" :class="{ 'ai-chat-panel--embedded': embedded }" :style="panelStyle" v-show="visible">
    <!-- 头部（非嵌入模式时显示） -->
    <div v-if="!embedded" class="panel-header" @click="toggleExpand">
      <div class="header-left">
        <span class="panel-icon">🤖</span>
        <span class="panel-title">AI 助手</span>
        <span class="config-status" :title="`API: ${config.apiEndpoint}`">
          ⚙️
        </span>
      </div>

      <div class="header-actions">
        <button class="action-btn" @click.stop="toggleSettings" title="配置AI服务">
          ⚙️
        </button>
        <button class="action-btn" @click.stop="clearHistory" title="清空历史">
          🗑️
        </button>
        <button class="action-btn close-btn" @click.stop="close" title="关闭">
          ✕
        </button>
      </div>
    </div>

    <!-- 配置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h4>AI服务配置</h4>
        <button class="close-settings-btn" @click="showSettings = false">✕</button>
      </div>

      <div class="settings-form">
        <!-- API接口地址 -->
        <div class="form-group">
          <label for="apiEndpoint">API接口地址</label>
          <input
            id="apiEndpoint"
            v-model="configForm.apiEndpoint"
            type="url"
            placeholder="http://127.0.0.1:1234/v1"
            class="form-input"
          />
          <span class="form-hint">LMStudio默认: http://127.0.0.1:1234/v1</span>
        </div>

        <!-- API密钥 -->
        <div class="form-group">
          <label for="apiKey">API密钥</label>
          <input
            id="apiKey"
            v-model="configForm.apiKey"
            type="password"
            placeholder="lm-studio"
            class="form-input"
          />
          <span class="form-hint">本地模型可使用默认值: lm-studio</span>
        </div>

        <!-- 模型名称 -->
        <div class="form-group">
          <label for="modelName">模型名称</label>
          <input
            id="modelName"
            v-model="configForm.modelName"
            type="text"
            placeholder="local-model"
            class="form-input"
          />
          <span class="form-hint">LMStudio会自动检测模型</span>
        </div>

        <!-- Token限制 -->
        <div class="form-group">
          <label for="maxTokens">最大Token数</label>
          <input
            id="maxTokens"
            v-model.number="configForm.maxTokens"
            type="number"
            min="100"
            max="100000"
            class="form-input"
          />
          <span class="form-hint">默认: 4096</span>
        </div>

        <!-- 温度参数 -->
        <div class="form-group">
          <label for="temperature">温度参数</label>
          <input
            id="temperature"
            v-model.number="configForm.temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            class="form-input"
          />
          <span class="form-hint">0.0-1.0，越高越随机（默认: 0.7）</span>
        </div>

        <!-- 请求超时时间 -->
        <div class="form-group">
          <label for="requestTimeout">请求超时时间（秒）</label>
          <input
            id="requestTimeout"
            v-model.number="(configForm as any).requestTimeoutSeconds"
            type="number"
            min="30"
            max="600"
            step="30"
            class="form-input"
          />
          <span class="form-hint">单位：秒，默认: 300秒（5分钟）</span>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button class="btn btn-secondary" @click="handleResetConfig">
            重置默认
          </button>
          <button class="btn btn-primary" @click="saveConfig">
            保存配置
          </button>
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />

      <!-- 空状态提示 -->
      <div v-if="messages.length === 0 && isSupported" class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-text">开始与AI助手对话</div>
        <div class="empty-hint">例如：在detail band中创建一个标题</div>
        <div class="empty-hint">当前API: {{ config.apiEndpoint }}</div>
      </div>

      <!-- 浏览器不支持提示 -->
      <div v-if="!isSupported" class="unsupported-warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-title">浏览器不支持AI助手</div>
        <div class="warning-message">{{ browserSupport?.message }}</div>
        <div class="warning-requirements">
          <div class="requirement-title">需要以下浏览器特性支持：</div>
          <ul class="requirement-list">
            <li :class="{ supported: browserSupport?.features.webassembly }">
              {{ browserSupport?.features.webassembly ? '✓' : '✗' }} WebAssembly
            </li>
            <li :class="{ supported: browserSupport?.features.webWorkers }">
              {{ browserSupport?.features.webWorkers ? '✓' : '✗' }} Web Workers
            </li>
            <li :class="{ supported: browserSupport?.features.fetch }">
              {{ browserSupport?.features.fetch ? '✓' : '✗' }} Fetch API
            </li>
            <li :class="{ supported: browserSupport?.features.bigUint64Array }">
              {{ browserSupport?.features.bigUint64Array ? '✓' : '✗' }} BigUint64Array
            </li>
          </ul>
        </div>
        <div class="suggestion">
          建议使用最新版本的Chrome、Firefox或Safari浏览器
        </div>
      </div>
    </div>

    <!-- 输入框 -->
    <ChatInput
      :disabled="isLoading || !isSupported"
      :placeholder="isSupported ? '输入指令，例如：在detail band中创建一个文本框显示客户名称' : '浏览器不支持，请升级浏览器'"
      @submit="handleSendMessage"
    />
  </div>
</template>

<style scoped>
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-top: 2px solid #e0e0e0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: height 0.3s ease;
  height: 100%;
}

.ai-chat-panel--embedded {
  border-top: none;
  box-shadow: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 1.2em;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
}

.config-status {
  font-size: 0.85em;
  color: #666;
  cursor: help;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background-color: #ffcdd2;
}

/* 配置面板样式 */
.settings-panel {
  background-color: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px;
  max-height: 40%;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.settings-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.close-settings-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.close-settings-btn:hover {
  color: #333;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.form-input {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.form-hint {
  font-size: 11px;
  color: #999;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 1.1em;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.9em;
  font-style: italic;
  margin-bottom: 4px;
}

/* 浏览器不支持提示样式 */
.unsupported-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: #fff3e0;
  border: 1px solid #ffcc02;
  border-radius: 8px;
  margin: 12px;
  text-align: center;
}

.warning-icon {
  font-size: 3em;
  margin-bottom: 12px;
}

.warning-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #f57c00;
  margin-bottom: 8px;
}

.warning-message {
  font-size: 0.95em;
  color: #666;
  margin-bottom: 16px;
}

.warning-requirements {
  background-color: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 400px;
}

.requirement-title {
  font-size: 0.9em;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.requirement-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.requirement-list li {
  font-size: 0.85em;
  color: #666;
  padding: 4px 0;
}

.requirement-list li.supported {
  color: #4caf50;
}

.requirement-list li:not(.supported) {
  color: #f44336;
}

.suggestion {
  font-size: 0.85em;
  color: #666;
  font-style: italic;
}
</style>
