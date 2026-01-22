<template>
  <div 
    class="design-element"
    :class="{ 
      'selected': isSelected,
      'out-of-bounds': isOutOfBounds
    }"
    @click.stop="handleSelect"
    :style="elementStyle"
    @mousedown.stop="handleMouseDown"
    @contextmenu.stop="handleContextMenu"
    @dblclick.stop="handleDoubleClick"
  >
    <!-- 子组件将覆盖此内容 -->
    <slot></slot>

    <!-- 调整大小手柄 -->
    <div 
      v-if="isSelected"
      class="resize-handle resize-handle-se"
      @mousedown.stop="(event) => handleResize('se', event)"
    ></div>
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
  parentFrameIndex?: number;
  selectedElement: SelectedElementInfo | null;
  selectedElements?: {bandIndex: number, elementIndex: number, parentFrameIndex?: number, uuid?: string}[]; // 添加多选支持
  isDragging?: boolean;
  reportFontFamily?: string;
  reportFontSize?: number;
  reportIsBold?: boolean;
  reportIsItalic?: boolean;
  reportIsUnderline?: boolean;
  isOutOfBounds?: boolean;
}>();

// Emits
const emit = defineEmits<{
  select: [bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number];
  dragStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  resizeStart: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  contextmenu: [event: MouseEvent, bandIndex: number, elementIndex: number, parentFrameIndex?: number];
  startEditing: [bandIndex: number, elementIndex: number, parentFrameIndex?: number];
}>();

// 是否选中
const isSelected = computed(() => {
  // 1. 优先使用 UUID 进行比较（最准确）
  if (props.element.uuid) {
    // 检查多选
    if (props.selectedElements && props.selectedElements.length > 0) {
      return props.selectedElements.some(el => el.uuid === props.element.uuid);
    }
    // 检查单选
    if (props.selectedElement && props.selectedElement.uuid) {
      return props.selectedElement.uuid === props.element.uuid;
    }
  }

  // 2. 降级到索引比较（辅助函数：将 undefined 视为 -1 进行比较）
  const getPFI = (pfi: number | undefined) => pfi === undefined ? -1 : pfi;
  const currentPFI = getPFI(props.parentFrameIndex);

  // 检查是否在多选列表中
  if (props.selectedElements && props.selectedElements.length > 0) {
    return props.selectedElements.some(
      el => el.bandIndex === props.bandIndex && 
            el.elementIndex === props.elementIndex && 
            getPFI(el.parentFrameIndex) === currentPFI
    );
  }
  
  // 单选逻辑
  return props.selectedElement && 
         props.selectedElement.bandIndex === props.bandIndex && 
         props.selectedElement.elementIndex === props.elementIndex &&
         getPFI(props.selectedElement.parentFrameIndex) === currentPFI;
});

