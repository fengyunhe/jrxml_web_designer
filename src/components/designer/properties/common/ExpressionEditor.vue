<template>
  <div class="expression-editor" ref="editorRef">
    <div class="expression-input-group">
      <input
        ref="inputRef"
        :value="modelValue"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
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

    <!-- 自动完成下拉 -->
    <div v-if="showAutocomplete && filteredSuggestions.length > 0" class="autocomplete-dropdown">
      <div
        v-for="(item, index) in filteredSuggestions"
        :key="item.value"
        class="autocomplete-item"
        :class="{ active: index === activeSuggestionIndex }"
        @mousedown.prevent="selectSuggestion(item)"
        @mouseenter="activeSuggestionIndex = index"
      >
        <span class="autocomplete-type" :class="item.type">{{ item.typeLabel }}</span>
        <span class="autocomplete-value">{{ item.value }}</span>
        <span v-if="item.description" class="autocomplete-desc">{{ item.description }}</span>
      </div>
    </div>

    <!-- 表达式帮助面板 -->
    <div v-if="showHelp && !showAutocomplete" class="expression-help">
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

      <div class="help-section">
        <h5>内置方法</h5>
        <div class="help-items">
          <div class="help-item" @click="insertExpression('NOW()')">
            <span class="expression-text">NOW()</span>
            <span class="expression-desc">当前时间</span>
          </div>
          <div class="help-item" @click="insertExpression('TODAY()')">
            <span class="expression-text">TODAY()</span>
            <span class="expression-desc">今天日期</span>
          </div>
          <div class="help-item" @click="insertExpression('String.valueOf()')">
            <span class="expression-text">String.valueOf()</span>
            <span class="expression-desc">转换为字符串</span>
          </div>
          <div class="help-item" @click="insertExpression('Integer.valueOf()')">
            <span class="expression-text">Integer.valueOf()</span>
            <span class="expression-desc">转换为整数</span>
          </div>
          <div class="help-item" @click="insertExpression('Double.valueOf()')">
            <span class="expression-text">Double.valueOf()</span>
            <span class="expression-desc">转换为浮点数</span>
          </div>
          <div class="help-item" @click="insertExpression('new java.util.Date()')">
            <span class="expression-text">new java.util.Date()</span>
            <span class="expression-desc">创建当前日期</span>
          </div>
          <div class="help-item" @click="insertExpression('new java.text.SimpleDateFormat(&quot;yyyy-MM-dd&quot;).format()')">
            <span class="expression-text">SimpleDateFormat.format()</span>
            <span class="expression-desc">日期格式化</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';

interface SuggestionItem {
  value: string;
  type: 'field' | 'parameter' | 'variable' | 'method';
  typeLabel: string;
  description?: string;
}

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  reportFields?: Array<{ name: string; class?: string }>;
  reportParameters?: Array<{ name: string; class?: string }>;
  reportVariables?: Array<{ name: string; class?: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRef = ref<HTMLElement>();
const inputRef = ref<HTMLInputElement>();
const showHelp = ref(false);
const showAutocomplete = ref(false);
const activeSuggestionIndex = ref(0);
const currentPrefix = ref<'$F{' | '$P{' | '$V{' | 'method' | null>(null);
const currentFilter = ref('');

const allSuggestions = computed<SuggestionItem[]>(() => {
  const items: SuggestionItem[] = [];

  if (props.reportFields) {
    for (const field of props.reportFields) {
      items.push({
        value: field.name,
        type: 'field',
        typeLabel: 'F',
        description: field.class,
      });
    }
  }

  if (props.reportParameters) {
    for (const param of props.reportParameters) {
      items.push({
        value: param.name,
        type: 'parameter',
        typeLabel: 'P',
        description: param.class,
      });
    }
  }

  // Built-in variables
  const builtInVars = [
    { value: 'PAGE_NUMBER', description: '当前页码' },
    { value: 'PAGE_COUNT', description: '总页数' },
    { value: 'REPORT_COUNT', description: '记录总数' },
    { value: 'COLUMN_NUMBER', description: '当前列号' },
    { value: 'CURRENT_ROW_COUNT', description: '当前行号' },
    { value: 'REPORT_PARAMETERS_MAP', description: '报表参数映射' },
    { value: 'REPORT_FILE', description: '报表文件名' },
    { value: 'REPORT_CONNECTION', description: '报表连接' },
    { value: 'REPORT_SCRIPTLET', description: '报表脚本' },
    { value: 'SUBREPORT_DIR', description: '子报表目录' },
    { value: 'REPORT_DATA_SOURCE', description: '报表数据源' },
    { value: 'IS_IGNORE_PAGINATION', description: '是否忽略分页' },
  ];
  for (const v of builtInVars) {
    items.push({
      value: v.value,
      type: 'variable',
      typeLabel: 'V',
      description: v.description,
    });
  }

  // User-defined report variables
  if (props.reportVariables) {
    for (const variable of props.reportVariables) {
      items.push({
        value: variable.name,
        type: 'variable',
        typeLabel: 'V',
        description: variable.class,
      });
    }
  }

  // Built-in methods
  const builtInMethods = [
    { value: 'NOW()', description: '当前时间' },
    { value: 'TODAY()', description: '今天日期' },
    { value: 'String.valueOf(', description: '转换为字符串' },
    { value: 'Integer.valueOf(', description: '转换为整数' },
    { value: 'Double.valueOf(', description: '转换为浮点数' },
    { value: 'new java.util.Date()', description: '创建当前日期' },
    { value: 'new java.text.SimpleDateFormat("yyyy-MM-dd").format(', description: '日期格式化' },
  ];
  for (const m of builtInMethods) {
    items.push({
      value: m.value,
      type: 'method',
      typeLabel: 'M',
      description: m.description,
    });
  }

  return items;
});

const filteredSuggestions = computed(() => {
  const filter = currentFilter.value.toLowerCase();
  let typeFilter: string | null = null;
  if (currentPrefix.value === '$F{') typeFilter = 'field';
  else if (currentPrefix.value === '$P{') typeFilter = 'parameter';
  else if (currentPrefix.value === '$V{') typeFilter = 'variable';
  else if (currentPrefix.value === 'method') typeFilter = 'method';

  return allSuggestions.value
    .filter(item => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (filter && !item.value.toLowerCase().includes(filter)) return false;
      return true;
    })
    .slice(0, 10);
});

