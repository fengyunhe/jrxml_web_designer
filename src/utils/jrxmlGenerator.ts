// 导入类型定义
import type { DesignElement, BandType, Band } from '../types';
import type { ReportProperties, Field, Parameter } from './jrxml/types';
import { buildJasperReportOpenTag } from './jrxml/xmlBuilder';

export type { ReportProperties, Field, Parameter } from './jrxml/types';

// 辅助函数：确保坐标值为整数
function toInt(value: any): number {
  return parseInt(value as string) || 0;
}

// 生成JRXML内容
export function generateJRXMLContent(
  properties: ReportProperties,
  bands: Band[],
  fields: Field[],
  parameters: Parameter[] = [],
  subDatasets: any[] = [],
  styles: any[] = []
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
  let jrxml = buildJasperReportOpenTag(safeProperties);

  // 添加表格样式
  if (styles && styles.length > 0) {
    jrxml += '  <!-- 表格样式 -->\n';
    styles.forEach(style => {
      jrxml += generateStyleXML(style);
    });
  } else {
    // 如果没有提供样式，使用默认样式
    jrxml += generateDefaultTableStylesXML();
  }

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
  
  // 添加主报表查询语句
  if (properties.query && properties.query.text) {
    jrxml += `\n  <queryString language="${properties.query.language || 'sql'}"><![CDATA[${properties.query.text}]]></queryString>\n`;
  }
  
  // 添加子数据集定义
  if (subDatasets.length > 0) {
    jrxml += '\n  <!-- 子数据集定义 -->\n';
    subDatasets.forEach(dataset => {
      if (dataset.name) {
        let subDatasetAttrs = `name="${dataset.name}" uuid="${dataset.uuid || crypto.randomUUID()}"`;
        if (dataset.scriptletClass) {
          subDatasetAttrs += ` scriptletClass="${dataset.scriptletClass}"`;
        }
        if (dataset.resourceBundle) {
          subDatasetAttrs += ` resourceBundle="${dataset.resourceBundle}"`;
        }
        if (dataset.whenResourceMissingType) {
          subDatasetAttrs += ` whenResourceMissingType="${dataset.whenResourceMissingType}"`;
        }
        jrxml += `  <subDataset ${subDatasetAttrs}>
`;
        // 添加数据集属性
        if (dataset.properties) {
          Object.entries(dataset.properties).forEach(([key, value]) => {
            jrxml += `    <property name="${key}" value="${value}"/>\n`;
          });
        }
        
        // 添加查询语句
        if (dataset.query && dataset.query.text) {
          jrxml += `    <queryString language="${dataset.query.language || 'sql'}"><![CDATA[${dataset.query.text}]]></queryString>\n`;
        }
        
        // 添加字段定义
        if (dataset.fields && dataset.fields.length > 0) {
          dataset.fields.forEach((field: any) => {
            if (field.name && field.class) {
              jrxml += `    <field name="${field.name}" class="${field.class}">\n`;
              
              // 添加字段属性
              if (field.properties) {
                Object.entries(field.properties).forEach(([key, value]) => {
                  jrxml += `        <property name="${key}" value="${value}"/>\n`;
                });
              }
              
              jrxml += `    </field>\n`;
            }
          });
        }
        jrxml += '  </subDataset>\n';
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
      band.elements.forEach(element => {
        // 为每个元素验证位置，使用当前band类型的高度限制
        const validatedElement = validateElementPosition(element);
        jrxml += generateElementXML(validatedElement);
      });
      
      jrxml += `\n    </band>\n  </${band.type}>`;
    }
  });

  jrxml += '</jasperReport>';
  return jrxml;
}

// 生成默认表格样式XML
function generateDefaultTableStylesXML(): string {
  return `  <!-- 默认表格样式 -->
  <style name="Table_TH" mode="Opaque" backcolor="#F0F8FF">
    <box>
      <pen lineWidth="0.5" lineColor="#000000"/>
      <topPen lineWidth="0.5" lineColor="#000000"/>
      <leftPen lineWidth="0.5" lineColor="#000000"/>
      <bottomPen lineWidth="0.5" lineColor="#000000"/>
      <rightPen lineWidth="0.5" lineColor="#000000"/>
    </box>
  </style>
  <style name="Table_CH" mode="Opaque" backcolor="#BFE1FF">
    <box>
      <pen lineWidth="0.5" lineColor="#000000"/>
      <topPen lineWidth="0.5" lineColor="#000000"/>
      <leftPen lineWidth="0.5" lineColor="#000000"/>
      <bottomPen lineWidth="0.5" lineColor="#000000"/>
      <rightPen lineWidth="0.5" lineColor="#000000"/>
    </box>
  </style>
  <style name="Table_TD" mode="Opaque" backcolor="#FFFFFF">
    <box>
      <pen lineWidth="0.5" lineColor="#000000"/>
      <topPen lineWidth="0.5" lineColor="#000000"/>
      <leftPen lineWidth="0.5" lineColor="#000000"/>
      <bottomPen lineWidth="0.5" lineColor="#000000"/>
      <rightPen lineWidth="0.5" lineColor="#000000"/>
    </box>
  </style>
`;
}

// 生成样式XML
function generateStyleXML(style: any): string {
  if (!style.name) return '';
  
  let xml = `  <style name="${style.name}"`;
  
  // 添加模式属性
  if (style.mode) {
    xml += ` mode="${style.mode}"`;
  }
  
  // 添加背景颜色属性
  if (style.backcolor) {
    xml += ` backcolor="${style.backcolor}"`;
  }
  
  // 添加前景颜色属性
  if (style.forecolor) {
    xml += ` forecolor="${style.forecolor}"`;
  }
  
  xml += `>
`;
  
  // 添加box元素
  if (style.box) {
    xml += generateBoxXML(style.box, style);
  }
  
  // 添加textElement元素（如果有文本对齐或垂直对齐设置）
  if (style.textAlignment || style.verticalAlignment) {
    xml += `    <textElement`;
    if (style.textAlignment) {
      xml += ` textAlignment="${style.textAlignment}"`;
    }
    if (style.verticalAlignment) {
      xml += ` verticalAlignment="${style.verticalAlignment}"`;
    }
    xml += `>
`;
    
    // 添加font元素
    if (style.fontFamily || style.fontSize || style.isBold || style.isItalic || style.isUnderline) {
      xml += `      <font`;
      if (style.fontFamily) {
        xml += ` fontName="${style.fontFamily}"`;
      }
      if (style.fontSize) {
        xml += ` size="${style.fontSize}"`;
      }
      if (style.isBold) {
        xml += ` isBold="true"`;
      }
      if (style.isItalic) {
        xml += ` isItalic="true"`;
      }
      if (style.isUnderline) {
        xml += ` isUnderline="true"`;
      }
      xml += `/>
`;
    }
    
    xml += `    </textElement>
`;
  }
  
  xml += `  </style>
`;
  return xml;
}

// 生成元素XML
function generateElementXML(element: any): string {
  switch (element.type) {
    case 'empty':
      return '';
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
    case 'ellipse':
      return generateEllipseXML(element);
    case 'break':
      return generateBreakXML(element);
    case 'frame':
      return generateFrameXML(element);
    case 'table':
      return generateTableXML(element);
    default:
      return '';
  }
}

// 生成box元素XML
function generateBoxXML(box: any, element: any = {}): string {
  // 如果没有box对象，创建一个临时对象
  const boxData = box || {};
  
  // 检查直接存储在元素根级别的边框属性（向后兼容）
  if (!boxData.pen && (element.borderWidth || element.borderStyle || element.borderColor)) {
    boxData.pen = {
      lineWidth: element.borderWidth,
      lineStyle: element.borderStyle,
      lineColor: element.borderColor
    };
  }
  
  // 检查是否有任何边距设置
  const hasPadding = boxData.padding !== undefined && boxData.padding !== '' && boxData.padding !== 0;
  const hasTopPadding = boxData.topPadding !== undefined && boxData.topPadding !== '' && boxData.topPadding !== 0;
  const hasLeftPadding = boxData.leftPadding !== undefined && boxData.leftPadding !== '' && boxData.leftPadding !== 0;
  const hasBottomPadding = boxData.bottomPadding !== undefined && boxData.bottomPadding !== '' && boxData.bottomPadding !== 0;
  const hasRightPadding = boxData.rightPadding !== undefined && boxData.rightPadding !== '' && boxData.rightPadding !== 0;
  
  // 检查pen格式的边框数据（不过时）
  const hasTopPen = boxData.topPen && boxData.topPen.lineWidth !== undefined && boxData.topPen.lineWidth > 0;
  const hasLeftPen = boxData.leftPen && boxData.leftPen.lineWidth !== undefined && boxData.leftPen.lineWidth > 0;
  const hasBottomPen = boxData.bottomPen && boxData.bottomPen.lineWidth !== undefined && boxData.bottomPen.lineWidth > 0;
  const hasRightPen = boxData.rightPen && boxData.rightPen.lineWidth !== undefined && boxData.rightPen.lineWidth > 0;
  const hasPen = boxData.pen && boxData.pen.lineWidth !== undefined && boxData.pen.lineWidth > 0;
  
  // 检查直接格式的边框数据（过时，但向后兼容）
  const hasGlobalBorderWidth = boxData.borderWidth !== undefined && boxData.borderWidth > 0;
  const hasGlobalBorderStyle = boxData.borderStyle !== undefined && boxData.borderStyle !== '';
  
  // 如果没有任何边框和边距设置，则不生成box标签
  if (!hasPen && !hasTopPen && !hasLeftPen && !hasBottomPen && !hasRightPen &&
      !hasGlobalBorderWidth && !hasGlobalBorderStyle &&
      !hasPadding && !hasTopPadding && !hasLeftPadding && !hasBottomPadding && !hasRightPadding) {
    return '';
  }
  
  let xml = '      <box';
  
  // 添加非过时的box属性（padding相关）
  if (boxData.padding !== undefined && boxData.padding !== '') {
    const paddingValue = boxData.padding === '' ? 0 : boxData.padding;
    xml += ` padding="${paddingValue}"`;
  }
  if (boxData.topPadding !== undefined && boxData.topPadding !== '') {
    const topPaddingValue = boxData.topPadding === '' ? 0 : boxData.topPadding;
    xml += ` topPadding="${topPaddingValue}"`;
  }
  if (boxData.leftPadding !== undefined && boxData.leftPadding !== '') {
    const leftPaddingValue = boxData.leftPadding === '' ? 0 : boxData.leftPadding;
    xml += ` leftPadding="${leftPaddingValue}"`;
  }
  if (boxData.bottomPadding !== undefined && boxData.bottomPadding !== '') {
    const bottomPaddingValue = boxData.bottomPadding === '' ? 0 : boxData.bottomPadding;
    xml += ` bottomPadding="${bottomPaddingValue}"`;
  }
  if (boxData.rightPadding !== undefined && boxData.rightPadding !== '') {
    const rightPaddingValue = boxData.rightPadding === '' ? 0 : boxData.rightPadding;
    xml += ` rightPadding="${rightPaddingValue}"`;
  }
  
  xml += '>\n';
  
  // 优先使用pen格式（不过时），否则使用直接格式（过时，向后兼容）
  // 1. 处理全局边框
  if (hasPen) {
    xml += '        <pen';
    if (boxData.pen.lineWidth !== undefined && boxData.pen.lineWidth !== null) {
      let lineWidth = boxData.pen.lineWidth;
      if (typeof lineWidth === 'string') {
        if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
        else if (lineWidth === '2Point') lineWidth = 2;
        else if (lineWidth === '4Point') lineWidth = 4;
        else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
      }
      xml += ` lineWidth="${lineWidth}"`;
    }
    if (boxData.pen.lineStyle && boxData.pen.lineStyle !== null && boxData.pen.lineStyle !== '') xml += ` lineStyle="${boxData.pen.lineStyle}"`;
    if (boxData.pen.lineColor && boxData.pen.lineColor !== null) xml += ` lineColor="${boxData.pen.lineColor}"`;
    xml += '/>\n';
  } else if (hasGlobalBorderWidth || hasGlobalBorderStyle) {
    // 回退到直接格式（过时）
    xml += '        <pen';
    if (boxData.borderWidth !== undefined && boxData.borderWidth !== null && boxData.borderWidth > 0) {
      xml += ` lineWidth="${boxData.borderWidth}"`;
    }
    if (boxData.borderStyle !== undefined && boxData.borderStyle !== null && boxData.borderStyle !== '') {
      xml += ` lineStyle="${boxData.borderStyle}"`;
    }
    if (boxData.borderColor !== undefined && boxData.borderColor !== null) {
      xml += ` lineColor="${boxData.borderColor}"`;
    }
    xml += '/>\n';
  }
  
  // 2. 处理各边pen（不过时）
  // 上边框
  if (hasTopPen) {
    xml += '        <topPen';
    let lineWidth = boxData.topPen.lineWidth;
    if (typeof lineWidth === 'string') {
      if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
      else if (lineWidth === '2Point') lineWidth = 2;
      else if (lineWidth === '4Point') lineWidth = 4;
      else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
    }
    xml += ` lineWidth="${lineWidth}"`;
    if (boxData.topPen.lineStyle && boxData.topPen.lineStyle !== null && boxData.topPen.lineStyle !== '') xml += ` lineStyle="${boxData.topPen.lineStyle}"`;
    if (boxData.topPen.lineColor && boxData.topPen.lineColor !== null) xml += ` lineColor="${boxData.topPen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 左边框
  if (hasLeftPen) {
    xml += '        <leftPen';
    let lineWidth = boxData.leftPen.lineWidth;
    if (typeof lineWidth === 'string') {
      if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
      else if (lineWidth === '2Point') lineWidth = 2;
      else if (lineWidth === '4Point') lineWidth = 4;
      else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
    }
    xml += ` lineWidth="${lineWidth}"`;
    if (boxData.leftPen.lineStyle && boxData.leftPen.lineStyle !== null && boxData.leftPen.lineStyle !== '') xml += ` lineStyle="${boxData.leftPen.lineStyle}"`;
    if (boxData.leftPen.lineColor && boxData.leftPen.lineColor !== null) xml += ` lineColor="${boxData.leftPen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 下边框
  if (hasBottomPen) {
    xml += '        <bottomPen';
    let lineWidth = boxData.bottomPen.lineWidth;
    if (typeof lineWidth === 'string') {
      if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
      else if (lineWidth === '2Point') lineWidth = 2;
      else if (lineWidth === '4Point') lineWidth = 4;
      else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
    }
    xml += ` lineWidth="${lineWidth}"`;
    if (boxData.bottomPen.lineStyle && boxData.bottomPen.lineStyle !== null && boxData.bottomPen.lineStyle !== '') xml += ` lineStyle="${boxData.bottomPen.lineStyle}"`;
    if (boxData.bottomPen.lineColor && boxData.bottomPen.lineColor !== null) xml += ` lineColor="${boxData.bottomPen.lineColor}"`;
    xml += '/>\n';
  }
  
  // 右边框
  if (hasRightPen) {
    xml += '        <rightPen';
    let lineWidth = boxData.rightPen.lineWidth;
    if (typeof lineWidth === 'string') {
      if (lineWidth === '1Point' || lineWidth === 'Thin') lineWidth = 1;
      else if (lineWidth === '2Point') lineWidth = 2;
      else if (lineWidth === '4Point') lineWidth = 4;
      else if (/^\d+$/.test(lineWidth)) lineWidth = parseInt(lineWidth);
    }
    xml += ` lineWidth="${lineWidth}"`;
    if (boxData.rightPen.lineStyle && boxData.rightPen.lineStyle !== null && boxData.rightPen.lineStyle !== '') xml += ` lineStyle="${boxData.rightPen.lineStyle}"`;
    if (boxData.rightPen.lineColor && boxData.rightPen.lineColor !== null) xml += ` lineColor="${boxData.rightPen.lineColor}"`;
    xml += '/>\n';
  }
  
  xml += '      </box>\n';
  return xml;
}

// 验证并调整元素位置，确保在band范围内
function validateElementPosition(element: any): any {
  if (!element) return element;
  
  // 创建元素的副本以避免修改原始对象
  const validatedElement = { ...element };
  
  // 确保元素有默认值
  validatedElement.x = validatedElement.x || 0;
  validatedElement.y = validatedElement.y || 0;
  validatedElement.width = validatedElement.width || 100;
  validatedElement.height = validatedElement.height || 20;
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
  let xml = `    <staticText`;

  // 添加StaticText特有的属性
  // textAdjust属性
  if (element.textAdjust && ['StretchHeight', 'CutText', 'ShrinkToFit'].includes(element.textAdjust)) {
    xml += ` textAdjust="${element.textAdjust}"`;
  }

  // rotation属性
  if (element.rotation && ['None', 'Left', 'Right'].includes(element.rotation)) {
    xml += ` rotation="${element.rotation}"`;
  }

  // pattern属性
  if (element.pattern) {
    xml += ` pattern="${element.pattern}"`;
  }

  xml += `>\n      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;

  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }

  if (element.forecolor) {
    xml += ` forecolor="${element.forecolor}"`;
  }

  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }

  // 使用元素设置的模式，不再自动覆盖
  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }

  xml += '/>\n';

  // 生成layout属性
  if (element.layout) {
    // 写入property标签来保存布局信息
    xml += `      <property name="com.jaspersoft.studio.layout" value="com.jaspersoft.studio.editor.layout.${element.layout}"/>\n`;
  }

  // 生成box元素
  xml += generateBoxXML(element.box, element);

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

  // 新增：超链接属性
  if (element.hyperlinkType && element.hyperlinkType !== 'None') {
    xml += ` hyperlinkType="${element.hyperlinkType}"`;
  }

  // 新增：书签层级
  if (element.bookmarkLevel !== undefined && element.bookmarkLevel > 0) {
    xml += ` bookmarkLevel="${element.bookmarkLevel}"`;
  }

  // 新增：忽略分页
  if (element.isIgnorePagination !== undefined && element.isIgnorePagination) {
    xml += ` isIgnorePagination="true"`;
  }

  xml += `>\n      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;

  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }

  if (element.forecolor) {
    xml += ` forecolor="${element.forecolor}"`;
  }

  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }

  // 使用元素设置的模式，不再自动覆盖
  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }

  // 添加reportElement的其他可选属性
  if (element.positionType && ['Float', 'FixRelativeToTop', 'FixRelativeToBottom'].includes(element.positionType)) {
    xml += ` positionType="${element.positionType}"`;
  }

  xml += '/>\n';

  // 生成box元素
  xml += generateBoxXML(element.box, element);

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

  // 新增：超链接表达式
  if (element.hyperlinkReferenceExpression) {
    xml += `      <hyperlinkReferenceExpression><![CDATA[${element.hyperlinkReferenceExpression}]]></hyperlinkReferenceExpression>\n`;
  }

  xml += `    </textField>\n`;
  return xml;
}

