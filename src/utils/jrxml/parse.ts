import type { DesignElement, BandType, Band } from '@/types';
import type { ReportProperties, Field, Parameter } from './types';

export function parseJRXMLContent(jrxmlContent: string): { properties: ReportProperties; bands: Band[]; fields: Field[]; parameters: Parameter[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(jrxmlContent, 'text/xml');

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

  const fields: Field[] = [];
  xmlDoc.querySelectorAll('field').forEach(fieldElem => {
    const name = fieldElem.getAttribute('name');
    const className = fieldElem.getAttribute('class') || 'java.lang.String';
    if (name) {
      fields.push({ name, class: className });
    }
  });

  const parameters: Parameter[] = [];
  xmlDoc.querySelectorAll('parameter').forEach(paramElem => {
    const name = paramElem.getAttribute('name');
    const className = paramElem.getAttribute('class') || 'java.lang.String';
    if (name) {
      const param: Parameter = { name, class: className };
      const defaultValueExpr = paramElem.querySelector('defaultValueExpression');
      if (defaultValueExpr && defaultValueExpr.textContent) {
        param.defaultValue = defaultValueExpr.textContent.trim();
      }
      parameters.push(param);
    }
  });

  const bands: Band[] = [];
  const bandTypes = ['background', 'title', 'pageHeader', 'columnHeader', 'detail', 'columnFooter', 'pageFooter', 'lastPageFooter', 'summary', 'noData'];

  bandTypes.forEach(type => {
    const bandContainer = xmlDoc.querySelector(`${type}`);
    if (!bandContainer) return;
    const bandElem = bandContainer.querySelector('band');
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

  return { properties, bands, fields, parameters };
}

function parseBandElements(bandElem: Element): any[] {
  const elements: any[] = [];
  const elementTypes = ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break'];

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

function parseElement(element: Element, type: string): any {
  const reportElement = element.querySelector('reportElement');
  if (!reportElement) return null;

  const validElementTypes: Array<'staticText' | 'textField' | 'image' | 'line' | 'rectangle' | 'ellipse' | 'break'> = ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break'];
  const elementType = validElementTypes.includes(type as any) ? (type as any) : undefined;
  if (!elementType) return null;

  const result: Partial<DesignElement> = {
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

  const boxElement = element.querySelector('box');
  if (boxElement) {
    result.box = parseBoxElement(boxElement);
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
  const textElement = element.querySelector('textElement');
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

  const expressionElem = element.querySelector('textFieldExpression');
  if (expressionElem) {
    result.expression = expressionElem.textContent || '';
    const fieldMatch = result.expression.match(/\\$F\\{([^}]+)\\}/);
    if (fieldMatch) {
      result.fieldName = fieldMatch[1];
    }
  }
}

function parseImageElement(element: Element, result: any): void {
  if (element.hasAttribute('scaleImage')) result.scaleImage = element.getAttribute('scaleImage');
  if (element.hasAttribute('hAlign')) result.hAlign = element.getAttribute('hAlign');
  if (element.hasAttribute('vAlign')) result.vAlign = element.getAttribute('vAlign');

  const graphicElement = parseGraphicElement(element);
  if (Object.keys(graphicElement).length > 0) {
    Object.assign(result, graphicElement);
  }

  const imageExpression = element.querySelector('imageExpression');
  if (imageExpression) {
    result.imageExpression = imageExpression.textContent || '';
  }
}

function parseLineElement(element: Element, result: any): void {
  if (element.hasAttribute('direction')) {
    result.lineDirection = element.getAttribute('direction');
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
}

if (typeof window === 'undefined' && typeof DOMParser === 'undefined') {
  console.warn('DOMParser is not available. In Node.js environment, please use a library like xmldom.');
}

