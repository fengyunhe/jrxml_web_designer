/**
 * MCP Tool Handlers - 工具处理器实现
 *
 * 实现所有MCP工具的核心逻辑，确保与Vue响应式系统集成
 */

import type { DesignElement, Band, BandType } from '@/types';
import { createNewElement } from '@/utils/elementUtils';

// ============================================
// 类型定义
// ============================================

export interface MCPToolResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface MCPToolCall {
  name: string;
  params: Record<string, any>;
}

export interface MCPToolHandler {
  execute: (params: Record<string, any>, context: MCPContext) => Promise<MCPToolResult>;
}

export interface MCPContext {
  bands: Band[];
  reportProperties: any;
  fields: any[];
  parameters: any[];
  variables: any[];
  saveStateToHistory: () => void;
  updateJRXML: () => void;
  selectElement: (bandIndex: number, elementIndex: number, isMultiSelect?: boolean, parentFrameIndex?: number) => void;
  selectedElement?: any;
  selectedElements?: any[];
  undo?: () => Promise<void>;
  redo?: () => Promise<void>;
}

// ============================================
// 查询工具处理器
// ============================================

const getDesignStateHandler: MCPToolHandler = {
  execute: async (params, context) => {
    return {
      success: true,
      data: {
        reportProperties: context.reportProperties,
        bands: context.bands.map(band => ({
          type: band.type,
          height: band.height,
          elementsCount: band.elements?.length || 0
        })),
        fields: context.fields,
        parameters: context.parameters,
        variables: context.variables
      }
    };
  }
};

const getElementHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuid } = params;

    for (const band of context.bands) {
      const element = band.elements?.find(e => e.uuid === uuid);
      if (element) {
        return {
          success: true,
          data: {
            ...element,
            bandType: band.type
          }
        };
      }
    }

    return {
      success: false,
      error: `Element with UUID ${uuid} not found`
    };
  }
};

const findElementsHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { fieldName, parameterName, elementType, text } = params;
    const results: Array<{
      element: DesignElement;
      bandType: BandType;
      index: number;
      parentFrameIndex?: number;
    }> = [];

    for (const band of context.bands) {
      if (!band.elements) continue;

      band.elements.forEach((element, index) => {
        let matches = true;

        // 按字段名筛选
        if (fieldName) {
          const hasField = element.type === 'textField' &&
            (element as any).expression?.includes(`$F{${fieldName}}`);
          if (!hasField) matches = false;
        }

        // 按参数名筛选
        if (parameterName) {
          const hasParam = element.type === 'textField' &&
            (element as any).expression?.includes(`$P{${parameterName}}`);
          if (!hasParam) matches = false;
        }

        // 按元素类型筛选
        if (elementType && element.type !== elementType) {
          matches = false;
        }

        // 按文本内容筛选
        if (text) {
          const elementText = (element as any).text || (element as any).expression || '';
          if (!elementText.toLowerCase().includes(text.toLowerCase())) {
            matches = false;
          }
        }

        if (matches) {
          results.push({
            element,
            bandType: band.type,
            index,
            parentFrameIndex: undefined
          });
        }
      });
    }

    return {
      success: true,
      data: results
    };
  }
};

// ============================================
// 创建工具处理器
// ============================================

const createStaticTextHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const {
      bandType,
      x,
      y,
      width,
      height,
      text,
      fontSize = 12,
      fontFamily = 'Arial',
      isBold = false,
      isItalic = false,
      forecolor = '#000000',
      backcolor = 'transparent',
      textAlignment = 'Left'
    } = params;

    // 查找目标band的索引
    const bandIndex = context.bands.findIndex(b => b.type === bandType);
    if (bandIndex === -1) {
      return {
        success: false,
        error: `Band ${bandType} not found`
      };
    }

    // 创建元素
    const newElement = createNewElement('staticText', x, y) as any;
    Object.assign(newElement, {
      width,
      height,
      text,
      fontSize,
      fontFamily,
      isBold,
      isItalic,
      forecolor,
      backcolor,
      textAlignment
    });

    // 关键：直接操作响应式数组，确保Vue检测到变化
    const band = context.bands[bandIndex];
    if (band) {
      if (!band.elements) {
        band.elements = [];
      }

      // 使用push方法，Vue会检测到数组变化
      band.elements.push(newElement);

      // 保存历史并更新JRXML
      context.saveStateToHistory();
      context.updateJRXML();

      // 关键：强制触发Vue的响应式更新
      // 通过重新赋值bands数组来触发Vue的更新
      const newBands = [...context.bands];
      context.bands.length = 0;
      context.bands.push(...newBands);
    }

    return {
      success: true,
      data: {
        uuid: newElement.uuid,
        message: `Created static text "${text}" in ${bandType} band`
      }
    };
  }
};

const createTextFieldHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const {
      bandType,
      x,
      y,
      width,
      height,
      expression,
      fontSize = 12,
      fontFamily = 'Arial',
      isBold = false,
      pattern
    } = params;

    // 查找目标band的索引
    const bandIndex = context.bands.findIndex(b => b.type === bandType);
    if (bandIndex === -1) {
      return {
        success: false,
        error: `Band ${bandType} not found`
      };
    }

    // 创建元素
    const newElement = createNewElement('textField', x, y) as any;
    Object.assign(newElement, {
      width,
      height,
      expression,
      fontSize,
      fontFamily,
      isBold,
      pattern
    });

    // 直接操作响应式数组
    const band = context.bands[bandIndex];
    if (band) {
      if (!band.elements) {
        band.elements = [];
      }
      band.elements.push(newElement);

      // 保存历史并更新JRXML
      context.saveStateToHistory();
      context.updateJRXML();
    }

    return {
      success: true,
      data: {
        uuid: newElement.uuid,
        message: `Created text field with expression "${expression}" in ${bandType} band`
      }
    };
  }
};

const createRectangleHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const {
      bandType,
      x,
      y,
      width,
      height,
      forecolor = '#000000',
      backcolor = 'transparent',
      mode = 'Opaque',
      lineWidth = 1,
      lineStyle = 'Solid'
    } = params;

    // 查找目标band的索引
    const bandIndex = context.bands.findIndex(b => b.type === bandType);
    if (bandIndex === -1) {
      return {
        success: false,
        error: `Band ${bandType} not found`
      };
    }

    // 创建元素
    const newElement = createNewElement('rectangle', x, y) as any;
    Object.assign(newElement, {
      width,
      height,
      forecolor,
      backcolor,
      mode,
      pen: {
        lineWidth,
        lineStyle,
        lineColor: forecolor
      }
    });

    // 直接操作响应式数组
    const band = context.bands[bandIndex];
    if (band) {
      if (!band.elements) {
        band.elements = [];
      }
      band.elements.push(newElement);

      // 保存历史并更新JRXML
      context.saveStateToHistory();
      context.updateJRXML();
    }

    return {
      success: true,
      data: {
        uuid: newElement.uuid,
        message: `Created rectangle in ${bandType} band`
      }
    };
  }
};

const createFrameHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const {
      bandType,
      x,
      y,
      width,
      height,
      borderColor,
      backgroundColor
    } = params;

    // 查找目标band的索引
    const bandIndex = context.bands.findIndex(b => b.type === bandType);
    if (bandIndex === -1) {
      return {
        success: false,
        error: `Band ${bandType} not found`
      };
    }

    // 创建元素
    const newElement = createNewElement('frame', x, y) as any;
    Object.assign(newElement, {
      width,
      height,
      elements: [],
      borderColor,
      backgroundColor
    });

    // 直接操作响应式数组
    const band = context.bands[bandIndex];
    if (band) {
      if (!band.elements) {
        band.elements = [];
      }
      band.elements.push(newElement);

      // 保存历史并更新JRXML
      context.saveStateToHistory();
      context.updateJRXML();
    }

    return {
      success: true,
      data: {
        uuid: newElement.uuid,
        message: `Created frame in ${bandType} band`
      }
    };
  }
};

// ============================================
// 修改工具处理器
// ============================================

const updateElementHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuid, properties } = params;

    // 查找元素
    for (const band of context.bands) {
      const elementIndex = band.elements?.findIndex(e => e.uuid === uuid);
      if (elementIndex !== undefined && elementIndex !== -1) {
        const element = band.elements[elementIndex];
        if (element) {
          // 更新属性
          Object.assign(element, properties);

          // 保存历史并更新
          context.saveStateToHistory();
          context.updateJRXML();

          // 关键：强制触发Vue的响应式更新
          const newBands = [...context.bands];
          context.bands.length = 0;
          context.bands.push(...newBands);

          return {
            success: true,
            data: {
              message: `Updated element ${uuid} with properties: ${Object.keys(properties).join(', ')}`
            }
          };
        }
      }
    }

    return {
      success: false,
      error: `Element with UUID ${uuid} not found`
    };
  }
};

const moveElementHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuid, x, y } = params;

    // 查找元素
    for (const band of context.bands) {
      const element = band.elements?.find(e => e.uuid === uuid);
      if (element) {
        // 更新位置
        element.x = x;
        element.y = y;

        // 保存历史并更新
        context.saveStateToHistory();
        context.updateJRXML();

        // 关键：强制触发Vue的响应式更新
        const newBands = [...context.bands];
        context.bands.length = 0;
        context.bands.push(...newBands);

        return {
          success: true,
          data: {
            message: `Moved element ${uuid} to position (${x}, ${y})`
          }
        };
      }
    }

    return {
      success: false,
      error: `Element with UUID ${uuid} not found`
    };
  }
};

// ============================================
// 删除工具处理器
// ============================================

const deleteElementHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuid } = params;

    for (const band of context.bands) {
      if (!band.elements) continue;

      const elementIndex = band.elements.findIndex(e => e.uuid === uuid);
      if (elementIndex !== -1) {
        // 删除元素
        band.elements.splice(elementIndex, 1);

        // 保存历史并更新
        context.saveStateToHistory();
        context.updateJRXML();

        // 关键：强制触发Vue的响应式更新
        const newBands = [...context.bands];
        context.bands.length = 0;
        context.bands.push(...newBands);

        return {
          success: true,
          data: {
            message: `Deleted element ${uuid}`
          }
        };
      }
    }

    return {
      success: false,
      error: `Element with UUID ${uuid} not found`
    };
  }
};

// ============================================
// 批量操作工具处理器
// ============================================

const deleteElementsHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuids } = params;
    let deletedCount = 0;

    for (const uuid of uuids) {
      for (const band of context.bands) {
        if (!band.elements) continue;

        const elementIndex = band.elements.findIndex(e => e.uuid === uuid);
        if (elementIndex !== -1) {
          band.elements.splice(elementIndex, 1);
          deletedCount++;
          break;
        }
      }
    }

    if (deletedCount > 0) {
      context.saveStateToHistory();
      context.updateJRXML();

      const newBands = [...context.bands];
      context.bands.length = 0;
      context.bands.push(...newBands);

      return {
        success: true,
        data: {
          message: `Deleted ${deletedCount} elements successfully`
        }
      };
    }

    return {
      success: false,
      error: 'No elements found with the provided UUIDs'
    };
  }
};

const moveElementsHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuids, deltaX, deltaY } = params;
    let movedCount = 0;

    for (const uuid of uuids) {
      for (const band of context.bands) {
        const element = band.elements?.find(e => e.uuid === uuid);
        if (element) {
          element.x = Math.max(0, element.x + deltaX);
          element.y = Math.max(0, element.y + deltaY);
          movedCount++;
          break;
        }
      }
    }

    if (movedCount > 0) {
      context.saveStateToHistory();
      context.updateJRXML();

      const newBands = [...context.bands];
      context.bands.length = 0;
      context.bands.push(...newBands);

      return {
        success: true,
        data: {
          message: `Moved ${movedCount} elements by (${deltaX}, ${deltaY})`
        }
      };
    }

    return {
      success: false,
      error: 'No elements found with the provided UUIDs'
    };
  }
};

const updateElementsStyleHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuids, fontSize, fontFamily, isBold, isItalic, forecolor, backcolor } = params;
    let updatedCount = 0;

    for (const uuid of uuids) {
      for (const band of context.bands) {
        const element = band.elements?.find(e => e.uuid === uuid);
        if (element) {
          if (fontSize !== undefined) (element as any).fontSize = fontSize;
          if (fontFamily !== undefined) (element as any).fontFamily = fontFamily;
          if (isBold !== undefined) (element as any).isBold = isBold;
          if (isItalic !== undefined) (element as any).isItalic = isItalic;
          if (forecolor !== undefined) element.forecolor = forecolor;
          if (backcolor !== undefined) element.backcolor = backcolor;
          updatedCount++;
          break;
        }
      }
    }

    if (updatedCount > 0) {
      context.saveStateToHistory();
      context.updateJRXML();

      const newBands = [...context.bands];
      context.bands.length = 0;
      context.bands.push(...newBands);

      return {
        success: true,
        data: {
          message: `Updated style for ${updatedCount} elements`
        }
      };
    }

    return {
      success: false,
      error: 'No elements found with the provided UUIDs'
    };
  }
};

// ============================================
// 调整大小和对齐工具处理器
// ============================================

const resizeElementHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuid, width, height } = params;

    for (const band of context.bands) {
      const element = band.elements?.find(e => e.uuid === uuid);
      if (element) {
        if (width !== undefined) element.width = Math.max(1, width);
        if (height !== undefined) element.height = Math.max(1, height);

        context.saveStateToHistory();
        context.updateJRXML();

        const newBands = [...context.bands];
        context.bands.length = 0;
        context.bands.push(...newBands);

        return {
          success: true,
          data: {
            message: `Resized element ${uuid} to (${element.width}x${element.height})`
          }
        };
      }
    }

    return {
      success: false,
      error: `Element with UUID ${uuid} not found`
    };
  }
};

const resizeElementsHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuids, width, height } = params;
    let resizedCount = 0;

    for (const uuid of uuids) {
      for (const band of context.bands) {
        const element = band.elements?.find(e => e.uuid === uuid);
        if (element) {
          if (width !== undefined) element.width = Math.max(1, width);
          if (height !== undefined) element.height = Math.max(1, height);
          resizedCount++;
          break;
        }
      }
    }

    if (resizedCount > 0) {
      context.saveStateToHistory();
      context.updateJRXML();

      const newBands = [...context.bands];
      context.bands.length = 0;
      context.bands.push(...newBands);

      return {
        success: true,
        data: {
          message: `Resized ${resizedCount} elements`
        }
      };
    }

    return {
      success: false,
      error: 'No elements found with the provided UUIDs'
    };
  }
};

const alignElementsHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuids, alignment } = params;
    const elements: Array<{ element: DesignElement; band: Band }> = [];

    // 找出所有元素
    for (const uuid of uuids) {
      for (const band of context.bands) {
        const element = band.elements?.find(e => e.uuid === uuid);
        if (element) {
          elements.push({ element, band });
          break;
        }
      }
    }

    if (elements.length < 2) {
      return {
        success: false,
        error: 'Need at least 2 elements to align'
      };
    }

    // 根据对齐方式计算目标位置
    let targetValue: number;
    switch (alignment) {
      case 'left':
        targetValue = Math.min(...elements.map(e => e.element.x));
        elements.forEach(e => e.element.x = targetValue);
        break;
      case 'right':
        targetValue = Math.max(...elements.map(e => e.element.x + e.element.width));
        elements.forEach(e => e.element.x = targetValue - e.element.width);
        break;
      case 'center':
        const centerX = Math.min(...elements.map(e => e.element.x)) +
          Math.max(...elements.map(e => e.element.x + e.element.width)) / 2;
        elements.forEach(e => e.element.x = centerX - e.element.width / 2);
        break;
      case 'top':
        targetValue = Math.min(...elements.map(e => e.element.y));
        elements.forEach(e => e.element.y = targetValue);
        break;
      case 'bottom':
        targetValue = Math.max(...elements.map(e => e.element.y + e.element.height));
        elements.forEach(e => e.element.y = targetValue - e.element.height);
        break;
      case 'middle':
        const centerY = Math.min(...elements.map(e => e.element.y)) +
          Math.max(...elements.map(e => e.element.y + e.element.height)) / 2;
        elements.forEach(e => e.element.y = centerY - e.element.height / 2);
        break;
    }

    context.saveStateToHistory();
    context.updateJRXML();

    const newBands = [...context.bands];
    context.bands.length = 0;
    context.bands.push(...newBands);

    return {
      success: true,
      data: {
        message: `Aligned ${elements.length} elements to ${alignment}`
      }
    };
  }
};

const distributeElementsHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { uuids, direction } = params;
    const elements: Array<{ element: DesignElement; band: Band }> = [];

    for (const uuid of uuids) {
      for (const band of context.bands) {
        const element = band.elements?.find(e => e.uuid === uuid);
        if (element) {
          elements.push({ element, band });
          break;
        }
      }
    }

    if (elements.length < 3) {
      return {
        success: false,
        error: 'Need at least 3 elements to distribute'
      };
    }

    // 按位置排序
    if (direction === 'horizontal') {
      elements.sort((a, b) => a.element.x - b.element.x);
      const totalWidth = elements.reduce((sum, e) => sum + e.element.width, 0);
      const firstElem = elements[0];
      if (!firstElem) {
        return { success: false, error: 'Unexpected error: no elements' };
      }
      const startX = firstElem.element.x;
      const lastElem = elements[elements.length - 1];
      if (!lastElem) {
        return { success: false, error: 'Unexpected error: no last element' };
      }
      const totalSpace = (lastElem.element.x + lastElem.element.width) - startX;
      const spacing = (totalSpace - totalWidth) / (elements.length - 1);

      let currentX = startX;
      elements.forEach(e => {
        e.element.x = currentX;
        currentX += e.element.width + spacing;
      });
    } else {
      elements.sort((a, b) => a.element.y - b.element.y);
      const totalHeight = elements.reduce((sum, e) => sum + e.element.height, 0);
      const firstElem = elements[0];
      if (!firstElem) {
        return { success: false, error: 'Unexpected error: no elements' };
      }
      const startY = firstElem.element.y;
      const lastElem = elements[elements.length - 1];
      if (!lastElem) {
        return { success: false, error: 'Unexpected error: no last element' };
      }
      const totalSpace = (lastElem.element.y + lastElem.element.height) - startY;
      const spacing = (totalSpace - totalHeight) / (elements.length - 1);

      let currentY = startY;
      elements.forEach(e => {
        e.element.y = currentY;
        currentY += e.element.height + spacing;
      });
    }

    context.saveStateToHistory();
    context.updateJRXML();

    const newBands = [...context.bands];
    context.bands.length = 0;
    context.bands.push(...newBands);

    return {
      success: true,
      data: {
        message: `Distributed ${elements.length} elements ${direction === 'horizontal' ? 'horizontally' : 'vertically'}`
      }
    };
  }
};

// ============================================
// 撤销/重做工具处理器
// ============================================

const undoHandler: MCPToolHandler = {
  execute: async (params, context) => {
    try {
      // 调用父组件的undo功能
      if (typeof context.undo === 'function') {
        await context.undo();
        return {
          success: true,
          data: {
            message: 'Undone successfully'
          }
        };
      }
      return {
        success: false,
        error: 'Undo function not available'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to undo'
      };
    }
  }
};

const redoHandler: MCPToolHandler = {
  execute: async (params, context) => {
    try {
      if (typeof context.redo === 'function') {
        await context.redo();
        return {
          success: true,
          data: {
            message: 'Redone successfully'
          }
        };
      }
      return {
        success: false,
        error: 'Redo function not available'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redo'
      };
    }
  }
};

// ============================================
// 报表属性工具处理器
// ============================================

const updateReportPropertiesHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const updates = Object.keys(params).filter(k => params[k] !== undefined);

    if (updates.length === 0) {
      return {
        success: false,
        error: 'No properties to update'
      };
    }

    updates.forEach(key => {
      if (params[key] !== undefined) {
        (context.reportProperties as any)[key] = params[key];
      }
    });

    context.saveStateToHistory();
    context.updateJRXML();

    return {
      success: true,
      data: {
        message: `Updated report properties: ${updates.join(', ')}`
      }
    };
  }
};

const addFieldHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { name, classType = 'java.lang.String', description } = params;

    // 检查是否已存在同名字段
    const exists = context.fields.some(f => f.name === name);
    if (exists) {
      return {
        success: false,
        error: `Field with name "${name}" already exists`
      };
    }

    context.fields.push({
      name,
      classType,
      description: description || '',
      isForPrompting: true
    });

    context.saveStateToHistory();
    context.updateJRXML();

    return {
      success: true,
      data: {
        message: `Added field "${name}" of type ${classType}`
      }
    };
  }
};

const addParameterHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { name, classType = 'java.lang.String', description, defaultValue } = params;

    const exists = context.parameters.some(p => p.name === name);
    if (exists) {
      return {
        success: false,
        error: `Parameter with name "${name}" already exists`
      };
    }

    context.parameters.push({
      name,
      classType,
      description: description || '',
      defaultValue: defaultValue || ''
    });

    context.saveStateToHistory();
    context.updateJRXML();

    return {
      success: true,
      data: {
        message: `Added parameter "${name}" of type ${classType}`
      }
    };
  }
};

const updateBandHeightHandler: MCPToolHandler = {
  execute: async (params, context) => {
    const { bandType, height } = params;

    // 查找band的索引
    const bandIndex = context.bands.findIndex(b => b.type === bandType);
    if (bandIndex === -1) {
      return {
        success: false,
        error: `Band ${bandType} not found`
      };
    }

    // 更新高度
    const band = context.bands[bandIndex];
    if (band) {
      band.height = height;

      // 保存历史并更新
      context.saveStateToHistory();
      context.updateJRXML();
    }

    return {
      success: true,
      data: {
        message: `Updated ${bandType} band height to ${height}px`
      }
    };
  }
};

// ============================================
// 工具处理器映射
// ============================================

export const MCPToolHandlers: Record<string, MCPToolHandler> = {
  // 查询工具
  'get_design_state': getDesignStateHandler,
  'get_element': getElementHandler,
  'find_elements': findElementsHandler,
  // 创建工具
  'create_static_text': createStaticTextHandler,
  'create_text_field': createTextFieldHandler,
  'create_rectangle': createRectangleHandler,
  'create_frame': createFrameHandler,
  // 修改工具
  'update_element': updateElementHandler,
  'move_element': moveElementHandler,
  // 删除工具
  'delete_element': deleteElementHandler,
  // Band操作工具
  'update_band_height': updateBandHeightHandler,
  // 批量操作工具
  'delete_elements': deleteElementsHandler,
  'move_elements': moveElementsHandler,
  'update_elements_style': updateElementsStyleHandler,
  // 调整大小和对齐工具
  'resize_element': resizeElementHandler,
  'resize_elements': resizeElementsHandler,
  'align_elements': alignElementsHandler,
  'distribute_elements': distributeElementsHandler,
  // 撤销/重做工具
  'undo': undoHandler,
  'redo': redoHandler,
  // 报表属性工具
  'update_report_properties': updateReportPropertiesHandler,
  'add_field': addFieldHandler,
  'add_parameter': addParameterHandler
};

// ============================================
// 工具执行接口
// ============================================

/**
 * 执行MCP工具
 */
export async function executeMCPTool(
  toolCall: MCPToolCall,
  context: MCPContext
): Promise<MCPToolResult> {
  const handler = MCPToolHandlers[toolCall.name];

  if (!handler) {
    return {
      success: false,
      error: `Unknown tool: ${toolCall.name}`
    };
  }

  try {
    return await handler.execute(toolCall.params, context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * 批量执行MCP工具
 */
export async function executeMCPToolsBatch(
  toolCalls: MCPToolCall[],
  context: MCPContext
): Promise<MCPToolResult[]> {
  const results: MCPToolResult[] = [];

  for (const toolCall of toolCalls) {
    const result = await executeMCPTool(toolCall, context);
    results.push(result);

    // 如果某个工具执行失败，停止批量执行
    if (!result.success) {
      break;
    }
  }

  return results;
}
