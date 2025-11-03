// 面板操作相关的工具函数

import { PANEL_CONSTANTS } from '@/constants/constants';

// 调整底部面板高度
export function adjustBottomPanelHeight(
  currentHeight: number,
  deltaY: number,
  minHeight?: number,
  maxHeight?: number
): number {
  const newHeight = currentHeight + deltaY;
  const minH = minHeight || PANEL_CONSTANTS.DEFAULT_BOTTOM_PANEL_HEIGHT;
  const maxH = maxHeight || 800; // 默认最大高度
  
  return Math.max(minH, Math.min(newHeight, maxH));
}

// 调整左侧面板宽度
export function adjustLeftPanelWidth(
  currentWidth: number,
  deltaX: number,
  minWidth?: number,
  maxWidth?: number
): number {
  const newWidth = currentWidth + deltaX;
  const minW = minWidth || PANEL_CONSTANTS.LEFT_PANEL_MIN_WIDTH;
  const maxW = maxWidth || PANEL_CONSTANTS.LEFT_PANEL_MAX_WIDTH;
  
  return Math.max(minW, Math.min(newWidth, maxW));
}

// 调整属性面板宽度
export function adjustPropertyPanelWidth(
  currentWidth: number,
  deltaX: number,
  minWidth?: number,
  maxWidth?: number
): number {
  const newWidth = currentWidth - deltaX; // 属性面板在右侧，所以方向相反
  const minW = minWidth || 200;
  const maxW = maxWidth || 600;
  
  return Math.max(minW, Math.min(newWidth, maxW));
}

// 检查点是否在调整区域内
export function isInResizeArea(
  x: number,
  y: number,
  areaType: 'bottom' | 'left' | 'right',
  containerRect: DOMRect,
  threshold: number = 10
): boolean {
  switch (areaType) {
    case 'bottom':
      return y >= containerRect.bottom - threshold && y <= containerRect.bottom;
    case 'left':
      return x >= containerRect.left && x <= containerRect.left + threshold;
    case 'right':
      return x >= containerRect.right - threshold && x <= containerRect.right;
    default:
      return false;
  }
}

// 获取鼠标光标样式
export function getResizeCursor(areaType: 'bottom' | 'left' | 'right'): string {
  switch (areaType) {
    case 'bottom':
      return 'ns-resize';
    case 'left':
      return 'ew-resize';
    case 'right':
      return 'ew-resize';
    default:
      return 'default';
  }
}

// 面板状态管理
export interface PanelState {
  leftPanelWidth: number;
  bottomPanelHeight: number;
  propertyPanelWidth: number;
  leftPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  propertyPanelCollapsed: boolean;
}

// 获取默认面板状态
export function getDefaultPanelState(): PanelState {
  return {
    leftPanelWidth: PANEL_CONSTANTS.DEFAULT_LEFT_PANEL_WIDTH,
    bottomPanelHeight: PANEL_CONSTANTS.DEFAULT_BOTTOM_PANEL_HEIGHT,
    propertyPanelWidth: PANEL_CONSTANTS.DEFAULT_PROPERTY_PANEL_WIDTH,
    leftPanelCollapsed: false,
    bottomPanelCollapsed: false,
    propertyPanelCollapsed: false,
  };
}

// 切换面板折叠状态
export function togglePanelCollapsed(
  currentState: PanelState,
  panelType: 'left' | 'bottom' | 'property'
): PanelState {
  const newState = { ...currentState };
  
  switch (panelType) {
    case 'left':
      newState.leftPanelCollapsed = !currentState.leftPanelCollapsed;
      break;
    case 'bottom':
      newState.bottomPanelCollapsed = !currentState.bottomPanelCollapsed;
      break;
    case 'property':
      newState.propertyPanelCollapsed = !currentState.propertyPanelCollapsed;
      break;
  }
  
  return newState;
}

// 保存面板状态到本地存储
export function savePanelState(panelState: PanelState): void {
  try {
    localStorage.setItem('pdf_designer_panel_state', JSON.stringify(panelState));
  } catch (error) {
    console.error('保存面板状态失败:', error);
  }
}

// 从本地存储加载面板状态
export function loadPanelState(): PanelState | null {
  try {
    const stateStr = localStorage.getItem('pdf_designer_panel_state');
    if (stateStr) {
      return JSON.parse(stateStr) as PanelState;
    }
  } catch (error) {
    console.error('加载面板状态失败:', error);
  }
  return null;
}

// 计算面板可见宽度
export function getPanelVisibleWidth(
  panelWidth: number,
  isCollapsed: boolean
): number {
  return isCollapsed ? 0 : panelWidth;
}

// 计算面板可见高度
export function getPanelVisibleHeight(
  panelHeight: number,
  isCollapsed: boolean
): number {
  return isCollapsed ? 0 : panelHeight;
}

// 计算内容区域尺寸
export function getContentAreaSize(
  containerWidth: number,
  containerHeight: number,
  leftPanelState: { width: number, collapsed: boolean },
  bottomPanelState: { height: number, collapsed: boolean },
  propertyPanelState: { width: number, collapsed: boolean }
): { width: number, height: number } {
  const leftPanelVisibleWidth = getPanelVisibleWidth(leftPanelState.width, leftPanelState.collapsed);
  const bottomPanelVisibleHeight = getPanelVisibleHeight(bottomPanelState.height, bottomPanelState.collapsed);
  const propertyPanelVisibleWidth = getPanelVisibleWidth(propertyPanelState.width, propertyPanelState.collapsed);
  
  return {
    width: containerWidth - leftPanelVisibleWidth - propertyPanelVisibleWidth,
    height: containerHeight - bottomPanelVisibleHeight,
  };
}