// 导入类型定义
import type { DesignElement, BandType, Band } from '../types';

// JRXML生成器
export interface ReportProperties {
  name: string;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
}

export interface Field {
  name: string;
  class: string;
}

// 报表参数接口
export interface Parameter {
  name: string;
  class: string;
  defaultValue?: string;
}

// 辅助函数：确保坐标值为整数
function toInt(value: any): number {
  return Math.round(Number(value) || 0);
}

// 生成JRXML内容
export function generateJRXMLContent(
  properties: ReportProperties,
  bands: Band[],
  fields: Field[],
  parameters: Parameter[] = []
): string {
  // 确保页边距有默认值，如果没有设置则使用0
  const safeProperties = {
    ...properties,
    leftMargin: properties.leftMargin || 0,
    rightMargin: properties.rightMargin || 0,
    topMargin: properties.topMargin || 0,
    bottomMargin: properties.bottomMargin || 0
  };
  
  // 创建字段名称的映射，用于快速查找
  const fieldMap = new Map<string, Field>();
  fields.forEach(field => {
    if (field.name) {
      fieldMap.set(field.name, field);
    }
  });
  
  // 遍历所有元素，收集使用的字段名
  const usedFieldNames = new Set<string>();
  bands.forEach(band => {
    band.elements.forEach(element => {
      if (element.type === 'textField' && element.fieldName) {
        usedFieldNames.add(element.fieldName);
      }
      // 也检查表达式中是否包含字段引用
      if (element.type === 'textField' && element.expression) {
        const fieldMatches = element.expression.match(/\$F\{([^}]+)\}/g);
        if (fieldMatches) {
          fieldMatches.forEach(match => {
            const fieldName = match.substring(3, match.length - 1); // 去掉 $F{ 和 }
            usedFieldNames.add(fieldName);
          });
        }
      }
    });
  });
  
  // 添加缺失的字段到字段列表
  usedFieldNames.forEach(fieldName => {
    if (!fieldMap.has(fieldName)) {
      fieldMap.set(fieldName, { name: fieldName, class: 'java.lang.String' });
    }
  });
  
  // 获取更新后的字段列表
  const updatedFields = Array.from(fieldMap.values());
  
  let jrxml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" 
    name="${safeProperties.name}"
    pageWidth="${safeProperties.pageWidth}"
    pageHeight="${safeProperties.pageHeight}"
    columnWidth="${safeProperties.pageWidth - safeProperties.leftMargin - safeProperties.rightMargin}"
    leftMargin="${safeProperties.leftMargin}"
    rightMargin="${safeProperties.rightMargin}"
    topMargin="${safeProperties.topMargin}"
    bottomMargin="${safeProperties.bottomMargin}">
`;

  // 添加参数定义
  if (parameters.length > 0) {
    jrxml += '\n  <!-- 报表参数定义 -->\n';
    parameters.forEach(param => {
      if (param.name && param.class) {
        jrxml += `  <parameter name="${param.name}" class="${param.class}">\n`;
        if (param.defaultValue !== undefined) {
          jrxml += `    <defaultValueExpression><![CDATA[${param.defaultValue}]]></defaultValueExpression>\n`;
        }
        jrxml += '  </parameter>\n';
      }
    });
  }
  
  // 添加字段定义
  if (updatedFields.length > 0) {
    jrxml += '\n  <!-- 数据字段定义 -->\n';
    updatedFields.forEach(field => {
      if (field.name && field.class) {
        jrxml += `  <field name="${field.name}" class="${field.class}"/>
