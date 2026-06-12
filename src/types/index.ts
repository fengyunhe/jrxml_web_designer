// 元素类型枚举
export type ElementType =
  | "staticText"
  | "textField"
  | "image"
  | "line"
  | "rectangle"
  | "ellipse"
  | "break"
  | "frame"
  | "table"
  | "subreport"
  | "list"
  | "chart"
  | "barcode";

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

// 字段属性接口
export interface FieldProperty {
  name: string;
  value: string;
}

// 字段接口
export interface Field {
  name: string;
  class: string;
  properties?: FieldProperty[];
}

// 报表属性接口
export interface ReportProperty {
  name: string;
  value: string;
}

// Band类型枚举
export type BandType =
  | "detail"
  | "pageHeader"
  | "pageFooter"
  | "title"
  | "summary"
  | "columnHeader"
  | "columnFooter"
  | "background"
  | "lastPageFooter"
  | "noData";

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

// 分组接口
export interface ReportGroup {
  name: string;
  uuid?: string;
  expression: string;
  isStartNewPage?: boolean;
  isStartNewColumn?: boolean;
  isRepeatHeader?: boolean;
  isReprintHeaderOnEachPage?: boolean;
  isResetPageNumber?: boolean;
  isHideColumnHeader?: boolean;
  isKeepTogether?: boolean;
  isKeepFooterTogether?: boolean;
  minHeightToStartNewPage?: number;
  header?: Band;
  footer?: Band;
}

