<template>
  <div class="alignment-guides" v-if="guides.length > 0">
    <div
      v-for="guide in guides"
      :key="guide.id"
      class="guide-line"
      :class="[guide.type, { active: guide.active }]"
      :style="guideStyle(guide)"
    >
      <span v-if="guide.label" class="guide-label">{{ guide.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface AlignmentGuideData {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  label?: string;
  active: boolean;
}

const props = defineProps<{
  guides: AlignmentGuideData[];
  zoomLevel?: number;
}>();

const zoom = computed(() => props.zoomLevel ?? 1);

function guideStyle(guide: AlignmentGuideData) {
  const pos = guide.position * zoom.value;
  if (guide.type === 'horizontal') {
    return {
      top: `${pos}px`,
      left: '0',
      right: '0',
      height: '1px',
    };
  }
  return {
    left: `${pos}px`,
    top: '0',
    bottom: '0',
    width: '1px',
  };
}
</script>

<style scoped>
.alignment-guides {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.guide-line {
  position: absolute;
}

.guide-line.horizontal {
  border-top: 1px dashed #4a90e2;
  opacity: 0.6;
}

.guide-line.vertical {
  border-left: 1px dashed #4a90e2;
  opacity: 0.6;
}

.guide-line.active {
  border-color: #ff4d4f;
  opacity: 0.9;
}

.guide-label {
  position: absolute;
  font-size: 10px;
  background: rgba(74, 144, 226, 0.85);
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;
  top: 2px;
  left: 4px;
  pointer-events: none;
}

.guide-line.active .guide-label {
  background: rgba(255, 77, 79, 0.85);
}
</style>
