import type { Column, ColumnGroup, BaseColumn } from '../../types/table';

/**
 * 列工厂实现类，用于创建表格列相关对象
 */
export class ColumnFactoryImpl {
  /**
   * 创建普通列
   * @param column 列配置对象
   * @returns 创建的列对象
   */
  createColumn(column: any): Column {
    return {
      uuid: column.uuid || crypto.randomUUID(),
      name: column.name || `Column`,
      width: column.width || 100,
      weight: column.weight,
      printWhenExpression: column.printWhenExpression,
      tableHeader: column.tableHeader,
      tableFooter: column.tableFooter,
      groupHeaders: column.groupHeaders,
      groupFooters: column.groupFooters,
      columnHeader: column.columnHeader,
      columnFooter: column.columnFooter,
      detailCell: column.detailCell,
      propertyExpressions: column.propertyExpressions,
      properties: column.properties
    };
  }

  /**
   * 创建列组合
   * @param group 列组合配置对象
   * @returns 创建的列组合对象
   */
  createColumnGroup(group: any): ColumnGroup {
    const columnGroup: ColumnGroup = {
      uuid: group.uuid || crypto.randomUUID(),
      name: group.name || `Group`,
      width: group.width || this.calculateGroupWidth(group.children),
      weight: group.weight,
      printWhenExpression: group.printWhenExpression,
      tableHeader: group.tableHeader,
      tableFooter: group.tableFooter,
      groupHeaders: group.groupHeaders,
      groupFooters: group.groupFooters,
      columnHeader: group.columnHeader,
      columnFooter: group.columnFooter,
      propertyExpressions: group.propertyExpressions,
      properties: group.properties,
      children: []
    };

    // 递归创建子列
    if (group.children) {
      columnGroup.children = this.createColumns(group.children);
    }

    return columnGroup;
  }

  /**
   * 批量创建列
   * @param columns 列配置对象数组
   * @returns 创建的列对象数组
   */
  createColumns(columns: any[]): (Column | ColumnGroup)[] {
    return columns.map(item => {
      if (item.children) {
        return this.createColumnGroup(item);
      } else {
        return this.createColumn(item);
      }
    });
  }

  /**
   * 计算列组合的宽度
   * @param children 子列数组
   * @returns 计算后的宽度
   */
  private calculateGroupWidth(children: any[]): number {
    if (!children || children.length === 0) {
      return 0;
    }

    return children.reduce((sum, child) => {
      if (child.children) {
        return sum + this.calculateGroupWidth(child.children);
      } else {
        return sum + (child.width || 0);
      }
    }, 0);
  }
}

/**
 * 表格工具类，提供表格相关的操作方法
 */
export class TableUtils {
  private static columnFactory = new ColumnFactoryImpl();

  /**
   * 计算列组合的宽度
   * @param columnGroup 列组合
   * @returns 计算后的宽度
   */
  static calculateColumnGroupWidth(columnGroup: ColumnGroup): number {
    return columnGroup.children.reduce((sum, child) => {
      if ('children' in child) {
        return sum + this.calculateColumnGroupWidth(child);
      } else {
        return sum + child.width;
      }
    }, 0);
  }

  /**
   * 更新列组合的宽度
   * @param columnGroup 列组合
   */
  static updateColumnGroupWidth(columnGroup: ColumnGroup): void {
    columnGroup.width = this.calculateColumnGroupWidth(columnGroup);
  }

  /**
   * 递归更新所有列组合的宽度
   * @param columns 列数组
   */
  static updateAllColumnGroupWidths(columns: (Column | ColumnGroup)[]): void {
    columns.forEach(column => {
      if ('children' in column) {
        this.updateAllColumnGroupWidths(column.children);
        this.updateColumnGroupWidth(column);
      }
    });
  }

