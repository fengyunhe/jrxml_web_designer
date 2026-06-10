<script setup lang="ts">
import { computed } from 'vue';
import type { MCPToolCall, MCPToolResult } from '@/mcp';

// Props
const props = defineProps<{
  toolCall: MCPToolCall;
  toolResult?: MCPToolResult;
}>();

// 工具显示名称映射
const toolDisplayNames: Record<string, string> = {
  'get_design_state': '获取设计状态',
  'get_element': '获取元素信息',
  'find_elements': '查找元素',
  'create_static_text': '创建静态文本',
  'create_text_field': '创建动态文本框',
  'create_rectangle': '创建矩形',
  'create_frame': '创建Frame',
  'update_element': '更新元素',
  'move_element': '移动元素',
  'delete_element': '删除元素',
  'update_band_height': '调整Band高度'
};

// 获取工具显示名称
const displayName = computed(() => {
  return toolDisplayNames[props.toolCall.name] || props.toolCall.name;
});

// 格式化参数
const formattedParams = computed(() => {
  const params = props.toolCall.params;
  if (!params || Object.keys(params).length === 0) {
    return '无参数';
  }
  return JSON.stringify(params, null, 2);
});

// 工具状态
const toolStatus = computed(() => {
  if (!props.toolResult) return 'pending';
  return props.toolResult.success ? 'success' : 'failed';
});

// 状态样式类
const statusClass = computed(() => ({
  'tool-call-display': true,
  'status-pending': toolStatus.value === 'pending',
  'status-success': toolStatus.value === 'success',
  'status-failed': toolStatus.value === 'failed'
}));
</script>

<template>
  <div :class="statusClass">
    <!-- 工具名称 -->
    <div class="tool-header">
      <span class="tool-icon">🔧</span>
      <span class="tool-name">{{ displayName }}</span>
      <span v-if="toolResult" class="tool-status" :class="toolStatus">
        {{ toolStatus === 'success' ? '✓ 成功' : '✗ 失败' }}
      </span>
    </div>

    <!-- 工具参数 -->
    <div class="tool-params">
      <div class="params-label">参数:</div>
      <pre class="params-code">{{ formattedParams }}</pre>
    </div>

    <!-- 工具结果 -->
    <div v-if="toolResult" class="tool-result">
      <div class="result-label">结果:</div>
      <div v-if="toolResult.success" class="result-success">
        {{ toolResult.data?.message || '执行成功' }}
      </div>
      <div v-else class="result-error">
        {{ toolResult.error || '执行失败' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-call-display {
  margin-top: 8px;
  padding: 10px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  font-size: 0.9em;
}

.status-pending {
  border-color: #ff9800;
  background-color: #fff3e0;
}

.status-success {
  border-color: #4caf50;
  background-color: #f1f8e9;
}

.status-failed {
  border-color: #f44336;
  background-color: #ffebee;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
}

.tool-icon {
  font-size: 1.1em;
}

.tool-name {
  flex: 1;
}

.tool-status {
  font-size: 0.85em;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-success {
  color: #2e7d32;
  background-color: #c8e6c9;
}

.status-failed {
  color: #c62828;
  background-color: #ffcdd2;
}

.tool-params,
.tool-result {
  margin-top: 8px;
}

.params-label,
.result-label {
  font-size: 0.85em;
  color: #666;
  margin-bottom: 4px;
}

.params-code {
  margin: 0;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  overflow-x: auto;
  white-space: pre-wrap;
}

.result-success {
  color: #2e7d32;
  font-weight: 500;
}

.result-error {
  color: #c62828;
  font-weight: 500;
}
</style>
