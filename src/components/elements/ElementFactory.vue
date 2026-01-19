<template>
  <component
    :is="getElementComponent"
    v-bind="commonProps"
    v-on="commonEvents"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { elementRegistry } from './ElementRegistry';
import StaticTextElement from './StaticTextElement.vue';
import TextFieldElement from './TextFieldElement.vue';
import ImageElement from './ImageElement.vue';
import LineElement from './LineElement.vue';
import RectangleElement from './RectangleElement.vue';
import EllipseElement from './EllipseElement.vue';
import BreakElement from './BreakElement.vue';
import FrameElement from './FrameElement.vue';
import type { 
  DesignElement,
  SelectedElementInfo,
  EditingElementInfo
} from '../../types';

// 组件缓存
const componentCache = ref<Record<string, any>>({
  staticText: StaticTextElement,
  textField: TextFieldElement,
  image: ImageElement,
  line: LineElement,
  rectangle: RectangleElement,
  ellipse: EllipseElement,
  break: BreakElement,
  frame: FrameElement
});

// 预加载组件
onMounted(() => {
  // 注册默认组件到缓存
  elementRegistry.getAllElements().forEach(config => {
    if (!componentCache.value[config.type]) {
      loadComponent(config.type);
    }
  });
});

// 动态加载组件
async function loadComponent(type: string) {
  try {
    const component = await elementRegistry.loadElementComponent(type);
    if (component) {
      componentCache.value[type] = component;
    }
  } catch (error) {
    console.error(`Failed to load component for element type ${type}:`, error);
  }
}

// Props
const props = defineProps<{
  element: DesignElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  selectedElements: {bandIndex: number, elementIndex: number, parentFrameIndex?: number}[]; // 添加多选支持
  editingElement: EditingElementInfo | null;
  isDragging?: boolean;
  reportFontFamily?: string;
  reportFontSize?: number;
  reportIsBold?: boolean;
  reportIsItalic?: boolean;
  reportIsUnderline?: boolean;
  isOutOfBounds?: boolean;
  parentFrameIndex?: number;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  startEditing: [bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  finishEditing: [];
  cancelEditing: [];
  checkFields: [fields: string[]];
}>();

// 根据元素类型获取对应的组件
const getElementComponent = computed(() => {
  const type = props.element.type;
  
  // 从缓存中获取组件
  if (componentCache.value[type]) {
    return componentCache.value[type];
  }
  
  // 动态加载组件
  loadComponent(type);
  
  // 默认组件
  return StaticTextElement;
});

// 通用属性 - 添加类型断言以确保与组件期望的类型匹配
const commonProps = computed(() => ({
  element: props.element as any, // 使用any断言暂时解决类型兼容性问题
  bandIndex: props.bandIndex,
  elementIndex: props.elementIndex,
  selectedElement: props.selectedElement,
  selectedElements: props.selectedElements, // 添加多选支持
  editingElement: props.editingElement,
  isDragging: props.isDragging,
  reportFontFamily: props.reportFontFamily,
  reportFontSize: props.reportFontSize,
  reportIsBold: props.reportIsBold,
  reportIsItalic: props.reportIsItalic,
  reportIsUnderline: props.reportIsUnderline,
  isOutOfBounds: props.isOutOfBounds,
  parentFrameIndex: props.parentFrameIndex
}));

// 通用事件
const commonEvents = {
  select: (bandIndex: number, elementIndex: number, isMultiSelect = false, parentFrameIndex?: number) => {
    emit('select', bandIndex, elementIndex, isMultiSelect, parentFrameIndex);
  },
  dragStart: (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
    emit('dragStart', event, bandIndex, elementIndex, parentFrameIndex);
  },
  resizeStart: (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
    emit('resizeStart', event, bandIndex, elementIndex, parentFrameIndex);
  },
  contextmenu: (event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
    emit('contextmenu', event, bandIndex, elementIndex, parentFrameIndex);
  },
  startEditing: (bandIndex: number, elementIndex: number, parentFrameIndex?: number) => {
    emit('startEditing', bandIndex, elementIndex, parentFrameIndex);
  },
  finishEditing: () => {
    emit('finishEditing');
  },
  cancelEditing: () => {
    emit('cancelEditing');
  },
  checkFields: (fields: string[]) => {
    emit('checkFields', fields);
  }
};
</script>