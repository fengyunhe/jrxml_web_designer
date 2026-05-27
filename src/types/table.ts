// 表格相关类型定义

// 基础单元格接口
export interface BaseCell {
  height?: number;
  width?: number;
  style?: string;
  mode?: string;
  backcolor?: string;
  forecolor?: string;
  textAlignment?: string;
  verticalAlignment?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  box?: {
    padding?: number;
    topPadding?: number;
    leftPadding?: number;
    bottomPadding?: number;
    rightPadding?: number;
    pen?: {
      lineWidth?: number;
      lineStyle?: string;
      lineColor?: string;
    };
    borderWidth?: number;
    borderStyle?: string;
    borderColor?: string;
  };
  element?: any; // 单元格内的元素
}

// 单元格接口
export interface Cell extends BaseCell {
  rowSpan?: number;
  enable?: boolean;
}

// 分组单元格接口
export interface GroupCell extends Cell {
  groupName: string;
}

// 基础列接口
export interface BaseColumn {
  uuid: string;
  name: string;
  width: number;
  weight?: number;
  printWhenExpression?: string;
  tableHeader?: Cell;
  tableFooter?: Cell;
  groupHeaders?: GroupCell[];
  groupFooters?: GroupCell[];
  columnHeader?: Cell;
  columnFooter?: Cell;
  propertyExpressions?: any[];
  properties?: Record<string, string>;
}

// 普通列接口
export interface Column extends BaseColumn {
  detailCell?: Cell;
}

// 列组合接口
export interface ColumnGroup extends BaseColumn {
  children: (Column | ColumnGroup)[];
}

// 表格元素接口
export interface TableElement {
  type: 'table';
  uuid: string;
  x: number;
  y: number;
  width: number;
  height: number;
  columns?: Column[];
  children?: (Column | ColumnGroup)[];
  styles?: {
    tableHeader?: string;
    columnHeader?: string;
    detail?: string;
    columnFooter?: string;
    tableFooter?: string;
  };
  whenNoDataType?: string;
  horizontalPosition?: string;
  shrinkWidth?: string;
  printOrder?: string;
  ignoreWidth?: string;
  dataset?: {
    name: string;
    uuid?: string;
    connectionExpression?: string;
    parameters?: any[];
  };
  tableHeader?: {
    height?: number;
    printWhenExpression?: string;
  };
  columnHeader?: {
    height?: number;
    printWhenExpression?: string;
  };
  groupHeaders?: {
    groupName: string;
    height?: number;
    printWhenExpression?: string;
  }[];
  detail?: {
    height?: number;
    printWhenExpression?: string;
  };
  groupFooters?: {
    groupName: string;
    height?: number;
    printWhenExpression?: string;
  }[];
  columnFooter?: {
    height?: number;
    printWhenExpression?: string;
  };
  tableFooter?: {
    height?: number;
    printWhenExpression?: string;
  };
  noData?: {
    height?: number;
    style?: string;
    elements?: any[];
  };
}

// 列访问者接口（用于访问者模式）
export interface ColumnVisitor<T> {
  visitColumn(column: Column): T;
  visitColumnGroup(columnGroup: ColumnGroup): T;
}

// 列工厂接口
export interface ColumnFactory {
  createColumn(column: any): Column;
  createColumnGroup(group: any): ColumnGroup;
  createColumns(columns: any[]): (Column | ColumnGroup)[];
}
