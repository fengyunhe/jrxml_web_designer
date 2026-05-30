<template>
  <div class="multi-select-toolbar" v-if="visible">
    <div class="toolbar-group">
      <span class="toolbar-label">对齐</span>
      <button class="toolbar-btn" title="左对齐" @click="$emit('align', 'left')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="2" width="2" height="12" fill="currentColor"/><rect x="5" y="4" width="8" height="3" fill="currentColor" opacity="0.7"/><rect x="5" y="9" width="5" height="3" fill="currentColor" opacity="0.7"/></svg>
      </button>
      <button class="toolbar-btn" title="水平居中" @click="$emit('align', 'center')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="7" y="1" width="2" height="14" fill="currentColor" opacity="0.3"/><rect x="3" y="4" width="10" height="3" fill="currentColor" opacity="0.7"/><rect x="4" y="9" width="8" height="3" fill="currentColor" opacity="0.7"/></svg>
      </button>
      <button class="toolbar-btn" title="右对齐" @click="$emit('align', 'right')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="13" y="2" width="2" height="12" fill="currentColor"/><rect x="3" y="4" width="8" height="3" fill="currentColor" opacity="0.7"/><rect x="6" y="9" width="5" height="3" fill="currentColor" opacity="0.7"/></svg>
      </button>
      <span class="toolbar-divider"></span>
      <button class="toolbar-btn" title="上对齐" @click="$emit('align', 'top')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="1" width="12" height="2" fill="currentColor"/><rect x="3" y="5" width="3" height="8" fill="currentColor" opacity="0.7"/><rect x="9" y="5" width="3" height="5" fill="currentColor" opacity="0.7"/></svg>
      </button>
      <button class="toolbar-btn" title="垂直居中" @click="$emit('align', 'middle')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="7" width="14" height="2" fill="currentColor" opacity="0.3"/><rect x="3" y="2" width="3" height="12" fill="currentColor" opacity="0.7"/><rect x="9" y="4" width="3" height="8" fill="currentColor" opacity="0.7"/></svg>
      </button>
      <button class="toolbar-btn" title="下对齐" @click="$emit('align', 'bottom')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="13" width="12" height="2" fill="currentColor"/><rect x="3" y="3" width="3" height="8" fill="currentColor" opacity="0.7"/><rect x="9" y="5" width="3" height="6" fill="currentColor" opacity="0.7"/></svg>
      </button>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">分布</span>
      <button class="toolbar-btn" title="水平均匀分布" @click="$emit('distribute', 'horizontal')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="2" width="1" height="12" fill="currentColor" opacity="0.5"/><rect x="4" y="4" width="3" height="8" fill="currentColor" opacity="0.7"/><rect x="9" y="4" width="3" height="8" fill="currentColor" opacity="0.7"/><rect x="14" y="2" width="1" height="12" fill="currentColor" opacity="0.5"/></svg>
      </button>
      <button class="toolbar-btn" title="垂直均匀分布" @click="$emit('distribute', 'vertical')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="1" width="12" height="1" fill="currentColor" opacity="0.5"/><rect x="4" y="4" width="8" height="3" fill="currentColor" opacity="0.7"/><rect x="4" y="9" width="8" height="3" fill="currentColor" opacity="0.7"/><rect x="2" y="14" width="12" height="1" fill="currentColor" opacity="0.5"/></svg>
      </button>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">尺寸</span>
      <button class="toolbar-btn" title="相同宽度" @click="$emit('resize', 'sameWidth')">W</button>
      <button class="toolbar-btn" title="相同高度" @click="$emit('resize', 'sameHeight')">H</button>
      <button class="toolbar-btn" title="相同大小" @click="$emit('resize', 'sameSize')">
        <svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="5" width="6" height="6" fill="currentColor" opacity="0.5"/></svg>
      </button>
    </div>

    <span class="toolbar-divider"></span>
    <span class="toolbar-info">{{ count }} 个元素已选中</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  count: number;
}>();

defineEmits<{
  (e: 'align', direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void;
  (e: 'distribute', direction: 'horizontal' | 'vertical'): void;
  (e: 'resize', type: 'sameWidth' | 'sameHeight' | 'sameSize'): void;
}>();
</script>

<style scoped>
.multi-select-toolbar {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  background: #2c2c2c;
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  z-index: 100;
  white-space: nowrap;
  font-size: 12px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-label {
  font-size: 11px;
  color: #aaa;
  margin-right: 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: #ddd;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: #444;
  color: #fff;
}

.toolbar-btn:active {
  background: #4a90e2;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #555;
  margin: 0 4px;
}

.toolbar-info {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}
</style>
