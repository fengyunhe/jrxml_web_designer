import type { DesignElement, BandType, Band } from '@/types';
import type { ReportProperties, Field, Parameter, SubDataset, Variable, ReportStyle, ConditionalStyle } from './types';

export function parseJRXMLContent(jrxmlContent: string): { properties: ReportProperties; bands: Band[]; fields: Field[]; parameters: Parameter[]; datasets: SubDataset[]; variables: Variable[]; styles: ReportStyle[]; reportProperties: Array<{name: string; value: string}> } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(jrxmlContent, 'text/xml');

  // 直接使用根元素作为jasperReport元素，不严格验证tagName，因为解析器可能会添加命名空间前缀
  const jasperReportElem = xmlDoc.documentElement;
  if (!jasperReportElem) {
    throw new Error('Invalid JRXML: Missing root element');
  }

  // 解析主报表查询字符串 - 只查找直接子元素
  let query: { language: string; text: string } | undefined;
  let queryStringElem = null;
  
  // 1. 先查找直接子元素中的queryString（不带命名空间）
  for (const child of Array.from(jasperReportElem.children)) {
    if (child.tagName === 'queryString') {
      queryStringElem = child;
      break;
    }
  }
  
  // 2. 如果没找到，尝试查找带命名空间的直接子元素
  if (!queryStringElem) {
    // 尝试使用getElementsByTagNameNS查找直接子元素
    const nsChildren = jasperReportElem.getElementsByTagNameNS('http://jasperreports.sourceforge.net/jasperreports', 'queryString');
    if (nsChildren.length > 0) {
      // 确保是直接子元素
      for (let i = 0; i < nsChildren.length; i++) {
        const child = nsChildren[i];
        if (child) {
          const parent = child.parentNode;
          if (parent === jasperReportElem) {
            queryStringElem = child;
            break;
          }
        }
      }
    }
  }
  
  // 3. 如果没找到，尝试通过localName匹配直接子元素
  if (!queryStringElem) {
    queryStringElem = Array.from(jasperReportElem.children).find(child => child.localName === 'queryString') || null;
  }
  if (queryStringElem) {
    const language = queryStringElem.getAttribute('language') || 'sql';
    const text = queryStringElem.textContent?.trim() || '';
    query = { language, text };
  }

  const properties: ReportProperties = {
    name: jasperReportElem.getAttribute('name') || 'Unnamed Report',
    pageWidth: parseInt(jasperReportElem.getAttribute('pageWidth') || '595'),
    pageHeight: parseInt(jasperReportElem.getAttribute('pageHeight') || '842'),
    leftMargin: parseInt(jasperReportElem.getAttribute('leftMargin') || '20'),
    rightMargin: parseInt(jasperReportElem.getAttribute('rightMargin') || '20'),
    topMargin: parseInt(jasperReportElem.getAttribute('topMargin') || '30'),
    bottomMargin: parseInt(jasperReportElem.getAttribute('bottomMargin') || '30'),
    whenNoDataType: jasperReportElem.getAttribute('whenNoDataType') || 'AllSectionsNoDetail',
    query
  };

  const fields: Field[] = [];
  // 只获取根元素直接子元素中的field元素，不包括数据集内部的字段
  Array.from(jasperReportElem.children).forEach(child => {
    if (child.tagName === 'field' || child.localName === 'field') {
      const name = child.getAttribute('name');
      const className = child.getAttribute('class') || 'java.lang.String';
      if (name) {
        fields.push({ name, class: className });
      }
    }
  });

  const parameters: Parameter[] = [];
  // 只获取根元素直接子元素中的parameter元素，不包括数据集内部的参数
  Array.from(jasperReportElem.children).forEach(child => {
    if (child.tagName === 'parameter' || child.localName === 'parameter') {
      const name = child.getAttribute('name');
      const className = child.getAttribute('class') || 'java.lang.String';
      if (name) {
        const param: Parameter = { name, class: className };
        const defaultValueExpr = child.querySelector('defaultValueExpression');
        if (defaultValueExpr && defaultValueExpr.textContent) {
          param.defaultValue = defaultValueExpr.textContent.trim();
        }
        parameters.push(param);
      }
    }
  });

  const bands: Band[] = [];
  const bandTypes = ['background', 'title', 'pageHeader', 'columnHeader', 'detail', 'columnFooter', 'pageFooter', 'lastPageFooter', 'summary', 'noData'];

  bandTypes.forEach(type => {
    // 查找band容器元素，考虑命名空间
    let bandContainer = xmlDoc.querySelector(`${type}`);
    if (!bandContainer) {
      // 尝试使用getElementsByTagNameNS，将undefined转换为null
      bandContainer = xmlDoc.getElementsByTagNameNS('http://jasperreports.sourceforge.net/jasperreports', type)[0] || null;
    }
    if (!bandContainer) {
      // 尝试使用localName匹配所有元素，将undefined转换为null
      const allElements = xmlDoc.getElementsByTagName('*');
      bandContainer = Array.from(allElements).find(element => element.localName === type) || null;
    }
    if (!bandContainer) return;
    
    // 查找band元素，考虑命名空间
    let bandElem = bandContainer.querySelector('band');
    if (!bandElem) {
      // 尝试使用getElementsByTagNameNS，将undefined转换为null
      bandElem = bandContainer.getElementsByTagNameNS('http://jasperreports.sourceforge.net/jasperreports', 'band')[0] || null;
    }
    if (!bandElem) {
      // 尝试使用localName匹配，将undefined转换为null
      const containerChildren = Array.from(bandContainer.children);
      bandElem = containerChildren.find(child => child.localName === 'band' || child.tagName === 'band') || null;
    }
    if (!bandElem) return;

    const height = parseInt(bandElem.getAttribute('height') || '0');
    const elements = parseBandElements(bandElem);

    const band: any = {
      type: type as BandType,
      height,
      elements
    };

    if (bandElem.hasAttribute('splitType')) {
      band.splitType = bandElem.getAttribute('splitType');
    } else if (bandElem.hasAttribute('isSplitAllowed')) {
      const isSplitAllowed = bandElem.getAttribute('isSplitAllowed') === 'true';
      band.splitType = isSplitAllowed ? 'Stretch' : 'Prevent';
    }

    bands.push(band);
  });

  // 解析子数据集
  const datasets: SubDataset[] = [];
  Array.from(jasperReportElem.children).forEach(child => {
    if (child.tagName === 'subDataset' || child.localName === 'subDataset') {
      const dataset = parseSubDataset(child);
      datasets.push(dataset);
    }
  });

  // 解析报表变量
  const variables: Variable[] = [];
  Array.from(jasperReportElem.children).forEach(child => {
    if (child.tagName === 'variable' || child.localName === 'variable') {
      const name = child.getAttribute('name');
      const className = child.getAttribute('class') || 'java.lang.String';
      if (name) {
        const variable: Variable = { name, class: className };
        const calcType = child.getAttribute('calculation');
        if (calcType) variable.calculationType = calcType;
        const resetType = child.getAttribute('resetType');
        if (resetType) variable.resetType = resetType;
        const resetGroup = child.getAttribute('resetGroup');
        if (resetGroup) variable.resetGroup = resetGroup;
        const exprElem = child.querySelector('variableExpression');
        if (exprElem && exprElem.textContent) variable.expression = exprElem.textContent.trim();
        const initExprElem = child.querySelector('initialValueExpression');
        if (initExprElem && initExprElem.textContent) variable.initialValueExpression = initExprElem.textContent.trim();
        variables.push(variable);
      }
    }
  });

  // 解析报表样式
  const styles: ReportStyle[] = [];
  Array.from(jasperReportElem.children).forEach(child => {
    if (child.tagName === 'style' || child.localName === 'style') {
      const name = child.getAttribute('name');
      if (!name) return;
      const style: ReportStyle = { name };
      if (child.hasAttribute('parentStyle')) style.parentStyle = child.getAttribute('parentStyle') || undefined;
      if (child.hasAttribute('mode')) style.mode = child.getAttribute('mode') || undefined;
      if (child.hasAttribute('backcolor')) style.backcolor = child.getAttribute('backcolor') || undefined;
      if (child.hasAttribute('forecolor')) style.forecolor = child.getAttribute('forecolor') || undefined;
      const condExpr = child.querySelector('conditionExpression');
      if (condExpr && condExpr.textContent) style.conditionExpression = condExpr.textContent.trim();
      const boxElem = child.querySelector('box');
      if (boxElem) style.box = parseBoxElement(boxElem);
      const textElem = child.querySelector('textElement');
      if (textElem) {
        if (textElem.hasAttribute('textAlignment')) style.textAlignment = textElem.getAttribute('textAlignment') || undefined;
        if (textElem.hasAttribute('verticalAlignment')) style.verticalAlignment = textElem.getAttribute('verticalAlignment') || undefined;
        const fontElem = textElem.querySelector('font');
        if (fontElem) {
          if (fontElem.hasAttribute('fontName')) style.fontFamily = fontElem.getAttribute('fontName') || undefined;
          if (fontElem.hasAttribute('size')) style.fontSize = parseInt(fontElem.getAttribute('size') || '12');
          style.isBold = fontElem.getAttribute('isBold') === 'true';
          style.isItalic = fontElem.getAttribute('isItalic') === 'true';
          style.isUnderline = fontElem.getAttribute('isUnderline') === 'true';
        }
      }
      const conditionalStyleElems = child.querySelectorAll('conditionalStyle');
      if (conditionalStyleElems.length > 0) {
        style.conditionalStyles = [];
        conditionalStyleElems.forEach(csElem => {
          const cs: ConditionalStyle = { conditionExpression: '', properties: {} };
          const csCondExpr = csElem.querySelector('conditionExpression');
          if (csCondExpr && csCondExpr.textContent) cs.conditionExpression = csCondExpr.textContent.trim();
          if (csElem.hasAttribute('forecolor')) cs.properties.forecolor = csElem.getAttribute('forecolor') || undefined;
          if (csElem.hasAttribute('backcolor')) cs.properties.backcolor = csElem.getAttribute('backcolor') || undefined;
          if (csElem.hasAttribute('mode')) cs.properties.mode = csElem.getAttribute('mode') || undefined;
          const csBox = csElem.querySelector('box');
          if (csBox) cs.properties.box = parseBoxElement(csBox);
          const csTextElem = csElem.querySelector('textElement');
          if (csTextElem) {
            if (csTextElem.hasAttribute('textAlignment')) cs.properties.textAlignment = csTextElem.getAttribute('textAlignment') || undefined;
            if (csTextElem.hasAttribute('verticalAlignment')) cs.properties.verticalAlignment = csTextElem.getAttribute('verticalAlignment') || undefined;
            const csFont = csTextElem.querySelector('font');
            if (csFont) {
              if (csFont.hasAttribute('fontName')) cs.properties.fontFamily = csFont.getAttribute('fontName') || undefined;
              if (csFont.hasAttribute('size')) cs.properties.fontSize = parseInt(csFont.getAttribute('size') || '12');
              cs.properties.isBold = csFont.getAttribute('isBold') === 'true';
              cs.properties.isItalic = csFont.getAttribute('isItalic') === 'true';
              cs.properties.isUnderline = csFont.getAttribute('isUnderline') === 'true';
            }
          }
          if (!style.conditionalStyles) style.conditionalStyles = [];
          style.conditionalStyles.push(cs);
        });
      }
      styles.push(style);
    }
  });

  // 解析报表级别 <property> 元素
  const reportProperties: Array<{name: string; value: string}> = [];
  Array.from(jasperReportElem.children).forEach(child => {
    if (child.tagName === 'property' || child.localName === 'property') {
      const propName = child.getAttribute('name');
      const propValue = child.getAttribute('value');
      if (propName && propValue) {
        reportProperties.push({ name: propName, value: propValue });
      }
    }
  });

  return { properties, bands, fields, parameters, datasets, variables, styles, reportProperties };
}