function detectAutocompleteContext(value: string, cursorPos: number) {
  const beforeCursor = value.substring(0, cursorPos);
  const match = beforeCursor.match(/\$(F|P|V)\{([^}]*)$/);
  if (match) {
    currentPrefix.value = `$${match[1]}{` as '$F{' | '$P{' | '$V{';
    currentFilter.value = match[2];
    showAutocomplete.value = true;
    activeSuggestionIndex.value = 0;
  } else {
    // Check for method name trigger: extract word at cursor
    const wordMatch = beforeCursor.match(/([A-Za-z][A-Za-z0-9_.]*)$/);
    if (wordMatch && wordMatch[1].length >= 2) {
      const word = wordMatch[1];
      // Check if any method suggestion starts with the typed word (case-insensitive)
      const hasMethodMatch = allSuggestions.value.some(
        item => item.type === 'method' && item.value.toLowerCase().startsWith(word.toLowerCase())
      );
      if (hasMethodMatch) {
        currentPrefix.value = 'method';
        currentFilter.value = word;
        showAutocomplete.value = true;
        activeSuggestionIndex.value = 0;
        return;
      }
    }
    showAutocomplete.value = false;
    currentPrefix.value = null;
    currentFilter.value = '';
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  emit('update:modelValue', value);
  nextTick(() => {
    detectAutocompleteContext(value, target.selectionStart || value.length);
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (!showAutocomplete.value) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeSuggestionIndex.value = Math.min(
      activeSuggestionIndex.value + 1,
      filteredSuggestions.value.length - 1
    );
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeSuggestionIndex.value = Math.max(activeSuggestionIndex.value - 1, 0);
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    if (filteredSuggestions.value.length > 0) {
      event.preventDefault();
      selectSuggestion(filteredSuggestions.value[activeSuggestionIndex.value]);
    }
  } else if (event.key === 'Escape') {
    showAutocomplete.value = false;
  }
}

function selectSuggestion(item: SuggestionItem) {
  const input = inputRef.value;
  if (!input) return;

  const value = props.modelValue || '';
  const cursorPos = input.selectionStart || value.length;
  const beforeCursor = value.substring(0, cursorPos);
  const afterCursor = value.substring(cursorPos);

  if (item.type === 'method') {
    // Replace the partial word before cursor with the full method text
    const wordMatch = beforeCursor.match(/([A-Za-z][A-Za-z0-9_.]*)$/);
    if (wordMatch) {
      const prefixStart = beforeCursor.length - wordMatch[0].length;
      const newValue = beforeCursor.substring(0, prefixStart) + item.value + afterCursor;
      emit('update:modelValue', newValue);
    }
  } else {
    const prefixMatch = beforeCursor.match(/\$(F|P|V)\{[^}]*$/);
    if (prefixMatch) {
      const prefixStart = beforeCursor.lastIndexOf('$');
      const newValue = beforeCursor.substring(0, prefixStart) + `$${prefixMatch[1]}{${item.value}}` + afterCursor;
      emit('update:modelValue', newValue);
    }
  }

  showAutocomplete.value = false;
  currentPrefix.value = null;

  nextTick(() => {
    input.focus();
  });
}

function handleFocus() {
  if (inputRef.value) {
    detectAutocompleteContext(
      props.modelValue || '',
      inputRef.value.selectionStart || 0
    );
  }
}

function handleBlur() {
  // Delay to allow click on autocomplete item
  setTimeout(() => {
    showAutocomplete.value = false;
  }, 200);
}

const commonExpressions = [
  { expression: '$F{field}.equals("value")', description: '字段等于指定值' },
  { expression: '$F{field} != null', description: '字段不为空' },
  { expression: '$F{field} > 0', description: '字段大于0' },
  { expression: '$V{PAGE_NUMBER} > 1', description: '页码大于1' },
  { expression: '$F{status}.equals("active")', description: '状态为active' },
  { expression: '$F{amount}.doubleValue() > 100', description: '金额大于100' },
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

/* Autocomplete dropdown */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 2px;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.1s;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background: #e6f4ff;
}

.autocomplete-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.autocomplete-type.field {
  background: #1890ff;
}

.autocomplete-type.parameter {
  background: #722ed1;
}

.autocomplete-type.variable {
  background: #fa8c16;
}

.autocomplete-type.method {
  background: #52c41a;
}

.autocomplete-value {
  font-family: monospace;
  font-weight: 500;
  color: #333;
}

.autocomplete-desc {
  color: #999;
  font-size: 11px;
  margin-left: auto;
}

/* Help panel */
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
