// 设计器常量定义

// 缩放相关常量
export const ZOOM_CONSTANTS = {
  DEFAULT_ZOOM: 1,
  ZOOM_LEVELS: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 2,
  OPTIMAL_ZOOM_MARGIN: 0.9, // 计算最佳缩放比例时的边距系数
};

// 面板尺寸常量
export const PANEL_CONSTANTS = {
  DEFAULT_BOTTOM_PANEL_HEIGHT: 400,
  DEFAULT_PROPERTY_PANEL_WIDTH: 300,
  DEFAULT_LEFT_PANEL_WIDTH: 280, // 左侧面板默认宽度
  LEFT_PANEL_MIN_WIDTH: 150, // 左侧面板最小宽度
  LEFT_PANEL_MAX_WIDTH: 400, // 左侧面板最大宽度
};

// 报表属性常量
export const REPORT_CONSTANTS = {
  DEFAULT_PAGE_WIDTH: 595, // A4宽度（像素）
  DEFAULT_PAGE_HEIGHT: 842, // A4高度（像素）
  DEFAULT_MARGIN: 20,
  DEFAULT_FONT_SIZE: 12,
  MIN_ELEMENT_WIDTH: 20,
  MIN_ELEMENT_HEIGHT: 10,
  MIN_BAND_HEIGHT: 0,
  MAX_BAND_HEIGHT: 800,
};

// 历史记录常量
export const HISTORY_CONSTANTS = {
  MAX_HISTORY_SIZE: 50,
};

// 键盘导航常量
export const KEYBOARD_CONSTANTS = {
  ELEMENT_PASTE_OFFSET: 10,
  SECONDARY_AXIS_WEIGHT: 0.1,
};

// DOM操作常量
export const DOM_CONSTANTS = {
  CALCULATE_ZOOM_DELAY: 100, // 计算缩放比例的延迟时间（毫秒）
  SCROLL_BAR_WIDTH: 40, // 滚动条宽度估算值
};

// 边框样式常量
export const BORDER_CONSTANTS = {
  THIN: 'Thin',
  MEDIUM: 'Medium',
  THICK: 'Thick',
  DASHED: 'Dashed',
  DOTTED: 'Dotted',
  DOUBLE: 'Double',
  // 边框宽度常量
  THIN_WIDTH: 1,
  MEDIUM_WIDTH: 2,
  THICK_WIDTH: 4,
};

// 文本对齐常量
export const TEXT_ALIGN_CONSTANTS = {
  LEFT: 'Left',
  CENTER: 'Center',
  RIGHT: 'Right',
  JUSTIFIED: 'Justified',
};

// 垂直对齐常量
export const VERTICAL_ALIGN_CONSTANTS = {
  TOP: 'Top',
  MIDDLE: 'Middle',
  BOTTOM: 'Bottom',
};

// 字体常量
export const FONT_CONSTANTS = {
  DEFAULT_FONT_FAMILY: 'Noto Serif SC',
  // 字体大小常量
  DEFAULT_SIZE: 12,
  MIN_SIZE: 8,
  MAX_SIZE: 72,
  HEADER_SIZE: 16,
  LABEL_SIZE: 14,
  SMALL_SIZE: 10,
  TINY_SIZE: 8,
};

// 元素类型常量
export const ELEMENT_TYPE_CONSTANTS = {
  STATIC_TEXT: 'staticText',
  TEXT_FIELD: 'textField',
  IMAGE: 'image',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  BREAK: 'break',
  FRAME: 'frame',
};

// 元素尺寸常量
export const ELEMENT_CONSTANTS = {
  MIN_WIDTH: 20,
  MIN_HEIGHT: 10,
};

// Band类型常量
export const BAND_TYPE_CONSTANTS = {
  TITLE: 'title',
  PAGE_HEADER: 'pageHeader',
  COLUMN_HEADER: 'columnHeader',
  DETAIL: 'detail',
  COLUMN_FOOTER: 'columnFooter',
  PAGE_FOOTER: 'pageFooter',
  SUMMARY: 'summary',
  BACKGROUND: 'background',
  LAST_PAGE_FOOTER: 'lastPageFooter',
  NO_DATA: 'noData',
};