// 解析子数据集元素
function parseSubDataset(subDatasetElem: Element): SubDataset {
  const name = subDatasetElem.getAttribute('name') || 'UnnamedDataset';
  
  // 解析数据集属性
  const properties: Record<string, string> = {};
  Array.from(subDatasetElem.children).forEach(child => {
    if (child.tagName === 'property' || child.localName === 'property') {
      const propertyName = child.getAttribute('name');
      const propertyValue = child.getAttribute('value');
      if (propertyName && propertyValue) {
        properties[propertyName] = propertyValue;
      }
    }
  });
  
  // 解析查询字符串 - 只查找直接子元素
  let query: { language: string; text: string } | undefined;
  let queryStringElem = null;
  
  // 1. 先查找直接子元素中的queryString（不带命名空间）
  for (const child of Array.from(subDatasetElem.children)) {
    if (child.tagName === 'queryString') {
      queryStringElem = child;
      break;
    }
  }
  
  // 2. 如果没找到，尝试查找带命名空间的直接子元素
  if (!queryStringElem) {
    // 尝试使用getElementsByTagNameNS查找直接子元素
    const nsChildren = subDatasetElem.getElementsByTagNameNS('http://jasperreports.sourceforge.net/jasperreports', 'queryString');
    if (nsChildren.length > 0) {
      // 确保是直接子元素
      for (let i = 0; i < nsChildren.length; i++) {
        const child = nsChildren[i];
        if (child) {
          const parent = child.parentNode;
          if (parent === subDatasetElem) {
            queryStringElem = child;
            break;
          }
        }
      }
    }
  }
  
  // 3. 如果没找到，尝试通过localName匹配直接子元素
  if (!queryStringElem) {
    queryStringElem = Array.from(subDatasetElem.children).find(child => child.localName === 'queryString') || null;
  }
  if (queryStringElem) {
    const language = queryStringElem.getAttribute('language') || 'sql';
    const text = queryStringElem.textContent?.trim() || '';
    query = { language, text };
  }
  
  // 解析数据集内部的字段
  const fields: Field[] = [];
  Array.from(subDatasetElem.children).forEach(child => {
    if (child.tagName === 'field' || child.localName === 'field') {
      const fieldName = child.getAttribute('name');
      const className = child.getAttribute('class') || 'java.lang.String';
      if (fieldName) {
        // 解析字段属性
        const fieldProperties: Record<string, string> = {};
        Array.from(child.children).forEach(fieldChild => {
          if (fieldChild.tagName === 'property' || fieldChild.localName === 'property') {
            const propName = fieldChild.getAttribute('name');
            const propValue = fieldChild.getAttribute('value');
            if (propName && propValue) {
              fieldProperties[propName] = propValue;
            }
          }
        });
        
        fields.push({ 
          name: fieldName, 
          class: className,
          properties: fieldProperties
        });
      }
    }
  });
  
  // 解析数据集内部的参数
  const parameters: Parameter[] = [];
  Array.from(subDatasetElem.children).forEach(child => {
    if (child.tagName === 'parameter' || child.localName === 'parameter') {
      const paramName = child.getAttribute('name');
      const className = child.getAttribute('class') || 'java.lang.String';
      if (paramName) {
        const param: Parameter = { name: paramName, class: className };
        const defaultValueExpr = child.querySelector('defaultValueExpression');
        if (defaultValueExpr && defaultValueExpr.textContent) {
          param.defaultValue = defaultValueExpr.textContent.trim();
        }
        parameters.push(param);
      }
    }
  });
  
  return { name, fields, parameters, properties, query };
}