// 元素样式 - 使用更适合的类型断言方式
const elementStyle = computed(() => {
  // 为复杂表达式单独计算值并添加类型断言
  // 修正垂直对齐值的映射
  let verticalAlign = 'flex-start'; // 默认值
  if (props.element.verticalAlignment) {
    switch (props.element.verticalAlignment) {
      case 'Top':
        verticalAlign = 'flex-start';
        break;
      case 'Middle':
        verticalAlign = 'center';
        break;
      case 'Bottom':
        verticalAlign = 'flex-end';
        break;
      default:
        verticalAlign = 'flex-start';
    }
  }
  
  const justifyContent = props.element.textAlignment === 'Justified' ? 'space-between' : (props.element.textAlignment?.toLowerCase() || 'flex-start');
  const textAlign = props.element.textAlignment === 'Justified' ? 'justify' : (props.element.textAlignment?.toLowerCase() || 'left');
  
  // 计算边框样式
  const calculateBorder = (side: string): string => {
    // 优先使用getBorderStyle函数，它已经包含了完整的边框处理逻辑
    const borderStyle = getBorderStyle(side, props.element.box);
    if (borderStyle && borderStyle !== 'none') {
      return borderStyle;
    }
    
    // 如果getBorderStyle返回none，则返回none
    return 'none';
  };
  
  // 使用CSSProperties类型断言整个对象
  return {
    position: 'absolute' as 'absolute',
    left: `${props.element.x}px`,
    top: `${props.element.y}px`,
    width: `${props.element.width}px`,
    height: `${props.element.height}px`,
    backgroundColor: (props.element.mode === 'Opaque' && props.element.backcolor) ? props.element.backcolor : 'transparent',
    color: props.element.forecolor,
    paddingTop: props.element.box?.topPadding ? `${props.element.box.topPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    paddingLeft: props.element.box?.leftPadding ? `${props.element.box.leftPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    paddingBottom: props.element.box?.bottomPadding ? `${props.element.box.bottomPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    paddingRight: props.element.box?.rightPadding ? `${props.element.box.rightPadding}px` : (props.element.box?.padding ? `${props.element.box.padding}px` : undefined),
    borderTop: calculateBorder('top'),
    borderLeft: calculateBorder('left'),
    borderBottom: calculateBorder('bottom'),
    borderRight: calculateBorder('right'),
    borderRadius: props.element.type === 'ellipse' ? '50%' : ((props.element.type === 'rectangle' && (props.element as any).radius) ? `${(props.element as any).radius}px` : undefined),
    fontFamily: props.element.fontFamily || props.reportFontFamily,
    fontSize: props.element.fontSize ? `${props.element.fontSize}px` : (props.reportFontSize ? `${props.reportFontSize}px` : undefined),
    fontWeight: (props.element.isBold === true || (props.element.isBold === undefined && props.reportIsBold)) ? 'bold' : 'normal',
    fontStyle: (props.element.isItalic === true || (props.element.isItalic === undefined && props.reportIsItalic)) ? 'italic' : 'normal',
    textDecoration: (props.element.isUnderline === true || (props.element.isUnderline === undefined && props.reportIsUnderline)) ? 'underline' : 'none',
    display: 'flex' as 'flex',
    alignItems: verticalAlign as any,
    justifyContent: justifyContent as any,
    textAlign: textAlign as any
  } as any;
});

// 获取边框样式
const getBorderStyle = (side: string, box?: any): string | undefined => {
  if (!box) return 'none';
  
  // 优先使用sidePen元素（根据xsd定义，这是推荐的方式）
  const penProperty = side === 'top' ? box.topPen : 
                    side === 'left' ? box.leftPen : 
                    side === 'bottom' ? box.bottomPen : 
                    box.rightPen;
  
  // 获取各边边框样式和宽度
  const sideBorderStyle = side === 'top' ? box.topBorderStyle : 
                         side === 'left' ? box.leftBorderStyle : 
                         side === 'bottom' ? box.bottomBorderStyle : 
                         box.rightBorderStyle;
  
  const sideBorderWidth = side === 'top' ? box.topBorderWidth : 
                         side === 'left' ? box.leftBorderWidth : 
                         side === 'bottom' ? box.bottomBorderWidth : 
                         box.rightBorderWidth;
  
  // 其次考虑已弃用的sideBorder属性
  const borderProperty = side === 'top' ? box.topBorder : 
                     side === 'left' ? box.leftBorder : 
                     side === 'bottom' ? box.bottomBorder : 
                     box.rightBorder;
  
  // 如果有sideBorder属性且已经是完整的CSS边框字符串，直接返回
  if (borderProperty && borderProperty.includes(' ')) {
    return borderProperty;
  }
  
  // 如果没有sidePen也没有sideBorder，检查全局pen或border
  // 检查是否有全局边框设置
  const hasGlobalBorder = (box.pen && box.pen.lineWidth && box.pen.lineWidth > 0) || 
                          (box.borderWidth && box.borderWidth > 0) ||
                          (box.border && box.border !== '');
  
  // 如果没有任何边框设置，返回none
  if (!penProperty && !borderProperty && !hasGlobalBorder) return 'none';
  
  // 获取边框颜色 - 优先使用sidePen的lineColor，然后是全局pen的lineColor，再然后是已弃用的颜色属性
  const colorProperty = side === 'top' ? box.topBorderColor : 
                     side === 'left' ? box.leftBorderColor : 
                     side === 'bottom' ? box.bottomBorderColor : 
                     box.rightBorderColor;
  const color = penProperty?.lineColor || box.pen?.lineColor || colorProperty || box.borderColor;
  
  // 获取线宽 - 优先使用新的边框宽度属性
  let hasWidth = false;
  let width = '1px'; // 默认宽度

  // 优先使用sidePen的lineWidth属性
  if (penProperty?.lineWidth !== undefined) {
    width = `${penProperty.lineWidth}px`;
    // 只有当线宽大于0时才标记为有宽度
    hasWidth = penProperty.lineWidth > 0;
  } else if (sideBorderWidth !== undefined) {
    width = `${sideBorderWidth}px`;
    // 只有当线宽大于0时才标记为有宽度
    hasWidth = sideBorderWidth > 0;
  } else if (box.borderWidth !== undefined) {
    width = `${box.borderWidth}px`;
    // 只有当线宽大于0时才标记为有宽度
    hasWidth = box.borderWidth > 0;
  } else if (box.pen?.lineWidth !== undefined) {
    // 如果没有sidePen但有全局pen，使用全局pen的lineWidth
    width = `${box.pen.lineWidth}px`;
    hasWidth = box.pen.lineWidth > 0;
  } else if (borderProperty === 'Thin' || borderProperty === '1Point') {
    width = '1px';
    hasWidth = true;
  } else if (borderProperty === '2Point' || borderProperty === 'Medium') {
    width = '2px';
    hasWidth = true;
  } else if (borderProperty === '4Point' || borderProperty === 'Thick') {
    width = '4px';
    hasWidth = true;
  }
  
  // 获取线型 - 优先使用新的边框样式属性
  let hasStyle = false;
  let style = 'solid'; // 默认实线
  
  if (penProperty?.lineStyle) {
    if (penProperty.lineStyle === 'Dashed') style = 'dashed';
    else if (penProperty.lineStyle === 'Dotted') style = 'dotted';
    else if (penProperty.lineStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (sideBorderStyle) {
    if (sideBorderStyle === 'Dashed') style = 'dashed';
    else if (sideBorderStyle === 'Dotted') style = 'dotted';
    else if (sideBorderStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (box.borderStyle) {
    if (box.borderStyle === 'Dashed') style = 'dashed';
    else if (box.borderStyle === 'Dotted') style = 'dotted';
    else if (box.borderStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (box.pen?.lineStyle) {
    // 如果没有sidePen但有全局pen，使用全局pen的lineStyle
    if (box.pen.lineStyle === 'Dashed') style = 'dashed';
    else if (box.pen.lineStyle === 'Dotted') style = 'dotted';
    else if (box.pen.lineStyle === 'Double') style = 'double';
    hasStyle = true;
  } else if (borderProperty === 'Dashed') {
    style = 'dashed';
    hasStyle = true;
  } else if (borderProperty === 'Dotted') {
    style = 'dotted';
    hasStyle = true;
  } else if (borderProperty === 'Double') {
    style = 'double';
    hasStyle = true;
  }
  
  // 只有当设置了颜色、宽度或样式中的至少一个时，才显示边框
  // 特别地，如果没有设置宽度（线宽为0或未设置），则不显示边框
  if (!color && !hasWidth && !hasStyle) return 'none';
  
  // 如果没有设置宽度（线宽为0），则不显示边框，即使有颜色或样式
  if (!hasWidth) return 'none';
  
  // 如果没有设置颜色，使用透明色
  const finalColor = color || 'transparent';
  
  return `${width} ${style} ${finalColor}`;
};

// 处理选择
const handleSelect = (event: MouseEvent) => {
  // 检查是否按下了Ctrl或Shift键（多选）
  const isMultiSelect = event.ctrlKey || event.shiftKey || event.metaKey;
  emit('select', props.bandIndex, props.elementIndex, isMultiSelect, props.parentFrameIndex);
};

// 处理鼠标按下（拖拽）
const handleMouseDown = (event: MouseEvent) => {
  // 记录鼠标按下的初始位置和时间
  const startX = event.clientX;
  const startY = event.clientY;
  const startTime = Date.now();
  
  // 拖动状态标志
  let isDragging = false;
  let dragTimer: number | null = null;
  
  // 鼠标移动处理函数
  const handleMouseMove = (moveEvent: MouseEvent) => {
    // 计算移动距离
    const deltaX = Math.abs(moveEvent.clientX - startX);
    const deltaY = Math.abs(moveEvent.clientY - startY);
    
    // 只有在鼠标按下超过100毫秒后才允许拖动
    const elapsed = Date.now() - startTime;
    
    if (elapsed > 100 && (deltaX > 5 || deltaY > 5)) {
      if (!isDragging) {
        isDragging = true;
        // 触发拖动开始事件
        emit('dragStart', moveEvent, props.bandIndex, props.elementIndex, props.parentFrameIndex);
      }
    }
  };
  
  // 鼠标释放处理函数
  const handleMouseUp = () => {
    // 清除定时器（如果有）
    if (dragTimer !== null) {
      clearTimeout(dragTimer);
      dragTimer = null;
    }
    
    // 移除事件监听器
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // 添加事件监听器
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 处理调整大小
const handleResize = (_direction: string, event?: MouseEvent) => {
  // 获取当前事件对象
  const resizeEvent = event || window.event as MouseEvent;
  if (resizeEvent) {
    emit('resizeStart', resizeEvent, props.bandIndex, props.elementIndex, props.parentFrameIndex);
  }
};

// 处理上下文菜单
const handleContextMenu = (event: MouseEvent) => {
  emit('contextmenu', event, props.bandIndex, props.elementIndex, props.parentFrameIndex);
};

// 处理双击事件
const handleDoubleClick = () => {
  emit('startEditing', props.bandIndex, props.elementIndex, props.parentFrameIndex);
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
  /* 添加文字换行样式 */
  word-break: break-all;
}

.design-element.selected {
  outline: 2px solid #1890ff;
  outline-offset: -1px;
  /* 提高选中元素的层级，确保可以正确交互 */
  z-index: 10;
}

.design-element.out-of-bounds {
  /* 超出边界元素的高亮样式 */
  outline: 2px dashed #ff4d4f;
  outline-offset: -1px;
  background-color: rgba(255, 77, 79, 0.1);
  box-shadow: 0 0 5px rgba(255, 77, 79, 0.5);
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  background-color: #1890ff;
  cursor: se-resize;
  z-index: 20;
}
</style>