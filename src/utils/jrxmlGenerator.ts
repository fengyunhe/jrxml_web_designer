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
  type: string;
  height: number;
  elements: any[];
}

export interface Field {
  name: string;
  class: string;
}

// 生成JRXML内容
export function generateJRXMLContent(
  properties: ReportProperties,
  bands: Band[],
  fields: Field[]
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

// 生成静态文本XML
function generateStaticTextXML(element: any): string {
  let xml = `    <staticText>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"`;
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  xml += '/>\n';
  
  // 确保始终包含textElement和font元素，符合DTD结构
  let textElementAttrs = '';
  
  // 添加textAlignment属性，确保符合DTD
  if (element.textAlignment && ['Left', 'Center', 'Right', 'Justified'].includes(element.textAlignment)) {
    textElementAttrs += ` textAlignment="${element.textAlignment}"`;
  }
  
  xml += `      <textElement${textElementAttrs}>\n        <font`;
    
  let fontAttrs = '';
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
  
  xml += `>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"`;
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  // 添加reportElement的其他可选属性
  if (element.positionType && ['Float', 'FixRelativeToTop', 'FixRelativeToBottom'].includes(element.positionType)) {
    xml += ` positionType="${element.positionType}"`;
  }
  
  xml += '/>\n';
  
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