// Band相关的工具函数

import type { Band,BandType } from '@/types';
import { BAND_TYPE_CONSTANTS, BAND_HEIGHT_CONSTANTS, BAND_CONSTANTS } from '@/constants/constants';

// 获取Band的显示名称
export function getBandDisplayName(bandType: string): string {
  const bandNames: Record<string, string> = {
    [BAND_TYPE_CONSTANTS.TITLE]: '标题',
    [BAND_TYPE_CONSTANTS.PAGE_HEADER]: '页眉',
    [BAND_TYPE_CONSTANTS.COLUMN_HEADER]: '列标题',
    [BAND_TYPE_CONSTANTS.DETAIL]: '详情',
    [BAND_TYPE_CONSTANTS.COLUMN_FOOTER]: '列脚',
    [BAND_TYPE_CONSTANTS.PAGE_FOOTER]: '页脚',
    [BAND_TYPE_CONSTANTS.SUMMARY]: '总结',
    [BAND_TYPE_CONSTANTS.BACKGROUND]: '背景',
    [BAND_TYPE_CONSTANTS.LAST_PAGE_FOOTER]: '末页页脚',
    [BAND_TYPE_CONSTANTS.NO_DATA]: '无数据',
  };
  return bandNames[bandType] || bandType;
}

// 创建新Band
export function createNewBand(bandType: BandType): Band {
  return {
    type: bandType,
    height: BAND_HEIGHT_CONSTANTS[bandType as keyof typeof BAND_HEIGHT_CONSTANTS] || 50,
    splitType: 'Stretch',
    elements:[]
  };
}

// 获取Band的默认高度
export function getBandDefaultHeight(bandType: BandType): number {
  return BAND_HEIGHT_CONSTANTS[bandType as keyof typeof BAND_HEIGHT_CONSTANTS] || 50;
}

// 检查点是否在Band内
export function isPointInBand(y: number, band: Band, bandY: number): boolean {
  return y >= bandY && y <= bandY + band.height;
}

// 获取Band在画布上的Y坐标
export function getBandYPosition(bands: Band[], targetBandType: string): number {
  let y = 0;
  const bandSpacing = BAND_CONSTANTS.SPACING; // band之间的间距
  let bandCount = 0;
  
  for (const band of bands) {
    if (band.type === targetBandType) {
      return y;
    }
    y += band.height;
    // 在band之间添加间距，但不在最后一个band后添加
    if (bandCount < bands.length - 1) {
      y += bandSpacing;
    }
    bandCount++;
  }
  return y;
}

// 获取指定Y坐标所在的Band
export function getBandAtY(bands: Band[], y: number): { band: Band | null, bandY: number } {
  let currentY = 0;
  const bandSpacing = BAND_CONSTANTS.SPACING; // band之间的间距
  
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (!band) continue;
    
    const bandBottom = currentY + band.height;
    
    if (y >= currentY && y <= bandBottom) {
      return { band, bandY: currentY };
    }
    currentY += band.height;
    // 在band之间添加间距，但不在最后一个band后添加
    if (i < bands.length - 1) {
      currentY += bandSpacing;
    }
  }
  return { band: null, bandY: currentY };
}

// 获取所有Band的总高度
export function getTotalBandsHeight(bands: Band[]): number {
  if (bands.length === 0) return 0;
  
  const bandSpacing = BAND_CONSTANTS.SPACING; // band之间的间距
  const totalBandHeight = bands.reduce((total, band) => total + band.height, 0);
  const totalSpacing = (bands.length - 1) * bandSpacing; // 只在band之间添加间距
  
  return totalBandHeight + totalSpacing;
}

// 调整Band高度
export function adjustBandHeight(bands: Band[], bandType: string, newHeight: number): Band[] {
  return bands.map(band => 
    band.type === bandType ? { ...band, height: newHeight } : band
  );
}


// 添加新Band到指定位置
export function addBandAtPosition(bands: Band[], bandType: BandType, position?: number): Band[] {
  const newBand = createNewBand(bandType);
  
  if (position === undefined) {
    // 如果没有指定位置，添加到末尾
    return [...bands, newBand];
  }
  
  // 在指定位置插入
  const newBands = [...bands];
  newBands.splice(position, 0, newBand);
  return newBands;
}

// 删除Band
export function removeBand(bands: Band[], bandType: string): Band[] {
  return bands.filter(band => band.type !== bandType);
}

// 检查Band是否存在
export function bandExists(bands: Band[], bandType: string): boolean {
  return bands.some(band => band.type === bandType);
}

// 获取Band的分割类型选项
export function getBandSplitOptions(): Array<{ value: string, label: string }> {
  return [
    { value: 'Stretch', label: '拉伸' },
    { value: 'Prevent', label: '防止' },
    { value: 'Immediate', label: '立即' },
  ];
}