// 报表数据接口
export interface ReportData {
  reportProperties: ReportProperties;
  bands: Band[];
  reportFields: ReportField[];
  reportParameters?: ReportParameter[];
  reportVariables?: ReportVariable[];
  reportGroups?: ReportGroup[];
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

// 报表变量接口
export interface ReportVariable {
  name: string;
  class: string;
  calculationType?:
    | "Nothing"
    | "Count"
    | "DistinctCount"
    | "Sum"
    | "Average"
    | "First"
    | "Min"
    | "Max"
    | "StDev"
    | "Variance";
  resetType?: "Report" | "Page" | "Column" | "Group";
  resetGroup?: string;
  expression?: string;
  initialValueExpression?: string;
}

// 条件样式接口
export interface ConditionalStyle {
  conditionExpression: string;
  properties: Partial<ReportStyle>;
}

// 报表样式接口
export interface ReportStyle {
  name: string;
  parentStyle?: string;
  mode?: string;
  backcolor?: string;
  forecolor?: string;
  conditionExpression?: string;
  box?: Box;
  textAlignment?: string;
  verticalAlignment?: string;
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  conditionalStyles?: ConditionalStyle[];
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
  orientation?: "portrait" | "landscape";
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
  forecolorMode?: "Opaque" | "Transparent"; // 添加forecolorMode属性
  backcolor?: string;
  mode?: "Opaque" | "Transparent";
  fill?: "Solid" | "None"; // 添加fill属性
  border?: string;
  box?: Box;
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlignment?: "Left" | "Center" | "Right" | "Justified";
  verticalAlignment?: "Top" | "Middle" | "Bottom";
  markup?: string; // 添加markup属性
  textAdjust?: string; // 添加textAdjust属性
  isStyledText?: boolean; // 添加过时的isStyledText属性以保持兼容性
  isStretchWithOverflow?: boolean; // 添加过时的isStretchWithOverflow属性以保持兼容性
  style?: string; // 样式引用名称
}

// 静态文本元素接口
export interface StaticTextElement extends DesignElementBase {
  type: "staticText";
  text?: string;
  markup?: "none" | "html" | "rtf" | "styledtext";
  textAdjust?: "StretchHeight" | "CutText" | "ShrinkToFit";
  rotation?: "None" | "Left" | "Right";
  pattern?: string;
  xml_lang?: string;
  printWhenExpression?: string;
}

// 文本字段元素接口
export interface TextFieldElement extends DesignElementBase {
  type: "textField";
  expression?: string;
  evaluationTime?:
    | "Now"
    | "Report"
    | "Page"
    | "Column"
    | "Group"
    | "Band"
    | "Auto";
  evaluationGroup?: string;
  pattern?: string;
  isBlankWhenNull?: boolean;
  hyperlinkType?:
    | "None"
    | "Reference"
    | "Anchor"
    | "LocalAnchor"
    | "LocalPage"
    | "RemotePage"
    | "RemoteAnchor"
    | "mailto"
    | "LocalPageBookmark"
    | "PdfAnchor";
  hyperlinkAnchor?: string;
  hyperlinkPage?: number;
  hyperlinkReferenceExpression?: string;
  hyperlinkAnchorExpression?: string;
  hyperlinkPageExpression?: string;
  hyperlinkTooltip?: string;
  bookmarkLevel?: number;
  isIgnorePagination?: boolean;
  printWhenExpression?: string;
  // 过时属性（向后兼容）
  isStretchWithOverflow?: boolean;
}

// 图片元素接口
export interface ImageElement extends DesignElementBase {
  type: "image";
  imageExpression?: string;
  scaleType?: "Clip" | "FillFrame" | "RealHeight" | "RealSize";
  hAlign?: "Left" | "Center" | "Right";
  vAlign?: "Top" | "Middle" | "Bottom";
  isUsingCache?: boolean;
  isLazy?: boolean;
  onErrorType?: "Error" | "Blank" | "Icon";
  evaluationTime?: "Now" | "Report" | "Page" | "Column" | "Band";
  hyperlinkType?: string;
  hyperlinkReferenceExpression?: string;
  hyperlinkAnchorExpression?: string;
  hyperlinkPageExpression?: string;
  hyperlinkTooltip?: string;
  printWhenExpression?: string;
  // 过时属性（向后兼容）
  scaleImage?: "Clip" | "FillFrame" | "RetainShape" | "RealHeight" | "RealSize";
}

// 线条元素接口
export interface LineElement extends DesignElementBase {
  type: "line";
  lineDirection?: "TopDown" | "BottomUp";
  lineWidth?: number;
  lineColor?: string;
  lineStyle?: string;
  evaluationTime?: "Now" | "Report" | "Page" | "Column" | "Band";
  // 新增属性
  isPrintRepeatedValues?: boolean;
  printWhenExpression?: string;
}

// 矩形元素接口
export interface RectangleElement extends DesignElementBase {
  type: "rectangle";
  radius?: number; // 圆角半径
  pen?: Pen; // 边框样式
  // 新增属性
  isPrintRepeatedValues?: boolean;
  isRemoveLineWhenBlank?: boolean;
  printWhenExpression?: string;
}

// 椭圆元素接口
export interface EllipseElement extends DesignElementBase {
  type: "ellipse";
  pen?: Pen; // 边框样式
  // 新增属性
  isPrintRepeatedValues?: boolean;
  isRemoveLineWhenBlank?: boolean;
  printWhenExpression?: string;
}

// 分页符元素接口
export interface BreakElement extends DesignElementBase {
  type: "break";
  breakType?: "Page" | "Column";
  // 新增属性
  isResetPageNumber?: boolean;
  isResetPageOverflow?: boolean;
}

// 容器元素接口
export interface FrameElement extends DesignElementBase {
  type: "frame";
  elements?: DesignElement[]; // 容器内的子元素
  layout?: "FreeLayout" | "HorizontalLayout" | "VerticalLayout"; // 布局属性
  evaluationTime?:
    | "Now"
    | "Report"
    | "Page"
    | "Column"
    | "Group"
    | "Band"
    | "Auto";
  // 条件打印
  printWhenExpression?: string;
  printWhenGroupChanges?: string;
  // 分页控制
  isIgnorePagination?: boolean;
  isSplitAllowed?: boolean;
  splitType?: "Stretch" | "Prevent" | "Immediate";
  // 框架特有属性
  isRemoveLineWhenBlank?: boolean;
  isPrintRepeatedValues?: boolean;
}

// 行分组接口
export interface RowGroup {
  uuid: string;
  name: string;
  height: number;
  header?: TableCell;
  footer?: TableCell;
  isStartNewPage?: boolean;
  isRepeatHeader?: boolean;
  expression?: string;
}

// 表格元素接口
export interface TableElement extends DesignElementBase {
  type: "table";
  dataset: TableDataset;
  // 支持分组和列的混合结构
  children?: (ColumnGroup | TableColumn)[];
  // 保持向后兼容，支持传统的columns数组
  columns: TableColumn[];
  // 行分组
  rowGroups?: RowGroup[];
  styles?: {
    tableHeader?: string;
    columnHeader?: string;
    detail?: string;
    columnFooter?: string;
    tableFooter?: string;
  };
  whenNoDataType?:
    | "Blank"
    | "NoDataCell"
    | "AllSectionsNoDetail"
    | "AllSectionsWithDetail";
  // 表格级属性
  printHeaders?: boolean;
  ignoreWidth?: boolean;
  isIgnorePagination?: boolean;
  // 样式继承
  style?: string;
  parentStyle?: string;
  // 分页控制
  splitType?: "Stretch" | "Prevent" | "Immediate";
}

// 子报表元素接口
export interface SubreportElement extends DesignElementBase {
  type: "subreport";
  subreportExpression?: string;
  parametersMapExpression?: string;
  connectionExpression?: string;
  dataSourceExpression?: string;
  returnValue?: {
    subreportVariable: string;
    toVariable: string;
    calculationType?: string;
  }[];
  printWhenExpression?: string;
  isUsingCache?: boolean;
  evaluationTime?: "Now" | "Report" | "Page" | "Column" | "Group" | "Band" | "Auto" | "Master";
  evaluationGroup?: string;
  isIgnorePagination?: boolean;
}

// 列表元素接口
export interface ListElement extends DesignElementBase {
  type: "list";
  listContents?: {
    elements: DesignElement[];
    height?: number;
  };
  printWhenExpression?: string;
  evaluationTime?: "Now" | "Report" | "Page" | "Column" | "Group" | "Band" | "Auto";
  evaluationGroup?: string;
  splitType?: "Stretch" | "Prevent" | "Immediate";
}

// 图表元素接口
export interface ChartElement extends DesignElementBase {
  type: "chart";
  chartType: "pie" | "pie3D" | "bar" | "bar3D" | "xyBar" | "stackedBar" | "stackedBar3D" | "line" | "xyLine" | "area" | "xyArea" | "scatter" | "bubble" | "timeSeries" | "highLow" | "candlestick" | "meter" | "thermometer" | "multiAxis" | "stackedArea" | "gantt" | "spider";
  title?: string;
  titleExpression?: string;
  subtitleExpression?: string;
  legendExpression?: string;
  evaluationTime?: "Now" | "Report" | "Page" | "Column" | "Group" | "Band" | "Auto" | "Master";
  evaluationGroup?: string;
  printWhenExpression?: string;
}

// 条码元素接口
export interface BarcodeElement extends DesignElementBase {
  type: "barcode";
  barcodeType: "Code128" | "Code39" | "EAN13" | "EAN8" | "UPCA" | "UPCE" | "QRCode" | "DataMatrix" | "Interleaved2Of5" | "Codabar" | "EAN128" | "PDF417" | "POSTNET" | "RoyalMailCustomer" | "USPSIntelligentMail";
  codeExpression?: string;
  printWhenExpression?: string;
  evaluationTime?: "Now" | "Report" | "Page" | "Column" | "Group" | "Band" | "Auto";
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
  | TableElement
  | SubreportElement
  | ListElement
  | ChartElement
  | BarcodeElement;

// 报表区域接口
export interface Band {
  type: BandType;
  height: number;
  elements: DesignElement[];
  splitType?: "Stretch" | "Prevent" | "Immediate";
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
