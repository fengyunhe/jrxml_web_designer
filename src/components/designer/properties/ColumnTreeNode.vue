<template>
  <div class="column-tree-node" :style="{ marginLeft: depth > 0 ? '16px' : '0' }">
    <!-- 节点头部 -->
    <div
      class="column-tree-node-header"
      :class="{ group: isGroup, 'last-sibling': isLast }"
    >
      <!-- 展开/折叠按钮（仅分组） -->
      <button
        v-if="isGroup"
        class="column-tree-expand-btn"
        :class="{ collapsed: !expanded }"
        @click="expanded = !expanded"
        :title="expanded ? '折叠' : '展开'"
      >
        ▶
      </button>
      <span v-else class="column-tree-expand-placeholder"></span>

      <!-- 节点类型图标 -->
      <span class="column-tree-node-icon">
        {{ isGroup ? '▦' : '☰' }}
      </span>

      <!-- 名称输入 -->
      <input
        class="column-tree-node-name"
        :value="node.name"
        @input="handleNameChange(($event.target as HTMLInputElement).value)"
        @blur="handleNameBlur"
        placeholder="名称"
      />

      <!-- 宽度 -->
      <template v-if="isGroup">
        <span class="column-tree-node-width-display" :title="`宽度: ${node.width}px (自动计算)`">
          {{ node.width }}
        </span>
      </template>
      <template v-else>
        <input
          class="column-tree-node-width"
          type="number"
          :value="(node as Column).width"
          @change="handleWidthChange(($event.target as HTMLInputElement).value)"
          min="1"
          title="列宽 (px)"
        />
      </template>

      <!-- 操作按钮 -->
      <div class="column-tree-node-actions">
        <button
          v-if="canMoveUp"
          class="column-tree-action-btn"
          @click.stop="$emit('move-node', node.uuid, 'up')"
          title="上移"
        >↑</button>
        <button
          v-if="canMoveDown"
          class="column-tree-action-btn"
          @click.stop="$emit('move-node', node.uuid, 'down')"
          title="下移"
        >↓</button>
        <button
          v-if="isGroup"
          class="column-tree-action-btn"
          @click.stop="$emit('add-column-child', node.uuid)"
          title="组内添加列"
        >⊕</button>
        <button
          class="column-tree-action-btn"
          @click.stop="$emit('add-column-after', node.uuid)"
          title="后添加列"
        >+</button>
        <button
          class="column-tree-action-btn"
          @click.stop="$emit('add-column-group-after', node.uuid)"
          title="后添加分组"
        >⧉</button>
        <button
          v-if="isGroup"
          class="column-tree-action-btn"
          @click.stop="$emit('ungroup-node', node.uuid)"
          title="取消分组"
        >⊟</button>
        <button
          class="column-tree-action-btn danger"
          @click.stop="$emit('delete-node', node.uuid)"
          title="删除"
        >×</button>
      </div>
    </div>

    <!-- 分组子节点 -->
    <div v-if="isGroup && expanded" class="column-tree-node-children">
      <ColumnTreeNode
        v-for="(child, idx) in (node as ColumnGroup).children"
        :key="child.uuid || idx"
        :node="child"
        :depth="depth + 1"
        :is-last="idx === (node as ColumnGroup).children.length - 1"
        :parent-uuid="node.uuid"
        :parent-length="(node as ColumnGroup).children.length"
        :sibling-index="idx"
        @update-node="(uuid, updates) => $emit('update-node', uuid, updates)"
        @delete-node="(uuid) => $emit('delete-node', uuid)"
        @add-column-after="(uuid) => $emit('add-column-after', uuid)"
        @add-column-child="(uuid) => $emit('add-column-child', uuid)"
        @add-column-group-after="(uuid) => $emit('add-column-group-after', uuid)"
        @ungroup-node="(uuid) => $emit('ungroup-node', uuid)"
        @move-node="(uuid, dir) => $emit('move-node', uuid, dir)"
      />
      <!-- 组内空状态提示 -->
      <div v-if="(node as ColumnGroup).children.length === 0" class="column-tree-empty-hint">
        点击 ⊕ 添加组内列
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Column, ColumnGroup, BaseColumn } from '../../../types/table';

const props = defineProps<{
  node: Column | ColumnGroup;
  depth: number;
  isLast: boolean;
  parentUuid?: string | null;
  parentLength?: number;
  siblingIndex?: number;
}>();

const emit = defineEmits<{
  (e: 'update-node', uuid: string, updates: Partial<BaseColumn>): void;
  (e: 'delete-node', uuid: string): void;
  (e: 'add-column-after', uuid: string): void;
  (e: 'add-column-child', uuid: string): void;
  (e: 'add-column-group-after', uuid: string): void;
  (e: 'ungroup-node', uuid: string): void;
  (e: 'move-node', uuid: string, direction: 'up' | 'down'): void;
}>();

const expanded = ref(true);

const isGroup = computed(() => 'children' in props.node);

const canMoveUp = computed(() => {
  return props.siblingIndex !== undefined && props.siblingIndex > 0;
});

const canMoveDown = computed(() => {
  if (props.siblingIndex === undefined || props.parentLength === undefined) return false;
  return props.siblingIndex < props.parentLength - 1;
});

function handleNameChange(value: string) {
  emit('update-node', props.node.uuid, { name: value });
}

function handleNameBlur() {
  // 触发 JRXML 更新
}

function handleWidthChange(value: string) {
  const width = parseInt(value, 10);
  if (!isNaN(width) && width > 0) {
    emit('update-node', props.node.uuid, { width });
  }
}
</script>
