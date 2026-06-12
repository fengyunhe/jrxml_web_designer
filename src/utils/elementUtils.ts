// 元素相关的工具函数

import type { DesignElement } from '@/types';
import { getElementConfig, createElement } from '@/components/elements/ElementRegistry';

// 获取元素的唯一键
export function getElementKey(element: { element: DesignElement, bandIndex: number, elementIndex: number, parentFrameIndex?: number }): string {
  if (element.parentFrameIndex !== undefined) {
    return `${element.element.type}-${element.bandIndex}-${element.parentFrameIndex}-${element.elementIndex}`;
  }
  return `${element.element.type}-${element.bandIndex}-${element.elementIndex}`;
}

// 获取元素类型名称
export function getElementTypeName(type: string): string {
  const config = getElementConfig(type);
  return config?.name || type;
}

// 获取元素图标
export function getElementIcon(type: string): string {
  const config = getElementConfig(type);
  return config?.icon || '?';
}

// 获取元素SVG图标
export function getElementIconSvg(type: string): string | undefined {
  const config = getElementConfig(type);
  return config?.iconSvg;
}

// 获取元素显示信息（不包含Band）
export function getElementDisplayInfoWithoutBand(element: DesignElement): string {
  let info = '';
  
  // 根据元素类型添加特定信息
  if (element.type === 'staticText' && (element as any).text) {
    info = `${(element as any).text.substring(0, 15)}${(element as any).text.length > 15 ? '...' : ''}`;
  } else if (element.type === 'textField') {
    if ((element as any).expression) {
      info = `${(element as any).expression.substring(0, 15)}${(element as any).expression.length > 15 ? '...' : ''}`;
    } else if ((element as any).fieldName) {
      info = `$F{${(element as any).fieldName}}`;
    }
  } else if (element.type === 'image' && (element as any).imagePath) {
    info = (element as any).imagePath;
  }
  
  return info;
}

// 检查元素是否被选中
export function isElementSelected(element: { element: DesignElement, bandIndex: number, elementIndex: number, parentFrameIndex?: number }, selectedElement: { bandIndex: number, elementIndex: number, parentFrameIndex?: number } | null | undefined): boolean {
  if (!selectedElement) return false;
  
  // 如果两个元素都有 UUID，则优先使用 UUID 进行比较
  if (element.element.uuid && (selectedElement as any).uuid) {
    return element.element.uuid === (selectedElement as any).uuid;
  }
  
  // 否则回退到基于位置的比较
  return selectedElement.bandIndex === element.bandIndex && 
         selectedElement.elementIndex === element.elementIndex &&
         selectedElement.parentFrameIndex === element.parentFrameIndex;
}

// 从列表中选择元素
export function selectElementFromList(element: { element: DesignElement, bandIndex: number, elementIndex: number, parentFrameIndex?: number }, selectElement: (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => void): void {
  selectElement(element.bandIndex, element.elementIndex, false, element.parentFrameIndex);
}

// 递归查找元素
function findElementsByPredicate(bands: any[], predicate: (element: DesignElement) => boolean, callback: (bandIndex: number, elementIndex: number, parentFrameIndex?: number) => void): boolean {
  let found = false;
  
  bands.forEach((band, bandIndex) => {
    if (band.elements) {
      band.elements.forEach((element: DesignElement, elementIndex: number) => {
        // 检查元素自身
        if (predicate(element)) {
          callback(bandIndex, elementIndex, undefined);
          found = true;
          return;
        }
        
        // 如果是 Frame，递归检查子元素
        if (element.type === 'frame' && (element as any).elements) {
          (element as any).elements.forEach((childElement: DesignElement, childIndex: number) => {
            if (predicate(childElement)) {
              callback(bandIndex, childIndex, elementIndex);
              found = true;
            }
          });
        }
      });
    }
  });
  
  return found;
}

// 根据参数选择元素
export function selectElementsByParameter(bands: any[], paramName: string, selectElement: (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => void): void {
  const predicate = (element: DesignElement) => {
    return element.type === 'textField' && (element as any).expression && (element as any).expression.includes(`$P{${paramName}}`);
  };
  
  const found = findElementsByPredicate(bands, predicate, (bandIndex, elementIndex, parentFrameIndex) => {
    selectElement(bandIndex, elementIndex, false, parentFrameIndex);
  });
  
  // 如果没有找到使用该参数的元素，可以显示提示
  if (!found) {
    console.log(`没有找到使用参数 $P{${paramName}} 的元素`);
  }
}

// 根据字段选择元素
export function selectElementsByField(bands: any[], fieldName: string, selectElement: (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => void): void {
  const predicate = (element: DesignElement) => {
    return element.type === 'textField' && (element as any).expression && (element as any).expression.includes(`$F{${fieldName}}`);
  };
  
  const found = findElementsByPredicate(bands, predicate, (bandIndex, elementIndex, parentFrameIndex) => {
    selectElement(bandIndex, elementIndex, false, parentFrameIndex);
  });
  
  // 如果没有找到使用该字段的元素，可以显示提示
  if (!found) {
    console.log(`没有找到使用字段 $F{${fieldName}} 的元素`);
  }
}

// 创建新元素
export function createNewElement(type: string, x: number, y: number): DesignElement {
  let element: DesignElement;
  try {
    element = createElement(type, { x, y });
  } catch {
    element = {
      type: type as any,
      x,
      y,
      width: 100,
      height: 30
    } as DesignElement;
  }
  
  // 生成 UUID
  if (!element.uuid) {
    element.uuid = crypto.randomUUID();
  }
  
  return element;
}

// 复制元素
export function duplicateElement(element: DesignElement, offsetX: number = 10, offsetY: number = 10): DesignElement {
  // 深拷贝元素
  const duplicatedElement = JSON.parse(JSON.stringify(element));
  
  // 生成新的 UUID
  duplicatedElement.uuid = crypto.randomUUID();
  
  // 处理边框属性，只保留宽度大于0的边框
  if (duplicatedElement.box) {
    // 处理新边框模型
    if (duplicatedElement.box.pen && duplicatedElement.box.pen.lineWidth <= 0) {
      delete duplicatedElement.box.pen;
    }
    
    // 处理各边边框
    ['topPen', 'leftPen', 'bottomPen', 'rightPen'].forEach(penType => {
      if (duplicatedElement.box[penType] && duplicatedElement.box[penType].lineWidth <= 0) {
        delete duplicatedElement.box[penType];
      }
    });
    
    // 如果box对象为空，则删除整个box属性
    if (Object.keys(duplicatedElement.box).length === 0) {
      delete duplicatedElement.box;
    }
  }
  
  // 调整位置
  duplicatedElement.x = element.x + offsetX;
  duplicatedElement.y = element.y + offsetY;
  
  return duplicatedElement;
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
