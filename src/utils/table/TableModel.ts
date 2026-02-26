import type { TableElement, Column, ColumnGroup, Cell } from '../../types/table';
import { TableUtils } from './ColumnFactory';

/**
 * 表格模型类，用于管理表格的状态和操作
 */
export class TableModel {
  private table: TableElement;

  constructor(table: TableElement) {
    this.table = table;
  }

  /**
   * 获取表格元素
   * @returns 表格元素
   */
  getTable(): TableElement {
    return this.table;
  }

  /**
   * 获取所有列（包括普通列和列组合）
   * @returns 列数组
   */
  getColumns(): (Column | ColumnGroup)[] {
    return this.table.children || this.table.columns || [];
  }

  /**
   * 设置列数组
   * @param columns 列数组
   */
  setColumns(columns: (Column | ColumnGroup)[]): void {
    if (this.table.children) {
      this.table.children = columns;
    } else {
      this.table.columns = columns;
    }
    // 更新所有列组合的宽度
    TableUtils.updateAllColumnGroupWidths(columns);
  }

  /**
   * 添加列
   * @param column 要添加的列
   * @param index 插入位置，默认为末尾
   */
  addColumn(column: Column | ColumnGroup, index?: number): void {
    const columns = this.getColumns();
    const newColumns = TableUtils.addColumn(columns, column, index);
    this.setColumns(newColumns);
  }

  /**
   * 移动列
   * @param fromIndex 原索引
   * @param toIndex 目标索引
   */
  moveColumn(fromIndex: number, toIndex: number): void {
    const columns = this.getColumns();
    const newColumns = TableUtils.moveColumn(columns, fromIndex, toIndex);
    this.setColumns(newColumns);
  }

  /**
   * 删除列
   * @param uuid 要删除的列的UUID
   */
  removeColumn(uuid: string): void {
    const columns = this.getColumns();
    const newColumns = TableUtils.removeColumn(columns, uuid);
    this.setColumns(newColumns);
  }

  /**
   * 查找列 by UUID
   * @param uuid 列的UUID
   * @returns 找到的列，未找到则返回null
   */
  findColumnByUuid(uuid: string): Column | ColumnGroup | null {
    const columns = this.getColumns();
    return TableUtils.findColumnByUuid(columns, uuid);
  }

  /**
   * 获取所有叶子列
   * @returns 叶子列数组
   */
  getLeafColumns(): Column[] {
    const columns = this.getColumns();
    return TableUtils.getLeafColumns(columns);
  }

  /**
   * 更新列的属性
   * @param uuid 列的UUID
   * @param updates 更新的属性
   */
  updateColumn(uuid: string, updates: Partial<Column | ColumnGroup>): void {
    const column = this.findColumnByUuid(uuid);
    if (column) {
      Object.assign(column, updates);
      // 如果是列组合，更新其宽度
      if ('children' in column) {
        TableUtils.updateColumnGroupWidth(column);
        // 递归更新父列组合的宽度
        this.updateParentColumnGroupWidths();
      } else {
        // 如果是普通列，更新所有父列组合的宽度
        this.updateParentColumnGroupWidths();
      }
    }
  }

  /**
   * 更新单元格的属性
   * @param columnUuid 列的UUID
   * @param cellType 单元格类型
   * @param updates 更新的属性
   */
  updateCell(columnUuid: string, cellType: keyof Pick<Column, 'tableHeader' | 'tableFooter' | 'columnHeader' | 'columnFooter' | 'detailCell'>,
    updates: Partial<Cell>): void {
    const column = this.findColumnByUuid(columnUuid);
    if (column) {
      // 检查 detailCell 只在 Column 类型中存在
      if (cellType === 'detailCell' && 'children' in column) {
        // ColumnGroup 没有 detailCell 属性，直接返回
        return;
      }
      
      // 类型断言，确保编译器理解我们已经处理了类型差异
      const columnWithCell = column as Column;
      if (!columnWithCell[cellType]) {
        columnWithCell[cellType] = {};
      }
      Object.assign(columnWithCell[cellType], updates);
    }
  }

  /**
   * 递归更新所有父列组合的宽度
   */
  private updateParentColumnGroupWidths(): void {
    const columns = this.getColumns();
    TableUtils.updateAllColumnGroupWidths(columns);
  }

  /**
   * 计算表格的总宽度
   * @returns 表格总宽度
   */
  calculateTotalWidth(): number {
    const columns = this.getColumns();
    return columns.reduce((sum, column) => {
      if ('children' in column) {
        return sum + column.width;
      } else {
        return sum + column.width;
      }
    }, 0);
  }

  /**
   * 更新表格宽度为实际列宽总和
   */
  updateTableWidth(): void {
    this.table.width = this.calculateTotalWidth();
  }

  /**
   * 验证表格结构
   * @returns 验证结果，包含是否有效和错误信息
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const columns = this.getColumns();

    // 检查是否有列
    if (columns.length === 0) {
      errors.push('表格至少需要有一列');
    }

    // 检查列宽度
    TableUtils.traverseColumns(columns, column => {
      if (column.width <= 0) {
        errors.push(`列 ${column.name} 的宽度必须大于0`);
      }
    });

    // 检查列组合的宽度是否与子列宽度之和一致
    TableUtils.traverseColumns(columns, column => {
      if ('children' in column) {
        const calculatedWidth = TableUtils.calculateColumnGroupWidth(column);
        if (column.width !== calculatedWidth) {
          errors.push(`列组合 ${column.name} 的宽度与子列宽度之和不一致`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 克隆表格模型
   * @returns 克隆的表格模型
   */
  clone(): TableModel {
    const clonedTable = JSON.parse(JSON.stringify(this.table)) as TableElement;
    return new TableModel(clonedTable);
  }
}