// 生成图片XML
function generateImageXML(element: any): string {
  let xml = `    <image`;

  // 支持两种属性命名：scaleType（新）和scaleImage（过时，向后兼容）
  const scaleValue = element.scaleType || element.scaleImage;
  if (scaleValue && ['Clip', 'FillFrame', 'RetainShape', 'RealHeight', 'RealSize'].includes(scaleValue)) {
    xml += ` scaleImage="${scaleValue}"`;
  }

  // 处理水平对齐
  if (element.hAlign && ['Left', 'Center', 'Right'].includes(element.hAlign)) {
    xml += ` hAlign="${element.hAlign}"`;
  }

  // 处理垂直对齐
  if (element.vAlign && ['Top', 'Middle', 'Bottom'].includes(element.vAlign)) {
    xml += ` vAlign="${element.vAlign}"`;
  }

  // 新增：是否使用缓存
  if (element.isUsingCache !== undefined) {
    xml += ` isUsingCache="${element.isUsingCache}"`;
  }

  // 新增：是否懒加载
  if (element.isLazy !== undefined && element.isLazy) {
    xml += ` isLazy="true"`;
  }

  // 新增：错误处理类型
  if (element.onErrorType && ['Error', 'Blank', 'Icon'].includes(element.onErrorType)) {
    xml += ` onErrorType="${element.onErrorType}"`;
  }

  // 新增：求值时间
  if (element.evaluationTime && element.evaluationTime !== 'Now') {
    const validEvaluationTimes = ['Report', 'Page', 'Column', 'Band'];
    if (validEvaluationTimes.includes(element.evaluationTime)) {
      xml += ` evaluationTime="${element.evaluationTime}"`;
    }
  }

  // 新增：超链接类型
  if (element.hyperlinkType && element.hyperlinkType !== 'None') {
    xml += ` hyperlinkType="${element.hyperlinkType}"`;
  }

  xml += `>
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;

  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }

  if (element.forecolor) {
    xml += ` forecolor="${element.forecolor}"`;
  }

  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }

  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }

  xml += `/>
`;

  // 生成box元素
  xml += generateBoxXML(element.box, element);

  const imageExpressionValue = element.imageExpression || '""';
  xml += `      <imageExpression><![CDATA[${imageExpressionValue}]]></imageExpression>\n`;

  // 新增：超链接表达式
  if (element.hyperlinkReferenceExpression) {
    xml += `      <hyperlinkReferenceExpression><![CDATA[${element.hyperlinkReferenceExpression}]]></hyperlinkReferenceExpression>\n`;
  }

  xml += `    </image>\n`;
  return xml;
}

// 生成线条XML
function generateLineXML(element: any): string {
  // 处理过时的direction属性，转换为direction属性
  const direction = element.lineDirection || element.direction || 'TopDown'; // XSD中默认是TopDown
  let xml = `    <line direction="${direction}">
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;

  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }

  xml += `/>
    </line>\n`;
  return xml;
}

