<template>
  <BaseElement
    :element="element"
    :band-index="bandIndex"
    :element-index="elementIndex"
    :selected-element="selectedElement"
    :report-font-family="reportFontFamily"
    :report-font-size="reportFontSize"
    :report-is-bold="reportIsBold"
    :report-is-italic="reportIsItalic"
    :report-is-underline="reportIsUnderline"
    @select="handleSelect"
    @drag-start="handleDragStart"
    @resize-start="handleResizeStart"
  >
    <template v-if="isEditing">
      <input 
        v-model="element.text" 
        type="text" 
        class="inline-edit-input"
        @blur="handleFinishEditing"
        @keyup.enter="handleFinishEditing"
        @keyup.esc="handleCancelEditing"
        ref="editInput"
      />
    </template>
    <template v-else>
      <span @dblclick.stop="handleStartEditing">{{ element.text || '静态文本' }}</span>
    </template>
  </BaseElement>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseElement from './BaseElement.vue';
import type { StaticTextElement, SelectedElementInfo, EditingElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: StaticTextElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  editingElement: EditingElementInfo | null;
  reportFontFamily?: string;
  reportFontSize?: number;
  reportIsBold?: boolean;
  reportIsItalic?: boolean;
  reportIsUnderline?: boolean;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  startEditing: [bandIndex: number, elementIndex: number];
  finishEditing: [];
  cancelEditing: [];
}>();

// Refs
const editInput = ref<HTMLInputElement | null>(null);

// 是否正在编辑
const isEditing = computed(() => {
  return props.editingElement && 
         props.editingElement.bandIndex === props.bandIndex && 
         props.editingElement.elementIndex === props.elementIndex;
});

// 当进入编辑状态时，聚焦输入框
watch(() => isEditing.value, (newVal) => {
  if (newVal && editInput.value) {
    setTimeout(() => {
      editInput.value?.focus();
      editInput.value?.select();
    }, 10);
  }
});

// 处理选择
const handleSelect = (bandIndex: number, elementIndex: number) => {
  emit('select', bandIndex, elementIndex);
};

// 处理拖拽开始
const handleDragStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('dragStart', event, bandIndex, elementIndex);
};

// 处理调整大小开始
const handleResizeStart = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  emit('resizeStart', event, bandIndex, elementIndex);
};

// 开始编辑
const handleStartEditing = () => {
  emit('startEditing', props.bandIndex, props.elementIndex);
};

// 完成编辑
const handleFinishEditing = () => {
  emit('finishEditing');
};

// 取消编辑
const handleCancelEditing = () => {
  emit('cancelEditing');
};
</script>

<style scoped>
.inline-edit-input {
  width: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  text-decoration: inherit;
}
</style>