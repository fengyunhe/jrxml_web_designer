<template>
  <div 
    class="resizable-panel" 
    :class="[
      `resizable-panel--${position}`,
      { 'resizable-panel--collapsed': isCollapsed }
    ]"
    :style="panelStyle"
  >
    <!-- 折叠按钮 -->
    <div 
      v-if="collapsible"
      class="panel-collapse-button"
      :class="`panel-collapse-button--${position}`"
      @click="toggleCollapse"
    >
      <span class="collapse-icon">{{ isCollapsed ? expandIcon : collapseIcon }}</span>
    </div>
    
    <!-- 调整手柄 -->
    <div 
      v-if="resizable && !isCollapsed"
      class="panel-resize-handle"
      :class="`panel-resize-handle--${position}`"
      @mousedown.stop="startResizing"
    ></div>
    
    <!-- 面板内容 -->
    <div v-if="!isCollapsed" class="panel-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

// 定义组件属性
interface Props {
  // 面板位置：left, right, bottom
  position: 'left' | 'right' | 'bottom';
  // 初始尺寸（宽度或高度，取决于位置）
  initialSize: number;
  // 最小尺寸
  minSize?: number;
  // 最大尺寸
  maxSize?: number;
  // 是否可调整大小
  resizable?: boolean;
  // 是否可折叠
  collapsible?: boolean;
  // 折叠后的尺寸
  collapsedSize?: number;
}

// 定义组件事件
interface Emits {
  (e: 'size-change', size: number): void;
  (e: 'collapse-change', isCollapsed: boolean): void;
}

// 使用默认值
const props = withDefaults(defineProps<Props>(), {
  minSize: 200,
  maxSize: 600,
  resizable: true,
  collapsible: false,
  collapsedSize: 40
});

const emit = defineEmits<Emits>();

// 响应式数据
const currentSize = ref(props.initialSize);
const isCollapsed = ref(false);
const isResizing = ref(false);

// 计算面板样式
const panelStyle = computed(() => {
  const size = isCollapsed.value ? props.collapsedSize : currentSize.value;
  
  if (props.position === 'left' || props.position === 'right') {
    return {
      width: `${size}px`
    };
  } else {
    return {
      height: `${size}px`
    };
  }
});

// 折叠图标
const collapseIcon = computed(() => {
  switch (props.position) {
    case 'left': return '◀';
    case 'right': return '▶';
    case 'bottom': return '▼';
    default: return '◀';
  }
});

// 展开图标
const expandIcon = computed(() => {
  switch (props.position) {
    case 'left': return '▶';
    case 'right': return '◀';
    case 'bottom': return '▲';
    default: return '▶';
  }
});

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse-change', isCollapsed.value);
};

// 开始调整大小
const startResizing = (event: MouseEvent) => {
  if (!props.resizable || isCollapsed.value) return;
  
  event.preventDefault();
  isResizing.value = true;
  
  const startPos = props.position === 'left' || props.position === 'right' 
    ? event.clientX 
    : event.clientY;
  const startSize = currentSize.value;
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return;
    
    let delta: number;
    
    if (props.position === 'left') {
      // 左侧面板：向右拖动增加宽度
      delta = e.clientX - startPos;
    } else if (props.position === 'right') {
      // 右侧面板：向左拖动增加宽度
      delta = startPos - e.clientX;
    } else {
      // 底部面板：向上拖动增加高度
      delta = startPos - e.clientY;
    }
    
    // 计算新尺寸并限制在最小/最大值之间
    const newSize = Math.max(props.minSize!, Math.min(props.maxSize!, startSize + delta));
    currentSize.value = newSize;
    emit('size-change', newSize);
  };
  
  const handleMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 清理事件监听器
onUnmounted(() => {
  // 确保在组件卸载时移除所有事件监听器
  document.removeEventListener('mousemove', () => {});
  document.removeEventListener('mouseup', () => {});
});
</script>

<style scoped>
.resizable-panel {
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}

/* 左侧面板 */
.resizable-panel--left {
  border-right: 1px solid #ddd;
}

/* 右侧面板 */
.resizable-panel--right {
  border-left: 1px solid #ddd;
}

/* 底部面板 */
.resizable-panel--bottom {
  border-top: 1px solid #ddd;
}

/* 折叠状态 */
.resizable-panel--collapsed {
  min-width: auto !important;
  min-height: auto !important;
}

/* 折叠按钮 */
.panel-collapse-button {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 0 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.panel-collapse-button--left {
  right: 0;
  top: 0;
}

.panel-collapse-button--right {
  left: 0;
  top: 0;
  border-radius: 0 0 4px 0;
}

.panel-collapse-button--bottom {
  right: 0;
  top: 0;
  border-radius: 0 0 0 4px;
}

.collapse-icon {
  font-size: 12px;
  user-select: none;
}

/* 调整手柄 */
.panel-resize-handle {
  position: absolute;
  background-color: transparent;
  z-index: 5;
}

.panel-resize-handle:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 左侧面板调整手柄 */
.panel-resize-handle--left {
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
}

/* 右侧面板调整手柄 */
.panel-resize-handle--right {
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
}

/* 底部面板调整手柄 */
.panel-resize-handle--bottom {
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  cursor: ns-resize;
}

/* 面板内容 */
.panel-content {
  width: 100%;
  height: 100%;
  overflow: hidden; /* 改为hidden，让子元素自己处理滚动 */
  padding: 8px;
  display: flex;
  flex-direction: column;
}
</style>