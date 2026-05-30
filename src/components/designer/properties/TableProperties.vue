<template>
  <div class="table-properties">
    <h4>Table属性</h4>

    <!-- 数据集 -->
    <div class="form-group">
      <label>数据集名称</label>
      <input
        :value="element.dataset?.name || ''"
        @input="updateDatasetProperty('name', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="tableDataset"
      />
    </div>

    <!-- 连接表达式 -->
    <div class="form-group">
      <label>连接表达式</label>
      <ExpressionEditor
        :model-value="element.dataset?.connectionExpression || ''"
        @update:model-value="updateDatasetProperty('connectionExpression', $event)"
        placeholder="$P{REPORT_CONNECTION}"
      />
    </div>

    <!-- 查询语句 -->
    <div class="form-group">
      <label>查询语句</label>
      <textarea
        :value="element.dataset?.query?.text || ''"
        @input="updateQueryProperty('text', ($event.target as HTMLTextAreaElement).value)"
        placeholder="SELECT * FROM table"
        rows="3"
      ></textarea>
    </div>

    <!-- 查询语言 -->
    <div class="form-group">
      <SelectControl
        :model-value="element.dataset?.query?.language || 'sql'"
        @update:model-value="updateQueryProperty('language', $event)"
        :options="queryLanguageOptions"
        label="查询语言"
      />
    </div>

    <!-- 分隔线 -->
    <div class="form-divider"></div>

    <!-- 表格样式 -->
    <div class="form-group">
      <h5>表格样式</h5>

      <!-- 表头样式 -->
      <div class="style-item">
        <label>表头样式</label>
        <select
          :value="element.styles?.tableHeader || 'Table_TH'"
          @input="updateStyleProperty('tableHeader', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 列头样式 -->
      <div class="style-item">
        <label>列头样式</label>
        <select
          :value="element.styles?.columnHeader || 'Table_CH'"
          @input="updateStyleProperty('columnHeader', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 详情样式 -->
      <div class="style-item">
        <label>详情样式</label>
        <select
          :value="element.styles?.detail || 'Table_TD'"
          @input="updateStyleProperty('detail', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 列脚样式 -->
      <div class="style-item">
        <label>列脚样式</label>
        <select
          :value="element.styles?.columnFooter || 'Table_CH'"
          @input="updateStyleProperty('columnFooter', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 表脚样式 -->
      <div class="style-item">
        <label>表脚样式</label>
        <select
          :value="element.styles?.tableFooter || 'Table_TH'"
          @input="updateStyleProperty('tableFooter', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="form-divider"></div>

    <!-- 无数据类型 -->
    <div class="form-group">
      <SelectControl
        :model-value="element.whenNoDataType || 'AllSectionsNoDetail'"
        @update:model-value="updateProperty('whenNoDataType', $event)"
        :options="whenNoDataTypeOptions"
        label="无数据类型"
        description="当没有数据时的处理方式"
      />
    </div>

    <!-- 打印表头 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.printHeaders !== false"
        @update:model-value="updateProperty('printHeaders', $event)"
        label="打印表头"
        description="是否打印表格表头"
      />
    </div>

    <!-- 忽略宽度 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.ignoreWidth || false"
        @update:model-value="updateProperty('ignoreWidth', $event)"
        label="忽略宽度"
        description="忽略表格宽度限制"
      />
    </div>

    <!-- 忽略分页 -->
    <div class="form-group">
      <SwitchControl
        :model-value="element.isIgnorePagination || false"
        @update:model-value="updateProperty('isIgnorePagination', $event)"
        label="忽略分页"
        description="表格内容不会被分页打断"
      />
    </div>

    <!-- 分隔线 -->
    <div class="form-divider"></div>

    <!-- 行分组管理 -->
    <div class="form-group">
      <h5>行分组</h5>
      <div class="row-groups-list">
        <div
          v-for="(group, index) in element.rowGroups || []"
          :key="index"
          class="row-group-item"
        >
          <span class="row-group-name">{{ group.name || `分组 ${Number(index) + 1}` }}</span>
          <button @click="removeRowGroup(Number(index))" class="remove-button">删除</button>
        </div>
      </div>
      <button @click="addRowGroup" class="add-button">添加行分组</button>
    </div>

    <!-- 分隔线 -->
    <div class="form-divider"></div>

    <!-- 样式继承 -->
    <div class="form-group">
      <label>样式继承</label>
      <select
        :value="element.parentStyle || ''"
        @input="updateProperty('parentStyle', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">无</option>
        <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ExpressionEditor from './common/ExpressionEditor.vue';
import SwitchControl from './common/SwitchControl.vue';
import SelectControl from './common/SelectControl.vue';

const props = defineProps<{
  element: any;
  availableStyles?: string[];
}>();

const emit = defineEmits<{
  'update:element': [element: any];
}>();

const queryLanguageOptions = [
  { value: 'sql', label: 'SQL' },
  { value: 'xPath', label: 'XPath' },
  { value: 'HQL', label: 'HQL' },
  { value: 'EJBQL', label: 'EJBQL' },
  { value: 'MDX', label: 'MDX' }
];