`;
      }
    });
  }

  // 添加报表区域
  bands.forEach(band => {
    if (band.elements.length > 0 || band.height > 0) {
      jrxml += `\n  <${band.type}>`;
      
      // 根据XSD规范，height属性应该在band元素上
      let bandAttributes = `height="${band.height}"`;
      
      // 优先使用非过时的splitType属性，只有在没有splitType属性时才使用过时的isSplitAllowed属性作为fallback
      if (band.splitType) {
        // 如果已经指定了splitType属性，直接使用
        bandAttributes += ` splitType="${band.splitType}"`;
      } else if (band.isSplitAllowed !== undefined) {
        // 只有在没有splitType属性时才使用过时的isSplitAllowed属性
        const splitTypeValue = band.isSplitAllowed ? 'Stretch' : 'Prevent';
        bandAttributes += ` splitType="${splitTypeValue}"`;
      }
      
      jrxml += `\n    <band ${bandAttributes}>`;
      
      // 添加区域内的元素，根据band类型验证元素位置
      const bandTypeHeight = getDefaultBandHeight(band.type);
      band.elements.forEach(element => {
        // 为每个元素验证位置，使用当前band类型的高度限制
        const validatedElement = validateElementPosition(element, bandTypeHeight);
        jrxml += generateElementXML(validatedElement);
      });
      
      jrxml += `\n    </band>\n  </${band.type}>`;
    }
  });

  jrxml += '</jasperReport>';
  return jrxml;
}

// 生成元素XML
function generateElementXML(element: any): string {
  switch (element.type) {
    case 'staticText':
      return generateStaticTextXML(element);
    case 'textField':
      return generateTextFieldXML(element);
    case 'image':
      return generateImageXML(element);
    case 'line':
      return generateLineXML(element);
    case 'rectangle':
      return generateRectangleXML(element);
    default:
      return '';
  }
}

// 验证border值是否符合XSD要求
function validateBorderValue(borderValue: string): string {
  if (!borderValue) return '';
  
  // XSD中lineWidth应该是数值，而不是字符串枚举值
  // 将字符串值转换为对应的数值
  if (borderValue === '0' || borderValue === 'false' || borderValue === 'None') return '0';
  if (borderValue === 'Thin' || borderValue === '1') return '1';
  if (borderValue === '1Point') return '1';
  if (borderValue === '2Point') return '2';
  if (borderValue === '4Point') return '4';
  if (borderValue === 'Dotted') return '1'; // Dotted是样式，不是宽度，默认为1
  
  // 如果是纯数字，直接返回
  if (/^\d+$/.test(borderValue)) {
    return borderValue;
  }
  
  // 默认返回0，表示无边框
  return '0';
}

// 从CSS边框样式中提取边框宽度和样式
function extractBorderFromCSS(cssBorder: string): { width: number, style: string, color?: string } {
  if (!cssBorder) return { width: 0, style: '' };
  
  // 解析CSS边框样式，例如 "1px solid #000000"
  const parts = cssBorder.trim().split(/\s+/);
  
  if (parts.length >= 2) {
    const width = parts[0];
    const style = parts[1];
    const color = parts.length > 2 ? parts[2] : undefined;
    
    // 将CSS宽度转换为JRXML宽度数值
    let jrxmlWidth = 1; // 默认宽度
    if (width === '1px') jrxmlWidth = 1;
    else if (width === '2px') jrxmlWidth = 2;
    else if (width === '3px') jrxmlWidth = 2; // 3px接近2Point
    else if (width === '4px') jrxmlWidth = 4;
    else if (width && /^\d+px$/.test(width)) {
      const pxValue = parseInt(width.replace('px', ''));
      if (pxValue <= 1) jrxmlWidth = 1;
      else if (pxValue <= 2) jrxmlWidth = 2;
      else jrxmlWidth = 4;
    }
    
    // 将CSS样式转换为JRXML样式
    let jrxmlStyle = 'Solid';
    if (style === 'dashed') jrxmlStyle = 'Dashed';
    else if (style === 'dotted') jrxmlStyle = 'Dotted';
    else if (style === 'double') jrxmlStyle = 'Double'; // 注意：Double可能不在XSD中，需要处理
    
    return { width: jrxmlWidth, style: jrxmlStyle, color };
  }
  
  // 如果解析失败，尝试将整个字符串作为枚举值处理
  const borderValue = validateBorderValue(cssBorder);
  let widthValue = 0;
  if (borderValue === '1Point') widthValue = 1;
  else if (borderValue === '2Point') widthValue = 2;
  else if (borderValue === '4Point') widthValue = 4;
  
  return { width: widthValue, style: 'Solid' };
}

// 生成box元素XML
function generateBoxXML(box: any): string {
  if (!box) return '';
  
  // 检查是否有任何边距设置
  const hasPadding = box.padding !== undefined && box.padding !== '' && box.padding !== 0;
  const hasTopPadding = box.topPadding !== undefined && box.topPadding !== '' && box.topPadding !== 0;
  const hasLeftPadding = box.leftPadding !== undefined && box.leftPadding !== '' && box.leftPadding !== 0;
  const hasBottomPadding = box.bottomPadding !== undefined && box.bottomPadding !== '' && box.bottomPadding !== 0;
  const hasRightPadding = box.rightPadding !== undefined && box.rightPadding !== '' && box.rightPadding !== 0;
  
  // 检查是否有旧的pen子元素
  const hasOldPenModel = box.pen || box.topPen || box.leftPen || box.bottomPen || box.rightPen;
  
  // 检查全局边框宽度是否为0
  const hasGlobalBorderWidth = box.borderWidth !== undefined && box.borderWidth > 0;
  const hasGlobalBorderStyle = box.borderStyle !== undefined && box.borderStyle !== '';
  
  // 检查各边边框宽度是否大于0
  const hasTopBorderWidth = box.topBorderWidth !== undefined && box.topBorderWidth > 0;
  const hasLeftBorderWidth = box.leftBorderWidth !== undefined && box.leftBorderWidth > 0;
  const hasBottomBorderWidth = box.bottomBorderWidth !== undefined && box.bottomBorderWidth > 0;
  const hasRightBorderWidth = box.rightBorderWidth !== undefined && box.rightBorderWidth > 0;
  
  // 检查旧模型中各边边框宽度是否大于0
  const hasOldTopPenWidth = box.topPen && box.topPen.lineWidth !== undefined && box.topPen.lineWidth > 0;
  const hasOldLeftPenWidth = box.leftPen && box.leftPen.lineWidth !== undefined && box.leftPen.lineWidth > 0;
  const hasOldBottomPenWidth = box.bottomPen && box.bottomPen.lineWidth !== undefined && box.bottomPen.lineWidth > 0;
  const hasOldRightPenWidth = box.rightPen && box.rightPen.lineWidth !== undefined && box.rightPen.lineWidth > 0;
  const hasOldPenWidth = box.pen && box.pen.lineWidth !== undefined && box.pen.lineWidth > 0;
  
  // 如果全局边框宽度为0且没有任何边距设置，则不生成box标签
  if (!hasGlobalBorderWidth && !hasGlobalBorderStyle && !hasTopBorderWidth && !hasLeftBorderWidth && !hasBottomBorderWidth && !hasRightBorderWidth &&
      !hasOldPenWidth && !hasOldTopPenWidth && !hasOldLeftPenWidth && !hasOldBottomPenWidth && !hasOldRightPenWidth &&
      !hasPadding && !hasTopPadding && !hasLeftPadding && !hasBottomPadding && !hasRightPadding) {
    return '';
  }
  
  let xml = '      <box';
  
  // 添加非过时的box属性（padding相关）
  if (box.padding !== undefined && box.padding !== '') {
    // 如果padding是空字符串，使用默认值0
    const paddingValue = box.padding === '' ? 0 : box.padding;
    xml += ` padding="${paddingValue}"`;
  }
  if (box.topPadding !== undefined && box.topPadding !== '') {
    // 如果topPadding是空字符串，使用默认值0
    const topPaddingValue = box.topPadding === '' ? 0 : box.topPadding;
    xml += ` topPadding="${topPaddingValue}"`;
  }
  if (box.leftPadding !== undefined && box.leftPadding !== '') {
    // 如果leftPadding是空字符串，使用默认值0
    const leftPaddingValue = box.leftPadding === '' ? 0 : box.leftPadding;
    xml += ` leftPadding="${leftPaddingValue}"`;
  }
  if (box.bottomPadding !== undefined && box.bottomPadding !== '') {
    // 如果bottomPadding是空字符串，使用默认值0
    const bottomPaddingValue = box.bottomPadding === '' ? 0 : box.bottomPadding;
    xml += ` bottomPadding="${bottomPaddingValue}"`;
  }
  if (box.rightPadding !== undefined && box.rightPadding !== '') {
    // 如果rightPadding是空字符串，使用默认值0
    const rightPaddingValue = box.rightPadding === '' ? 0 : box.rightPadding;
    xml += ` rightPadding="${rightPaddingValue}"`;
  }
  
  xml += '>\n';
  
  // 优先使用新的边框数据模型（borderWidth和borderStyle）
  // 1. 处理全局边框，只有当宽度大于0时才生成
  if (hasGlobalBorderWidth || hasGlobalBorderStyle) {
    xml += '        <pen';
    if (box.borderWidth !== undefined && box.borderWidth !== null && box.borderWidth > 0) {
      xml += ` lineWidth="${box.borderWidth}"`;
    }
    if (box.borderStyle !== undefined && box.borderStyle !== null && box.borderStyle !== '') {
      xml += ` lineStyle="${box.borderStyle}"`;
    }
    if (box.borderColor !== undefined && box.borderColor !== null) {
      xml += ` lineColor="${box.borderColor}"`;
    }
    xml += '/>\n';
  }
  
  // 2. 处理各边边框，只有当宽度大于0时才生成
  // 上边框 - 只有当宽度大于0时才生成
  if (hasTopBorderWidth) {
    xml += '        <topPen';
    if (box.topBorderWidth !== undefined && box.topBorderWidth !== null && box.topBorderWidth > 0) {
      xml += ` lineWidth="${box.topBorderWidth}"`;
    }
    if (box.topBorderStyle !== undefined && box.topBorderStyle !== null && box.topBorderStyle !== '') {
      xml += ` lineStyle="${box.topBorderStyle}"`;
    }
    if (box.topBorderColor !== undefined && box.topBorderColor !== null) {
      xml += ` lineColor="${box.topBorderColor}"`;
    }
    xml += '/>\n';
  }
  
  // 左边框 - 只有当宽度大于0时才生成
  if (hasLeftBorderWidth) {
    xml += '        <leftPen';
    if (box.leftBorderWidth !== undefined && box.leftBorderWidth !== null && box.leftBorderWidth > 0) {
      xml += ` lineWidth="${box.leftBorderWidth}"`;
    }
    if (box.leftBorderStyle !== undefined && box.leftBorderStyle !== null && box.leftBorderStyle !== '') {
      xml += ` lineStyle="${box.leftBorderStyle}"`;
    }
    if (box.leftBorderColor !== undefined && box.leftBorderColor !== null) {
      xml += ` lineColor="${box.leftBorderColor}"`;
    }
    xml += '/>\n';
  }
  
  // 下边框 - 只有当宽度大于0时才生成
  if (hasBottomBorderWidth) {
    xml += '        <bottomPen';
    if (box.bottomBorderWidth !== undefined && box.bottomBorderWidth !== null && box.bottomBorderWidth > 0) {
      xml += ` lineWidth="${box.bottomBorderWidth}"`;
    }
    if (box.bottomBorderStyle !== undefined && box.bottomBorderStyle !== null && box.bottomBorderStyle !== '') {
      xml += ` lineStyle="${box.bottomBorderStyle}"`;
    }
    if (box.bottomBorderColor !== undefined && box.bottomBorderColor !== null) {
      xml += ` lineColor="${box.bottomBorderColor}"`;
    }
    xml += '/>\n';
  }
  
  // 右边框 - 只有当宽度大于0时才生成
  if (hasRightBorderWidth) {
    xml += '        <rightPen';
    if (box.rightBorderWidth !== undefined && box.rightBorderWidth !== null && box.rightBorderWidth > 0) {
      xml += ` lineWidth="${box.rightBorderWidth}"`;
    }
    if (box.rightBorderStyle !== undefined && box.rightBorderStyle !== null && box.rightBorderStyle !== '') {
      xml += ` lineStyle="${box.rightBorderStyle}"`;
    }
    if (box.rightBorderColor !== undefined && box.rightBorderColor !== null) {
      xml += ` lineColor="${box.rightBorderColor}"`;
    }
    xml += '/>\n';
  }
  
  // 回退到旧的边框数据模型（pen子元素）
  // 只有当宽度大于0时才生成pen子元素
  if (box.pen && box.borderWidth === undefined && box.borderStyle === undefined && hasOldPenWidth) {
    xml += '        <pen';
    if (box.pen.lineWidth !== undefined && box.pen.lineWidth !== null) {
      // 如果lineWidth是字符串，尝试转换为数值
      let lineWidth = box.pen.lineWidth;
      if (typeof lineWidth === 'string') {
        if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
        else if (lineWidth === '2Point') lineWidth = 2;
        else if (lineWidth === '4Point') lineWidth = 4;
        else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
      }
      xml += ` lineWidth="${lineWidth}"`;
    }
    if (box.pen.lineStyle && box.pen.lineStyle !== null && box.pen.lineStyle !== '') xml += ` lineStyle="${box.pen.lineStyle}"`;
    if (box.pen.lineColor && box.pen.lineColor !== null) xml += ` lineColor="${box.pen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 只有当宽度大于0时才生成topPen子元素
  if (box.topPen && box.topBorderWidth === undefined && box.topBorderStyle === undefined && hasOldTopPenWidth) {
    xml += '        <topPen';
    if (box.topPen.lineWidth !== undefined && box.topPen.lineWidth !== null) {
      // 如果lineWidth是字符串，尝试转换为数值
      let lineWidth = box.topPen.lineWidth;
      if (typeof lineWidth === 'string') {
        if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
        else if (lineWidth === '2Point') lineWidth = 2;
        else if (lineWidth === '4Point') lineWidth = 4;
        else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
      }
      xml += ` lineWidth="${lineWidth}"`;
    }
    if (box.topPen.lineStyle && box.topPen.lineStyle !== null && box.topPen.lineStyle !== '') xml += ` lineStyle="${box.topPen.lineStyle}"`;
    if (box.topPen.lineColor && box.topPen.lineColor !== null) xml += ` lineColor="${box.topPen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 只有当宽度大于0时才生成leftPen子元素
  if (box.leftPen && box.leftBorderWidth === undefined && box.leftBorderStyle === undefined && hasOldLeftPenWidth) {
    xml += '        <leftPen';
    if (box.leftPen.lineWidth !== undefined && box.leftPen.lineWidth !== null) {
      // 如果lineWidth是字符串，尝试转换为数值
      let lineWidth = box.leftPen.lineWidth;
      if (typeof lineWidth === 'string') {
        if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
        else if (lineWidth === '2Point') lineWidth = 2;
        else if (lineWidth === '4Point') lineWidth = 4;
        else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
      }
      xml += ` lineWidth="${lineWidth}"`;
    }
    if (box.leftPen.lineStyle && box.leftPen.lineStyle !== null && box.leftPen.lineStyle !== '') xml += ` lineStyle="${box.leftPen.lineStyle}"`;
    if (box.leftPen.lineColor && box.leftPen.lineColor !== null) xml += ` lineColor="${box.leftPen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 只有当宽度大于0时才生成bottomPen子元素
  if (box.bottomPen && box.bottomBorderWidth === undefined && box.bottomBorderStyle === undefined && hasOldBottomPenWidth) {
    xml += '        <bottomPen';
    if (box.bottomPen.lineWidth !== undefined && box.bottomPen.lineWidth !== null) {
      // 如果lineWidth是字符串，尝试转换为数值
      let lineWidth = box.bottomPen.lineWidth;
      if (typeof lineWidth === 'string') {
        if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
        else if (lineWidth === '2Point') lineWidth = 2;
        else if (lineWidth === '4Point') lineWidth = 4;
        else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
      }
      xml += ` lineWidth="${lineWidth}"`;
    }
    if (box.bottomPen.lineStyle && box.bottomPen.lineStyle !== null && box.bottomPen.lineStyle !== '') xml += ` lineStyle="${box.bottomPen.lineStyle}"`;
    if (box.bottomPen.lineColor && box.bottomPen.lineColor !== null) xml += ` lineColor="${box.bottomPen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 只有当宽度大于0时才生成rightPen子元素
  if (box.rightPen && box.rightBorderWidth === undefined && box.rightBorderStyle === undefined && hasOldRightPenWidth) {
    xml += '        <rightPen';
    if (box.rightPen.lineWidth !== undefined && box.rightPen.lineWidth !== null) {
      // 如果lineWidth是字符串，尝试转换为数值
      let lineWidth = box.rightPen.lineWidth;
      if (typeof lineWidth === 'string') {
        if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
        else if (lineWidth === '2Point') lineWidth = 2;
        else if (lineWidth === '4Point') lineWidth = 4;
        else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
      }
      xml += ` lineWidth="${lineWidth}"`;
    }
    if (box.rightPen.lineStyle && box.rightPen.lineStyle !== null && box.rightPen.lineStyle !== '') xml += ` lineStyle="${box.rightPen.lineStyle}"`;
    if (box.rightPen.lineColor && box.rightPen.lineColor !== null) xml += ` lineColor="${box.rightPen.lineColor}"`;
    xml += '/>\n';
  }
  
  xml += '      </box>\n';
  return xml;
}

// 验证并调整元素位置，确保在band范围内
function validateElementPosition(element: any, _bandHeight: number): any {
  if (!element) return element;
  
  // 创建元素的副本以避免修改原始对象
  const validatedElement = { ...element };
  
  // 确保元素有默认值
  validatedElement.x = validatedElement.x || 0;
  validatedElement.y = validatedElement.y || 0;
  validatedElement.width = validatedElement.width || 100;
  validatedElement.height = validatedElement.height || 20;
  
  // 注释掉调整元素高度的代码，保留原始高度
  // 检查元素是否超出band高度
  // const elementBottom = validatedElement.y + validatedElement.height;
  // if (elementBottom > bandHeight) {
  //   // 如果元素超出band高度，调整元素高度以适应band
  //   validatedElement.height = Math.max(10, bandHeight - validatedElement.y);
  //   console.warn(`元素位置超出band高度范围，已调整元素高度从${element.height}到${validatedElement.height}`);
  // }
  
  return validatedElement;
}

// 根据band类型获取默认高度
function getDefaultBandHeight(bandType: string): number {
  switch (bandType) {
    case 'title':
      return 50;
    case 'pageHeader':
      return 40;
    case 'columnHeader':
      return 30;
    case 'detail':
      return 353; // 默认detail band高度
    case 'columnFooter':
      return 30;
    case 'pageFooter':
      return 40;
    case 'summary':
      return 50;
    default:
      return 50;
  }
}

// 生成静态文本XML
function generateStaticTextXML(element: any): string {
  let xml = `    <staticText>\n      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  xml += '/>\n';
  
  // 生成box元素
  xml += generateBoxXML(element.box);
  
  // 确保始终包含textElement和font元素，符合DTD结构
  let textElementAttrs = '';
  
  // 优先使用非过时的markup属性，只有在没有markup属性时才使用过时的isStyledText属性作为fallback
  if (element.markup) {
    // 如果已经指定了markup属性，直接使用
    textElementAttrs += ` markup="${element.markup}"`;
  } else if (element.isStyledText !== undefined) {
    // 只有在没有markup属性时才使用过时的isStyledText属性
    const markupValue = element.isStyledText ? 'styled' : 'none';
    textElementAttrs += ` markup="${markupValue}"`;
  }
  
  // 只添加非过时的textAlignment属性，确保符合DTD
  if (element.textAlignment && ['Left', 'Center', 'Right', 'Justified'].includes(element.textAlignment)) {
    textElementAttrs += ` textAlignment="${element.textAlignment}"`;
  }
  
  // 只添加非过时的verticalAlignment属性，确保符合DTD
  if (element.verticalAlignment && ['Top', 'Middle', 'Bottom'].includes(element.verticalAlignment)) {
    textElementAttrs += ` verticalAlignment="${element.verticalAlignment}"`;
  }
  
  xml += `      <textElement${textElementAttrs}>
        <font`;
    
  let fontAttrs = '';
  // 添加字体名称属性
  if (element.fontFamily) {
    fontAttrs += ` fontName="${element.fontFamily}"`;
  }
  if (element.fontSize) {
    fontAttrs += ` size="${element.fontSize}"`;
  }
  
  if (element.isBold) {
    fontAttrs += ' isBold="true"';
  }
  
  if (element.isItalic) {
    fontAttrs += ' isItalic="true"';
  }
  
  if (element.isUnderline) {
    fontAttrs += ' isUnderline="true"';
  }
  
  xml += `${fontAttrs}/>\n      </textElement>\n`;
  
  xml += `      <text><![CDATA[${element.text || ''}]]></text>\n    </staticText>\n`;
  return xml;
}

// 生成动态文本XML
function generateTextFieldXML(element: any): string {
  let xml = `    <textField`;
  
  // 添加textField的特有属性，确保符合XSD规范
  // 优先使用非过时的textAdjust属性，只有在没有textAdjust属性时才使用过时的isStretchWithOverflow属性作为fallback
  if (element.textAdjust) {
    // 如果已经指定了textAdjust属性，直接使用
    xml += ` textAdjust="${element.textAdjust}"`;
  } else if (element.isStretchWithOverflow !== undefined) {
    // 只有在没有textAdjust属性时才使用过时的isStretchWithOverflow属性
    const textAdjustValue = element.isStretchWithOverflow ? 'StretchHeight' : 'CutText';
    xml += ` textAdjust="${textAdjustValue}"`;
  }
  
  if (element.evaluationTime && element.evaluationTime !== 'Now') {
    // 确保evaluationTime符合DTD允许的值
    const validEvaluationTimes = ['Report', 'Page', 'Column', 'Group', 'Band', 'Auto'];
    if (validEvaluationTimes.includes(element.evaluationTime)) {
      xml += ` evaluationTime="${element.evaluationTime}"`;
    }
    if (element.evaluationTime === 'Group' && element.evaluationGroup) {
      xml += ` evaluationGroup="${element.evaluationGroup}"`;
    }
  }
  
  if (element.pattern) {
    xml += ` pattern="${element.pattern}"`;
  }
  
  if (element.isBlankWhenNull !== undefined) {
    xml += ` isBlankWhenNull="${element.isBlankWhenNull}"`;
  }
  
  xml += `>\n      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  // 添加reportElement的其他可选属性
  if (element.positionType && ['Float', 'FixRelativeToTop', 'FixRelativeToBottom'].includes(element.positionType)) {
    xml += ` positionType="${element.positionType}"`;
  }
  
  xml += '/>\n';
  
  // 生成box元素
  xml += generateBoxXML(element.box);
  
  // 添加文本元素配置，确保textAlignment符合DTD
  let textElementAttrs = '';
  if (element.textAlignment && ['Left', 'Center', 'Right', 'Justified'].includes(element.textAlignment)) {
    textElementAttrs += ` textAlignment="${element.textAlignment}"`;
  }
  
  if (element.verticalAlignment && ['Top', 'Middle', 'Bottom'].includes(element.verticalAlignment)) {
    textElementAttrs += ` verticalAlignment="${element.verticalAlignment}"`;
  }
  
  xml += `      <textElement${textElementAttrs}>\n`;
  
  // 添加字体配置
  let fontAttrs = '';
  // 添加字体名称属性
  if (element.fontFamily) {
    fontAttrs += ` fontName="${element.fontFamily}"`;
  }
  if (element.fontSize) {
    fontAttrs += ` size="${element.fontSize}"`;
  }
  
  if (element.isBold) {
    fontAttrs += ' isBold="true"';
  }
  
  if (element.isItalic) {
    fontAttrs += ' isItalic="true"';
  }
  
  if (element.isUnderline) {
    fontAttrs += ' isUnderline="true"';
  }
  
  xml += `        <font${fontAttrs}/>\n      </textElement>\n`;
  
  let expression = element.expression;
  if (!expression && element.fieldName) {
    expression = `$F{${element.fieldName}}`;
  }
  
  if (expression) {
    xml += `      <textFieldExpression><![CDATA[${expression}]]></textFieldExpression>\n`;
  }
  
  xml += `    </textField>\n`;
  return xml;
}

// 生成图片XML
function generateImageXML(element: any): string {
  let xml = `    <image`;
  
  // 添加image特有的属性，确保符合DTD
  if (element.scaleImage && ['Clip', 'FillFrame', 'RetainShape', 'RealHeight', 'RealSize'].includes(element.scaleImage)) {
    xml += ` scaleImage="${element.scaleImage}"`;
  }
  
  // 处理过时的hAlign属性，转换为hAlign属性
  if (element.hAlign && ['Left', 'Center', 'Right'].includes(element.hAlign)) {
    xml += ` hAlign="${element.hAlign}"`;
  }
  
  // 处理过时的vAlign属性，转换为vAlign属性
  if (element.vAlign && ['Top', 'Middle', 'Bottom'].includes(element.vAlign)) {
    xml += ` vAlign="${element.vAlign}"`;
  }
  
  xml += `>
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"/>
`;
  
  xml += `      <imageExpression><![CDATA[${element.imagePath || '""'}]]></imageExpression>\n    </image>\n`;
  return xml;
}

// 生成线条XML
function generateLineXML(element: any): string {
  // 处理过时的direction属性，转换为direction属性
  const direction = element.lineDirection || element.direction || 'TopDown'; // XSD中默认是TopDown
  let xml = `    <line direction="${direction}">
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"/>
    </line>\n`;
  return xml;
}

// 生成矩形XML
function generateRectangleXML(element: any): string {
  let xml = `    <rectangle>
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;
  
  // 处理过时的backcolor属性，转换为backcolor属性
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  xml += '/>\n      <graphicElement fill="Solid"/>\n    </rectangle>\n';
  return xml;
}

// 不再需要UUID生成函数，已移除

// 解析JRXML内容为设计器数据结构
export function parseJRXMLContent(jrxmlContent: string): { properties: ReportProperties; bands: Band[]; fields: Field[]; parameters: Parameter[] } {
  // 使用DOMParser解析XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(jrxmlContent, 'text/xml');
  
  // 解析报表属性
  const jasperReportElem = xmlDoc.querySelector('jasperReport');
  if (!jasperReportElem) {
    throw new Error('Invalid JRXML: Missing jasperReport element');
  }
  
  const properties: ReportProperties = {
    name: jasperReportElem.getAttribute('name') || 'Unnamed Report',
    pageWidth: parseInt(jasperReportElem.getAttribute('pageWidth') || '595'),
    pageHeight: parseInt(jasperReportElem.getAttribute('pageHeight') || '842'),
    leftMargin: parseInt(jasperReportElem.getAttribute('leftMargin') || '20'),
    rightMargin: parseInt(jasperReportElem.getAttribute('rightMargin') || '20'),
    topMargin: parseInt(jasperReportElem.getAttribute('topMargin') || '30'),
    bottomMargin: parseInt(jasperReportElem.getAttribute('bottomMargin') || '30')
  };
  
  // 解析字段
  const fields: Field[] = [];
  xmlDoc.querySelectorAll('field').forEach(fieldElem => {
    const name = fieldElem.getAttribute('name');
    const className = fieldElem.getAttribute('class') || 'java.lang.String';
    if (name) {
      fields.push({ name, class: className });
    }
  });
  
  // 解析参数
  const parameters: Parameter[] = [];
  xmlDoc.querySelectorAll('parameter').forEach(paramElem => {
    const name = paramElem.getAttribute('name');
    const className = paramElem.getAttribute('class') || 'java.lang.String';
    if (name) {
      const param: Parameter = { name, class: className };
      
      // 解析默认值
      const defaultValueExpr = paramElem.querySelector('defaultValueExpression');
      if (defaultValueExpr && defaultValueExpr.textContent) {
        param.defaultValue = defaultValueExpr.textContent.trim();
      }
      
      parameters.push(param);
    }
  });
  
  // 解析bands
  const bands: Band[] = [];
  const bandTypes = ['background', 'title', 'pageHeader', 'columnHeader', 'detail', 'columnFooter', 'pageFooter', 'lastPageFooter', 'summary', 'noData'];
  
  bandTypes.forEach(type => {
    const bandContainer = xmlDoc.querySelector(`${type}`);
    if (bandContainer) {
      const bandElem = bandContainer.querySelector('band');
      if (bandElem) {
        const height = parseInt(bandElem.getAttribute('height') || '0');
        const elements = parseBandElements(bandElem);
        
        const band: any = {
          type: type as BandType,
          height,
          elements
        };
        
        // 优先使用非过时的splitType属性，只有在没有splitType属性时才使用过时的isSplitAllowed属性作为fallback
        if (bandElem.hasAttribute('splitType')) {
          // 如果已经指定了splitType属性，直接使用
          band.splitType = bandElem.getAttribute('splitType');
        } else if (bandElem.hasAttribute('isSplitAllowed')) {
          // 只有在没有splitType属性时才使用过时的isSplitAllowed属性
          const isSplitAllowed = bandElem.getAttribute('isSplitAllowed') === 'true';
          band.splitType = isSplitAllowed ? 'Stretch' : 'Prevent';
        }
        
        bands.push(band);
      }
    }
  });
  
  return { properties, bands, fields, parameters };
}

// 解析band中的元素
function parseBandElements(bandElem: Element): any[] {
  const elements: any[] = [];
  
  // 处理各种元素类型
  const elementTypes = ['staticText', 'textField', 'image', 'line', 'rectangle'];
  
  elementTypes.forEach(type => {
    bandElem.querySelectorAll(type).forEach(element => {
      const parsedElement = parseElement(element, type);
      if (parsedElement) {
        elements.push(parsedElement);
      }
    });
  });
  
  return elements;
}

// 解析单个元素
function parseElement(element: Element, type: string): any {
  const reportElement = element.querySelector('reportElement');
  if (!reportElement) return null;
  
  // 确保type是有效的DesignElement类型（排除rectangle）
  const validElementTypes: Array<'staticText' | 'textField' | 'image' | 'line'> = ['staticText', 'textField', 'image', 'line'];
  const elementType = validElementTypes.includes(type as any) ? (type as any) : undefined;
  
  if (!elementType) return null;
  
  const result: Partial<DesignElement> = {
    type: elementType,
    x: parseInt(reportElement.getAttribute('x') || '0'),
    y: parseInt(reportElement.getAttribute('y') || '0'),
    width: parseInt(reportElement.getAttribute('width') || '100'),
    height: parseInt(reportElement.getAttribute('height') || '30')
  };
  
  // 设置背景色
  const backcolor = reportElement.getAttribute('backcolor');
  if (backcolor) {
    result.backcolor = backcolor;
  }
  
  // 解析box元素
  const boxElement = element.querySelector('box');
  if (boxElement) {
    result.box = parseBoxElement(boxElement);
  }
  
  // 解析特定类型的元素属性
  switch (type) {
    case 'staticText':
      parseStaticTextElement(element, result);
      break;
    case 'textField':
      parseTextFieldElement(element, result);
      break;
    case 'image':
      parseImageElement(element, result);
      break;
    case 'line':
      parseLineElement(element, result);
      break;
    case 'rectangle':
      parseRectangleElement(element, result);
      break;
  }
  
  return result;
}

// 解析box元素，重点处理边框和边距
function parseBoxElement(boxElement: Element): any {
  const box = {} as any;
  
  // 解析padding属性
  if (boxElement.hasAttribute('padding')) {
    box.padding = parseInt(boxElement.getAttribute('padding') || '0');
  }
  
  // 解析各方向的padding属性
  if (boxElement.hasAttribute('topPadding')) {
    box.topPadding = parseInt(boxElement.getAttribute('topPadding') || '0');
  }
  if (boxElement.hasAttribute('leftPadding')) {
    box.leftPadding = parseInt(boxElement.getAttribute('leftPadding') || '0');
  }
  if (boxElement.hasAttribute('bottomPadding')) {
    box.bottomPadding = parseInt(boxElement.getAttribute('bottomPadding') || '0');
  }
  if (boxElement.hasAttribute('rightPadding')) {
    box.rightPadding = parseInt(boxElement.getAttribute('rightPadding') || '0');
  }
  
  // 解析过时的border属性，转换为pen子元素
  if (boxElement.hasAttribute('border')) {
    if (!box.pen) box.pen = {};
    // 确保边框宽度为0时也被记录，而不是被忽略
    box.pen.lineWidth = parseInt(boxElement.getAttribute('border') || '0');
  }
  
  // 解析过时的borderColor属性，转换为pen子元素
  if (boxElement.hasAttribute('borderColor')) {
    if (!box.pen) box.pen = {};
    box.pen.lineColor = boxElement.getAttribute('borderColor');
  }
  
  // 解析过时的topBorder属性，转换为topPen子元素
  if (boxElement.hasAttribute('topBorder')) {
    if (!box.topPen) box.topPen = {};
    // 确保边框宽度为0时也被记录，而不是被忽略
    box.topPen.lineWidth = parseInt(boxElement.getAttribute('topBorder') || '0');
  }
  
  // 解析过时的topBorderColor属性，转换为topPen子元素
  if (boxElement.hasAttribute('topBorderColor')) {
    if (!box.topPen) box.topPen = {};
    box.topPen.lineColor = boxElement.getAttribute('topBorderColor');
  }
  
  // 解析过时的leftBorder属性，转换为leftPen子元素
  if (boxElement.hasAttribute('leftBorder')) {
    if (!box.leftPen) box.leftPen = {};
    // 确保边框宽度为0时也被记录，而不是被忽略
    box.leftPen.lineWidth = parseInt(boxElement.getAttribute('leftBorder') || '0');
  }
  
  // 解析过时的leftBorderColor属性，转换为leftPen子元素
  if (boxElement.hasAttribute('leftBorderColor')) {
    if (!box.leftPen) box.leftPen = {};
    box.leftPen.lineColor = boxElement.getAttribute('leftBorderColor');
  }
  
  // 解析过时的bottomBorder属性，转换为bottomPen子元素
  if (boxElement.hasAttribute('bottomBorder')) {
    if (!box.bottomPen) box.bottomPen = {};
    // 确保边框宽度为0时也被记录，而不是被忽略
    box.bottomPen.lineWidth = parseInt(boxElement.getAttribute('bottomBorder') || '0');
  }
  
  // 解析过时的bottomBorderColor属性，转换为bottomPen子元素
  if (boxElement.hasAttribute('bottomBorderColor')) {
    if (!box.bottomPen) box.bottomPen = {};
    box.bottomPen.lineColor = boxElement.getAttribute('bottomBorderColor');
  }
  
  // 解析过时的rightBorder属性，转换为rightPen子元素
  if (boxElement.hasAttribute('rightBorder')) {
    if (!box.rightPen) box.rightPen = {};
    // 确保边框宽度为0时也被记录，而不是被忽略
    box.rightPen.lineWidth = parseInt(boxElement.getAttribute('rightBorder') || '0');
  }
  
  // 解析过时的rightBorderColor属性，转换为rightPen子元素
  if (boxElement.hasAttribute('rightBorderColor')) {
    if (!box.rightPen) box.rightPen = {};
    box.rightPen.lineColor = boxElement.getAttribute('rightBorderColor');
  }
  
  // 解析pen子元素
  const topPen = boxElement.querySelector('topPen');
  if (topPen) box.topPen = parsePenElement(topPen);
  
  const leftPen = boxElement.querySelector('leftPen');
  if (leftPen) box.leftPen = parsePenElement(leftPen);
  
  const bottomPen = boxElement.querySelector('bottomPen');
  if (bottomPen) box.bottomPen = parsePenElement(bottomPen);
  
  const rightPen = boxElement.querySelector('rightPen');
  if (rightPen) box.rightPen = parsePenElement(rightPen);
  
  const pen = boxElement.querySelector('pen');
  if (pen) box.pen = parsePenElement(pen);
  
  return box;
}

// 解析pen元素，处理边框粗细、样式和颜色
function parsePenElement(penElement: Element): any {
  const pen = {} as any;
  
  if (penElement.hasAttribute('lineWidth')) {
    // 确保lineWidth为0时也被记录，而不是被忽略
    pen.lineWidth = parseFloat(penElement.getAttribute('lineWidth') || '0');
  }
  if (penElement.hasAttribute('lineStyle')) pen.lineStyle = penElement.getAttribute('lineStyle');
  if (penElement.hasAttribute('lineColor')) pen.lineColor = penElement.getAttribute('lineColor');
  
  return pen;
}

// 解析静态文本元素
function parseStaticTextElement(element: Element, result: any): void {
  const textElement = element.querySelector('textElement');
  if (textElement) {
    if (textElement.hasAttribute('textAlignment')) {
      result.textAlignment = textElement.getAttribute('textAlignment');
    }
    
    if (textElement.hasAttribute('verticalAlignment')) {
      result.verticalAlignment = textElement.getAttribute('verticalAlignment');
    }
    
    // 处理过时的isStyledText属性，转换为markup属性
    if (textElement.hasAttribute('isStyledText')) {
      const isStyledText = textElement.getAttribute('isStyledText') === 'true';
      result.markup = isStyledText ? 'styled' : 'none';
    }
    
    // 如果已经指定了markup属性，直接使用
    if (textElement.hasAttribute('markup')) {
      result.markup = textElement.getAttribute('markup');
    }
    
    const fontElement = textElement.querySelector('font');
    if (fontElement) {
      if (fontElement.hasAttribute('size')) result.fontSize = parseInt(fontElement.getAttribute('size') || '12');
      result.isBold = fontElement.getAttribute('isBold') === 'true';
      result.isItalic = fontElement.getAttribute('isItalic') === 'true';
      result.isUnderline = fontElement.getAttribute('isUnderline') === 'true';
      if (fontElement.hasAttribute('fontName')) result.fontFamily = fontElement.getAttribute('fontName');
    }
  }
  
  const textNode = element.querySelector('text');
  if (textNode) {
    result.text = textNode.textContent || '';
  }
}

// 解析动态文本元素
function parseTextFieldElement(element: Element, result: any): void {
  // 处理过时的isStretchWithOverflow属性，转换为textAdjust属性
  if (element.hasAttribute('isStretchWithOverflow')) {
    const isStretchWithOverflow = element.getAttribute('isStretchWithOverflow') === 'true';
    result.textAdjust = isStretchWithOverflow ? 'StretchHeight' : 'CutText';
  }
  
  // 如果已经指定了textAdjust属性，直接使用
  if (element.hasAttribute('textAdjust')) {
    result.textAdjust = element.getAttribute('textAdjust');
  }
  
  if (element.hasAttribute('evaluationTime')) {
    result.evaluationTime = element.getAttribute('evaluationTime');
    if (element.hasAttribute('evaluationGroup')) {
      result.evaluationGroup = element.getAttribute('evaluationGroup');
    }
  }
  
  if (element.hasAttribute('pattern')) result.pattern = element.getAttribute('pattern');
  result.isBlankWhenNull = element.hasAttribute('isBlankWhenNull') ? element.getAttribute('isBlankWhenNull') === 'true' : true;
  
  // 解析textElement和font
  const textElement = element.querySelector('textElement');
  if (textElement) {
    if (textElement.hasAttribute('textAlignment')) {
      result.textAlignment = textElement.getAttribute('textAlignment');
    }
    
    if (textElement.hasAttribute('verticalAlignment')) {
      result.verticalAlignment = textElement.getAttribute('verticalAlignment');
    }
    
    const fontElement = textElement.querySelector('font');
    if (fontElement) {
      if (fontElement.hasAttribute('size')) result.fontSize = parseInt(fontElement.getAttribute('size') || '12');
      result.isBold = fontElement.getAttribute('isBold') === 'true';
      result.isItalic = fontElement.getAttribute('isItalic') === 'true';
      result.isUnderline = fontElement.getAttribute('isUnderline') === 'true';
      if (fontElement.hasAttribute('fontName')) result.fontFamily = fontElement.getAttribute('fontName');
    }
  }
  
  // 解析表达式
  const expressionElem = element.querySelector('textFieldExpression');
  if (expressionElem) {
    result.expression = expressionElem.textContent || '';
    // 尝试从表达式中提取字段名
    const fieldMatch = result.expression.match(/\$F\{([^}]+)\}/);
    if (fieldMatch) {
      result.fieldName = fieldMatch[1];
    }
  }
}

