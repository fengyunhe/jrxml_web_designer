<template>
  <div class="split-button" ref="container">
    <button 
      class="main-button" 
      :class="primaryAction.class || 'btn-primary'"
      @click="handleMainClick"
      :title="primaryAction.title"
    >
      {{ primaryAction.label }}
    </button>
    <button 
      class="dropdown-trigger" 
      :class="primaryAction.class || 'btn-primary'"
      @click.stop="toggleDropdown"
    >
      <span class="arrow" :class="{ 'open': isOpen }">▼</span>
    </button>
    
    <div v-if="isOpen" class="dropdown-menu">
      <div 
        v-for="(item, index) in secondaryActions" 
        :key="index" 
        class="dropdown-item" 
        @click="handleItemClick(item)"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface ActionItem {
  label: string;
  handler: () => void;
  title?: string;
  class?: string;
}

interface Props {
  actions: ActionItem[];
  defaultIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  defaultIndex: 0
});

const container = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const currentIndex = ref(props.defaultIndex);

const primaryAction = computed<ActionItem>(() => {
  if (props.actions.length > 0 && currentIndex.value < props.actions.length) {
    const action = props.actions[currentIndex.value];
    if (action) return action;
  }
  return { label: '', handler: () => {} };
});

const secondaryActions = computed(() => {
  return props.actions.filter((_, index) => index !== currentIndex.value);
});

function handleMainClick() {
  primaryAction.value.handler();
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handleItemClick(item: ActionItem) {
  // Find the original index of the clicked item
  const newIndex = props.actions.indexOf(item);
  if (newIndex !== -1) {
    currentIndex.value = newIndex;
  }
  
  isOpen.value = false;
  item.handler();
}

function handleClickOutside(event: MouseEvent) {
  if (container.value && !container.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.split-button {
  display: inline-flex;
  position: relative;
  vertical-align: middle;
}

.main-button {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  padding-left: 10px;
  padding-right: 10px;
  height: 32px; /* Fixed height for consistency */
  display: flex;
  align-items: center;
}

.dropdown-trigger {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding-left: 6px;
  padding-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px; /* Fixed height for consistency */
}

.arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
  white-space: nowrap;
  text-align: left;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

/* Button styles */
button {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}
</style>
