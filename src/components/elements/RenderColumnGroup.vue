<template>
  <!-- 渲染当前级别的分组行 -->
  <div class="column-group-row">
    <template v-for="(child, index) in group.children" :key="child.uuid || index">
      <!-- 分组 -->
      <div 
        v-if="child.children && child.children.length > 0"
        class="column-group-cell"
        :style="{ width: `${Number(child.width) || 0}px` }"
        :class="{ 'column-selected': isGroupSelected(child) }"
      >
        <div 
          class="cell-content group-content"
          :style="getGroupCellStyle(child, type)"
        >
          <!-- 渲染分组表头 -->
          <template v-if="type === 'tableHeader' && child.hasTableHeader && child.tableHeader">
            <div class="static-text">{{ child.tableHeader.text || '' }}</div>
          </template>
          <!-- 渲染分组列头 -->
          <template v-else-if="type === 'columnHeader' && child.hasColumnHeader && child.columnHeader">
            <div class="column-name">{{ child.name }}</div>
          </template>
        </div>
      </div>
      <!-- 普通列 -->
      <div 
        v-else
        class="column-cell"
        :style="{ width: `${Number(child.width) || 0}px` }"
        :class="{ 'column-selected': isColumnSelectedInGroup(child, index as number) }"
        @click.stop="handleColumnClick(child, $event, index as number)"
        @contextmenu.stop="handleColumnContextMenu(child, $event, index as number)"
      >
        <div 
          class="cell-content"
          :style="getCellStyle(child, type)"
        >
          <!-- 渲染列头内容 -->
          <template v-if="type === 'tableHeader'">
            <template v-if="child.hasTableHeader && child.tableHeader">
              <template v-if="child.tableHeader.type === 'staticText'">
                <div class="static-text">{{ child.tableHeader.text || '' }}</div>
              </template>
              <template v-else-if="child.tableHeader.type === 'textField'">
                <div class="text-field">{{ child.tableHeader.expression || '' }}</div>
              </template>
            </template>
            <div v-else class="cell-content empty">
              Table Header
            </div>
          </template>
          <template v-else-if="type === 'columnHeader'">
            <div class="column-name">{{ child.name }}</div>
          </template>
        </div>
      </div>
    </template>
  </div>
  
  <!-- 递归渲染所有子分组的行 -->
  <template v-for="(child, index) in group.children" :key="`child-${child.uuid || index}`">
    <render-column-group 
      v-if="child.children && child.children.length > 0"
      :group="child" 
      :level="level + 1" 
      :type="type"
      :columns="columns"
      @column-click="handleColumnClick"
      @column-context-menu="handleColumnContextMenu"
    />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  group: any;
  level: number;
  type: string;
  columns?: any[];
}>();

const emit = defineEmits<{
  columnClick: [column: any, event: MouseEvent, index?: number];
  columnContextMenu: [column: any, event: MouseEvent, index?: number];
}>();

function getGroupCellStyle(group: any, type: string) {
  if (group[type]) {
    return getCellStyle(group[type], type);
  }
  return {
    backgroundColor: type === 'tableHeader' ? '#f0f0f0' : '#e6e6e6',
    fontWeight: '600',
    color: '#333'
  };
}

function getCellStyle(cell: any, type: string) {
  if (!cell) return {};
  
  const styles: any = {};
  
  if (cell.fontSize) {
    styles.fontSize = `${cell.fontSize}px`;
  }
  if (cell.forecolor) {
    styles.color = cell.forecolor;
  }
  if (cell.isBold) {
    styles.fontWeight = 'bold';
  }
  if (cell.isItalic) {
    styles.fontStyle = 'italic';
  }
  if (cell.isUnderline) {
    styles.textDecoration = 'underline';
  }
  if (cell.backcolor) {
    styles.backgroundColor = cell.backcolor;
  }
  
  const borderWidth = cell.borderWidth || 0;
  if (borderWidth > 0) {
    styles.border = `${borderWidth}px solid #000000`;
  }
  
  return styles;
}

function isGroupSelected(group: any): boolean {
  return false;
}

function isColumnSelectedInGroup(column: any, index: number): boolean {
  return false;
}

function handleColumnClick(column: any, event: MouseEvent, index?: number) {
  emit('columnClick', column, event, index);
}

function handleColumnContextMenu(column: any, event: MouseEvent, index?: number) {
  emit('columnContextMenu', column, event, index);
}
</script>

<style scoped>
.column-group-row {
  display: flex;
  width: 100%;
  height: 30px;
  border-bottom: 1px solid #ccc;
}

.column-group-cell,
.column-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  border-right: 1px solid #ccc;
  height: 100%;
}

.column-group-cell:last-child,
.column-cell:last-child {
  border-right: none;
}

.column-group-cell:hover,
.column-cell:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.column-selected {
  background-color: rgba(64, 158, 255, 0.15) !important;
  border: 1px solid rgba(64, 158, 255, 0.5) !important;
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  color: inherit;
}

.cell-content.empty {
  color: #999;
  font-style: italic;
}

.group-content {
  width: 100%;
  height: 100%;
}

.static-text,
.text-field,
.column-name {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  color: inherit;
}

.text-field {
  font-family: monospace;
}
</style>
