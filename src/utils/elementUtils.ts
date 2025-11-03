// 元素相关的工具函数

import type { DesignElement } from '@/types';
import { ELEMENT_TYPE_CONSTANTS } from '@/constants/constants';

// 获取元素的唯一键
export function getElementKey(element: { element: DesignElement, bandIndex: number, elementIndex: number }): string {
  return `${element.element.type}-${element.bandIndex}-${element.elementIndex}`;
}

// 获取元素类型名称
export function getElementTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    [ELEMENT_TYPE_CONSTANTS.STATIC_TEXT]: '静态文本',
    [ELEMENT_TYPE_CONSTANTS.TEXT_FIELD]: '动态文本',
    [ELEMENT_TYPE_CONSTANTS.IMAGE]: '图片',
    [ELEMENT_TYPE_CONSTANTS.LINE]: '线条',
    [ELEMENT_TYPE_CONSTANTS.RECTANGLE]: '矩形',
  };
  return typeNames[type] || type;
}

// 获取元素图标
export function getElementIcon(type: string): string {
  const icons: Record<string, string> = {
    [ELEMENT_TYPE_CONSTANTS.STATIC_TEXT]: 'T',
    [ELEMENT_TYPE_CONSTANTS.TEXT_FIELD]: '{ }',
    [ELEMENT_TYPE_CONSTANTS.IMAGE]: '🖼',
    [ELEMENT_TYPE_CONSTANTS.LINE]: '─',
    [ELEMENT_TYPE_CONSTANTS.RECTANGLE]: '▭'
  };
  return icons[type] || '?';
}

// 获取元素显示信息（不包含Band）
export function getElementDisplayInfoWithoutBand(element: DesignElement): string {
  let info = '';
  
  // 根据元素类型添加特定信息
  if (element.type === 'staticText' && (element as any).text) {
    info = `${(element as any).text.substring(0, 15)}${(element as any).text.length > 15 ? '...' : ''}`;
  } else if (element.type === 'textField' && (element as any).fieldName) {
    info = `$F{${(element as any).fieldName}}`;
  } else if (element.type === 'image' && (element as any).imagePath) {
    info = (element as any).imagePath;
  }
  
  return info;
}

// 检查元素是否被选中
export function isElementSelected(element: { element: DesignElement, bandIndex: number, elementIndex: number }, selectedElement: { bandIndex: number, elementIndex: number } | null): boolean {
  return selectedElement !== null && 
         selectedElement.bandIndex === element.bandIndex && 
         selectedElement.elementIndex === element.elementIndex;
}

// 从列表中选择元素
export function selectElementFromList(element: { element: DesignElement, bandIndex: number, elementIndex: number },selectElement: (bandIndex: number, elementIndex: number) => void): void {
  selectElement(element.bandIndex, element.elementIndex);
}

// 根据参数选择元素
export function selectElementsByParameter(bands: any[], paramName: string, selectElement: (bandIndex: number, elementIndex: number) => void): void {
  // 查找使用该参数的元素
  let foundElement = false;
  
  bands.forEach((band, bandIndex) => {
    if (band.elements) {
      band.elements.forEach((element: DesignElement, elementIndex: number) => {
        // 检查元素的表达式是否包含该参数
        if (element.type === 'textField' && (element as any).expression && (element as any).expression.includes(`$P{${paramName}}`)) {
          selectElement(bandIndex, elementIndex);
          foundElement = true;
          return;
        }
      });
    }
  });
  
  // 如果没有找到使用该参数的元素，可以显示提示
  if (!foundElement) {
    // 可以添加提示逻辑，这里暂时不实现
    console.log(`没有找到使用参数 $P{${paramName}} 的元素`);
  }
}

// 根据字段选择元素
export function selectElementsByField(bands: any[], fieldName: string, selectElement: (bandIndex: number, elementIndex: number) => void): void {
  // 查找使用该字段的元素
  let foundElement = false;
  
  bands.forEach((band, bandIndex) => {
    if (band.elements) {
      band.elements.forEach((element: DesignElement, elementIndex: number) => {
        // 检查元素的字段名或表达式是否包含该字段
        if ((element.type === 'textField' && (element as any).fieldName === fieldName) || 
            (element.type === 'textField' && (element as any).expression && (element as any).expression.includes(`$F{${fieldName}}`))) {
          selectElement(bandIndex, elementIndex);
          foundElement = true;
          return;
        }
      });
    }
  });
  
  // 如果没有找到使用该字段的元素，可以显示提示
  if (!foundElement) {
    // 可以添加提示逻辑，这里暂时不实现
    console.log(`没有找到使用字段 $F{${fieldName}} 的元素`);
  }
}

// 创建新元素
export function createNewElement(type: string, x: number, y: number): DesignElement {
  const baseElement: DesignElement = {
    type: type as any,
    x,
    y,
    width: 100,
    height: 30,
  };

  // 根据类型添加特定属性
  switch (type) {
    case ELEMENT_TYPE_CONSTANTS.STATIC_TEXT:
      return { ...baseElement, type: 'staticText' as any, text: '静态文本' };
    case ELEMENT_TYPE_CONSTANTS.TEXT_FIELD:
      return { ...baseElement, type: 'textField' as any, fieldName: 'field' };
    case ELEMENT_TYPE_CONSTANTS.IMAGE:
      return { ...baseElement, type: 'image' as any, imagePath: '' };
    case ELEMENT_TYPE_CONSTANTS.LINE:
      return { ...baseElement, type: 'line' as any, lineDirection: 'Horizontal' as any };
    case ELEMENT_TYPE_CONSTANTS.RECTANGLE:
      return { ...baseElement, type: 'rectangle' as any };
    default:
      return baseElement;
  }
}

// 复制元素
export function duplicateElement(element: DesignElement, offsetX: number = 10, offsetY: number = 10): DesignElement {
  return {
    ...element,
    x: element.x + offsetX,
    y: element.y + offsetY,
  };
}

// 检查点是否在元素内
export function isPointInElement(x: number, y: number, element: DesignElement): boolean {
  return x >= element.x && 
         x <= element.x + element.width && 
         y >= element.y && 
         y <= element.y + element.height;
}

// 获取元素的边界框
export function getElementBounds(element: DesignElement): { x: number, y: number, width: number, height: number } {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

// 获取多个元素的边界框
export function getElementsBounds(elements: DesignElement[]): { x: number, y: number, width: number, height: number } | null {
  if (elements.length === 0) return null;
  
  const minX = Math.min(...elements.map(el => el.x));
  const minY = Math.min(...elements.map(el => el.y));
  const maxX = Math.max(...elements.map(el => el.x + el.width));
  const maxY = Math.max(...elements.map(el => el.y + el.height));
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}