const whenNoDataTypeOptions = [
  { value: 'Blank', label: '空白' },
  { value: 'NoDataCell', label: '无数据单元格' },
  { value: 'AllSectionsNoDetail', label: '所有区域无详情' },
  { value: 'AllSectionsWithDetail', label: '所有区域包含详情' }
];

const updateProperty = (property: string, value: any) => {
  const updatedElement = { ...props.element };
  updatedElement[property] = value;
  emit('update:element', updatedElement);
};

const updateDatasetProperty = (property: string, value: any) => {
  const updatedElement = { ...props.element };
  if (!updatedElement.dataset) {
    updatedElement.dataset = {};
  }
  updatedElement.dataset[property] = value;
  emit('update:element', updatedElement);
};

const updateQueryProperty = (property: string, value: any) => {
  const updatedElement = { ...props.element };
  if (!updatedElement.dataset) {
    updatedElement.dataset = {};
  }
  if (!updatedElement.dataset.query) {
    updatedElement.dataset.query = { language: 'sql', text: '' };
  }
  updatedElement.dataset.query[property] = value;
  emit('update:element', updatedElement);
};

const updateStyleProperty = (property: string, value: any) => {
  const updatedElement = { ...props.element };
  if (!updatedElement.styles) {
    updatedElement.styles = {};
  }
  updatedElement.styles[property] = value;
  emit('update:element', updatedElement);
};

const addRowGroup = () => {
  const updatedElement = { ...props.element };
  if (!updatedElement.rowGroups) {
    updatedElement.rowGroups = [];
  }
  updatedElement.rowGroups.push({
    uuid: crypto.randomUUID(),
    name: `分组 ${updatedElement.rowGroups.length + 1}`,
    height: 30,
    isStartNewPage: false,
    isRepeatHeader: false,
    expression: ''
  });
  emit('update:element', updatedElement);
};

const removeRowGroup = (index: number) => {
  const updatedElement = { ...props.element };
  if (updatedElement.rowGroups) {
    updatedElement.rowGroups.splice(index, 1);
    emit('update:element', updatedElement);
  }
};
</script>

<style scoped>
.table-properties {
  padding: var(--prop-spacing-lg);
}

.table-properties h4 {
  margin: 0 0 var(--prop-spacing-lg) 0;
  padding: 0 0 var(--prop-spacing-sm) 0;
  font-size: var(--prop-font-size-md);
  color: var(--prop-text-primary);
  font-weight: var(--prop-font-weight-semibold);
  border-bottom: 1px solid var(--prop-divider-color);
}

.form-group {
  margin-bottom: var(--prop-spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--prop-spacing-xs);
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-secondary);
  font-weight: var(--prop-font-weight-medium);
}

.form-group h5 {
  margin: 0 0 var(--prop-spacing-md) 0;
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-primary);
  font-weight: var(--prop-font-weight-semibold);
}

.form-divider {
  height: 1px;
  background: var(--prop-divider-color);
  margin: var(--prop-spacing-lg) 0;
}

.style-item {
  display: flex;
  align-items: center;
  gap: var(--prop-spacing-sm);
  margin-bottom: var(--prop-spacing-sm);
}

.style-item label {
  min-width: 80px;
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-secondary);
}

.style-item select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--prop-border-color);
  border-radius: var(--prop-border-radius-md);
  font-size: var(--prop-font-size-sm);
  transition: border-color var(--prop-transition-fast), box-shadow var(--prop-transition-fast);
}

.style-item select:hover {
  border-color: var(--prop-border-hover);
}

.style-item select:focus {
  border-color: var(--prop-border-focus);
  box-shadow: var(--prop-focus-ring);
  outline: none;
}

.row-groups-list {
  margin-bottom: var(--prop-spacing-sm);
}

.row-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--prop-spacing-sm);
  background: var(--prop-bg-tertiary);
  border-radius: var(--prop-border-radius-md);
  margin-bottom: var(--prop-spacing-xs);
}

.row-group-name {
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-primary);
}

.remove-button {
  padding: 4px 8px;
  border: 1px solid var(--prop-danger-color);
  border-radius: var(--prop-border-radius-md);
  background: var(--prop-bg-primary);
  color: var(--prop-danger-color);
  cursor: pointer;
  font-size: var(--prop-font-size-sm);
  transition: background-color var(--prop-transition-fast), color var(--prop-transition-fast);
}

.remove-button:hover {
  background: var(--prop-danger-color);
  color: white;
}

.add-button {
  width: 100%;
  padding: var(--prop-spacing-sm);
  border: 1px dashed var(--prop-border-color);
  border-radius: var(--prop-border-radius-md);
  background: var(--prop-bg-primary);
  color: var(--prop-text-secondary);
  cursor: pointer;
  font-size: var(--prop-font-size-sm);
  transition: border-color var(--prop-transition-fast), color var(--prop-transition-fast);
}

.add-button:hover {
  border-color: var(--prop-primary-color);
  color: var(--prop-primary-color);
}
</style>
