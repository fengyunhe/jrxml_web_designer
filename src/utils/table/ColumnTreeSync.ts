import type { TableElement, Column, ColumnGroup, Cell } from '../../types/table';
import { TableUtils } from './ColumnFactory';

/**
 * 同步表格的 columns 平层数组与 children 层级结构。
 * children 为数据源，columns 从 children 重建。
 */
export function syncTableColumns(tableElement: TableElement): void {
  const children = tableElement.children || [];

  // 递归更新所有列组合的宽度
  TableUtils.updateAllColumnGroupWidths(children);

  // 从 children 重建 columns
  tableElement.columns = TableUtils.getLeafColumns(children);

  // 计算最大嵌套层级并更新未分组根级列的 rowSpan
  const maxDepth = calculateMaxDepth({ children });
  const requiredRowSpan = maxDepth;

  children.forEach((child) => {
    if (!('children' in child)) {
      // 未分组的根级叶子列
      if (child.tableHeader) child.tableHeader.rowSpan = requiredRowSpan;
      if (child.columnHeader) child.columnHeader.rowSpan = requiredRowSpan;
      if (child.columnFooter) child.columnFooter.rowSpan = requiredRowSpan;
      if (child.tableFooter) child.tableFooter.rowSpan = requiredRowSpan;
    }
  });

  // 更新表格总宽度
  tableElement.width = children.reduce((sum, c) => sum + c.width, 0);
}

/**
 * 递归计算树的最大深度
 */
function calculateMaxDepth(node: { children?: (Column | ColumnGroup)[] }, depth: number = 0): number {
  if (!node.children || node.children.length === 0) return depth;
  let maxDepth = depth;
  for (const child of node.children) {
    if ('children' in child) {
      const childDepth = calculateMaxDepth(child, depth + 1);
      if (childDepth > maxDepth) maxDepth = childDepth;
    }
  }
  return maxDepth;
}

/**
 * 创建一个默认的叶子列
 */
export function createDefaultColumn(name: string, width: number = 100): Column {
  return {
    uuid: crypto.randomUUID(),
    name,
    width,
    columnHeader: {
      enable: true,
      element: {
        type: 'staticText',
        x: 0,
        y: 0,
        width,
        height: 30,
        text: name,
        textAlignment: 'Center',
        verticalAlignment: 'Middle',
      },
    },
    detailCell: {
      enable: true,
      element: {
        type: 'textField',
        x: 0,
        y: 0,
        width,
        height: 30,
        expression: '',
        textAlignment: 'Center',
        verticalAlignment: 'Middle',
      },
    },
  };
}

/**
 * 创建一个空的列组合（无子列）
 */
export function createDefaultColumnGroup(name: string): ColumnGroup {
  return {
    uuid: crypto.randomUUID(),
    name,
    width: 0,
    columnHeader: {
      enable: true,
      element: {
        type: 'staticText',
        x: 0,
        y: 0,
        width: 0,
        height: 30,
        text: name,
        textAlignment: 'Center',
        verticalAlignment: 'Middle',
      },
    },
    children: [],
  };
}

/**
 * 在父级 children 数组中查找包含目标 uuid 的数组，并返回该数组和目标索引。
 */
export function findInParentArray(
  children: (Column | ColumnGroup)[],
  targetUuid: string,
): { parent: (Column | ColumnGroup)[]; index: number } | null {
  for (let i = 0; i < children.length; i++) {
    if (children[i].uuid === targetUuid) {
      return { parent: children, index: i };
    }
    if ('children' in children[i]) {
      const found = findInParentArray((children[i] as ColumnGroup).children, targetUuid);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 解散列组合：将组的子列提升到父级数组中组所在的位置
 */
export function ungroupColumnGroup(
  children: (Column | ColumnGroup)[],
  groupUuid: string,
): void {
  const result = findInParentArray(children, groupUuid);
  if (!result) return;

  const { parent, index } = result;
  const group = parent[index] as ColumnGroup;
  if (!('children' in group)) return;

  // 替换组为它的子列
  parent.splice(index, 1, ...group.children);
}