function parseBandElements(bandElem: Element): any[] {
  const elements: any[] = [];
  const validElementTypes = ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break', 'frame'];

  // 遍历直接子元素，而不是使用 querySelectorAll（避免递归查找嵌套元素）
  // 这也保留了元素的Z-order（堆叠顺序）
  Array.from(bandElem.children).forEach(child => {
    const elementType = child.localName || child.tagName;
    
    if (validElementTypes.includes(elementType)) {
      const parsedElement = parseElement(child, elementType);
      if (parsedElement) {
        elements.push(parsedElement);
      }
    } else if (elementType === 'componentElement') {
      // 处理组件元素，特别是表格
      const parsedComponent = parseComponentElement(child);
      if (parsedComponent) {
        elements.push(parsedComponent);
      }
    }
  });

  return elements;
}

// 解析组件元素，主要用于表格
function parseComponentElement(componentElem: Element): any {
  const reportElement = componentElem.querySelector('reportElement');
  if (!reportElement) return null;

  // 查找表格元素 - 支持带命名空间和不带命名空间的table元素
  let tableElem = null;
  
  // 1. 首先查找直接子元素
  for (const child of Array.from(componentElem.children)) {
    if (child.tagName === 'jr:table' || child.localName === 'table' || child.tagName === 'table') {
      tableElem = child;
      break;
    }
  }
  
  // 2. 如果没找到，尝试使用querySelector
  if (!tableElem) {
    tableElem = componentElem.querySelector('table');
  }
  
  // 3. 如果还是没找到，尝试查找所有后代元素
  if (!tableElem) {
    const allDescendants = componentElem.getElementsByTagName('*');
    for (const descendant of Array.from(allDescendants)) {
      if (descendant.tagName === 'jr:table' || descendant.localName === 'table' || descendant.tagName === 'table') {
        tableElem = descendant;
        break;
      }
    }
  }
  
  if (!tableElem) return null;

  // 解析表格
  return parseTableElement(tableElem, reportElement);
}

// 解析表格单元格内容
function parseCellContent(cellElem: Element): any {
  // 解析单元格高度
  const height = parseInt(cellElem.getAttribute('height') || '30');
  
  // 解析单元格内的元素
  const elements: any[] = [];
  const validElementTypes = ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break', 'frame'];
  
  Array.from(cellElem.children).forEach(child => {
    const elementType = child.localName || child.tagName;
    if (validElementTypes.includes(elementType)) {
      const parsedElement = parseElement(child, elementType);
      if (parsedElement) {
        elements.push(parsedElement);
      }
    }
  });
  
  // 返回包装为 { enable, element } 格式，与生成器期望一致
  if (elements.length > 0) {
    return {
      enable: true,
      element: {
        ...elements[0],
        height
      }
    };
  }

  // 默认静态文本元素
  return {
    enable: true,
    element: {
      type: 'staticText',
      x: 0,
      y: 0,
      width: 100,
      height,
      text: '',
      textAlignment: 'Left',
      verticalAlignment: 'Middle'
    }
  };
}

