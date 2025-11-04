import type { ReportProperties, Band, DesignElement } from '../types';
import { BAND_CONSTANTS } from '@/constants/constants';

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
  exceedsLeft: boolean;
  exceedsRight: boolean;
  exceedsBottom: boolean;
  exceedsTop: boolean;
  exceedsBandTop: boolean;
  exceedsBandBottom: boolean;
  exceedsBand: boolean;
  bandOffsetY: number;
} {
  // 计算当前band在页面中的Y位置（考虑前面所有band的高度和间距）
  let bandOffsetY = reportProperties.topMargin; // 从页面顶部边距开始
  
  // 累加前面所有band的高度和间距
  for (let i = 0; i < bandIndex; i++) {
    const currentBand = bands[i];
    if (currentBand) {
      const bandSpacing = BAND_CONSTANTS.SPACING; // band之间的间距
      bandOffsetY += currentBand.height + bandSpacing; // 添加band高度和间距
    }
  }
  
  // 计算可用区域（考虑边距）
  // 元素坐标是相对于band的，所以band内的可用宽度就是整个页面宽度减去左右边距
  const availableWidth = reportProperties.pageWidth - reportProperties.leftMargin - reportProperties.rightMargin;
  // const availableHeight = reportProperties.pageHeight - reportProperties.topMargin - reportProperties.bottomMargin; // 暂时不使用
  
  // 计算元素的实际位置和尺寸
  const elementRight = element.x + element.width;
  const elementBottom = element.y + element.height;
  
  // 检查是否超出band左侧（元素坐标是相对于band的，所以左侧边界是0）
  const exceedsLeft = element.x < 0;
  
  // 检查是否超出band右侧（元素坐标是相对于band的，所以右侧边界是可用宽度）
  const exceedsRight = elementRight > availableWidth;
  
  // 检查是否超出当前Band
  const exceedsBandTop = element.y < 0;
  const exceedsBandBottom = elementBottom > band.height;
  const exceedsBand = exceedsBandTop || exceedsBandBottom;
  
  // 检查是否超出页面顶部（仅对第一个band）
  let exceedsTop = false;
  if (bandIndex === 0) {
    // 第一个band的元素不能超出页面顶部
    const elementActualTop = bandOffsetY + element.y;
    const pageTopBoundary = reportProperties.topMargin;
    exceedsTop = elementActualTop < pageTopBoundary;
  }
  
  // 检查是否超出页面底部（仅对最后一个band）
  let exceedsPageBottom = false;
  if (bandIndex === bands.length - 1) {
    // 最后一个band的元素不能超出页面底部
    const elementActualBottom = bandOffsetY + elementBottom;
    const pageBottomBoundary = reportProperties.pageHeight - reportProperties.bottomMargin;
    exceedsPageBottom = elementActualBottom > pageBottomBoundary;
  }
  
  // 检查是否超出页面底部（对非最后一个band）
  let exceedsBottom = false;
  if (bandIndex < bands.length - 1) {
    // 非最后一个band的元素不能超出页面底部
    const elementActualBottom = bandOffsetY + elementBottom;
    const pageBottomBoundary = reportProperties.pageHeight - reportProperties.bottomMargin;
    exceedsBottom = elementActualBottom > pageBottomBoundary;
  } else {
    // 最后一个band使用exceedsPageBottom的值
    exceedsBottom = exceedsPageBottom;
  }
  
  return {
    isOutOfBounds: exceedsLeft || exceedsRight || exceedsBottom || exceedsBand || exceedsTop,
    exceedsLeft,
    exceedsRight,
    exceedsBottom,
    exceedsTop,
    exceedsBandTop,
    exceedsBandBottom,
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
  exceedsLeft: boolean;
  exceedsRight: boolean;
  exceedsBottom: boolean;
  exceedsTop: boolean;
  exceedsBandTop: boolean;
  exceedsBandBottom: boolean;
  exceedsBand: boolean;
}> {
  const outOfBoundsElements: Array<{
    bandIndex: number;
    elementIndex: number;
    element: DesignElement;
    exceedsLeft: boolean;
    exceedsRight: boolean;
    exceedsBottom: boolean;
    exceedsTop: boolean;
    exceedsBandTop: boolean;
    exceedsBandBottom: boolean;
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
          exceedsLeft: validation.exceedsLeft,
          exceedsRight: validation.exceedsRight,
          exceedsBottom: validation.exceedsBottom,
          exceedsTop: validation.exceedsTop,
          exceedsBandTop: validation.exceedsBandTop,
          exceedsBandBottom: validation.exceedsBandBottom,
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
  
  // 计算所有Band的总高度，考虑band之间的间距
  const totalBandsHeight = bands.reduce((total, band, index) => {
    return total + band.height + (index < bands.length - 1 ? BAND_CONSTANTS.SPACING : 0); // 添加band间距，除了最后一个band
  }, 0);
  const availableHeight = reportProperties.pageHeight - reportProperties.topMargin - reportProperties.bottomMargin;
  
  // 检查Band总高度是否超出页面
  if (totalBandsHeight > availableHeight) {
    errors.push(`报表设计无效：详细区域、页面和列的页眉页脚及边距不适合页面高度。`);
  }
  
  // 检查每个超出边界的元素
  outOfBoundsElements.forEach(({ bandIndex, elementIndex, exceedsLeft, exceedsRight, exceedsBottom, exceedsTop, exceedsBandTop, exceedsBandBottom, exceedsBand }) => {
    if (bands[bandIndex]) {
      const bandName = bands[bandIndex].type;
      const elementInfo = `${bandName}区域中的元素${elementIndex + 1}`;
      
      if (exceedsTop) {
        errors.push(`${elementInfo}超出页面顶部边界`);
      }
      
      if (exceedsLeft) {
        errors.push(`${elementInfo}超出${bandName}区域左边界`);
      }
      
      if (exceedsRight) {
        errors.push(`${elementInfo}超出${bandName}区域右边界`);
      }
      
      if (exceedsBottom) {
        errors.push(`${elementInfo}超出页面底部边界`);
      }
      
      if (exceedsBandTop) {
        errors.push(`${elementInfo}超出${bandName}区域顶部边界`);
      }
      
      if (exceedsBandBottom) {
        errors.push(`${elementInfo}超出${bandName}区域底部边界`);
      }
      
      if (exceedsBand) {
        errors.push(`${elementInfo}超出${bandName}区域边界`);
      }
    }
  });
  
  return errors;
}