<template>
  <div class="band-height-controls">
    <h4>Band高度设置</h4>
    <div class="band-heights-grid">
      <div v-for="(band, index) in bands" :key="index" class="band-height-item">
        <label>{{ getBandDisplayName(band.type) }}</label>
        <div class="band-height-control">
          <input 
            v-model.number="band.height" 
            type="number" 
            min="0"
            class="band-height-input"
            @change="updateBandHeight(index)"
            @blur="updateBandHeight(index)"
          />
          <span class="band-height-unit">px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '../../../types';

interface Props {
  bands: Band[];
}

interface Emits {
  (e: 'update:bands', bands: Band[]): void;
  (e: 'update-jrxml'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 获取Band显示名称
function getBandDisplayName(bandType: string): string {
  const bandNames: Record<string, string> = {
    'TITLE': '标题',
    'PAGE_HEADER': '页眉',
    'COLUMN_HEADER': '列标题',
    'DETAIL': '详细数据',
    'COLUMN_FOOTER': '列脚',
    'PAGE_FOOTER': '页脚',
    'SUMMARY': '汇总',
    'BACKGROUND': '背景',
    'LAST_PAGE_FOOTER': '末页页脚',
    'NO_DATA': '无数据'
  };
  return bandNames[bandType] || bandType;
}

// 更新Band高度
function updateBandHeight(_index: number) {
  const updatedBands = [...props.bands];
  emit('update:bands', updatedBands);
  emit('update-jrxml');
}
</script>

<style scoped>
.band-height-controls {
  margin-bottom: 24px;
}

.band-height-controls h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.band-heights-grid {
  display: grid;
  gap: 8px;
}

.band-height-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.band-height-item label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  flex: 1;
  margin-right: 8px;
}

.band-height-control {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 100px;
}

.band-height-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.band-height-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.band-height-unit {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
</style>
