// 导入类型定义
import type { DesignElement, BandType } from '../types';

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

export interface Band {
  type: BandType;
  height: number;
  elements: DesignElement[];
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

// 生成JRXML内容
export function generateJRXMLContent(
  properties: ReportProperties,
  bands: Band[],
  fields: Field[],
  parameters: Parameter[] = []
): string {
  let jrxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE jasperReport PUBLIC "-//JasperReports//DTD Report Design//EN" "http://jasperreports.sourceforge.net/dtds/jasperreport.dtd">
<jasperReport
    name="${properties.name}"
    pageWidth="${properties.pageWidth}"
    pageHeight="${properties.pageHeight}"
    columnWidth="${properties.pageWidth - properties.leftMargin - properties.rightMargin}"
    leftMargin="${properties.leftMargin}"
    rightMargin="${properties.rightMargin}"
    topMargin="${properties.topMargin}"
    bottomMargin="${properties.bottomMargin}">
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
  if (fields.length > 0) {
    jrxml += '\n  <!-- 数据字段定义 -->\n';
    fields.forEach(field => {
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
      
      // 根据DTD规范，height属性应该在band元素上
      jrxml += `\n    <band height="${band.height}">`;
      
      // 添加区域内的元素
      band.elements.forEach(element => {
        jrxml += generateElementXML(element);
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

// 生成box元素XML
function generateBoxXML(box: any): string {
  if (!box) return '';
  
  let xml = '      <box';
  
  // 添加box的属性
  if (box.padding !== undefined) xml += ` padding="${box.padding}"`;
  if (box.border) xml += ` border="${box.border}"`;
  if (box.borderColor) xml += ` borderColor="${box.borderColor}"`;
  if (box.topPadding !== undefined) xml += ` topPadding="${box.topPadding}"`;
  if (box.topBorder) xml += ` topBorder="${box.topBorder}"`;
  if (box.topBorderColor) xml += ` topBorderColor="${box.topBorderColor}"`;
  if (box.leftPadding !== undefined) xml += ` leftPadding="${box.leftPadding}"`;
  if (box.leftBorder) xml += ` leftBorder="${box.leftBorder}"`;
  if (box.leftBorderColor) xml += ` leftBorderColor="${box.leftBorderColor}"`;
  if (box.bottomPadding !== undefined) xml += ` bottomPadding="${box.bottomPadding}"`;
  if (box.bottomBorder) xml += ` bottomBorder="${box.bottomBorder}"`;
  if (box.bottomBorderColor) xml += ` bottomBorderColor="${box.bottomBorderColor}"`;
  if (box.rightPadding !== undefined) xml += ` rightPadding="${box.rightPadding}"`;
  if (box.rightBorder) xml += ` rightBorder="${box.rightBorder}"`;
  if (box.rightBorderColor) xml += ` rightBorderColor="${box.rightBorderColor}"`;
  
  xml += '>\n';
  
  // 添加全局pen子元素，如果存在的话
  if (box.pen) {
    xml += '        <pen';
    if (box.pen.lineWidth !== undefined) xml += ` lineWidth="${box.pen.lineWidth}"`;
    if (box.pen.lineStyle) xml += ` lineStyle="${box.pen.lineStyle}"`;
    if (box.pen.lineColor) xml += ` lineColor="${box.pen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 添加各边的pen子元素
  if (box.topPen) {
    xml += '        <topPen';
    if (box.topPen.lineWidth !== undefined) xml += ` lineWidth="${box.topPen.lineWidth}"`;
    if (box.topPen.lineStyle) xml += ` lineStyle="${box.topPen.lineStyle}"`;
    if (box.topPen.lineColor) xml += ` lineColor="${box.topPen.lineColor}"`;
    xml += '/>\n';
  }
  
  if (box.leftPen) {
    xml += '        <leftPen';
    if (box.leftPen.lineWidth !== undefined) xml += ` lineWidth="${box.leftPen.lineWidth}"`;
    if (box.leftPen.lineStyle) xml += ` lineStyle="${box.leftPen.lineStyle}"`;
    if (box.leftPen.lineColor) xml += ` lineColor="${box.leftPen.lineColor}"`;
    xml += '/>\n';
  }
  
  if (box.bottomPen) {
    xml += '        <bottomPen';
    if (box.bottomPen.lineWidth !== undefined) xml += ` lineWidth="${box.bottomPen.lineWidth}"`;
    if (box.bottomPen.lineStyle) xml += ` lineStyle="${box.bottomPen.lineStyle}"`;
    if (box.bottomPen.lineColor) xml += ` lineColor="${box.bottomPen.lineColor}"`;
    xml += '/>\n';
  }
  
  if (box.rightPen) {
    xml += '        <rightPen';
    if (box.rightPen.lineWidth !== undefined) xml += ` lineWidth="${box.rightPen.lineWidth}"`;
    if (box.rightPen.lineStyle) xml += ` lineStyle="${box.rightPen.lineStyle}"`;
    if (box.rightPen.lineColor) xml += ` lineColor="${box.rightPen.lineColor}"`;
    xml += '/>\n';
  }
  
  xml += '      </box>\n';
  return xml;
}

// 生成静态文本XML
function generateStaticTextXML(element: any): string {
  let xml = `    <staticText>\n      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"`;
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  xml += '/>\n';
  
  // 生成box元素
  xml += generateBoxXML(element.box);
  
  // 确保始终包含textElement和font元素，符合DTD结构
  let textElementAttrs = '';
  
  // 添加textAlignment属性，确保符合DTD
  if (element.textAlignment && ['Left', 'Center', 'Right', 'Justified'].includes(element.textAlignment)) {
    textElementAttrs += ` textAlignment="${element.textAlignment}"`;
  }
  
  // 添加verticalAlignment属性，确保符合DTD
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
  
  // 添加textField的特有属性，确保符合DTD规范
  if (element.isStretchWithOverflow !== undefined) {
    xml += ` isStretchWithOverflow="${element.isStretchWithOverflow}"`;
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
  
  xml += `>\n      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"`;
  
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
  
  if (element.hAlign && ['Left', 'Center', 'Right'].includes(element.hAlign)) {
    xml += ` hAlign="${element.hAlign}"`;
  }
  
  if (element.vAlign && ['Top', 'Middle', 'Bottom'].includes(element.vAlign)) {
    xml += ` vAlign="${element.vAlign}"`;
  }
  
  xml += `>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"/>
`;
  
  xml += `      <imageExpression><![CDATA[${element.imagePath || '""'}]]></imageExpression>\n    </image>\n`;
  return xml;
}

// 生成线条XML
function generateLineXML(element: any): string {
  const direction = element.lineDirection || element.direction || 'TopDown'; // DTD中默认是TopDown
  let xml = `    <line direction="${direction}">
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 1}"/>
    </line>\n`;
  return xml;
}

// 生成矩形XML
function generateRectangleXML(element: any): string {
  let xml = `    <rectangle>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"`;
  
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
        
        bands.push({
          type: type as BandType,
          height,
          elements
        });
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
  
  // 解析box属性
  if (boxElement.hasAttribute('border')) box.border = boxElement.getAttribute('border');
  if (boxElement.hasAttribute('borderColor')) box.borderColor = boxElement.getAttribute('borderColor');
  if (boxElement.hasAttribute('padding')) box.padding = parseInt(boxElement.getAttribute('padding') || '0');
  
  // 解析各边的边框属性
  if (boxElement.hasAttribute('topBorder')) box.topBorder = boxElement.getAttribute('topBorder');
  if (boxElement.hasAttribute('topBorderColor')) box.topBorderColor = boxElement.getAttribute('topBorderColor');
  if (boxElement.hasAttribute('topPadding')) box.topPadding = parseInt(boxElement.getAttribute('topPadding') || '0');
  
  if (boxElement.hasAttribute('leftBorder')) box.leftBorder = boxElement.getAttribute('leftBorder');
  if (boxElement.hasAttribute('leftBorderColor')) box.leftBorderColor = boxElement.getAttribute('leftBorderColor');
  if (boxElement.hasAttribute('leftPadding')) box.leftPadding = parseInt(boxElement.getAttribute('leftPadding') || '0');
  
  if (boxElement.hasAttribute('bottomBorder')) box.bottomBorder = boxElement.getAttribute('bottomBorder');
  if (boxElement.hasAttribute('bottomBorderColor')) box.bottomBorderColor = boxElement.getAttribute('bottomBorderColor');
  if (boxElement.hasAttribute('bottomPadding')) box.bottomPadding = parseInt(boxElement.getAttribute('bottomPadding') || '0');
  
  if (boxElement.hasAttribute('rightBorder')) box.rightBorder = boxElement.getAttribute('rightBorder');
  if (boxElement.hasAttribute('rightBorderColor')) box.rightBorderColor = boxElement.getAttribute('rightBorderColor');
  if (boxElement.hasAttribute('rightPadding')) box.rightPadding = parseInt(boxElement.getAttribute('rightPadding') || '0');
  
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
  
  if (penElement.hasAttribute('lineWidth')) pen.lineWidth = parseFloat(penElement.getAttribute('lineWidth') || '0');
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
  // 解析textField特有属性
  result.isStretchWithOverflow = element.getAttribute('isStretchWithOverflow') === 'true';
  
  if (element.hasAttribute('evaluationTime')) {
    result.evaluationTime = element.getAttribute('evaluationTime');
    if (element.hasAttribute('evaluationGroup')) {
      result.evaluationGroup = element.getAttribute('evaluationGroup');
    }
  }
  
  if (element.hasAttribute('pattern')) result.pattern = element.getAttribute('pattern');
  result.isBlankWhenNull = element.getAttribute('isBlankWhenNull') === 'true';
  
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
  
  const imageExpression = element.querySelector('imageExpression');
  if (imageExpression) {
    result.imagePath = imageExpression.textContent || '';
  }
}

// 解析线条元素
function parseLineElement(element: Element, result: any): void {
  if (element.hasAttribute('direction')) {
    result.direction = element.getAttribute('direction');
  }
}

// 解析矩形元素
function parseRectangleElement(element: Element, result: any): void {
  const graphicElement = element.querySelector('graphicElement');
  if (graphicElement) {
    if (graphicElement.hasAttribute('fill')) result.fill = graphicElement.getAttribute('fill');
  }
}

// 添加缺失的DOMParser定义，用于非浏览器环境
if (typeof window === 'undefined' && typeof DOMParser === 'undefined') {
  // 在Node.js环境中，需要引入xmldom或类似的库
  // 这里提供一个简单的兼容性提示
  console.warn('DOMParser is not available. In Node.js environment, please use a library like xmldom.');
}