// 解析表格列元素
function parseColumnElement(columnElem: Element, index: number): any {
  const columnWidth = parseInt(columnElem.getAttribute('width') || '100');
  const columnUuid = columnElem.getAttribute('uuid') || crypto.randomUUID();
  
  // 解析表头、列头和详情单元格 - 支持带命名空间和不带命名空间的单元格元素
  const tableHeaderElem = Array.from(columnElem.children).find(cell => 
    cell.localName === 'tableHeader'
  );
  const columnHeaderElem = Array.from(columnElem.children).find(cell => 
    cell.localName === 'columnHeader'
  );
  const tableFooterElem = Array.from(columnElem.children).find(cell => 
    cell.localName === 'tableFooter'
  );
  const columnFooterElem = Array.from(columnElem.children).find(cell => 
    cell.localName === 'columnFooter'
  );
  const detailCellElem = Array.from(columnElem.children).find(cell => 
    cell.localName === 'detailCell'
  );
  
  // 解析rowSpan属性
  const parseCellWithRowSpan = (cellElem: Element | undefined) => {
    if (!cellElem) return null;
    const cellContent = parseCellContent(cellElem);
    // 捕获rowSpan属性，默认值为1
    cellContent.rowSpan = parseInt(cellElem.getAttribute('rowSpan') || '1');
    return cellContent;
  };
  
  const tableHeader = tableHeaderElem ? parseCellWithRowSpan(tableHeaderElem) : null;
  const columnHeader = columnHeaderElem ? parseCellWithRowSpan(columnHeaderElem) : null;
  const tableFooter = tableFooterElem ? parseCellWithRowSpan(tableFooterElem) : null;
  const columnFooter = columnFooterElem ? parseCellWithRowSpan(columnFooterElem) : null;
  const detailCell = detailCellElem ? parseCellWithRowSpan(detailCellElem) : null;
  
  // 获取列名 - 从columnHeader中的文本元素获取
  let columnName = '';
  
  // 先尝试从columnHeader中获取列名（通过 .element 子对象访问）
  if (columnHeader) {
    const elem = columnHeader.element || columnHeader;
    if (elem.type === 'staticText') {
      columnName = elem.text || '';
    } else if (elem.type === 'textField') {
      // 去除expression值两侧的引号
      columnName = (elem.expression || '').replace(/^"|"$/g, '');
    }
  }
  
  // 如果columnHeader中没有获取到列名，则从property元素获取
  if (!columnName) {
    const columnNameProp = columnElem.querySelector('property[name="com.jaspersoft.studio.components.table.model.column.name"]');
    columnName = columnNameProp?.getAttribute('value') || '';
  }
  
  // 如果仍然没有获取到列名，则使用默认列名
  if (!columnName) {
    columnName = `Column${index + 1}`;
  }

  // 为没有内容的单元格设置默认值（使用 { enable, element } 包装格式）
  let tableHeaderWithDefaults = tableHeader;
  if (!tableHeaderWithDefaults) {
    tableHeaderWithDefaults = {
      enable: true,
      element: {
        type: 'staticText',
        x: 0,
        y: 0,
        width: columnWidth,
        height: 30,
        text: '',
        textAlignment: 'Center',
        verticalAlignment: 'Middle'
      },
      rowSpan: 1
    };
  }

  let columnHeaderWithDefaults = columnHeader;
  if (!columnHeaderWithDefaults) {
    columnHeaderWithDefaults = {
      enable: true,
      element: {
        type: 'staticText',
        x: 0,
        y: 0,
        width: columnWidth,
        height: 30,
        text: columnName,
        textAlignment: 'Center',
        verticalAlignment: 'Middle'
      },
      rowSpan: 1
    };
  }

  let tableFooterWithDefaults = tableFooter;
  if (!tableFooterWithDefaults) {
    tableFooterWithDefaults = {
      enable: true,
      element: {
        type: 'textField',
        x: 0,
        y: 0,
        width: columnWidth,
        height: 30,
        expression: '',
        textAlignment: 'Center',
        verticalAlignment: 'Middle'
      },
      rowSpan: 1
    };
  }

  let columnFooterWithDefaults = columnFooter;
  if (!columnFooterWithDefaults) {
    columnFooterWithDefaults = {
      enable: true,
      element: {
        type: 'textField',
        x: 0,
        y: 0,
        width: columnWidth,
        height: 30,
        expression: '',
        textAlignment: 'Center',
        verticalAlignment: 'Middle'
      },
      rowSpan: 1
    };
  }

  let detailCellWithDefaults = detailCell;
  if (!detailCellWithDefaults) {
    detailCellWithDefaults = {
      enable: true,
      element: {
        type: 'textField',
        x: 0,
        y: 0,
        width: columnWidth,
        height: 30,
        expression: '',
        textAlignment: 'Center',
        verticalAlignment: 'Middle'
      },
      rowSpan: 1
    };
  }

  return {
    type: 'column',
    uuid: columnUuid || crypto.randomUUID(),
    width: columnWidth,
    name: columnName,
    hasTableHeader: !!tableHeaderElem,
    hasColumnHeader: !!columnHeaderElem,
    hasTableFooter: !!tableFooterElem,
    hasColumnFooter: !!columnFooterElem,
    hasDetailCell: !!detailCellElem,
    tableHeader: tableHeaderWithDefaults,
    columnHeader: columnHeaderWithDefaults,
    tableFooter: tableFooterWithDefaults,
    columnFooter: columnFooterWithDefaults,
    detailCell: detailCellWithDefaults
  };
}

