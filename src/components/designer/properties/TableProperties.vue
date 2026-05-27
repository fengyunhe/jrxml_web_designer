<template>
  <div class="table-properties">
    <h4>Table属性</h4>

    <!-- 数据集 -->
    <div class="form-group">
      <label>数据集名称</label>
      <input
        :value="element.dataset?.name || ''"
        @input="updateDatasetProperty('name', $event.target.value)"
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
        @input="updateQueryProperty('text', $event.target.value)"
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
          @input="updateStyleProperty('tableHeader', $event.target.value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 列头样式 -->
      <div class="style-item">
        <label>列头样式</label>
        <select
          :value="element.styles?.columnHeader || 'Table_CH'"
          @input="updateStyleProperty('columnHeader', $event.target.value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 详情样式 -->
      <div class="style-item">
        <label>详情样式</label>
        <select
          :value="element.styles?.detail || 'Table_TD'"
          @input="updateStyleProperty('detail', $event.target.value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 列脚样式 -->
      <div class="style-item">
        <label>列脚样式</label>
        <select
          :value="element.styles?.columnFooter || 'Table_CH'"
          @input="updateStyleProperty('columnFooter', $event.target.value)"
        >
          <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
        </select>
      </div>

      <!-- 表脚样式 -->
      <div class="style-item">
        <label>表脚样式</label>
        <select
          :value="element.styles?.tableFooter || 'Table_TH'"
          @input="updateStyleProperty('tableFooter', $event.target.value)"
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
          <span class="row-group-name">{{ group.name || `分组 ${index + 1}` }}</span>
          <button @click="removeRowGroup(index)" class="remove-button">删除</button>
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
        @input="updateProperty('parentStyle', $event.target.value)"
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
  padding: 12px;
}

.table-properties h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-group h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.form-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 16px 0;
}

.style-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.style-item label {
  min-width: 80px;
  font-size: 12px;
  color: #666;
}

.style-item select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
}

.row-groups-list {
  margin-bottom: 8px;
}

.row-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
}

.row-group-name {
  font-size: 12px;
  color: #333;
}

.remove-button {
  padding: 4px 8px;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  background: white;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 12px;
}

.remove-button:hover {
  background: #ff4d4f;
  color: white;
}

.add-button {
  width: 100%;
  padding: 8px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 12px;
}

.add-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}
</style>
