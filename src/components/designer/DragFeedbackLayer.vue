<template>
  <div class="drag-feedback-layer" v-if="feedback.isDragging">
    <!-- 拖拽预览元素 -->
    <div
      v-if="feedback.previewPosition && feedback.previewSize"
      class="drag-preview"
      :style="{
        position: 'fixed',
        left: feedback.previewPosition.x + 'px',
        top: feedback.previewPosition.y + 'px',
        width: feedback.previewSize.width + 'px',
        height: feedback.previewSize.height + 'px',
        pointerEvents: 'none',
        zIndex: 1000,
      }"
    >
      <!-- 预览内容（显示元素类型图标） -->
      <div class="preview-content">
        <div class="preview-icon">
          <component :is="getDraggedElementIcon()" />
        </div>
        <div class="preview-info">
          <span class="element-type">{{ getDraggedElementType() }}</span>
          <span class="position">
            x: {{ Math.round(feedback.previewPosition.x) }}
            y: {{ Math.round(feedback.previewPosition.y) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 可放置区域高亮 -->
    <div
      v-for="zone in feedback.droppableZones"
      :key="zone.id"
      class="droppable-zone"
      :class="{
        'highlighted': zone.highlighted,
        'active': feedback.isDragging,
      }"
      :style="{
        position: 'absolute',
        left: zone.bounds.x + 'px',
        top: zone.bounds.y + 'px',
        width: zone.bounds.width + 'px',
        height: zone.bounds.height + 'px',
      }"
    >
      <div class="zone-border" />
      <div class="zone-label" v-if="zone.highlighted">
        放置到此处
      </div>
    </div>

    <!-- 吸附点可视化 -->
    <div
      v-for="point in feedback.snapPoints"
      :key="point.id"
      class="snap-point"
      :class="{
        'active': point.active,
        'horizontal': point.type === 'horizontal',
        'vertical': point.type === 'vertical',
      }"
      :style="{
        position: 'absolute',
        left: point.position.x + 'px',
        top: point.position.y + 'px',
      }"
    >
      <div class="snap-indicator" />
    </div>

    <!-- 吸附指示线 -->
    <div
      v-for="line in feedback.snapLines"
      :key="line.id"
      class="snap-line"
      :class="{
        'active': line.active,
        'horizontal': line.type === 'horizontal',
        'vertical': line.type === 'vertical',
      }"
      :style="getLineStyle(line)"
    >
      <div class="line-label">
        {{ Math.round(line.position) }}px
      </div>
    </div>

    <!-- 对齐辅助信息 -->
    <div
      class="alignment-info"
      v-if="feedback.snapLines.length > 0"
    >
      <div class="info-badge">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
        </svg>
        <span>已对齐</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DragFeedback } from '@/composables/useDragFeedback';

const props = defineProps<{
  feedback: DragFeedback;
}>();

// 获取拖拽元素图标
const getDraggedElementIcon = () => {
  // 根据元素类型返回不同的图标组件
  // 这里简化处理，实际可以根据type动态加载
  return 'div';
};

// 获取拖拽元素类型文本
const getDraggedElementType = () => {
  if (!props.feedback.draggedElementInfo) return '';

  const typeMap: Record<string, string> = {
    'staticText': '静态文本',
    'textField': '文本字段',
    'image': '图片',
    'line': '线条',
    'rectangle': '矩形',
    'ellipse': '椭圆',
    'break': '分页符',
    'frame': '框架',
    'table': '表格',
  };

  return typeMap[props.feedback.draggedElementInfo.type] || props.feedback.draggedElementInfo.type;
};

// 获取对齐线样式
const getLineStyle = (line: DragFeedback['snapLines'][0]) => {
  if (line.type === 'horizontal') {
    return {
      position: 'absolute' as const,
      left: '0',
      top: line.position + 'px',
      width: '100%',
      height: '1px',
    };
  } else {
    return {
      position: 'absolute' as const,
      left: line.position + 'px',
      top: '0',
      width: '1px',
      height: '100%',
    };
  }
};
</script>

<style scoped>
.drag-feedback-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.drag-preview {
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed #1890ff;
  border-radius: 4px;
  animation: drag-pulse 1.5s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
}

.preview-icon {
  width: 32px;
  height: 32px;
  background: #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon svg {
  width: 20px;
  height: 20px;
  color: white;
}

.preview-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.element-type {
  color: #1890ff;
  font-weight: 500;
}

.position {
  color: rgba(0, 0, 0, 0.45);
  font-family: monospace;
}

.droppable-zone {
  border: 2px dashed transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.droppable-zone.highlighted {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.droppable-zone.active {
  border-color: rgba(24, 144, 255, 0.3);
}

.zone-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px dashed rgba(24, 144, 255, 0.2);
  pointer-events: none;
}

.zone-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1890ff;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  animation: fadeIn 0.2s ease;
}

.snap-point {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1001;
}

.snap-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff4d4f;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: snap-pulse 0.5s ease-in-out infinite;
}

.snap-point.horizontal .snap-indicator {
  width: 8px;
  height: 12px;
  border-radius: 4px;
}

.snap-point.vertical .snap-indicator {
  width: 12px;
  height: 8px;
  border-radius: 4px;
}

.snap-line {
  position: absolute;
  background: #ff4d4f;
  opacity: 0.8;
  z-index: 1000;
  transition: opacity 0.2s ease;
}

.snap-line.horizontal {
  height: 2px;
}

.snap-line.vertical {
  width: 2px;
}

.line-label {
  position: absolute;
  background: #ff4d4f;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-family: monospace;
  white-space: nowrap;
  pointer-events: none;
}

.snap-line.horizontal .line-label {
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
}

.snap-line.vertical .line-label {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.alignment-info {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1002;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #52c41a;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes drag-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
  }
}

@keyframes snap-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