// 解析列分组元素
function parseColumnGroupElement(groupElem: Element, index: number): any {
  const groupUuid = groupElem.getAttribute('uuid') || crypto.randomUUID();
  const groupWidth = parseInt(groupElem.getAttribute('width') || '0');
  
  // 先解析columnHeader元素
  const columnHeaderElem = Array.from(groupElem.children).find(cell => 
    cell.localName === 'columnHeader'
  );
  
  // 解析rowSpan属性的辅助函数
  const parseCellWithRowSpan = (cellElem: Element | undefined) => {
    if (!cellElem) return undefined;
    const cellContent = parseCellContent(cellElem);
    // 捕获rowSpan属性，默认值为1
    cellContent.rowSpan = parseInt(cellElem.getAttribute('rowSpan') || '1');
    return cellContent;
  };
  
  // 获取列名 - 从columnHeader中的文本元素获取
  let groupName = '';
  const columnHeader = columnHeaderElem ? parseCellWithRowSpan(columnHeaderElem) : undefined;
  
  // 先尝试从columnHeader中获取列名（通过 .element 子对象访问）
  if (columnHeader) {
    const elem = columnHeader.element || columnHeader;
    if (elem.type === 'staticText') {
      groupName = elem.text || '';
    } else if (elem.type === 'textField') {
      groupName = elem.expression || '';
    }
  }
  
  // 如果columnHeader中没有获取到列名，则从property元素获取
  if (!groupName) {
    const groupNameProp = groupElem.querySelector('property[name="com.jaspersoft.studio.components.table.model.column.name"]');
    groupName = groupNameProp?.getAttribute('value') || '';
  }
  
  // 如果仍然没有获取到列名，则使用默认列名
  if (!groupName) {
    groupName = `Group${index + 1}`;
  }
  
  const group: any = {
    type: 'columnGroup',
    uuid: groupUuid,
    width: groupWidth,
    name: groupName,
    children: []
  };
  
  // 解析tableHeader
  const tableHeaderElem = Array.from(groupElem.children).find(cell => 
    cell.localName === 'tableHeader'
  );
  group.hasTableHeader = !!tableHeaderElem;
  if (tableHeaderElem) {
    group.tableHeader = parseCellWithRowSpan(tableHeaderElem);
  }
  
  // 解析tableFooter
  const tableFooterElem = Array.from(groupElem.children).find(cell => 
    cell.localName === 'tableFooter'
  );
  group.hasTableFooter = !!tableFooterElem;
  if (tableFooterElem) {
    group.tableFooter = parseCellWithRowSpan(tableFooterElem);
  }
  
  // 解析columnHeader
  group.hasColumnHeader = !!columnHeaderElem;
  if (columnHeader) {
    group.columnHeader = columnHeader;
  }
  
  // 解析columnFooter
  const columnFooterElem = Array.from(groupElem.children).find(cell => 
    cell.localName === 'columnFooter'
  );
  group.hasColumnFooter = !!columnFooterElem;
  if (columnFooterElem) {
    group.columnFooter = parseCellWithRowSpan(columnFooterElem);
  }
  
  // 解析子分组和子列
  let childIndex = 0;
  Array.from(groupElem.children).forEach(child => {
    // 检查是否为列元素
    if (child.tagName === 'jr:column' || child.localName === 'column' || child.tagName === 'column') {
      group.children.push(parseColumnElement(child, childIndex++));
    } 
    // 检查是否为列分组元素
    else if (child.tagName === 'jr:columnGroup' || child.localName === 'columnGroup' || child.tagName === 'columnGroup') {
      group.children.push(parseColumnGroupElement(child, childIndex++));
    }
  });
  
  return group;
}

// 解析表格元素
function parseTableElement(tableElem: Element, reportElement: Element): any {
  // 获取基本属性
  const x = parseInt(reportElement.getAttribute('x') || '0');
  const y = parseInt(reportElement.getAttribute('y') || '0');
  const width = parseInt(reportElement.getAttribute('width') || '555');
  const height = parseInt(reportElement.getAttribute('height') || '200');
  const uuid = reportElement.getAttribute('uuid') || crypto.randomUUID();
  
  // 解析颜色和模式属性
  const forecolor = reportElement.hasAttribute('forecolor') ? reportElement.getAttribute('forecolor') : undefined;
  const backcolor = reportElement.hasAttribute('backcolor') ? reportElement.getAttribute('backcolor') : undefined;
  const mode = reportElement.hasAttribute('mode') ? reportElement.getAttribute('mode') : undefined;

  // 解析表格样式
  const styles: any = {};
  const tableHeaderStyle = reportElement.getAttribute('com.jaspersoft.studio.table.style.table_header');
  const columnHeaderStyle = reportElement.getAttribute('com.jaspersoft.studio.table.style.column_header');
  const detailStyle = reportElement.getAttribute('com.jaspersoft.studio.table.style.detail');

  if (tableHeaderStyle) styles.tableHeader = tableHeaderStyle;
  if (columnHeaderStyle) styles.columnHeader = columnHeaderStyle;
  if (detailStyle) styles.detail = detailStyle;

  // 解析数据集
  const datasetRunElem = tableElem.querySelector('datasetRun');
  const subDataset = datasetRunElem?.getAttribute('subDataset') || 'tableDataset';

  // 解析表格属性 - 捕获所有XSD允许的属性
  const tableAttributes: any = {};
  for (let i = 0; i < tableElem.attributes.length; i++) {
    const attr = tableElem.attributes[i];
    // 确保attr不是undefined
    if (attr) {
      // 跳过命名空间和schemaLocation属性，因为它们在生成时会被硬编码
      if (attr.name.startsWith('xmlns') || attr.name === 'xsi:schemaLocation') {
        continue;
      }
      // 将属性添加到表格元素对象中
      tableAttributes[attr.name] = attr.value;
    }
  }

  // 解析表格连接表达式
  const connectionExprElem = datasetRunElem?.querySelector('connectionExpression');
  const connectionExpression = connectionExprElem?.textContent?.trim() || '$P{REPORT_CONNECTION}';

  // 解析表格列和列分组 - 支持带命名空间和不带命名空间的列元素
  const children: any[] = [];
  const columns: any[] = [];
  let childIndex = 0;
  
  Array.from(tableElem.children).forEach(child => {
    // 检查是否为列元素
    if (child.tagName === 'jr:column' || child.localName === 'column' || child.tagName === 'column') {
      const column = parseColumnElement(child, childIndex++);
      children.push(column);
      columns.push(column);
    } 
    // 检查是否为列分组元素
    else if (child.tagName === 'jr:columnGroup' || child.localName === 'columnGroup' || child.tagName === 'columnGroup') {
      const group = parseColumnGroupElement(child, childIndex++);
      children.push(group);
      // 同时收集所有普通列到columns数组，保持向后兼容
      const collectColumns = (group: any) => {
        group.children.forEach((child: any) => {
          if (child.detailCell) {
            // 普通列
            columns.push(child);
          } else {
            // 子分组
            collectColumns(child);
          }
        });
      };
      collectColumns(group);
    }
  });

  // 构建表格元素
  const tableElement: any = {
    type: 'table',
    uuid,
    x,
    y,
    width,
    height,
    styles,
    dataset: {
      uuid: datasetRunElem?.getAttribute('uuid') || crypto.randomUUID(),
      name: subDataset,
      type: 'table',
      connectionExpression
    },
    children, // 支持分组和列的混合结构
    columns, // 保持向后兼容，支持传统的columns数组
    ...tableAttributes, // 包含所有表格属性
    forecolor,
    backcolor,
    mode
  };

  return tableElement;
}

