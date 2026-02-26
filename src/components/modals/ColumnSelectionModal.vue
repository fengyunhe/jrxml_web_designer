<template>
  <BaseModal
    v-bind:visible="localVisible"
    @update:visible="updateVisible"
    title="选择要分组的列"
    :contentClass="'column-selection-dialog'"
    :useVShow="true"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="column-selection-content">
      <div class="form-group">
        <label>选择要分组的区域：</label>
        <n-radio-group v-model:value="selectedRegion" name="region">
          <n-radio-button value="tableHeader">表格头部</n-radio-button>
          <n-radio-button value="columnHeader">列头部</n-radio-button>
          <n-radio-button value="columnFooter">列尾部</n-radio-button>
          <n-radio-button value="tableFooter">表格尾部</n-radio-button>
        </n-radio-group>
      </div>
      <div class="form-group">
        <label>组合列文字内容：</label>
        <n-input v-model:value="groupText" placeholder="请输入组合列的文字内容" />
      </div>
      <div class="form-group">
        <label>选择要分组的列（只能选择相邻的列）：</label>
        <div class="column-list">
          <!-- 递归显示列和组 -->
          <template v-for="(item, index) in renderItems" :key="index">
            <div 
              v-if="!item.children" 
              class="column-item"
              :class="{
                'selected': selectedColumns.includes(index),
                'disabled': isItemDisabled(item, index),
                'adjacent': isAdjacentToSelected(index)
              }"
              @click="toggleItemSelection(item, index)"
            >
              <div class="column-checkbox">
                <n-checkbox 
                  :checked="selectedColumns.includes(index)" 
                  :disabled="isItemDisabled(item, index)"
                  @update:checked="(checked) => handleItemCheckboxChange(checked, item, index)"
                />
              </div>
              <div class="column-name">{{ item.name || `列 ${index + 1}` }}</div>
            </div>
            <div 
              v-else 
              class="group-item"
              :class="{
                'selected': selectedColumns.includes(index),
                'disabled': isItemDisabled(item, index),
                'adjacent': isAdjacentToSelected(index)
              }"
              @click="toggleItemSelection(item, index)"
            >
              <div class="column-checkbox">
                <n-checkbox 
                  :checked="selectedColumns.includes(index)" 
                  :disabled="isItemDisabled(item, index)"
                  @update:checked="(checked) => handleItemCheckboxChange(checked, item, index)"
                />
              </div>
              <div class="column-name group-name">{{ item.name || `组 ${index + 1}` }}</div>
              <div class="group-children">
                <!-- 递归显示子组和列 -->
                <template v-for="(child, childIndex) in item.children" :key="child.uuid || childIndex">
                  <div 
                    v-if="!child.children" 
                    class="group-child-item"
                    style="margin-left: 30px;"
                  >
                    <div class="child-checkbox">
                      <n-checkbox 
                        :checked="false" 
                        :disabled="true"
                      />
                    </div>
                    <div class="child-name">{{ child.name || ('列 ' + (Number(childIndex) + 1)) }}</div>
                  </div>
                  <div 
                    v-else 
                    class="nested-group-item"
                    style="margin-left: 30px;"
                  >
                    <div class="nested-group-header">
                      <div class="child-checkbox">
                        <n-checkbox 
                          :checked="false" 
                          :disabled="true"
                        />
                      </div>
                      <div class="child-name group-name">{{ child.name || ('组 ' + (Number(childIndex) + 1)) }}</div>
                      <div class="group-count">({{ child.children.length }} 项)</div>
                    </div>
                    <div class="nested-group-children">
                      <template v-for="(nestedChild, nestedIndex) in child.children" :key="nestedChild.uuid || nestedIndex">
                        <div 
                          v-if="!nestedChild.children" 
                          class="group-child-item"
                          style="margin-left: 50px;"
                        >
                          <div class="child-checkbox">
                            <n-checkbox 
                              :checked="false" 
                              :disabled="true"
                            />
                          </div>
                          <div class="child-name">{{ nestedChild.name || ('列 ' + (Number(nestedIndex) + 1)) }}</div>
                        </div>
                        <div 
                          v-else 
                          class="nested-group-item"
                          style="margin-left: 50px;"
                        >
                          <div class="nested-group-header">
                            <div class="child-checkbox">
                              <n-checkbox 
                                :checked="false" 
                                :disabled="true"
                              />
                            </div>
                            <div class="child-name group-name">{{ nestedChild.name || ('组 ' + (Number(nestedIndex) + 1)) }}</div>
                            <div class="group-count">({{ nestedChild.children.length }} 项)</div>
                          </div>
                          <div class="nested-group-children">
                            <!-- 继续递归显示更深层级的子项 -->
                            <template v-for="(deepChild, deepIndex) in nestedChild.children" :key="deepChild.uuid || deepIndex">
                              <div 
                                class="group-child-item"
                                style="margin-left: 70px;"
                              >
                                <div class="child-checkbox">
                                  <n-checkbox 
                                    :checked="false" 
                                    :disabled="true"
                                  />
                                </div>
                                <div class="child-name">{{ deepChild.name || ('列 ' + (Number(deepIndex) + 1)) }}</div>
                              </div>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div class="selected-info" v-if="selectedColumns.length > 0">
        已选择 {{ selectedColumns.length }} 列
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent } from 'vue';
import BaseModal from './BaseModal.vue';
import { NCheckbox, NRadioGroup, NRadio, NRadioButton, NInput } from 'naive-ui';

