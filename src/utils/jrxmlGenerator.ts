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
    bottomMargin="${properties.bottomMargin}"
    uuid="${generateUUID()}">
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
      jrxml += `\n  <${band.type} height="${band.height}">\n`;
      
      // 添加区域内的元素
      band.elements.forEach(element => {
        jrxml += generateElementXML(element);
      });
      
      jrxml += `  </${band.type}>\n`;
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
  
  if (element.fontSize || element.isBold) {
    xml += '      <textElement>\n        <font';
    if (element.fontSize) {
      xml += ` size="${element.fontSize}"`;
    }
    if (element.isBold) {
      xml += ' isBold="true"';
    }
    xml += '/>\n      </textElement>\n';
  }
  
  xml += `      <text><![CDATA[${element.text || ''}]]></text>\n    </staticText>\n`;
  return xml;
}

// 生成动态文本XML
function generateTextFieldXML(element: any): string {
  let xml = `    <textField>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"`;
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  xml += '/>\n';
  
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
  let xml = `    <image>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 30}"/>
`;
  
  xml += `      <imageExpression><![CDATA[${element.imagePath || '""'}]]></imageExpression>\n    </image>\n`;
  return xml;
}

// 生成线条XML
function generateLineXML(element: any): string {
  const lineDirection = element.lineDirection || 'Horizontal';
  let xml = `    <line>
      <reportElement x="${element.x || 0}" y="${element.y || 0}" width="${element.width || 100}" height="${element.height || 1}"/>
`;
  
  if (lineDirection) {
    xml += `      <lineDirection>${lineDirection}</lineDirection>\n`;
  }
  
  xml += `    </line>\n`;
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

// 生成UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}