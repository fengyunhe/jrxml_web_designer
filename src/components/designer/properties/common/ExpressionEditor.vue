<template>
  <div class="expression-editor">
    <div class="expression-input-group">
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        class="expression-input"
      />
      <button
        @click="showHelp = !showHelp"
        class="help-button"
        title="表达式帮助"
      >
        ?
      </button>
    </div>

    <!-- 表达式帮助面板 -->
    <div v-if="showHelp" class="expression-help">
      <div class="help-section">
        <h5>常用表达式</h5>
        <div class="help-items">
          <div
            v-for="item in commonExpressions"
            :key="item.expression"
            class="help-item"
            @click="insertExpression(item.expression)"
          >
            <span class="expression-text">{{ item.expression }}</span>
            <span class="expression-desc">{{ item.description }}</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h5>字段引用</h5>
        <div class="help-items">
          <div class="help-item" @click="insertExpression('$F{fieldName}')">
            <span class="expression-text">$F{fieldName}</span>
            <span class="expression-desc">字段引用</span>
          </div>
          <div class="help-item" @click="insertExpression('$P{paramName}')">
            <span class="expression-text">$P{paramName}</span>
            <span class="expression-desc">参数引用</span>
          </div>
          <div class="help-item" @click="insertExpression('$V{variableName}')">
            <span class="expression-text">$V{variableName}</span>
            <span class="expression-desc">变量引用</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h5>比较运算符</h5>
        <div class="help-items">
          <div class="help-item" @click="insertExpression('==')">
            <span class="expression-text">==</span>
            <span class="expression-desc">等于</span>
          </div>
          <div class="help-item" @click="insertExpression('!=')">
            <span class="expression-text">!=</span>
            <span class="expression-desc">不等于</span>
          </div>
          <div class="help-item" @click="insertExpression('>')">
            <span class="expression-text">></span>
            <span class="expression-desc">大于</span>
          </div>
          <div class="help-item" @click="insertExpression('<')">
            <span class="expression-text"><</span>
            <span class="expression-desc">小于</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h5>逻辑运算符</h5>
        <div class="help-items">
          <div class="help-item" @click="insertExpression('&&')">
            <span class="expression-text">&&</span>
            <span class="expression-desc">与</span>
          </div>
          <div class="help-item" @click="insertExpression('||')">
            <span class="expression-text">||</span>
            <span class="expression-desc">或</span>
          </div>
          <div class="help-item" @click="insertExpression('!')">
            <span class="expression-text">!</span>
            <span class="expression-desc">非</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showHelp = ref(false);

const commonExpressions = [
  {
    expression: '$F{field}.equals("value")',
    description: '字段等于指定值'
  },
  {
    expression: '$F{field} != null',
    description: '字段不为空'
  },
  {
    expression: '$F{field} > 0',
    description: '字段大于0'
  },
  {
    expression: '$V{PAGE_NUMBER} > 1',
    description: '页码大于1'
  },
  {
    expression: '$F{status}.equals("active")',
    description: '状态为active'
  },
  {
    expression: '$F{amount}.doubleValue() > 100',
    description: '金额大于100'
  }
];

const insertExpression = (expression: string) => {
  const currentValue = props.modelValue || '';
  emit('update:modelValue', currentValue + expression);
  showHelp.value = false;
};
</script>

<style scoped>
.expression-editor {
  position: relative;
}

.expression-input-group {
  display: flex;
  gap: 4px;
}

.expression-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.expression-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.help-button {
  width: 28px;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
  cursor: pointer;
  font-weight: bold;
  color: #666;
}

.help-button:hover {
  background: #e6e6e6;
  border-color: #999;
}

.expression-help {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 4px;
}

.help-section {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.help-section:last-child {
  border-bottom: none;
}

.help-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.help-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.help-item:hover {
  background: #f5f5f5;
}

.expression-text {
  font-family: monospace;
  color: #1890ff;
  font-weight: 500;
}

.expression-desc {
  color: #999;
  font-size: 11px;
}
</style>