// 生成矩形XML
function generateRectangleXML(element: any): string {
  let xml = '    <rectangle';
  
  if (element.radius !== undefined && element.radius > 0) {
    xml += ` radius="${element.radius}"`;
  }
  
  xml += `>\n      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;
  
  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }
  
  // 处理过时的backcolor属性，转换为backcolor属性
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  // 使用元素设置的模式，不再自动覆盖
  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }
  
  xml += '/>\n';
  
  // 生成graphicElement
  let hasGraphicElement = false;
  let graphicElementXml = '      <graphicElement';
  
  if (element.fill) {
    graphicElementXml += ` fill="${element.fill}"`;
    hasGraphicElement = true;
  }
  
  graphicElementXml += '>\n';
  
  // 生成pen
  if (element.pen && (element.pen.lineWidth !== undefined || element.pen.lineStyle || element.pen.lineColor)) {
    hasGraphicElement = true;
    graphicElementXml += '        <pen';
    if (element.pen.lineWidth !== undefined) graphicElementXml += ` lineWidth="${element.pen.lineWidth}"`;
    if (element.pen.lineStyle) graphicElementXml += ` lineStyle="${element.pen.lineStyle}"`;
    if (element.pen.lineColor) graphicElementXml += ` lineColor="${element.pen.lineColor}"`;
    graphicElementXml += '/>\n';
  }
  
  graphicElementXml += '      </graphicElement>\n';
  
  if (hasGraphicElement) {
    xml += graphicElementXml;
  }
  
  xml += '    </rectangle>\n';
  return xml;
}

// 生成椭圆XML
function generateEllipseXML(element: any): string {
  let xml = '    <ellipse>\n      <reportElement x="' + toInt(element.x) + '" y="' + toInt(element.y) + '" width="' + toInt(element.width) + '" height="' + toInt(element.height) + '"';
  
  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }
  
  // 处理backcolor属性
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  // 使用元素设置的模式，不再自动覆盖
  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }
  
  xml += '/>\n';
  
  // 生成graphicElement
  let hasGraphicElement = false;
  let graphicElementXml = '      <graphicElement';
  
  if (element.fill) {
    graphicElementXml += ` fill="${element.fill}"`;
    hasGraphicElement = true;
  }
  
  graphicElementXml += '>\n';
  
  // 生成pen
  if (element.pen && (element.pen.lineWidth !== undefined || element.pen.lineStyle || element.pen.lineColor)) {
    hasGraphicElement = true;
    graphicElementXml += '        <pen';
    if (element.pen.lineWidth !== undefined) graphicElementXml += ` lineWidth="${element.pen.lineWidth}"`;
    if (element.pen.lineStyle) graphicElementXml += ` lineStyle="${element.pen.lineStyle}"`;
    if (element.pen.lineColor) graphicElementXml += ` lineColor="${element.pen.lineColor}"`;
    graphicElementXml += '/>\n';
  }
  
  graphicElementXml += '      </graphicElement>\n';
  
  if (hasGraphicElement) {
    xml += graphicElementXml;
  }
  
  xml += '    </ellipse>\n';
  return xml;
}

// 生成容器XML
function generateFrameXML(element: any): string {
  let xml = '    <frame>\n      <reportElement x="' + toInt(element.x) + '" y="' + toInt(element.y) + '" width="' + toInt(element.width) + '" height="' + toInt(element.height) + '"';
  
  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  // 使用元素设置的模式，不再自动覆盖
  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }
  
  xml += '/>\n';
  
  // 生成box元素
  xml += generateBoxXML(element.box, element);
  
  // 生成子元素
  if (element.elements && element.elements.length > 0) {
    element.elements.forEach((child: any) => {
      xml += generateElementXML(child);
    });
  }
  
  xml += '    </frame>\n';
  return xml;
}

// 生成分页符XML
function generateBreakXML(element: any): string {
  // 默认为Page类型
  const type = element.breakType || 'Page';
  let xml = `    <break type="${type}">
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;

  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }

  xml += `/>
    </break>
`;
  return xml;
}

