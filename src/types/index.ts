// 元素类型枚举
export type ElementType = 'staticText' | 'textField' | 'image' | 'line' | 'rectangle';

// Band类型枚举
export type BandType = 'detail' | 'pageHeader' | 'pageFooter' | 'title' | 'summary' | 'columnHeader' | 'columnFooter';

// 笔样式接口
export interface Pen {
  lineWidth?: number;
  lineStyle?: string;
  lineColor?: string;
}

// 边框样式接口
export interface Box {
  // 全局边框
  border?: string;
  borderColor?: string;
  
  // 各边边框
  topBorder?: string;
  topBorderColor?: string;
  leftBorder?: string;
  leftBorderColor?: string;
  bottomBorder?: string;
  bottomBorderColor?: string;
  rightBorder?: string;
  rightBorderColor?: string;
  
  // 笔样式
  topPen?: Pen;
  leftPen?: Pen;
  bottomPen?: Pen;
  rightPen?: Pen;
  
  // 边距
  padding?: number;
  topPadding?: number;
  leftPadding?: number;
  bottomPadding?: number;
  rightPadding?: number;
  
  // 允许通过字符串索引访问属性
  [key: string]: any;
}

// 报表字段接口
export interface ReportField {
  name: string;
  class: string;
}

// 报表参数接口
export interface ReportParameter {
  name: string;
  class: string;
  defaultValue?: string;
}

// 字体设置接口
export interface FontSettings {
  name: string;
  size: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

// 报表属性接口
export interface ReportProperties {
  name: string;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  defaultFont: FontSettings;
}

// 设计元素基础接口
export interface DesignElementBase {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  backcolor?: string;
  border?: string;
  box?: Box;
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlignment?: 'Left' | 'Center' | 'Right' | 'Justified';
  verticalAlignment?: 'Top' | 'Middle' | 'Bottom';
}

// 静态文本元素接口
export interface StaticTextElement extends DesignElementBase {
  type: 'staticText';
  text?: string;
}

// 文本字段元素接口
export interface TextFieldElement extends DesignElementBase {
  type: 'textField';
  fieldName?: string;
  expression?: string;
  isStretchWithOverflow?: boolean;
  evaluationTime?: string;
  pattern?: string;
  isBlankWhenNull?: boolean;
}

// 图片元素接口
export interface ImageElement extends DesignElementBase {
  type: 'image';
  imagePath?: string;
}

// 线条元素接口
export interface LineElement extends DesignElementBase {
  type: 'line';
  lineDirection?: 'Horizontal' | 'Vertical';
  lineWidth?: number;
}

// 矩形元素接口
export interface RectangleElement extends DesignElementBase {
  type: 'rectangle';
}

// 设计元素联合类型
export type DesignElement = 
  | StaticTextElement 
  | TextFieldElement 
  | ImageElement 
  | LineElement
  | RectangleElement;

// 报表区域接口
export interface Band {
  type: BandType;
  height: number;
  elements: DesignElement[];
}

// 选中元素信息接口
export interface SelectedElementInfo {
  bandIndex: number;
  elementIndex: number;
}

// 编辑元素信息接口
export interface EditingElementInfo {
  bandIndex: number;
  elementIndex: number;
}

// 拖拽信息接口
export interface DraggingInfo {
  bandIndex: number;
  elementIndex: number;
  startX: number;
  startY: number;
}

// 选择框接口
export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 元素库项接口
export interface ElementLibraryItem {
  type: ElementType;
  name: string;
}