// 解析表格单元格元素
function parseCellElement(cellElem: Element): any {
  // 获取单元格内的第一个元素
  const childElement = cellElem.firstElementChild;
  if (!childElement) return undefined;

  // 解析单元格内的元素
  return parseElement(childElement, childElement.tagName);
}

// 辅助函数：查找元素的直接子元素，考虑命名空间
function findChildElement(parent: Element, localName: string): Element | null {
  return Array.from(parent.children).find(child => 
    child.localName === localName || child.tagName === localName
  ) || null;
}

function parseElement(element: Element, type: string): any {
  // 查找reportElement，考虑命名空间
  const reportElement = findChildElement(element, 'reportElement');
  if (!reportElement) return null;

  const validElementTypes: Array<'staticText' | 'textField' | 'image' | 'line' | 'rectangle' | 'ellipse' | 'break' | 'frame' | 'table'> = ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break', 'frame', 'table'];
  const elementType = validElementTypes.includes(type as any) ? (type as any) : undefined;
  if (!elementType) return null;

  const result: Partial<DesignElement> = {
    uuid: reportElement.getAttribute('uuid') || crypto.randomUUID(), // 读取 UUID，如果不存在则自动生成
    type: elementType,
    x: parseInt(reportElement.getAttribute('x') || '0'),
    y: parseInt(reportElement.getAttribute('y') || '0'),
    width: parseInt(reportElement.getAttribute('width') || '100'),
    height: parseInt(reportElement.getAttribute('height') || '30')
  };

  if (reportElement.hasAttribute('forecolor')) {
    result.forecolor = reportElement.getAttribute('forecolor') || undefined;
  }

  if (reportElement.hasAttribute('backcolor')) {
    result.backcolor = reportElement.getAttribute('backcolor') || undefined;
  }

  const mode = reportElement.getAttribute('mode');
  if (mode) {
    result.mode = mode as 'Opaque' | 'Transparent';
  }

  // 查找box元素，考虑命名空间
  const boxElement = findChildElement(element, 'box');
  if (boxElement) {
    result.box = parseBoxElement(boxElement);
    
    // 将边框属性复制到元素根级别，以便表格UI能够正确显示
    const box = result.box;
    if (box) {
      const resultAny = result as any;
      if (box.pen) {
        resultAny.borderWidth = box.pen.lineWidth;
        resultAny.borderStyle = box.pen.lineStyle;
        resultAny.borderColor = box.pen.lineColor;
      }
      
      // 处理各边边框属性
      if (box.topPen) {
        resultAny.topBorderWidth = box.topPen.lineWidth;
        resultAny.topBorderStyle = box.topPen.lineStyle;
        resultAny.topBorderColor = box.topPen.lineColor;
      }
      if (box.leftPen) {
        resultAny.leftBorderWidth = box.leftPen.lineWidth;
        resultAny.leftBorderStyle = box.leftPen.lineStyle;
        resultAny.leftBorderColor = box.leftPen.lineColor;
      }
      if (box.bottomPen) {
        resultAny.bottomBorderWidth = box.bottomPen.lineWidth;
        resultAny.bottomBorderStyle = box.bottomPen.lineStyle;
        resultAny.bottomBorderColor = box.bottomPen.lineColor;
      }
      if (box.rightPen) {
        resultAny.rightBorderWidth = box.rightPen.lineWidth;
        resultAny.rightBorderStyle = box.rightPen.lineStyle;
        resultAny.rightBorderColor = box.rightPen.lineColor;
      }
    }
  }

  // 读取 printWhenExpression 和 style 属性
  if (reportElement.hasAttribute('printWhenExpression')) {
    (result as any).printWhenExpression = reportElement.getAttribute('printWhenExpression') || undefined;
  }
  if (reportElement.hasAttribute('style')) {
    result.style = reportElement.getAttribute('style') || undefined;
  }
  if (reportElement.hasAttribute('isPrintRepeatedValues')) {
    (result as any).isPrintRepeatedValues = reportElement.getAttribute('isPrintRepeatedValues') !== 'false';
  }
  if (reportElement.hasAttribute('isRemoveLineWhenBlank')) {
    (result as any).isRemoveLineWhenBlank = reportElement.getAttribute('isRemoveLineWhenBlank') === 'true';
  }
  if (reportElement.hasAttribute('isResetPageNumber')) {
    (result as any).isResetPageNumber = reportElement.getAttribute('isResetPageNumber') === 'true';
  }
  if (reportElement.hasAttribute('isResetPageOverflow')) {
    (result as any).isResetPageOverflow = reportElement.getAttribute('isResetPageOverflow') === 'true';
  }

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
    case 'ellipse':
      parseEllipseElement(element, result);
      break;
    case 'break':
      parseBreakElement(element, result);
      break;
    case 'frame':
      parseFrameElement(element, result);
      break;
  }

  if (elementType === 'rectangle' && element.hasAttribute('radius')) {
    (result as any).radius = parseInt(element.getAttribute('radius') || '0');
  }

  return result;
}

