```<template>
  <div
    v-if="visible"
    class="selection-box"
    :style="{
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`
    }"
  ></div>
</template>```

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  visible: false
});

// 计算框选框的位置和大小
const left = computed(() => Math.min(props.startX, props.endX));
const top = computed(() => Math.min(props.startY, props.endY));
const width = computed(() => Math.abs(props.endX - props.startX));
const height = computed(() => Math.abs(props.endY - props.startY));
</script>

<style scoped>
.selection-box {
  position: absolute;
  border: 1px dashed #007bff;
  background-color: rgba(0, 123, 255, 0.1);
  pointer-events: none;
  z-index: 1000;
  /* 确保框选框相对于paper-container定位 */
  transform-origin: top left;
}
</style>