// 递归组件定义
const RecursiveColumnItem = defineComponent({
  name: 'RecursiveColumnItem',
  props: {
    item: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      default: 0
    }
  },
  template: `
    <div 
      v-if="!item.children" 
      class="group-child-item"
      :style="{ marginLeft: level * 20 + 'px' }"
    >
      <div class="child-checkbox">
        <n-checkbox 
          :checked="false" 
          :disabled="true"
        />
      </div>
      <div class="child-name">{{ item.name || '列' }}</div>
    </div>
    <div 
      v-else 
      class="nested-group-item"
    >
      <div 
        class="nested-group-header"
        :style="{ marginLeft: level * 20 + 'px' }"
      >
        <div class="child-checkbox">
          <n-checkbox 
            :checked="false" 
            :disabled="true"
          />
        </div>
        <div class="child-name group-name">{{ item.name || '组' }}</div>
        <div class="group-count">({{ item.children.length }} 项)</div>
      </div>
      <div class="nested-group-children">
        <RecursiveColumnItem 
          v-for="(child, childIndex) in item.children" 
          :key="child.uuid || childIndex"
          :item="child"
          :level="level + 1"
        />
      </div>
    </div>
  `
});

// Props
const props = defineProps<{
  visible: boolean;
  columns: any[];
  children: any[];
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', selectedColumnIndices: number[], selectedRegion: string, groupText: string): void;
}>();

// State
const selectedColumns = ref<number[]>([]);
const errorMessage = ref('');
const localVisible = ref(props.visible);
const selectedRegion = ref('tableHeader');
const groupText = ref('');

// Watch for visible changes to reset state
watch(() => props.visible, (newValue) => {
  localVisible.value = newValue;
  if (newValue) {
    // Reset state when modal opens
    selectedColumns.value = [];
    errorMessage.value = '';
    groupText.value = '';
  }
});

// Update visible prop
function updateVisible(value: boolean) {
  localVisible.value = value;
  emit('update:visible', value);
}

// 计算要渲染的项目列表（包括列和组）
const renderItems = computed(() => {
  return props.children || props.columns || [];
});

// Check if an item is disabled (already in a nested group)
function isItemDisabled(item: any, index: number): boolean {
  // 顶级组和列都可以选择
  return false;
}

// Check if an item is adjacent to any selected item
function isAdjacentToSelected(index: number): boolean {
  if (selectedColumns.value.length === 0) {
    return false;
  }
  
  return selectedColumns.value.some(selectedIndex => {
    return Math.abs(selectedIndex - index) === 1;
  });
}

// Toggle item selection
function toggleItemSelection(item: any, index: number): void {
  if (isItemDisabled(item, index)) {
    return;
  }
  
  const isSelected = selectedColumns.value.includes(index);
  
  if (isSelected) {
    // Deselect the item
    selectedColumns.value = selectedColumns.value.filter(i => i !== index);
  } else {
    // Check if this item is adjacent to any selected item
    // or if no items are selected yet
    if (selectedColumns.value.length === 0 || isAdjacentToSelected(index)) {
      selectedColumns.value.push(index);
      // Sort the selected items to maintain order
      selectedColumns.value.sort((a, b) => a - b);
      errorMessage.value = '';
    } else {
      errorMessage.value = '只能选择相邻的列或组';
    }
  }
}

// Handle checkbox change
function handleItemCheckboxChange(checked: boolean, item: any, index: number): void {
  if (checked) {
    toggleItemSelection(item, index);
  } else {
    selectedColumns.value = selectedColumns.value.filter(i => i !== index);
  }
}

// Handle confirm
function handleConfirm(): void {
  if (selectedColumns.value.length < 2) {
    errorMessage.value = '至少需要选择两个项目进行分组';
    return;
  }
  
  // Check if all selected items are adjacent
  const sortedItems = [...selectedColumns.value].sort((a, b) => a - b);
  for (let i = 1; i < sortedItems.length; i++) {
    const current = sortedItems[i];
    const previous = sortedItems[i - 1];
    if (current !== undefined && previous !== undefined && current - previous !== 1) {
      errorMessage.value = '只能选择相邻的列或组';
      return;
    }
  }
  
  // Emit confirm event with selected item indices, region, and group text
  emit('confirm', selectedColumns.value, selectedRegion.value, groupText.value);
  emit('update:visible', false);
}

// Handle cancel
function handleCancel(): void {
  emit('update:visible', false);
}
</script>

<style scoped>
.column-selection-dialog {
  width: 500px;
  max-width: 90vw;
}

.column-selection-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.column-list {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.column-item,
.group-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.column-item:last-child,
.group-item:last-child {
  border-bottom: none;
}

.column-item:hover:not(.disabled),
.group-item:hover:not(.disabled) {
  background-color: #f5f5f5;
}

.column-item.selected,
.group-item.selected {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.column-item.disabled,
.group-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.column-item.adjacent:not(.disabled):not(.selected),
.group-item.adjacent:not(.disabled):not(.selected) {
  background-color: #fff7e6;
}

.group-item {
  flex-direction: column;
  align-items: flex-start;
}

.group-item .column-name {
  margin-bottom: 8px;
}

.group-name {
  font-weight: 600;
  color: #1890ff;
}

.group-children {
  margin-left: 30px;
  width: 100%;
}

.group-child-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 14px;
  color: #666;
}

.nested-group-item {
  margin-top: 5px;
  margin-bottom: 5px;
}

.nested-group-header {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 14px;
}

.group-count {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.nested-group-children {
  margin-top: 5px;
}

.child-checkbox {
  margin-right: 10px;
}

.child-name {
  flex: 1;
}

.column-checkbox {
  margin-right: 10px;
}

.column-name {
  flex: 1;
}

.error-message {
  color: #ff4d4f;
  margin: 10px 0;
  padding: 8px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}

.selected-info {
  margin-top: 10px;
  padding: 8px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  color: #52c41a;
  font-size: 14px;
}
</style>