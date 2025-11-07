/**
 * JRXML过时标签和属性映射表
 * 用于将过时的标签和属性转换为当前推荐的标签和属性
 */

// 过时属性到新属性的映射
export const DEPRECATED_ATTRIBUTES_MAP: Record<string, string> = {
  // textElement属性
  'isStyledText': 'markup', // isStyledText="true" -> markup="styled"
  
  // textField属性
  'isStretchWithOverflow': 'textAdjust', // isStretchWithOverflow="true" -> textAdjust="StretchHeight"
  
  // band属性
  'isSplitAllowed': 'splitType', // isSplitAllowed="true" -> splitType="Stretch"
  
  // reportElement属性
  'mode': 'mode', // 这个属性没有过时，但需要确保使用正确的值
};

// 过时属性到新值的映射（需要特殊处理的值）
export const DEPRECATED_ATTRIBUTE_VALUES_MAP: Record<string, Record<string, any>> = {
  // isStyledText -> markup
  'isStyledText': {
    'true': 'styled',
    'false': 'none'
  },
  
  // isStretchWithOverflow -> textAdjust
  'isStretchWithOverflow': {
    'true': 'StretchHeight',
    'false': 'CutText'
  },
  
  // isSplitAllowed -> splitType
  'isSplitAllowed': {
    'true': 'Stretch',
    'false': 'Prevent'
  }
};

// 过时标签到新标签的映射
export const DEPRECATED_ELEMENTS_MAP: Record<string, string> = {
  // 边框相关标签
  'border': 'pen',
  'topBorder': 'topPen',
  'leftBorder': 'leftPen',
  'bottomBorder': 'bottomPen',
  'rightBorder': 'rightPen'
};

// box元素中过时的属性
export const BOX_DEPRECATED_ATTRIBUTES: string[] = [
  'border', 'borderColor',
  'topBorder', 'topBorderColor',
  'leftBorder', 'leftBorderColor',
  'bottomBorder', 'bottomBorderColor',
  'rightBorder', 'rightBorderColor',
  'padding', 'topPadding', 'leftPadding', 'bottomPadding', 'rightPadding'
];

// graphicElement元素中过时的属性
export const GRAPHIC_ELEMENT_DEPRECATED_ATTRIBUTES: string[] = [
  'pen', // 应该使用pen子元素
  'stretchType' // 应该使用reportElement中的stretchType
];

/**
 * 检查属性是否过时
 * @param attributeName 属性名
 * @returns 如果属性过时返回true，否则返回false
 */
export function isAttributeDeprecated(attributeName: string): boolean {
  return attributeName in DEPRECATED_ATTRIBUTES_MAP;
}

/**
 * 检查元素是否过时
 * @param elementName 元素名
 * @returns 如果元素过时返回true，否则返回false
 */
export function isElementDeprecated(elementName: string): boolean {
  return elementName in DEPRECATED_ELEMENTS_MAP;
}

/**
 * 获取过时属性的新属性名
 * @param attributeName 过时的属性名
 * @returns 新属性名，如果属性不过时则返回原属性名
 */
export function getNewAttributeName(attributeName: string): string {
  return DEPRECATED_ATTRIBUTES_MAP[attributeName] || attributeName;
}

/**
 * 获取过时元素的新元素名
 * @param elementName 过时的元素名
 * @returns 新元素名，如果元素不过时则返回原元素名
 */
export function getNewElementName(elementName: string): string {
  return DEPRECATED_ELEMENTS_MAP[elementName] || elementName;
}

/**
 * 转换过时属性的值
 * @param attributeName 属性名
 * @param attributeValue 属性值
 * @returns 转换后的属性值
 */
export function convertAttributeValue(attributeName: string, attributeValue: string): string {
  if (attributeName in DEPRECATED_ATTRIBUTE_VALUES_MAP) {
    const valueMap = DEPRECATED_ATTRIBUTE_VALUES_MAP[attributeName];
    if (valueMap && attributeValue in valueMap) {
      return valueMap[attributeValue];
    }
  }
  return attributeValue;
}

/**
 * 检查box元素中的属性是否过时
 * @param attributeName 属性名
 * @returns 如果属性过时返回true，否则返回false
 */
export function isBoxAttributeDeprecated(attributeName: string): boolean {
  return BOX_DEPRECATED_ATTRIBUTES.includes(attributeName);
}

/**
 * 检查graphicElement元素中的属性是否过时
 * @param attributeName 属性名
 * @returns 如果属性过时返回true，否则返回false
 */
export function isGraphicElementAttributeDeprecated(attributeName: string): boolean {
  return GRAPHIC_ELEMENT_DEPRECATED_ATTRIBUTES.includes(attributeName);
}