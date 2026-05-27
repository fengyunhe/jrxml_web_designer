// 元素类型枚举
export type ElementType = 'staticText' | 'textField' | 'image' | 'line' | 'rectangle' | 'ellipse' | 'break' | 'frame' | 'table';

// 列分组接口
export interface ColumnGroup {
  uuid: string;
  name: string;
  width: number;
  hasTableHeader?: boolean;
  tableHeader?: TableCell;
  columnHeader?: TableCell;
  columnFooter?: TableCell;
  tableFooter?: TableCell;
  // 子分组或列
  children: (ColumnGroup | TableColumn)[];
}

// 表格单元格接口
export interface TableCell {
  enable: boolean;
  element?: DesignElement;
}

// 表格列接口
export interface TableColumn {
  uuid: string;
  width: number;
  name: string;
  hasTableHeader?: boolean;
  tableHeader?: TableCell;
  columnHeader?: TableCell;
  detailCell?: TableCell;
  columnFooter?: TableCell;
  tableFooter?: TableCell;
  children?: (ColumnGroup | TableColumn)[];
}

// 查询接口
export interface Query {
  language: string;
  text: string;
}

// 表格数据集接口
export interface TableDataset {
  uuid: string;
  name: string;
  query?: Query;
  fields?: Field[];
}

// 字段接口
export interface Field {
  name: string;
  class: string;
}

// Band类型枚举
export type BandType = 'detail' | 'pageHeader' | 'pageFooter' | 'title' | 'summary' | 'columnHeader' | 'columnFooter' | 'background' | 'lastPageFooter' | 'noData';

// 笔样式接口
export interface Pen {
  lineWidth?: number;
  lineStyle?: string;
  lineColor?: string;
}

// 边框样式接口
export interface Box {
  // 全局边框
  border?: string; // 保持向后兼容
  borderColor?: string; // 保持向后兼容
  borderWidth?: number; // 全局边框宽度
  borderStyle?: string; // 全局边框样式
  
  // 各边边框
  topBorder?: string; // 保持向后兼容
  topBorderColor?: string; // 保持向后兼容
  topBorderWidth?: number; // 上边框宽度
  topBorderStyle?: string; // 上边框样式
  
  leftBorder?: string; // 保持向后兼容
  leftBorderColor?: string; // 保持向后兼容
  leftBorderWidth?: number; // 左边框宽度
  leftBorderStyle?: string; // 左边框样式
  
  bottomBorder?: string; // 保持向后兼容
  bottomBorderColor?: string; // 保持向后兼容
  bottomBorderWidth?: number; // 下边框宽度
  bottomBorderStyle?: string; // 下边框样式
  
