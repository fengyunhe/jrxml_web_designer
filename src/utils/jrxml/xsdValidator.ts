export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  code?: string;
  severity?: 'warning' | 'error' | 'fatal';
  elementName?: string;
  attributeName?: string;
}

let xsdContent: string | null = null;

export async function loadXsdSchema(): Promise<string> {
  if (xsdContent) {
    return xsdContent;
  }

  try {
    const response = await fetch('/jasperreport.xsd');
    if (!response.ok) {
      throw new Error(`无法加载XSD文件: ${response.status}`);
    }
    xsdContent = await response.text();
    return xsdContent;
  } catch (error) {
    console.error('加载XSD Schema失败:', error);
    throw error;
  }
}

function removeSchemaLocationAttribute(xmlContent: string): string {
  return xmlContent.replace(/\s*xsi:schemaLocation="[^"]*"/g, '');
}

function getLineNumber(xmlText: string, position: number): number {
  const textBeforePosition = xmlText.substring(0, position);
  const lines = textBeforePosition.split('\n');
  return lines.length + 1;
}

function getColumnNumber(xmlText: string, position: number): number {
  const textBeforePosition = xmlText.substring(0, position);
  const lastNewlineIndex = textBeforePosition.lastIndexOf('\n');
  if (lastNewlineIndex === -1) {
    return position + 1;
  }
  return position - lastNewlineIndex;
}

function findElementPositionInXml(xmlText: string, elementName: string, depth: number): { line: number; column: number } {
  const searchPattern = `<${elementName}`;
  let currentIndex = 0;
  let occurrenceCount = 0;
  
  while (currentIndex < xmlText.length) {
    const foundIndex = xmlText.indexOf(searchPattern, currentIndex);
    if (foundIndex === -1) break;
    
    occurrenceCount++;
    if (occurrenceCount === depth + 1) {
      return {
        line: getLineNumber(xmlText, foundIndex),
        column: getColumnNumber(xmlText, foundIndex)
      };
    }
    
    currentIndex = foundIndex + searchPattern.length;
  }
  
  return { line: 0, column: 0 };
}

function parseXmlLocal(xmlText: string): { document: Document | null; error: string | null } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { document: null, error: parserError.textContent || 'XML解析错误' };
    }
    return { document: doc, error: null };
  } catch (error) {
    return { document: null, error: String(error) };
  }
}

function collectAllowedAttributesFromXsd(xsdText: string, elementName: string): Set<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xsdText, 'application/xml');
  
  const attributes = new Set<string>();
  
  const elements = doc.querySelectorAll(`element[name="${elementName}"]`);
  elements.forEach(el => {
    const complexType = el.querySelector('complexType');
    if (complexType) {
      const attrElements = complexType.querySelectorAll('attribute');
      attrElements.forEach(attr => {
        const name = attr.getAttribute('name');
        if (name) {
          attributes.add(name);
        }
      });
    }
  });
  
  return attributes;
}

interface ElementDepthInfo {
  name: string;
  depth: number;
  occurrence: number;
}

function buildElementOccurrenceMap(xmlNode: Element, occurrenceMap: Map<string, number> = new Map()): Map<string, number> {
  const nodeName = xmlNode.localName || xmlNode.nodeName;
  const currentOccurrence = occurrenceMap.get(nodeName) || 0;
  occurrenceMap.set(nodeName, currentOccurrence + 1);
  
  for (const child of Array.from(xmlNode.children)) {
    buildElementOccurrenceMap(child, occurrenceMap);
  }
  
  return occurrenceMap;
}

function validateElementRecursive(
  xmlNode: Element,
  xsdText: string,
  xmlText: string,
  errors: ValidationError[],
  elementOccurrences: Map<string, number>,
  currentOccurrence: Map<string, number> = new Map(),
  depth: number = 0
): void {
  if (depth > 20) return;
  
  const nodeName = xmlNode.localName || xmlNode.nodeName;
  const nodeNs = xmlNode.namespaceURI;
  
  const thisElementOccurrence = currentOccurrence.get(nodeName) || 0;
  currentOccurrence.set(nodeName, thisElementOccurrence + 1);
  
  const allowedAttributes = collectAllowedAttributesFromXsd(xsdText, nodeName);
  
  if (allowedAttributes.size > 0) {
    for (const attr of Array.from(xmlNode.attributes)) {
      if (attr.name === 'xmlns' || attr.name.startsWith('xmlns:')) {
        continue;
      }
      
      const attrLocalName = attr.localName || attr.name.split(':')[1] || attr.name;
      
      if (!allowedAttributes.has(attrLocalName)) {
        const position = findElementPositionInXml(xmlText, nodeName, thisElementOccurrence);
        errors.push({
          line: position.line,
          column: position.column,
          message: `元素 '${nodeName}' 包含未知属性 '${attrLocalName}'`,
          severity: 'error',
          code: 'XML_UNEXPECTED_ATTRIBUTE',
          elementName: nodeName,
          attributeName: attrLocalName
        });
      }
    }
  }
  
  for (const child of Array.from(xmlNode.children)) {
    validateElementRecursive(child, xsdText, xmlText, errors, elementOccurrences, currentOccurrence, depth + 1);
  }
}

export async function validateJRXML(xmlContent: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  try {
    const xsdText = await loadXsdSchema();
    
    const xmlForValidation = removeSchemaLocationAttribute(xmlContent);
    
    const parseResult = parseXmlLocal(xmlForValidation);
    if (parseResult.error || !parseResult.document) {
      return {
        valid: false,
        errors: [{
          line: 0,
          column: 0,
          message: `XML解析错误: ${parseResult.error}`,
          severity: 'fatal',
          code: 'XML_PARSE_ERROR'
        }]
      };
    }
    
    const root = parseResult.document.documentElement;
    
    const elementOccurrences = buildElementOccurrenceMap(root);
    
    validateElementRecursive(root, xsdText, xmlForValidation, errors, elementOccurrences);
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('XSD验证失败:', error);
    return {
      valid: false,
      errors: [{
        line: 0,
        column: 0,
        message: `验证过程发生错误: ${String(error)}`,
        severity: 'fatal',
        code: 'VALIDATION_ERROR'
      }]
    };
  }
}

export function clearXsdCache(): void {
  xsdContent = null;
}