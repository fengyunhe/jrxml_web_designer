<template>
  <div class="color-picker-with-opacity">
    <div class="color-picker-row">
      <input 
        v-model="localColor" 
        type="color" 
        @input="updateColor" 
        class="color-input"
      />
    </div>
    <div class="color-opacity-row">
        <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        v-model.number="localOpacity" 
        @input="updateColor" 
        class="opacity-slider"
      />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: string | undefined;
  mode: 'Opaque' | 'Transparent' | undefined;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  'update:mode': [value: 'Opaque' | 'Transparent'];
}>();

// 本地状态
const localColor = ref('#ffffff');
const localOpacity = ref(1);

// 更新颜色
const updateColor = () => {
  let backcolor: string | undefined;
  let mode: 'Opaque' | 'Transparent';
  
  // 始终保持颜色值，只根据透明度调整格式
  if (localOpacity.value >= 1) {
    // 完全不透明，使用 hex
    backcolor = localColor.value;
    mode = 'Opaque';
  } else {
    // 半透明，使用 rgba
    // Hex 转 RGB
    let hex = localColor.value;
    if (hex.startsWith('#')) hex = hex.slice(1);
    
    // 处理简写 hex (e.g. #fff)
    if (hex.length === 3) {
      hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
    }
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // 保留4位小数
    const alpha = Math.round(localOpacity.value * 10000) / 10000;
    backcolor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    mode = alpha === 0 ? 'Transparent' : 'Opaque';
  }
  
  emit('update:modelValue', backcolor);
  emit('update:mode', mode);
};

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    localColor.value = '#ffffff';
    localOpacity.value = 0;
    return;
  }
  
  if (newVal.startsWith('#')) {
    localColor.value = newVal;
    // 更换背景颜色时，如果是白色，默认透明；其他颜色默认不透明
    localOpacity.value = newVal.toLowerCase() === '#ffffff' ? 0 : 1;
  } else if (newVal.startsWith('rgba')) {
    // 解析 rgba(r, g, b, a)
    const match = newVal.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]!);
      const g = parseInt(match[2]!);
      const b = parseInt(match[3]!);
      const a = match[4] ? parseFloat(match[4]) : 1;
      
      // RGB 转 Hex
      const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      localColor.value = hex;
      localOpacity.value = a;
    }
  } else if (newVal.startsWith('rgb')) {
    // 解析 rgb(r, g, b)
    const match = newVal.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]!);
      const g = parseInt(match[2]!);
      const b = parseInt(match[3]!);
      
      // RGB 转 Hex
      const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      localColor.value = hex;
      localOpacity.value = 1;
    }
  }
}, { immediate: true });

// 监听本地颜色变化，实现更换颜色时的透明度自动调整
watch(localColor, (newColor) => {
  // 更换背景颜色时，如果是白色，默认透明；其他颜色默认不透明
  localOpacity.value = newColor.toLowerCase() === '#ffffff' ? 0 : 1;
  // 更新颜色
  updateColor();
});
</script>

<style scoped>
.color-picker-with-opacity {
  width: 100%;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.color-input {
  width: 100%;
  padding: 0;
  border: 1px solid #ddd;
  cursor: pointer;
  height: 18px;
  flex-shrink: 0;
}

.opacity-slider {
  width: 100%;
  height: 6px;
  padding: 0;
  margin: 0;
}
</style>
