<script setup lang="ts">
import { ref, computed } from 'vue';

// Props
const props = withDefaults(defineProps<{
  disabled?: boolean;
  placeholder?: string;
  maxlength?: number;
}>(), {
  disabled: false,
  placeholder: '输入指令，例如：在detail band中创建一个文本框显示客户名称',
  maxlength: 1000
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit', value: string): void;
}>();

// 状态
const inputValue = ref('');
const isFocused = ref(false);

// 计算属性
const canSubmit = computed(() => {
  return inputValue.value.trim().length > 0 && !props.disabled;
});

// 方法
function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  inputValue.value = target.value;
  emit('update:modelValue', inputValue.value);
}

function handleSubmit() {
  if (!canSubmit.value) return;

  emit('submit', inputValue.value.trim());
  inputValue.value = '';
}

function handleKeydown(event: KeyboardEvent) {
  // Ctrl+Enter键提交（或Command+Enter on Mac）
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSubmit();
  }
}

function handleFocus() {
  isFocused.value = true;
}

function handleBlur() {
  isFocused.value = false;
}
</script>

<template>
  <div :class="['chat-input-container', { 'is-focused': isFocused, 'is-disabled': disabled }]">
    <textarea
      :value="inputValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :maxlength="maxlength"
      class="chat-input"
      @input="handleInput"
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
      rows="2"
    ></textarea>

    <div class="input-actions">
      <button
        class="submit-btn"
        :disabled="!canSubmit"
        @click="handleSubmit"
        title="发送消息 (Ctrl+Enter)"
      >
        <span class="btn-icon">➤</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input-container {
  display: flex;
  gap: 8px;
  padding: 12px;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
}

.chat-input-container.is-focused {
  box-shadow: inset 0 0 0 2px #2196f3;
}

.chat-input-container.is-disabled {
  background-color: #f5f5f5;
}

.chat-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  font-family: inherit;
}

.chat-input:focus {
  outline: none;
  border-color: #2196f3;
}

.chat-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.submit-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: #2196f3;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1976d2;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2em;
}
</style>