  /**
   * 计算列组合包含的叶子列数量
   * @param columnGroup 列组合
   * @returns 叶子列数量
   */
  static countLeafColumns(columnGroup: ColumnGroup): number {
    return columnGroup.children.reduce((count, child) => {
      if ('children' in child) {
        return count + this.countLeafColumns(child);
      } else {
        return count + 1;
      }
    }, 0);
  }

  /**
   * 获取所有叶子列
   * @param columns 列数组
   * @returns 叶子列数组
   */
  static getLeafColumns(columns: (Column | ColumnGroup)[]): Column[] {
    const leafColumns: Column[] = [];

    const collectLeafColumns = (items: (Column | ColumnGroup)[]) => {
      items.forEach(item => {
        if ('children' in item) {
          collectLeafColumns(item.children);
        } else {
          leafColumns.push(item);
        }
      });
    };

    collectLeafColumns(columns);
    return leafColumns;
  }

  /**
   * 深度优先遍历列结构
   * @param columns 列数组
   * @param callback 回调函数
   */
  static traverseColumns(columns: (Column | ColumnGroup)[], callback: (column: Column | ColumnGroup) => void): void {
    columns.forEach(column => {
      callback(column);
      if ('children' in column) {
        this.traverseColumns(column.children, callback);
      }
    });
  }

  /**
   * 查找列 by UUID
   * @param columns 列数组
   * @param uuid 列的UUID
   * @returns 找到的列，未找到则返回null
   */
  static findColumnByUuid(columns: (Column | ColumnGroup)[], uuid: string): Column | ColumnGroup | null {
    let found: Column | ColumnGroup | null = null;

    this.traverseColumns(columns, column => {
      if (column.uuid === uuid) {
        found = column;
      }
    });

    return found;
  }

  /**
   * 移动列
   * @param columns 列数组
   * @param fromIndex 原索引
   * @param toIndex 目标索引
   * @returns 移动后的列数组
   */
  static moveColumn(columns: (Column | ColumnGroup)[], fromIndex: number, toIndex: number): (Column | ColumnGroup)[] {
    if (fromIndex < 0 || fromIndex >= columns.length || toIndex < 0 || toIndex >= columns.length) {
      return columns;
    }

    const newColumns = [...columns];
    const movedColumn = newColumns.splice(fromIndex, 1)[0];
    if (movedColumn) {
      newColumns.splice(toIndex, 0, movedColumn);

      // 更新列组合的宽度
      this.updateAllColumnGroupWidths(newColumns);
    }

    return newColumns;
  }

  /**
   * 添加列
   * @param columns 列数组
   * @param column 要添加的列
   * @param index 插入位置，默认为末尾
   * @returns 添加后的列数组
   */
  static addColumn(columns: (Column | ColumnGroup)[], column: Column | ColumnGroup, index?: number): (Column | ColumnGroup)[] {
    const newColumns = [...columns];
    if (index !== undefined && index >= 0 && index <= newColumns.length) {
      newColumns.splice(index, 0, column);
    } else {
      newColumns.push(column);
    }

    // 更新列组合的宽度
    this.updateAllColumnGroupWidths(newColumns);

    return newColumns;
  }

  /**
   * 删除列
   * @param columns 列数组
   * @param uuid 要删除的列的UUID
   * @returns 删除后的列数组
   */
  static removeColumn(columns: (Column | ColumnGroup)[], uuid: string): (Column | ColumnGroup)[] {
    const newColumns = [...columns];
    const index = newColumns.findIndex(column => column.uuid === uuid);

    if (index !== -1) {
      newColumns.splice(index, 1);
      // 更新列组合的宽度
      this.updateAllColumnGroupWidths(newColumns);
    } else {
      // 递归查找并删除子列
      newColumns.forEach(column => {
        if ('children' in column) {
          column.children = this.removeColumn(column.children, uuid);
        }
      });
      // 更新列组合的宽度
      this.updateAllColumnGroupWidths(newColumns);
    }

    return newColumns;
  }
}