function parseBoxElement(boxElement: Element): any {
  const box = {} as any;

  if (boxElement.hasAttribute('padding')) {
    box.padding = parseInt(boxElement.getAttribute('padding') || '0');
  }

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

  if (boxElement.hasAttribute('border')) {
    if (!box.pen) box.pen = {};
    box.pen.lineWidth = parseInt(boxElement.getAttribute('border') || '0');
  }

  if (boxElement.hasAttribute('borderColor')) {
    if (!box.pen) box.pen = {};
    box.pen.lineColor = boxElement.getAttribute('borderColor');
  }

  if (boxElement.hasAttribute('topBorder')) {
    if (!box.topPen) box.topPen = {};
    box.topPen.lineWidth = parseInt(boxElement.getAttribute('topBorder') || '0');
  }

  if (boxElement.hasAttribute('topBorderColor')) {
    if (!box.topPen) box.topPen = {};
    box.topPen.lineColor = boxElement.getAttribute('topBorderColor');
  }

  if (boxElement.hasAttribute('leftBorder')) {
    if (!box.leftPen) box.leftPen = {};
    box.leftPen.lineWidth = parseInt(boxElement.getAttribute('leftBorder') || '0');
  }

  if (boxElement.hasAttribute('leftBorderColor')) {
    if (!box.leftPen) box.leftPen = {};
    box.leftPen.lineColor = boxElement.getAttribute('leftBorderColor');
  }

  if (boxElement.hasAttribute('bottomBorder')) {
    if (!box.bottomPen) box.bottomPen = {};
    box.bottomPen.lineWidth = parseInt(boxElement.getAttribute('bottomBorder') || '0');
  }

  if (boxElement.hasAttribute('bottomBorderColor')) {
    if (!box.bottomPen) box.bottomPen = {};
    box.bottomPen.lineColor = boxElement.getAttribute('bottomBorderColor');
  }

  if (boxElement.hasAttribute('rightBorder')) {
    if (!box.rightPen) box.rightPen = {};
    box.rightPen.lineWidth = parseInt(boxElement.getAttribute('rightBorder') || '0');
  }

  if (boxElement.hasAttribute('rightBorderColor')) {
    if (!box.rightPen) box.rightPen = {};
    box.rightPen.lineColor = boxElement.getAttribute('rightBorderColor');
  }

  const topPen = findChildElement(boxElement, 'topPen');
  if (topPen) box.topPen = parsePenElement(topPen);

  const leftPen = findChildElement(boxElement, 'leftPen');
  if (leftPen) box.leftPen = parsePenElement(leftPen);

  const bottomPen = findChildElement(boxElement, 'bottomPen');
  if (bottomPen) box.bottomPen = parsePenElement(bottomPen);

  const rightPen = findChildElement(boxElement, 'rightPen');
  if (rightPen) box.rightPen = parsePenElement(rightPen);

  const pen = findChildElement(boxElement, 'pen');
  if (pen) box.pen = parsePenElement(pen);

  return box;
}

function parsePenElement(penElement: Element): any {
  const pen = {} as any;
  if (penElement.hasAttribute('lineWidth')) {
    pen.lineWidth = parseFloat(penElement.getAttribute('lineWidth') || '0');
  }
  if (penElement.hasAttribute('lineStyle')) pen.lineStyle = penElement.getAttribute('lineStyle');
  if (penElement.hasAttribute('lineColor')) pen.lineColor = penElement.getAttribute('lineColor');
  return pen;
}

function parseStaticTextElement(element: Element, result: any): void {
  const textElement = findChildElement(element, 'textElement');
  if (textElement) {
    if (textElement.hasAttribute('textAlignment')) {
      result.textAlignment = textElement.getAttribute('textAlignment');
    }

    if (textElement.hasAttribute('verticalAlignment')) {
      result.verticalAlignment = textElement.getAttribute('verticalAlignment');
    }

    if (textElement.hasAttribute('isStyledText')) {
      const isStyledText = textElement.getAttribute('isStyledText') === 'true';
      result.markup = isStyledText ? 'styled' : 'none';
    }

    if (textElement.hasAttribute('markup')) {
      result.markup = textElement.getAttribute('markup');
    }

    const fontElement = findChildElement(textElement, 'font');
    if (fontElement) {
      if (fontElement.hasAttribute('size')) result.fontSize = parseInt(fontElement.getAttribute('size') || '12');
      result.isBold = fontElement.getAttribute('isBold') === 'true';
      result.isItalic = fontElement.getAttribute('isItalic') === 'true';
      result.isUnderline = fontElement.getAttribute('isUnderline') === 'true';
      if (fontElement.hasAttribute('fontName')) result.fontFamily = fontElement.getAttribute('fontName');
    }
  }

  const textNode = findChildElement(element, 'text');
  if (textNode) {
    result.text = textNode.textContent || '';
  }

  // 解析 StaticText 特有属性
  if (element.hasAttribute('textAdjust')) {
    result.textAdjust = element.getAttribute('textAdjust');
  }
  if (element.hasAttribute('rotation')) {
    result.rotation = element.getAttribute('rotation');
  }
  if (element.hasAttribute('pattern')) {
    result.pattern = element.getAttribute('pattern');
  }
}

function parseTextFieldElement(element: Element, result: any): void {
  if (element.hasAttribute('isStretchWithOverflow')) {
    const isStretchWithOverflow = element.getAttribute('isStretchWithOverflow') === 'true';
    result.textAdjust = isStretchWithOverflow ? 'StretchHeight' : 'CutText';
  }

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

  // 解析超链接属性
  if (element.hasAttribute('hyperlinkType')) result.hyperlinkType = element.getAttribute('hyperlinkType');
  if (element.hasAttribute('bookmarkLevel')) result.bookmarkLevel = parseInt(element.getAttribute('bookmarkLevel') || '0');
  if (element.hasAttribute('isIgnorePagination')) result.isIgnorePagination = element.getAttribute('isIgnorePagination') === 'true';

  const textElement = findChildElement(element, 'textElement');
  if (textElement) {
    if (textElement.hasAttribute('textAlignment')) {
      result.textAlignment = textElement.getAttribute('textAlignment');
    }

    if (textElement.hasAttribute('verticalAlignment')) {
      result.verticalAlignment = textElement.getAttribute('verticalAlignment');
    }

    const fontElement = findChildElement(textElement, 'font');
    if (fontElement) {
      if (fontElement.hasAttribute('size')) result.fontSize = parseInt(fontElement.getAttribute('size') || '12');
      result.isBold = fontElement.getAttribute('isBold') === 'true';
      result.isItalic = fontElement.getAttribute('isItalic') === 'true';
      result.isUnderline = fontElement.getAttribute('isUnderline') === 'true';
      if (fontElement.hasAttribute('fontName')) result.fontFamily = fontElement.getAttribute('fontName');
    }
  }

  const expressionElem = findChildElement(element, 'textFieldExpression');
  if (expressionElem) {
    result.expression = expressionElem.textContent || '';
    const fieldMatch = result.expression.match(/\$F\{([^}]+)\}/);
    if (fieldMatch) {
      result.fieldName = fieldMatch[1];
    }
  }

  // 解析超链接表达式
  const hyperlinkRefExpr = findChildElement(element, 'hyperlinkReferenceExpression');
  if (hyperlinkRefExpr) {
    result.hyperlinkReferenceExpression = hyperlinkRefExpr.textContent || '';
  }
  const hyperlinkAnchorExpr = findChildElement(element, 'hyperlinkAnchorExpression');
  if (hyperlinkAnchorExpr) {
    result.hyperlinkAnchorExpression = hyperlinkAnchorExpr.textContent || '';
  }
  const hyperlinkPageExpr = findChildElement(element, 'hyperlinkPageExpression');
  if (hyperlinkPageExpr) {
    result.hyperlinkPageExpression = hyperlinkPageExpr.textContent || '';
  }
}

