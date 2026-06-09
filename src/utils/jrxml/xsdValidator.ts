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
    const response = await fetch('./jasperreport.xsd');
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

function collectAllowedAttributesFromXsd(xsdText: string, elementName: string): Map<string, AllowedAttributeInfo> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xsdText, 'application/xml');

  const attributes = new Map<string, AllowedAttributeInfo>();

  const elements = doc.querySelectorAll(`element[name="${elementName}"]`);
  elements.forEach(el => {
    const complexType = el.querySelector('complexType');
    if (complexType) {
      const attrElements = complexType.querySelectorAll('attribute');
      attrElements.forEach(attr => {
        const name = attr.getAttribute('name');
        if (name) {
          const use = attr.getAttribute('use');
          attributes.set(name, {
            required: use === 'required'
          });
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
  const knownValidAttrs = KNOWN_VALID_ATTRIBUTES[nodeName] || [];

  if (allowedAttributes.size > 0) {
    for (const attr of Array.from(xmlNode.attributes)) {
      if (attr.name === 'xmlns' || attr.name.startsWith('xmlns:')) {
        continue;
      }

      const attrLocalName = attr.localName || attr.name.split(':')[1] || attr.name;

      // 如果属性不在允许列表中，也不在已知有效属性白名单中，则报告错误
      if (!allowedAttributes.has(attrLocalName) && !knownValidAttrs.includes(attrLocalName)) {
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

/**
 * 允许的属性信息
 */
export interface AllowedAttributeInfo {
  required: boolean;
}

/**
 * 已知有效的属性白名单
 * 这些属性虽然在 XSD 规范中未声明，但在实际使用中是有效的
 */
const KNOWN_VALID_ATTRIBUTES: Record<string, string[]> = {
  'columnGroup': ['width'],
  'column': ['width'],
};

/**
 * 从 XSD 中收集指定元素允许的属性集合（包含是否必需的信息）
 */
export async function getAllowedAttributesFromXsd(elementName: string): Promise<Map<string, AllowedAttributeInfo>> {
  const xsdText = await loadXsdSchema();
  return collectAllowedAttributesFromXsd(xsdText, elementName);
}

/**
 * 自动修复结果
 */
export interface AutoFixResult {
  fixed: boolean;
  fixedContent: string;
  fixes: Array<{
    elementName: string;
    attributeName: string;
    lineNumber: number;
  }>;
  warnings: Array<{
    elementName: string;
    attributeName: string;
    message: string;
  }>;
}

/**
 * 自动修复 JRXML，删除不符合 XSD 规范的属性
 */
export async function autoFixJRXML(xmlContent: string): Promise<AutoFixResult> {
  const fixes: AutoFixResult['fixes'] = [];
  const warnings: AutoFixResult['warnings'] = [];

  try {
    const xsdText = await loadXsdSchema();
    const xmlForValidation = removeSchemaLocationAttribute(xmlContent);

    const parseResult = parseXmlLocal(xmlForValidation);
    if (parseResult.error || !parseResult.document) {
      return {
        fixed: false,
        fixedContent: xmlContent,
        fixes: [],
        warnings: []
      };
    }

    const doc = parseResult.document;
    const root = doc.documentElement;

    // 递归遍历并删除不合法的属性
    const removeInvalidAttributes = (xmlNode: Element, depth: number = 0): void => {
      if (depth > 20) return;

      const nodeName = xmlNode.localName || xmlNode.nodeName;
      const allowedAttributes = collectAllowedAttributesFromXsd(xsdText, nodeName);

      if (allowedAttributes.size > 0) {
        const attributesToRemove: string[] = [];
        const knownValidAttrs = KNOWN_VALID_ATTRIBUTES[nodeName] || [];

        for (const attr of Array.from(xmlNode.attributes)) {
          if (attr.name === 'xmlns' || attr.name.startsWith('xmlns:')) {
            continue;
          }

          const attrLocalName = attr.localName || attr.name.split(':')[1] || attr.name;

          const attrInfo = allowedAttributes.get(attrLocalName);
          const isKnownValid = knownValidAttrs.includes(attrLocalName);

          // 如果属性不在允许列表中，且不在已知有效属性白名单中
          if (!attrInfo && !isKnownValid) {
            const lineNumber = getLineNumber(xmlForValidation, xmlForValidation.indexOf(` ${attrLocalName}="`) !== -1
              ? xmlForValidation.indexOf(` ${attrLocalName}="`)
              : xmlForValidation.indexOf(`\n${attrLocalName}="`));

            // 对于某些已知的必须属性，添加警告而不是删除
            const knownRequiredAttrs = ['width', 'height', 'x', 'y'];
            if (knownRequiredAttrs.includes(attrLocalName)) {
              warnings.push({
                elementName: nodeName,
                attributeName: attrLocalName,
                message: `属性 '${attrLocalName}' 不在XSD规范中，但可能是必需的。请手动检查。`
              });
            } else {
              attributesToRemove.push(attr.name);
              fixes.push({
                elementName: nodeName,
                attributeName: attrLocalName,
                lineNumber
              });
            }
          }
        }

        // 删除不合法的属性
        for (const attrName of attributesToRemove) {
          xmlNode.removeAttribute(attrName);
        }
      }

      // 递归处理子元素
      for (const child of Array.from(xmlNode.children)) {
        removeInvalidAttributes(child, depth + 1);
      }
    };

    removeInvalidAttributes(root);

    // 序列化修复后的 XML
    const serializer = new XMLSerializer();
    let fixedContent = serializer.serializeToString(doc);

    // 添加 XML 声明（如果缺失）
    if (!fixedContent.startsWith('<?xml')) {
      fixedContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + fixedContent;
    }

    return {
      fixed: fixes.length > 0,
      fixedContent,
      fixes,
      warnings
    };
  } catch (error) {
    console.error('自动修复失败:', error);
    return {
      fixed: false,
      fixedContent: xmlContent,
      fixes: [],
      warnings: []
    };
  }
}