// 解析图片元素
function parseImageElement(element: Element, result: any): void {
  if (element.hasAttribute('scaleImage')) result.scaleImage = element.getAttribute('scaleImage');
  if (element.hasAttribute('hAlign')) result.hAlign = element.getAttribute('hAlign');
  if (element.hasAttribute('vAlign')) result.vAlign = element.getAttribute('vAlign');
  
  // 解析graphicElement
  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }
  
  const imageExpression = element.querySelector('imageExpression');
  if (imageExpression) {
    result.imagePath = imageExpression.textContent || '';
  }
}

// 解析线条元素
function parseLineElement(element: Element, result: any): void {
  if (element.hasAttribute('direction')) {
    // 将XML中的direction属性映射到lineDirection
    result.lineDirection = element.getAttribute('direction');
  }
  
  // 解析graphicElement
  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }
}

// 解析graphicElement
function parseGraphicElement(element: Element): any {
  const graphicElement: any = {};
  
  // 解析graphicElement属性
  const graphicEl = element.querySelector('graphicElement');
  if (graphicEl) {
    // 处理过时的stretchType属性，转换为reportElement的同名属性
    if (graphicEl.hasAttribute('stretchType')) {
      graphicElement.stretchType = graphicEl.getAttribute('stretchType');
    }
    
    // 处理过时的pen属性，转换为pen子元素
    const penElement = graphicEl.querySelector('pen');
    if (penElement) {
      const pen: any = {};
      if (penElement.hasAttribute('lineWidth')) {
        pen.lineWidth = parseInt(penElement.getAttribute('lineWidth') || '0');
      }
      if (penElement.hasAttribute('lineStyle')) {
        pen.lineStyle = penElement.getAttribute('lineStyle');
      }
      if (penElement.hasAttribute('lineColor')) {
        pen.lineColor = penElement.getAttribute('lineColor');
      }
      graphicElement.pen = pen;
    }
  }
  
  return graphicElement;
}

// 解析矩形元素
function parseRectangleElement(element: Element, result: any): void {
  // 解析graphicElement
  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }
}

// 添加缺失的DOMParser定义，用于非浏览器环境
if (typeof window === 'undefined' && typeof DOMParser === 'undefined') {
  // 在Node.js环境中，需要引入xmldom或类似的库
  // 这里提供一个简单的兼容性提示
  console.warn('DOMParser is not available. In Node.js environment, please use a library like xmldom.');
}