  rightBorder?: string; // 保持向后兼容
  rightBorderColor?: string; // 保持向后兼容
  rightBorderWidth?: number; // 右边框宽度
  rightBorderStyle?: string; // 右边框样式
  
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

export interface ReportData {
      reportProperties: ReportProperties;
      bands: Band[];
      reportFields: ReportField[];
      jrxmlContent: string;
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
  orientation?: 'portrait' | 'landscape';
}

// 设计元素基础接口
export interface DesignElementBase {
  uuid?: string; // 符合XSD要求的唯一标识符
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  forecolor?: string; // 添加forecolor属性
  forecolorMode?: 'Opaque' | 'Transparent'; // 添加forecolorMode属性
  backcolor?: string;
  mode?: 'Opaque' | 'Transparent';
  fill?: 'Solid' | 'None'; // 添加fill属性
  border?: string;
  box?: Box;
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlignment?: 'Left' | 'Center' | 'Right' | 'Justified';
  verticalAlignment?: 'Top' | 'Middle' | 'Bottom';
  markup?: string; // 添加markup属性
  textAdjust?: string; // 添加textAdjust属性
  isStyledText?: boolean; // 添加过时的isStyledText属性以保持兼容性
  isStretchWithOverflow?: boolean; // 添加过时的isStretchWithOverflow属性以保持兼容性
}

// 静态文本元素接口
export interface StaticTextElement extends DesignElementBase {
  type: 'staticText';
  text?: string;
  markup?: 'none' | 'html' | 'rtf' | 'styledtext';
  textAdjust?: 'StretchHeight' | 'CutText' | 'ShrinkToFit';
  rotation?: 'None' | 'Left' | 'Right';
  pattern?: string;
  xml_lang?: string;
}

// 文本字段元素接口
export interface TextFieldElement extends DesignElementBase {
  type: 'textField';
  expression?: string;
  evaluationTime?: 'Now' | 'Report' | 'Page' | 'Column' | 'Group' | 'Band' | 'Auto';
  evaluationGroup?: string;
  pattern?: string;
  isBlankWhenNull?: boolean;
  hyperlinkType?: 'None' | 'Reference' | 'Anchor' | 'LocalAnchor' | 'LocalPage' | 'RemotePage' | 'RemoteAnchor' | 'mailto' | 'LocalPageBookmark' | 'PdfAnchor';
  hyperlinkAnchor?: string;
  hyperlinkPage?: number;
  hyperlinkReferenceExpression?: string;
  bookmarkLevel?: number;
  isIgnorePagination?: boolean;
  // 过时属性（向后兼容）
  isStretchWithOverflow?: boolean;
}

// 图片元素接口
export interface ImageElement extends DesignElementBase {
  type: 'image';
  imageExpression?: string;
  scaleType?: 'Clip' | 'FillFrame' | 'RealHeight' | 'RealSize';
  hAlign?: 'Left' | 'Center' | 'Right';
  vAlign?: 'Top' | 'Middle' | 'Bottom';
  isUsingCache?: boolean;
  isLazy?: boolean;
  onErrorType?: 'Error' | 'Blank' | 'Icon';
  evaluationTime?: 'Now' | 'Report' | 'Page' | 'Column' | 'Band';
  hyperlinkType?: string;
  hyperlinkReferenceExpression?: string;
  // 过时属性（向后兼容）
  scaleImage?: 'Clip' | 'FillFrame' | 'RetainShape' | 'RealHeight' | 'RealSize';
}

// 线条元素接口
export interface LineElement extends DesignElementBase {
  type: 'line';
  lineDirection?: 'TopDown' | 'BottomUp';
  lineWidth?: number;
}

// 矩形元素接口
export interface RectangleElement extends DesignElementBase {
  type: 'rectangle';
  radius?: number; // 圆角半径
  pen?: Pen; // 边框样式
}

// 椭圆元素接口
export interface EllipseElement extends DesignElementBase {
  type: 'ellipse';
  pen?: Pen; // 边框样式
}

// 分页符元素接口
export interface BreakElement extends DesignElementBase {
  type: 'break';
  breakType?: 'Page' | 'Column';
}

// 容器元素接口
export interface FrameElement extends DesignElementBase {
  type: 'frame';
  elements?: DesignElement[]; // 容器内的子元素
  layout?: 'FreeLayout' | 'HorizontalLayout' | 'VerticalLayout'; // 布局属性
}

// 表格元素接口
export interface TableElement extends DesignElementBase {
  type: 'table';
  dataset: TableDataset;
  // 支持分组和列的混合结构
  children?: (ColumnGroup | TableColumn)[];
  // 保持向后兼容，支持传统的columns数组
  columns: TableColumn[];
  styles?: {
    tableHeader?: string;
    columnHeader?: string;
    detail?: string;
  };
  whenNoDataType?: 'Blank' | 'NoDataCell' | 'AllSectionsNoDetail';
}

// 设计元素联合类型
export type DesignElement = 
  | StaticTextElement 
  | TextFieldElement 
  | ImageElement 
  | LineElement
  | RectangleElement
  | EllipseElement
  | BreakElement
  | FrameElement
  | TableElement;

// 报表区域接口
export interface Band {
  type: BandType;
  height: number;
  elements: DesignElement[];
  splitType?: 'Stretch' | 'Prevent' | 'Immediate';
  isSplitAllowed?: boolean; // 添加过时的isSplitAllowed属性以保持兼容性
}

// 选中元素信息接口
export interface SelectedElementInfo {
  bandIndex: number;
  elementIndex: number;
  parentFrameIndex?: number; // 如果在 Frame 内，这是 Frame 在 Band 中的索引
  uuid?: string;
}

// 多选元素信息接口
export interface SelectedElementsInfo {
  elements: Array<{
    bandIndex: number;
    elementIndex: number;
    parentFrameIndex?: number;
    uuid?: string;
  }>;
}

// 编辑元素信息接口
export interface EditingElementInfo {
  bandIndex: number;
  elementIndex: number;
  parentFrameIndex?: number;
}

// 拖拽信息接口
export interface DraggingInfo {
  bandIndex: number;
  elementIndex: number;
  parentFrameIndex?: number;
  startX: number;
  startY: number;
  lastTargetBandIndex?: number;
  lastTargetFrameIndex?: number; // 记录最后一次目标Frame索引
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