function parseImageElement(element: Element, result: any): void {
  if (element.hasAttribute('scaleImage')) result.scaleImage = element.getAttribute('scaleImage');
  if (element.hasAttribute('hAlign')) result.hAlign = element.getAttribute('hAlign');
  if (element.hasAttribute('vAlign')) result.vAlign = element.getAttribute('vAlign');
  if (element.hasAttribute('isUsingCache')) result.isUsingCache = element.getAttribute('isUsingCache') === 'true';
  if (element.hasAttribute('isLazy')) result.isLazy = element.getAttribute('isLazy') === 'true';
  if (element.hasAttribute('onErrorType')) result.onErrorType = element.getAttribute('onErrorType');
  if (element.hasAttribute('evaluationTime')) result.evaluationTime = element.getAttribute('evaluationTime');
  if (element.hasAttribute('hyperlinkType')) result.hyperlinkType = element.getAttribute('hyperlinkType');

  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }

  const imageExpression = element.querySelector('imageExpression');
  if (imageExpression) {
    result.imageExpression = imageExpression.textContent || '';
  }

  // 解析超链接表达式
  const hyperlinkRefExpr = findChildElement(element, 'hyperlinkReferenceExpression');
  if (hyperlinkRefExpr) {
    result.hyperlinkReferenceExpression = hyperlinkRefExpr.textContent || '';
  }
  const hyperlinkAnchorExpr = findChildElement(element, 'hyperlinkAnchorExpression');
  if (hyperlinkAnchorExpr) {
    result.hyperlinkAnchorExpression = hyperlinkAnchorExpr.textContent || '';
  }
  const hyperlinkPageExpr = findChildElement(element, 'hyperlinkPageExpression');
  if (hyperlinkPageExpr) {
    result.hyperlinkPageExpression = hyperlinkPageExpr.textContent || '';
  }
}

function parseLineElement(element: Element, result: any): void {
  if (element.hasAttribute('direction')) {
    result.lineDirection = element.getAttribute('direction');
  }
  if (element.hasAttribute('evaluationTime')) {
    result.evaluationTime = element.getAttribute('evaluationTime');
  }
  // 解析线条标签上的直接笔属性
  if (element.hasAttribute('lineWidth')) {
    result.lineWidth = parseFloat(element.getAttribute('lineWidth') || '0');
  }
  if (element.hasAttribute('lineColor')) {
    result.lineColor = element.getAttribute('lineColor');
  }
  if (element.hasAttribute('lineStyle')) {
    result.lineStyle = element.getAttribute('lineStyle');
  }

  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }
}

function parseGraphicElement(element: Element): any {
  const graphicElement: any = {};

  const graphicEl = element.querySelector('graphicElement');
  if (graphicEl) {
    if (graphicEl.hasAttribute('stretchType')) {
      graphicElement.stretchType = graphicEl.getAttribute('stretchType');
    }

    if (graphicEl.hasAttribute('fill')) {
      graphicElement.fill = graphicEl.getAttribute('fill');
    }
    
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

function parseRectangleElement(element: Element, result: any): void {
  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }
}

function parseEllipseElement(element: Element, result: any): void {
  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }
}

function parseBreakElement(element: Element, result: any): void {
  if (element.hasAttribute('type')) {
    result.breakType = element.getAttribute('type');
  } else {
    result.breakType = 'Page';
  }
  // BreakElement 特有的 reportElement 属性由 parseElement 中的公共代码处理
}

function parseFrameElement(element: Element, result: any): void {
  // 解析frame标签上的属性
  if (element.hasAttribute('isIgnorePagination')) {
    result.isIgnorePagination = element.getAttribute('isIgnorePagination') === 'true';
  }
  if (element.hasAttribute('splitType')) {
    result.splitType = element.getAttribute('splitType');
  } else if (element.hasAttribute('isSplitAllowed')) {
    const isSplitAllowed = element.getAttribute('isSplitAllowed') === 'true';
    result.splitType = isSplitAllowed ? 'Stretch' : 'Prevent';
  }
  if (element.hasAttribute('evaluationTime')) {
    result.evaluationTime = element.getAttribute('evaluationTime');
  }
  if (element.hasAttribute('printWhenGroupChanges')) {
    result.printWhenGroupChanges = element.getAttribute('printWhenGroupChanges');
  }

  // 递归解析容器内的子元素
  const elements: any[] = [];
  const validElementTypes = ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break', 'frame'];

  // 遍历直接子元素
  Array.from(element.children).forEach(child => {
    const childType = child.localName || child.tagName;
    if (validElementTypes.includes(childType)) {
      const parsedElement = parseElement(child, childType);
      if (parsedElement) {
        elements.push(parsedElement);
      }
    }
  });

  if (elements.length > 0) {
    result.elements = elements;
  }

  // 解析property中的layout信息
  const properties = element.querySelectorAll('property');
  properties.forEach(prop => {
    const name = prop.getAttribute('name');
    const value = prop.getAttribute('value');
    if (name === 'com.jaspersoft.studio.layout' && value) {
      if (value.includes('HorizontalLayout')) {
        result.layout = 'HorizontalLayout';
      } else if (value.includes('VerticalLayout')) {
        result.layout = 'VerticalLayout';
      } else if (value.includes('FreeLayout')) {
        result.layout = 'FreeLayout';
      }
    }
  });
}

if (typeof window === 'undefined' && typeof DOMParser === 'undefined') {
  console.warn('DOMParser is not available. In Node.js environment, please use a library like xmldom.');
}