// 生成列XML
function generateColumnXML(column: any, index: number, hasColumnGroups: boolean = false, maxDepth: number = 0): string {
  // 确保column有uuid，如果没有则生成一个
  const columnUuid = column.uuid || crypto.randomUUID();
  // 更新column的uuid，确保被保存
  column.uuid = columnUuid;
  let xml = `          <jr:column width="${toInt(column.width)}" uuid="${columnUuid}">
`;
  // 确保value属性值被正确转义，避免双重引用
  const escapedColumnName = (column.name || `Column${index + 1}`).replace(/"/g, '&quot;');
  xml += `            <property name="com.jaspersoft.studio.components.table.model.column.name" value="${escapedColumnName}"/>
`;
  
  // 生成tableHeader
  if (column.tableHeader && column.tableHeader.enable !== false) {
    if (column.tableHeader.element) {
      // 如果有element对象，则生成包含元素的tableHeader
      const tableHeaderElement = column.tableHeader.element;
      xml += `            <jr:tableHeader height="${toInt(tableHeaderElement.height || 30)}" rowSpan="${tableHeaderElement.rowSpan || 1}" style="Table_TH">
`;
      xml += generateElementXML(tableHeaderElement).replace(/^    /gm, '                ');
      xml += `            </jr:tableHeader>
`;
    } else {
      // 如果没有element对象，则生成空的tableHeader（自闭合形式）
      xml += `            <jr:tableHeader height="30" rowSpan="1" style="Table_TH"/>
`;
    }
  }
  
  // 生成tableFooter
  if (column.tableFooter) {
    if (column.tableFooter.element) {
      // 如果有element对象，则生成包含元素的tableFooter
      const tableFooterElement = column.tableFooter.element;
      xml += `            <jr:tableFooter height="${toInt(tableFooterElement.height || 30)}" rowSpan="${tableFooterElement.rowSpan || 1}">
`;
      xml += generateElementXML(tableFooterElement).replace(/^    /gm, '                ');
      xml += `            </jr:tableFooter>
`;
    } else {
      // 如果没有element对象，则生成空的tableFooter（自闭合形式）
      xml += `            <jr:tableFooter height="30" rowSpan="1"/>
`;
    }
  }
  
  // 生成columnHeader
  if (!column.children) {
    if (column.columnHeader) {
      if (column.columnHeader.element) {
        // 如果有element对象，则生成包含元素的columnHeader
        const columnHeaderElement = column.columnHeader.element;
        // 使用column.columnHeader的rowSpan，如果没有则使用columnHeaderElement的rowSpan，默认为1
        const rowSpan = column.columnHeader.rowSpan || columnHeaderElement.rowSpan || 1;
        xml += `            <jr:columnHeader height="${toInt(columnHeaderElement.height || 30)}" rowSpan="${rowSpan}" style="Table_CH">
`;
        xml += generateElementXML(columnHeaderElement).replace(/^    /gm, '                ');
        xml += `            </jr:columnHeader>
`;
      } else {
        // 如果没有element对象，则生成空的columnHeader（自闭合形式）
        // 使用column.columnHeader的rowSpan，默认为1
        const rowSpan = column.columnHeader.rowSpan || 1;
        xml += `            <jr:columnHeader height="30" rowSpan="${rowSpan}" style="Table_CH"/>
`;
      }
    } else {
      // 如果没有columnHeader对象，则生成默认的columnHeader
      xml += `            <jr:columnHeader height="30" rowSpan="1" style="Table_CH">
`;
      xml += `                <staticText>
`;
      xml += `                  <reportElement x="0" y="0" width="${toInt(column.width)}" height="30"/>
`;
      xml += `                  <textElement textAlignment="Center" verticalAlignment="Middle">
`;
      xml += `                    <font/>
`;
      xml += `                  </textElement>
`;
      xml += `                  <text><![CDATA[${column.name || `Column${index + 1}`}]]></text>
`;
      xml += `                </staticText>
`;
      xml += `            </jr:columnHeader>
`;
    }
  }
  
  // 生成columnFooter
  if (column.columnFooter) {
    if (column.columnFooter.element) {
      // 如果有element对象，则生成包含元素的columnFooter
      const columnFooterElement = column.columnFooter.element;
      xml += `            <jr:columnFooter height="${toInt(columnFooterElement.height || 30)}" rowSpan="${columnFooterElement.rowSpan || 1}" style="Table_CH">
`;
      xml += generateElementXML(columnFooterElement).replace(/^    /gm, '                ');
      xml += `            </jr:columnFooter>
`;
    } else {
      // 如果没有element对象，则生成空的columnFooter（自闭合形式）
      xml += `            <jr:columnFooter height="30" rowSpan="1" style="Table_CH"/>
`;
    }
  }
  
  // 生成detailCell
  if (column.detailCell) {
    if (column.detailCell.element) {
      // 如果有element对象，则生成包含元素的detailCell
      const detailCellElement = column.detailCell.element;
      xml += `            <jr:detailCell height="${toInt(detailCellElement.height || 30)}" style="Table_TD">
`;
      xml += generateElementXML(detailCellElement).replace(/^    /gm, '                ');
      xml += `            </jr:detailCell>
`;
    } else {
      // 如果没有element对象，则生成空的detailCell（自闭合形式）
      xml += `            <jr:detailCell height="30" style="Table_TD"/>
`;
    }
  } else {
    // 如果没有detailCell对象，则生成默认的detailCell
    xml += `            <jr:detailCell height="30" style="Table_TD">
`;
    xml += `                <textField>
`;
    xml += `                  <reportElement x="0" y="0" width="${toInt(column.width)}" height="30"/>
`;
    xml += `                  <textElement textAlignment="Center" verticalAlignment="Middle">
`;
    xml += `                    <font/>
`;
    xml += `                  </textElement>
`;
    xml += `                  <textFieldExpression><![CDATA[$F{FIELD_NAME}]]></textFieldExpression>
`;
    xml += `                </textField>
`;
    xml += `            </jr:detailCell>
`;
  }
  
  xml += `          </jr:column>
`;
  return xml;
}

// 生成列分组XML，同时收集处理过的列的UUID
function generateColumnGroupXML(group: any, processedColumnUuids?: Set<string>, hasColumnGroups: boolean = true, maxDepth: number = 0): string {
  // 确保group有uuid，如果没有则生成一个
  const groupUuid = group.uuid || crypto.randomUUID();
  // 更新group的uuid，确保被保存
  group.uuid = groupUuid;
  
  // 自动计算组合列宽度
  function calculateGroupWidth(node: any): number {
    if (node.children && node.children.length > 0) {
      return node.children.reduce((sum: number, child: any) => {
        return sum + calculateGroupWidth(child);
      }, 0);
    }
    return node.width || 0;
  }
  
  const groupWidth = calculateGroupWidth(group);
  group.width = groupWidth; // 更新group的width属性，确保一致性
  
  let xml = `          <jr:columnGroup width="${toInt(groupWidth)}" uuid="${groupUuid}">
`;
  // 确保value属性值被正确转义，避免双重引用
  const escapedGroupName = (group.name || `Group`).replace(/"/g, '&quot;');
  xml += `            <property name="com.jaspersoft.studio.components.table.model.column.name" value="${escapedGroupName}"/>
`;
  
  // 生成tableHeader
  if (group.tableHeader && group.tableHeader.enable !== false) {
    // 处理tableHeader结构，获取实际的元素（可能在element属性中）
    const actualTableHeader = group.tableHeader.element || group.tableHeader;
    
    // 如果没有边框设置，添加默认的边框
    if (!actualTableHeader.box || !actualTableHeader.box.pen) {
      actualTableHeader.box = {
        ...actualTableHeader.box,
        pen: {
          lineWidth: 1,
          lineStyle: 'Solid',
          lineColor: '#000000'
        }
      };
    }
    xml += `            <jr:tableHeader height="${toInt(actualTableHeader.height || 30)}" rowSpan="${group.tableHeader.rowSpan || actualTableHeader.rowSpan || 1}" style="Table_TH">
`;
    xml += generateElementXML(actualTableHeader).replace(/^    /gm, '                ');
    xml += `            </jr:tableHeader>
`;
  }
  
  // 生成tableFooter - 只要存在就生成，即使是空的
  if (group.hasTableFooter && group.tableFooter) {
    // 处理tableFooter结构，获取实际的元素（可能在element属性中）
    const actualTableFooter = group.tableFooter.element || group.tableFooter;
    
    xml += `            <jr:tableFooter height="${toInt(actualTableFooter.height || 30)}" rowSpan="${group.tableFooter.rowSpan || actualTableFooter.rowSpan || 1}">
`;
    if (actualTableFooter.expression || actualTableFooter.text) {
      xml += generateElementXML(actualTableFooter).replace(/^    /gm, '                ');
    }
    xml += `            </jr:tableFooter>
`;
  }
  
  // 生成columnHeader
  let columnHeader = group.columnHeader;
  if (columnHeader) {
    // 处理columnHeader结构，获取实际的元素（可能在element属性中）
    const actualColumnHeader = columnHeader.element || columnHeader;
    
    // 仅在没有明确设置text或expression时，才使用group.name作为默认值
    if (actualColumnHeader.type === 'staticText' && !actualColumnHeader.text) {
      actualColumnHeader.text = group.name;
    } else if (actualColumnHeader.type === 'textField' && !actualColumnHeader.expression) {
      actualColumnHeader.expression = group.name;
    }
    // 如果没有边框设置，添加默认的边框
    if (!actualColumnHeader.box || !actualColumnHeader.box.pen) {
      actualColumnHeader.box = {
        ...actualColumnHeader.box,
        pen: {
          lineWidth: 1,
          lineStyle: 'Solid',
          lineColor: '#000000'
        }
      };
    }
    
    // 对于组合列，使用设置的rowSpan值，如果没有则默认为1
    const rowSpan = columnHeader.rowSpan || actualColumnHeader.rowSpan || 1;
    console.log('Group columnHeader rowSpan:', rowSpan);
    xml += `            <jr:columnHeader height="${toInt(actualColumnHeader.height || 30)}" rowSpan="${rowSpan}" style="Table_CH">
`;
    xml += generateElementXML(actualColumnHeader).replace(/^    /gm, '                ');
    xml += `            </jr:columnHeader>
`;
  }
  
  // 生成columnFooter - 只要存在就生成，即使是空的
  if (group.hasColumnFooter && group.columnFooter) {
    // 处理columnFooter结构，获取实际的元素（可能在element属性中）
    const actualColumnFooter = group.columnFooter.element || group.columnFooter;
    
    xml += `            <jr:columnFooter height="${toInt(actualColumnFooter.height || 30)}" rowSpan="${group.columnFooter.rowSpan || actualColumnFooter.rowSpan || 1}" style="Table_CH">
`;
    if (actualColumnFooter.expression || actualColumnFooter.text) {
      xml += generateElementXML(actualColumnFooter).replace(/^    /gm, '                ');
    }
    xml += `            </jr:columnFooter>
`;
  }
  
  // 生成子分组或列
  const children = group.children || [];
  children.forEach((child: any, index: number) => {
    if (child.children) {
      // 递归生成子分组，传递hasColumnGroups标志和maxDepth
      xml += generateColumnGroupXML(child, processedColumnUuids, hasColumnGroups, maxDepth);
    } else {
      // 生成普通列，传递hasColumnGroups标志和maxDepth
      xml += generateColumnXML(child, index, hasColumnGroups, maxDepth);
      // 收集处理过的列的UUID
      if (processedColumnUuids) {
        processedColumnUuids.add(child.uuid);
      }
    }
  });
  
  xml += `</jr:columnGroup>`;
  return xml;
}

// 预处理表格元素，确保单元格中的元素尺寸与单元格尺寸一致
function preprocessTableElements(element: any) {
  // 处理列分组
  function processColumnGroup(group: any) {
    // 首先确保group.width是最新计算的聚合宽度
    function calculateGroupWidth(node: any): number {
      if (node.children && node.children.length > 0) {
        return node.children.reduce((sum: number, child: any) => {
          return sum + calculateGroupWidth(child);
        }, 0);
      }
      return node.width || 0;
    }
    
    // 计算并更新聚合列的总宽度
    const totalWidth = calculateGroupWidth(group);
    group.width = totalWidth; // 更新group的width属性，确保一致性
    
    // 确保group的tableHeader尺寸始终等于聚合列尺寸
    if (group.tableHeader) {
      group.tableHeader.width = totalWidth;
      group.tableHeader.height = group.tableHeader.height || 30;
      // 确保tableHeader中的元素尺寸等于tableHeader尺寸
      if (group.tableHeader.element) {
        group.tableHeader.element.width = totalWidth;
        group.tableHeader.element.height = group.tableHeader.height;
      }
    }
    
    // 确保group的columnHeader尺寸始终等于聚合列尺寸
    if (group.columnHeader) {
      group.columnHeader.width = totalWidth;
      group.columnHeader.height = group.columnHeader.height || 30;
      // 确保columnHeader中的元素尺寸等于columnHeader尺寸
      if (group.columnHeader.element) {
        group.columnHeader.element.width = totalWidth;
        group.columnHeader.element.height = group.columnHeader.height;
      }
    }
    
    // 确保group的columnFooter尺寸始终等于聚合列尺寸
    if (group.columnFooter) {
      group.columnFooter.width = totalWidth;
      group.columnFooter.height = group.columnFooter.height || 30;
      // 确保columnFooter中的元素尺寸等于columnFooter尺寸
      if (group.columnFooter.element) {
        group.columnFooter.element.width = totalWidth;
        group.columnFooter.element.height = group.columnFooter.height;
      }
    }
    
    // 确保group的tableFooter尺寸始终等于聚合列尺寸
    if (group.tableFooter) {
      group.tableFooter.width = totalWidth;
      group.tableFooter.height = group.tableFooter.height || 30;
      // 确保tableFooter中的元素尺寸等于tableFooter尺寸
      if (group.tableFooter.element) {
        group.tableFooter.element.width = totalWidth;
        group.tableFooter.element.height = group.tableFooter.height;
      }
    }
    
    // 递归处理子分组或列
    if (group.children) {
      group.children.forEach((child: any) => {
        if (child.children) {
          // 子分组
          processColumnGroup(child);
        } else {
          // 普通列，检查并调整列中的单元格元素
          processColumn(child);
        }
      });
    }
  }
  
  // 处理普通列
  function processColumn(column: any) {
    const columnWidth = column.width;
    const defaultCellHeight = 30;
    
    // 确保column的tableHeader尺寸始终等于列尺寸
    if (column.tableHeader) {
      column.tableHeader.width = columnWidth;
      column.tableHeader.height = column.tableHeader.height || defaultCellHeight;
      // 确保tableHeader中的元素尺寸等于tableHeader尺寸
      if (column.tableHeader.element) {
        column.tableHeader.element.width = columnWidth;
        column.tableHeader.element.height = column.tableHeader.height;
      }
    }
    
    // 确保column的columnHeader尺寸始终等于列尺寸
    if (column.columnHeader) {
      column.columnHeader.width = columnWidth;
      column.columnHeader.height = column.columnHeader.height || defaultCellHeight;
      // 确保columnHeader中的元素尺寸等于columnHeader尺寸
      if (column.columnHeader.element) {
        column.columnHeader.element.width = columnWidth;
        column.columnHeader.element.height = column.columnHeader.height;
      }
    }
    
    // 确保column的detailCell尺寸始终等于列尺寸
    if (column.detailCell) {
      column.detailCell.width = columnWidth;
      column.detailCell.height = column.detailCell.height || defaultCellHeight;
      // 确保detailCell中的元素尺寸等于detailCell尺寸
      if (column.detailCell.element) {
        column.detailCell.element.width = columnWidth;
        column.detailCell.element.height = column.detailCell.height;
      }
    }
    
    // 确保column的columnFooter尺寸始终等于列尺寸
    if (column.columnFooter) {
      column.columnFooter.width = columnWidth;
      column.columnFooter.height = column.columnFooter.height || defaultCellHeight;
      // 确保columnFooter中的元素尺寸等于columnFooter尺寸
      if (column.columnFooter.element) {
        column.columnFooter.element.width = columnWidth;
        column.columnFooter.element.height = column.columnFooter.height;
      }
    }
    
    // 确保column的tableFooter尺寸始终等于列尺寸
    if (column.tableFooter) {
      column.tableFooter.width = columnWidth;
      column.tableFooter.height = column.tableFooter.height || defaultCellHeight;
      // 确保tableFooter中的元素尺寸等于tableFooter尺寸
      if (column.tableFooter.element) {
        column.tableFooter.element.width = columnWidth;
        column.tableFooter.element.height = column.tableFooter.height;
      }
    }
  }
  
  // 开始处理
  // 首先处理列分组
  const groupChildren = element.children || [];
  groupChildren.forEach((child: any) => {
    if (child.children) {
      // 处理列分组
      processColumnGroup(child);
    }
  });
  
  // 然后处理普通列
  const normalColumns = element.columns || [];
  normalColumns.forEach((child: any) => {
    if (!child.children) {
      // 处理普通列
      processColumn(child);
    }
  });
}

// 生成表格XML
function generateTableXML(element: any): string {
  // 预处理表格元素，确保多列组合的单元格中的元素宽度不超过聚合列的总宽度
  preprocessTableElements(element);
  
  let xml = `    <componentElement>
      <reportElement x="${toInt(element.x)}" y="${toInt(element.y)}" width="${toInt(element.width)}" height="${toInt(element.height)}"`;
  
  if (element.uuid) {
    xml += ` uuid="${element.uuid}"`;
  }
  
  if (element.forecolor) {
    xml += ` forecolor="${element.forecolor}"`;
  }
  
  if (element.backcolor) {
    xml += ` backcolor="${element.backcolor}"`;
  }
  
  // 使用元素设置的模式，不再自动覆盖
  if (element.mode) {
    xml += ` mode="${element.mode}"`;
  }
  
  xml += `>
`;
  
  // 添加表格样式属性
  if (element.styles) {
    if (element.styles.tableHeader) {
      xml += `        <property name="com.jaspersoft.studio.table.style.table_header" value="${element.styles.tableHeader}"/>
`;
    }
    if (element.styles.columnHeader) {
      xml += `        <property name="com.jaspersoft.studio.table.style.column_header" value="${element.styles.columnHeader}"/>
`;
    }
    if (element.styles.detail) {
      xml += `        <property name="com.jaspersoft.studio.table.style.detail" value="${element.styles.detail}"/>
`;
    }
  }

  xml += '</reportElement>\n'
  
  // 添加表格属性 - 只包含XSD允许的属性
  let tableAttrs = '';
  if (element.whenNoDataType) {
    tableAttrs += ` whenNoDataType="${element.whenNoDataType}"`;
  }
  
  xml += `        <jr:table xmlns:jr="http://jasperreports.sourceforge.net/jasperreports/components" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports/components http://jasperreports.sourceforge.net/xsd/components.xsd"${tableAttrs}>
`;
  
  // 生成datasetRun
  const dataset = element.dataset || {};
  // 使用元素中已经存在的uuid，如果没有则生成一个新的
  const datasetUuid = dataset.uuid || crypto.randomUUID();
  xml += `          <datasetRun subDataset="${dataset.name || 'tableDataset'}" uuid="${datasetUuid}">
`;
  xml += `            <connectionExpression><![CDATA[${dataset.connectionExpression || '$P{REPORT_CONNECTION}'}]]></connectionExpression>
`;
  xml += `          </datasetRun>
`;
  
  // 生成列和列分组
  
  // 检测表格是否有任何组合列
  const hasColumnGroups = element.children && element.children.some((child: any) => child.children) || false;
  
  // 计算表格中组合列的最大嵌套层级
  function calculateMaxDepth(node: any, depth: number = 0): number {
    if (!node.children || node.children.length === 0) {
      // 叶子节点不贡献额外的表头行，返回 depth - 1
      return depth - 1;
    }
    let maxDepth = depth;
    for (const child of node.children) {
      const childDepth = calculateMaxDepth(child, depth + 1);
      if (childDepth > maxDepth) {
        maxDepth = childDepth;
      }
    }
    return maxDepth;
  }
  
  const maxDepth = calculateMaxDepth({ children: element.children || [] });
  console.log('Max Depth:', maxDepth);
  console.log('Required RowSpan:', maxDepth + 1);
  
  // 1. 收集已经处理过的列的UUID
  const processedColumnUuids = new Set<string>();
  
  // 计算需要的rowSpan值，对于未分组的列，rowSpan应该是maxDepth + 1
  const requiredRowSpan = maxDepth + 1;
  
  // 2. 处理element.children（包含列分组和直接列）
  const children = element.children || [];
  children.forEach((child: any, index: number) => {
    if (child.children) {
      // 列分组，传递processedColumnUuids集合、hasColumnGroups标志和maxDepth
      xml += generateColumnGroupXML(child, processedColumnUuids, hasColumnGroups, maxDepth);
    } else {
      // 直接列，是顶层直接列
      // 对于没有子列的顶层直接列，设置其tableHeader和columnHeader的rowSpan为requiredRowSpan
      if (child.tableHeader && !child.children) {
        child.tableHeader.rowSpan = child.tableHeader.rowSpan || requiredRowSpan;
        // 当rowSpan大于1时，调整tableHeader的height为单行高度乘以rowSpan
        if (child.tableHeader.rowSpan > 1) {
          const singleRowHeight = 30; // 默认单行高度
          child.tableHeader.height = singleRowHeight * child.tableHeader.rowSpan;
        }
      }
      if (child.columnHeader && !child.children) {
        child.columnHeader.rowSpan = child.columnHeader.rowSpan || requiredRowSpan;
        // 当rowSpan大于1时，调整columnHeader的height为单行高度乘以rowSpan
        if (child.columnHeader.rowSpan > 1) {
          const singleRowHeight = 30; // 默认单行高度
          child.columnHeader.height = singleRowHeight * child.columnHeader.rowSpan;
        }
      }
      // 传递hasColumnGroups标志和maxDepth
      xml += generateColumnXML(child, index, hasColumnGroups, maxDepth);
      processedColumnUuids.add(child.uuid);
    }
  });
  
  // 3. 处理element.columns，跳过已经在children中处理过的列
  const normalColumns = element.columns || [];
  normalColumns.forEach((child: any, index: number) => {
    if (!child.children && !processedColumnUuids.has(child.uuid)) {
      // 普通列且未被处理过，是顶层直接列
      // 对于没有子列的顶层直接列，设置其tableHeader和columnHeader的rowSpan为requiredRowSpan
      if (child.tableHeader && !child.children) {
        child.tableHeader.rowSpan = child.tableHeader.rowSpan || requiredRowSpan;
        // 当rowSpan大于1时，调整tableHeader的height为单行高度乘以rowSpan
        if (child.tableHeader.rowSpan > 1) {
          const singleRowHeight = 30; // 默认单行高度
          child.tableHeader.height = singleRowHeight * child.tableHeader.rowSpan;
        }
      }
      if (child.columnHeader && !child.children) {
        child.columnHeader.rowSpan = child.columnHeader.rowSpan || requiredRowSpan;
        // 当rowSpan大于1时，调整columnHeader的height为单行高度乘以rowSpan
        if (child.columnHeader.rowSpan > 1) {
          const singleRowHeight = 30; // 默认单行高度
          child.columnHeader.height = singleRowHeight * child.columnHeader.rowSpan;
        }
      }
      // 传递hasColumnGroups标志和maxDepth
      xml += generateColumnXML(child, index, hasColumnGroups, maxDepth);
      processedColumnUuids.add(child.uuid);
    }
  });
  
  // 生成表格的其他部分
  // 生成tableHeader
  if (element.tableHeader) {
    xml += `          <tableHeader height="${toInt(element.tableHeader.height || 30)}">
`;
    if (element.tableHeader.printWhenExpression) {
      xml += `            <printWhenExpression><![CDATA[${element.tableHeader.printWhenExpression}]]></printWhenExpression>
`;
    }
    xml += `          </tableHeader>
`;
  }
  
  // 生成columnHeader
  if (element.columnHeader) {
    xml += `          <columnHeader height="${toInt(element.columnHeader.height || 30)}">
`;
    if (element.columnHeader.printWhenExpression) {
      xml += `            <printWhenExpression><![CDATA[${element.columnHeader.printWhenExpression}]]></printWhenExpression>
`;
    }
    xml += `          </columnHeader>
`;
  }
  
  // 生成groupHeader
  if (element.groupHeaders && element.groupHeaders.length > 0) {
    element.groupHeaders.forEach((groupHeader: any) => {
      xml += `          <groupHeader groupName="${groupHeader.groupName}">
`;
      xml += `            <row height="${toInt(groupHeader.height || 30)}">
`;
      if (groupHeader.printWhenExpression) {
        xml += `              <printWhenExpression><![CDATA[${groupHeader.printWhenExpression}]]></printWhenExpression>
`;
      }
      xml += `            </row>
`;
      xml += `          </groupHeader>
`;
    });
  }
  
  // 生成detail
  if (element.detail) {
    xml += `          <detail height="${toInt(element.detail.height || 30)}">
`;
    if (element.detail.printWhenExpression) {
      xml += `            <printWhenExpression><![CDATA[${element.detail.printWhenExpression}]]></printWhenExpression>
`;
    }
    xml += `          </detail>
`;
  }
  
  // 生成groupFooter
  if (element.groupFooters && element.groupFooters.length > 0) {
    element.groupFooters.forEach((groupFooter: any) => {
      xml += `          <groupFooter groupName="${groupFooter.groupName}">
`;
      xml += `            <row height="${toInt(groupFooter.height || 30)}">
`;
      if (groupFooter.printWhenExpression) {
        xml += `              <printWhenExpression><![CDATA[${groupFooter.printWhenExpression}]]></printWhenExpression>
`;
      }
      xml += `            </row>
`;
      xml += `          </groupFooter>
`;
    });
  }
  
  // 生成columnFooter
  if (element.columnFooter) {
    xml += `          <columnFooter height="${toInt(element.columnFooter.height || 30)}">
`;
    if (element.columnFooter.printWhenExpression) {
      xml += `            <printWhenExpression><![CDATA[${element.columnFooter.printWhenExpression}]]></printWhenExpression>
`;
    }
    xml += `          </columnFooter>
`;
  }
  
  // 生成tableFooter
  if (element.tableFooter) {
    xml += `          <tableFooter height="${toInt(element.tableFooter.height || 30)}">
`;
    if (element.tableFooter.printWhenExpression) {
      xml += `            <printWhenExpression><![CDATA[${element.tableFooter.printWhenExpression}]]></printWhenExpression>
`;
    }
    xml += `          </tableFooter>
`;
  }
  
  // 生成noData
  if (element.noData) {
    xml += `          <noData height="${toInt(element.noData.height || 30)}"`;
    if (element.noData.style) {
      xml += ` style="${element.noData.style}"`;
    }
    xml += `>
`;
    if (element.noData.elements && element.noData.elements.length > 0) {
      element.noData.elements.forEach((noDataElement: any) => {
        xml += generateElementXML(noDataElement).replace(/^    /gm, '            ');
      });
    }
    xml += `          </noData>
`;
  }

  xml += `        </jr:table>
    </componentElement>
`;
  return xml;
}

// 不再需要UUID生成函数，已移除

// 解析JRXML内容为设计器数据结构
function parseJRXMLContentLegacy(jrxmlContent: string): { properties: ReportProperties; bands: Band[]; fields: Field[]; parameters: Parameter[] } {
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
    result.imageExpression = imageExpression.textContent || '';
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
    
    if (graphicEl.hasAttribute('fill')) {
      graphicElement.fill = graphicEl.getAttribute('fill');
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

export { parseJRXMLContent } from './jrxml/parse';
