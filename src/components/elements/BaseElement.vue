<template>
  <div 
    class="design-element"
    :class="{ 'selected': isSelected }"
    @click.stop="handleSelect"
    :style="elementStyle"
    @mousedown.stop="handleMouseDown"
  >
    <!-- 右下角调整大小手柄 -->
    <div 
      v-if="isSelected"
      class="resize-handle"
      @mousedown.stop="handleResize"
    ></div>
    
    <!-- 子组件将覆盖此内容 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DesignElement, SelectedElementInfo } from '../../types';

// Props
const props = defineProps<{
  element: DesignElement;
  bandIndex: number;
  elementIndex: number;
  selectedElement: SelectedElementInfo | null;
  reportFontFamily?: string;
  reportFontSize?: number;
  reportIsBold?: boolean;
  reportIsItalic?: boolean;
  reportIsUnderline?: boolean;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number];
}>();

// 是否选中
const isSelected = computed(() => {
  return props.selectedElement && 
         props.selectedElement.bandIndex === props.bandIndex && 
         props.selectedElement.elementIndex === props.elementIndex;
});

// 元素样式 - 使用更适合的类型断言方式
const elementStyle = computed(() => {
  // 为复杂表达式单独计算值并添加类型断言
  const verticalAlign = props.element.verticalAlignment?.toLowerCase() || 'flex-start';
  const justifyContent = props.element.textAlignment === 'Justified' ? 'space-between' : (props.element.textAlignment?.toLowerCase() || 'flex-start');
  const textAlign = props.element.textAlignment === 'Justified' ? 'justify' : (props.element.textAlignment?.toLowerCase() || 'left');
  
  // 使用CSSProperties类型断言整个对象
  return {
    position: 'absolute' as 'absolute',
    left: `${props.element.x}px`,
    top: `${props.element.y}px`,
    width: `${props.element.width}px`,
    height: `${props.element.height}px`,
    backgroundColor: props.element.backcolor || 'transparent',
    paddingTop: props.element.box?.topPadding ? `${props.element.box.topPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    paddingLeft: props.element.box?.leftPadding ? `${props.element.box.leftPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    paddingBottom: props.element.box?.bottomPadding ? `${props.element.box.bottomPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    paddingRight: props.element.box?.rightPadding ? `${props.element.box.rightPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    borderTop: getBorderStyle('top', props.element.box) || (props.element.border || props.element.box ? '1px solid #ccc' : '1px solid transparent'),
    borderLeft: getBorderStyle('left', props.element.box) || (props.element.border || props.element.box ? '1px solid #ccc' : '1px solid transparent'),
    borderBottom: getBorderStyle('bottom', props.element.box) || (props.element.border || props.element.box ? '1px solid #ccc' : '1px solid transparent'),
    borderRight: getBorderStyle('right', props.element.box) || (props.element.border || props.element.box ? '1px solid #ccc' : '1px solid transparent'),
    fontFamily: props.element.fontFamily || props.reportFontFamily,
    fontSize: props.element.fontSize ? `${props.element.fontSize}px` : (props.reportFontSize ? `${props.reportFontSize}px` : undefined),
    fontWeight: props.element.isBold !== undefined ? (props.element.isBold ? 'bold' : 'normal') : (props.reportIsBold ? 'bold' : 'normal'),
    fontStyle: props.element.isItalic !== undefined ? (props.element.isItalic ? 'italic' : 'normal') : (props.reportIsItalic ? 'italic' : 'normal'),
    textDecoration: props.element.isUnderline !== undefined ? (props.element.isUnderline ? 'underline' : 'none') : (props.reportIsUnderline ? 'underline' : 'none'),
    display: 'flex' as 'flex',
    alignItems: verticalAlign as any,
    justifyContent: justifyContent as any,
    textAlign: textAlign as any
  } as any;
});

// 获取边框样式
const getBorderStyle = (side: string, box?: any): string | undefined => {
  if (!box) return undefined;
  
  // 优先使用sidePen元素（根据xsd定义，这是推荐的方式）
  const penProperty = side === 'top' ? box.topPen : 
                    side === 'left' ? box.leftPen : 
                    side === 'bottom' ? box.bottomPen : 
                    box.rightPen;
  
  // 其次考虑已弃用的sideBorder属性
  const borderProperty = side === 'top' ? box.topBorder : 
                     side === 'left' ? box.leftBorder : 
                     side === 'bottom' ? box.bottomBorder : 
                     box.rightBorder;
  
  // 如果没有sidePen也没有sideBorder，检查全局pen或border
  if (!penProperty && !borderProperty && !box.pen && !box.border) return undefined;
  
  // 获取边框颜色 - 优先使用sidePen的lineColor，然后是全局pen的lineColor，再然后是已弃用的颜色属性
  const colorProperty = side === 'top' ? box.topBorderColor : 
                     side === 'left' ? box.leftBorderColor : 
                     side === 'bottom' ? box.bottomBorderColor : 
                     box.rightBorderColor;
  const color = penProperty?.lineColor || box.pen?.lineColor || colorProperty || box.borderColor || '#000000';

  // 获取线宽
  let width = '1px'; // 默认宽度

  if (penProperty?.lineWidth !== undefined) {
    width = `${penProperty.lineWidth}px`;
  } else if (borderProperty === 'Thin' || borderProperty === '1Point') {
    width = '1px';
  } else if (borderProperty === '2Point' || borderProperty === 'Medium') {
    width = '2px';
  } else if (borderProperty === '4Point' || borderProperty === 'Thick') {
    width = '4px';
  }
  
  // 获取线型
  let style = 'solid'; // 默认实线
  if (penProperty?.lineStyle) {
    if (penProperty.lineStyle === 'Dashed') style = 'dashed';
    else if (penProperty.lineStyle === 'Dotted') style = 'dotted';
    else if (penProperty.lineStyle === 'Double') style = 'double';
  }
  
  return `${width} ${style} ${color}`;
};

// 处理选择
const handleSelect = () => {
  emit('select', props.bandIndex, props.elementIndex);
};

// 处理鼠标按下（拖拽）
const handleMouseDown = (event: MouseEvent) => {
  // 直接触发dragStart事件，让父组件处理拖拽逻辑
  // 这样可以避免延迟，提高响应速度
  emit('dragStart', event, props.bandIndex, props.elementIndex);
};

// 处理调整大小
const handleResize = (event: MouseEvent) => {
  emit('resizeStart', event, props.bandIndex, props.elementIndex);
};
</script>

<style scoped>
.design-element {
  user-select: none;
  cursor: move;
  position: relative;
  box-sizing: border-box;
  z-index: 1;
  /* 添加小的点击区域扩展，提高选择准确性 */
  transform-origin: center;
  transition: outline 0.1s ease;
}

.design-element.selected {
  outline: 2px solid #1890ff;
  outline-offset: -1px;
  /* 提高选中元素的层级，确保可以正确交互 */
  z-index: 10;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  background-color: #1890ff;
  cursor: se-resize;
}
</style>