// Band默认高度常量
export const BAND_HEIGHT_CONSTANTS = {
  [BAND_TYPE_CONSTANTS.TITLE]: 80,
  [BAND_TYPE_CONSTANTS.PAGE_HEADER]: 50,
  [BAND_TYPE_CONSTANTS.COLUMN_HEADER]: 30,
  [BAND_TYPE_CONSTANTS.DETAIL]: 100,
  [BAND_TYPE_CONSTANTS.COLUMN_FOOTER]: 30,
  [BAND_TYPE_CONSTANTS.PAGE_FOOTER]: 40,
  [BAND_TYPE_CONSTANTS.SUMMARY]: 60,
  [BAND_TYPE_CONSTANTS.BACKGROUND]: 0,
  [BAND_TYPE_CONSTANTS.LAST_PAGE_FOOTER]: 40,
  [BAND_TYPE_CONSTANTS.NO_DATA]: 50,
};

// Band相关常量
export const BAND_CONSTANTS = {
  MIN_HEIGHT: 20,
  DEFAULT_ADDITIONAL_MARGIN: 10,
  DETAIL_ADDITIONAL_MARGIN: 15,
  SPACING: 0, // band之间的间距
};

// 评估时间常量
export const EVALUATION_TIME_CONSTANTS = {
  NOW: 'Now',
  REPORT: 'Report',
  PAGE: 'Page',
  COLUMN: 'Column',
  GROUP: 'Group',
  BAND: 'Band',
  AUTO: 'Auto',
};

// 标尺相关常量
export const RULER_CONSTANTS = {
  UNIT_SIZE: 5, // 基本单位，5px
  MAJOR_TICK_INTERVAL: 25, // 主要刻度间隔，25px
  LABEL_INTERVAL: 25, // 标签间隔，25px
};

// UI尺寸常量
export const UI_CONSTANTS = {
  // 元素尺寸
  DEFAULT_ELEMENT_WIDTH: 100,
  DEFAULT_ELEMENT_HEIGHT: 30,
  MIN_ELEMENT_SIZE: 20,
  // 边框宽度
  BORDER_THIN: 1,
  BORDER_MEDIUM: 2,
  BORDER_THICK: 4,
  // 面板尺寸
  BOTTOM_PANEL_MIN_HEIGHT: 100,
  BOTTOM_PANEL_MAX_HEIGHT: 800,
  PROPERTY_PANEL_MIN_WIDTH: 200,
  PROPERTY_PANEL_MAX_WIDTH: 600,
  // 标尺尺寸
  RULER_WIDTH: 40,
  RULER_HEIGHT: 40,
  RULER_LABEL_SIZE: 10,
  // 模态框尺寸
  MODAL_MAX_WIDTH: 800,
  MODAL_MAX_HEIGHT: 80,
  MODAL_PADDING: 20,
  // 按钮尺寸
  BUTTON_SMALL_HEIGHT: 30,
  BUTTON_SMALL_WIDTH: 30,
  // 其他UI尺寸
  LINE_HEIGHT: 1,
  LINE_HEIGHT_PX: 20, // 行高像素值
  TAB_BUTTON_HEIGHT: 40,
  RESIZE_HANDLE_SIZE: 10,
  RESIZE_HANDLE_WIDTH: 4,
  BOX_SHADOW_OFFSET: 2,
  BOX_SHADOW_BLUR: 10,
  BORDER_RADIUS_SMALL: 4,
  BORDER_RADIUS_MEDIUM: 6,
  BORDER_RADIUS_LARGE: 8,
  // 网格大小
  GRID_SIZE: 10,
  // 字体大小
  FONT_SIZE_DEFAULT: 14,
  FONT_SIZE_SMALL: 13,
  FONT_SIZE_TINY: 12,
  FONT_SIZE_MINI: 11,
  FONT_SIZE_MEDIUM: 15,
  FONT_SIZE_LABEL: 14,
  FONT_SIZE_HEADER: 16,
  // 间距
  SMALL_MARGIN: 8,
  MEDIUM_MARGIN: 12,
  LARGE_MARGIN: 20,
  SMALL_GAP: 5,
  MEDIUM_GAP: 15,
  // 输入框内边距
  INPUT_PADDING_SMALL: '6px 12px',
  INPUT_PADDING_MEDIUM: '8px 16px',
  // 面板内边距
  PANEL_PADDING: 16,
  // DOM操作延迟
  DOM_RENDER_DELAY: 100,
  // 键盘操作偏移量
  ELEMENT_PASTE_OFFSET: 10,
  SECONDARY_AXIS_WEIGHT: 0.1,
};