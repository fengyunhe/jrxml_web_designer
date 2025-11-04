import type { ReportProperties, Band, DesignElement } from '../types';

/**
 * 验证元素是否超出页面边界
 * @param element 要验证的元素
 * @param band 元素所在的Band
 * @param bandIndex Band的索引
 * @param bands 所有Band的数组
 * @param reportProperties 报表属性
 * @returns 验证结果，包含是否超出边界和超出类型
 */
export function validateElementBounds(
  element: DesignElement,
  band: Band,
  bandIndex: number,
  bands: Band[],
  reportProperties: ReportProperties
): {
  isOutOfBounds: boolean;
  exceedsRight: boolean;
  exceedsBottom: boolean;
  exceedsBand: boolean;
  bandOffsetY: number;
} {
  // 计算Band的Y轴偏移量
  let bandOffsetY = 0;
  for (let i = 0; i < bandIndex; i++) {
    const band = bands[i];
    if (band) {
      bandOffsetY += band.height;
    }
  }
  
  // 计算可用区域（考虑边距）
  const availableWidth = reportProperties.pageWidth - reportProperties.leftMargin - reportProperties.rightMargin;
  const availableHeight = reportProperties.pageHeight - reportProperties.topMargin - reportProperties.bottomMargin;
  
  // 计算元素的实际位置和尺寸
  const elementRight = element.x + element.width;
  const elementBottom = element.y + element.height;
  
  // 检查是否超出页面右侧
  const exceedsRight = elementRight > availableWidth;
  
  // 检查是否超出页面底部
  const totalBandHeight = bandOffsetY + band.height;
  const exceedsBottom = totalBandHeight > availableHeight;
  
  // 检查是否超出当前Band
  const exceedsBand = elementBottom > band.height;
  
  return {
    isOutOfBounds: exceedsRight || exceedsBottom || exceedsBand,
    exceedsRight,
    exceedsBottom,
    exceedsBand,
    bandOffsetY
  };
}

/**
 * 获取所有超出边界的元素
 * @param bands 所有Band的数组
 * @param reportProperties 报表属性
 * @returns 超出边界的元素列表，包含元素信息和超出类型
 */
export function getOutOfBoundsElements(
  bands: Band[],
  reportProperties: ReportProperties
): Array<{
  bandIndex: number;
  elementIndex: number;
  element: DesignElement;
  exceedsRight: boolean;
  exceedsBottom: boolean;
  exceedsBand: boolean;
}> {
  const outOfBoundsElements: Array<{
    bandIndex: number;
    elementIndex: number;
    element: DesignElement;
    exceedsRight: boolean;
    exceedsBottom: boolean;
    exceedsBand: boolean;
  }> = [];
  
  bands.forEach((band, bandIndex) => {
    band.elements.forEach((element, elementIndex) => {
      const validation = validateElementBounds(element, band, bandIndex, bands, reportProperties);
      
      if (validation.isOutOfBounds) {
        outOfBoundsElements.push({
          bandIndex,
          elementIndex,
          element,
          exceedsRight: validation.exceedsRight,
          exceedsBottom: validation.exceedsBottom,
          exceedsBand: validation.exceedsBand
        });
      }
    });
  });
  
  return outOfBoundsElements;
}

/**
 * 检查报表设计是否有效（所有元素都在边界内）
 * @param bands 所有Band的数组
 * @param reportProperties 报表属性
 * @returns 报表设计是否有效
 */
export function isReportDesignValid(
  bands: Band[],
  reportProperties: ReportProperties
): boolean {
  const outOfBoundsElements = getOutOfBoundsElements(bands, reportProperties);
  return outOfBoundsElements.length === 0;
}

/**
 * 获取报表设计的验证错误信息
 * @param bands 所有Band的数组
 * @param reportProperties 报表属性
 * @returns 验证错误信息数组
 */
export function getReportDesignValidationErrors(
  bands: Band[],
  reportProperties: ReportProperties
): string[] {
  const errors: string[] = [];
  const outOfBoundsElements = getOutOfBoundsElements(bands, reportProperties);
  
  // 计算所有Band的总高度
  const totalBandsHeight = bands.reduce((total, band) => total + band.height, 0);
  const availableHeight = reportProperties.pageHeight - reportProperties.topMargin - reportProperties.bottomMargin;
  
  // 检查Band总高度是否超出页面
  if (totalBandsHeight > availableHeight) {
    errors.push(`报表设计无效：详细区域、页面和列的页眉页脚及边距不适合页面高度。`);
  }
  
  // 检查每个超出边界的元素
  outOfBoundsElements.forEach(({ bandIndex, elementIndex, exceedsRight, exceedsBottom, exceedsBand }) => {
    if (bands[bandIndex]) {
      const bandName = bands[bandIndex].type;
      const elementInfo = `${bandName}区域中的元素${elementIndex + 1}`;
      
      if (exceedsRight) {
        errors.push(`${elementInfo}超出页面右边界`);
      }
      
      if (exceedsBottom) {
        errors.push(`${elementInfo}超出页面底部边界`);
      }
      
      if (exceedsBand) {
        errors.push(`${elementInfo}超出${bandName}区域边界`);
      }
    }
  });
  
  return errors;
}