<template>
  <div class="prop-panel table-properties">
    <h4 class="prop-heading-md">Table属性</h4>

    <!-- 数据集 -->
    <div class="prop-form-group">
      <label class="prop-label">数据集名称</label>
      <input
        :value="element.dataset?.name || ''"
        @input="updateDatasetProperty('name', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="tableDataset"
        class="prop-input"
      />
    </div>

    <!-- 连接表达式 -->
    <div class="prop-form-group">
      <label class="prop-label">连接表达式</label>
      <ExpressionEditor
        :model-value="element.dataset?.connectionExpression || ''"
        @update:model-value="updateDatasetProperty('connectionExpression', $event)"
        placeholder="$P{REPORT_CONNECTION}"
        :report-fields="reportFields"
        :report-parameters="reportParameters"
        :report-variables="reportVariables"
      />
    </div>

    <!-- 查询语句 -->
    <div class="prop-form-group">
      <label class="prop-label">查询语句</label>
      <textarea
        :value="element.dataset?.query?.text || ''"
        @input="updateQueryProperty('text', ($event.target as HTMLTextAreaElement).value)"
        placeholder="SELECT * FROM table"
        rows="3"
        class="prop-textarea"
      ></textarea>
    </div>

    <!-- 查询语言 -->
    <div class="prop-form-group">
      <SelectControl
        :model-value="element.dataset?.query?.language || 'sql'"
        @update:model-value="updateQueryProperty('language', $event)"
        :options="queryLanguageOptions"
        label="查询语言"
      />
    </div>

    <!-- 分隔线 -->
    <div class="prop-divider"></div>

    <!-- 表格样式 -->
    <div class="prop-form-group">
      <h5 class="prop-heading-sm">表格样式</h5>

      <div class="prop-style-select">
        <!-- 表头样式 -->
        <div>
          <label>表头样式</label>
          <select
            :value="element.styles?.tableHeader || 'Table_TH'"
            @input="updateStyleProperty('tableHeader', ($event.target as HTMLSelectElement).value)"
            class="prop-select"
          >
            <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
          </select>
        </div>

        <!-- 列头样式 -->
        <div>
          <label>列头样式</label>
          <select
            :value="element.styles?.columnHeader || 'Table_CH'"
            @input="updateStyleProperty('columnHeader', ($event.target as HTMLSelectElement).value)"
            class="prop-select"
          >
            <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
          </select>
        </div>

        <!-- 详情样式 -->
        <div>
          <label>详情样式</label>
          <select
            :value="element.styles?.detail || 'Table_TD'"
            @input="updateStyleProperty('detail', ($event.target as HTMLSelectElement).value)"
            class="prop-select"
          >
            <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
          </select>
        </div>

        <!-- 列脚样式 -->
        <div>
          <label>列脚样式</label>
          <select
            :value="element.styles?.columnFooter || 'Table_CH'"
            @input="updateStyleProperty('columnFooter', ($event.target as HTMLSelectElement).value)"
            class="prop-select"
          >
            <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
          </select>
        </div>

        <!-- 表脚样式 -->
        <div>
          <label>表脚样式</label>
          <select
            :value="element.styles?.tableFooter || 'Table_TH'"
            @input="updateStyleProperty('tableFooter', ($event.target as HTMLSelectElement).value)"
            class="prop-select"
          >
            <option v-for="style in availableStyles" :key="style" :value="style">{{ style }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="prop-divider"></div>

    <!-- 无数据类型 -->
    <div class="prop-form-group">
      <SelectControl
        :model-value="element.whenNoDataType || 'AllSectionsNoDetail'"
        @update:model-value="updateProperty('whenNoDataType', $event)"
        :options="whenNoDataTypeOptions"
        label="无数据类型"
        description="当没有数据时的处理方式"
      />
    </div>

    <!-- 打印表头 -->
    <div class="prop-form-group">
      <SwitchControl
        :model-value="element.printHeaders !== false"
        @update:model-value="updateProperty('printHeaders', $event)"
        label="打印表头"
        description="是否打印表格表头"
      />
    </div>

    <!-- 忽略宽度 -->
    <div class="prop-form-group">
      <SwitchControl
        :model-value="element.ignoreWidth || false"
        @update:model-value="updateProperty('ignoreWidth', $event)"
        label="忽略宽度"
        description="忽略表格宽度限制"
      />
    </div>

    <!-- 忽略分页 -->
    <div class="prop-form-group">
      <SwitchControl
        :model-value="element.isIgnorePagination || false"
        @update:model-value="updateProperty('isIgnorePagination', $event)"
        label="忽略分页"
        description="表格内容不会被分页打断"
      />
    </div>

    <!-- 分隔线 -->
    <div class="prop-divider"></div>

    <!-- 行分组管理 -->
    <div class="prop-form-group">
      <h5 class="prop-heading-sm">行分组</h5>
      <div class="prop-list">
        <div
          v-for="(group, index) in element.rowGroups || []"
          :key="index"
          class="prop-list-item"
        >
          <span class="prop-list-item-name">{{ group.name || `分组 ${Number(index) + 1}` }}</span>
          <div class="prop-list-item-actions">
            <button @click="removeRowGroup(Number(index))" class="prop-btn-danger prop-btn-sm">删除</button>
          </div>
        </div>
        <div v-if="!element.rowGroups || element.rowGroups.length === 0" class="prop-hint" style="padding: 8px 12px;">暂无行分组</div>
      </div>
      <button @click="addRowGroup" class="prop-btn-default" style="width: 100%; margin-top: 8px;">添加行分组</button>
    </div>

    <!-- 分隔线 -->
    <div class="prop-divider"></div>

    <!-- 样式继承 -->
    <div class="prop-form-group">
      <label class="prop-label">样式继承</label>
      <select
        :value="element.parentStyle || ''"
        @input="updateProperty('parentStyle', ($event.target as HTMLSelectElement).value)"
        class="prop-select"
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
  reportFields?: Array<{ name: string; class?: string }>;
  reportParameters?: Array<{ name: string; class?: string }>;
  reportVariables?: Array<{ name: string; class?: string }>;
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

/* Style select items use vertical layout (label above select) within prop-style-select */
.prop-style-select > div {
  display: flex;
  flex-direction: column;
  gap: var(--prop-spacing-xs);
}

.prop-style-select > div label {
  font-size: var(--prop-font-size-sm);
  color: var(--prop-text-secondary);
}
</style>
