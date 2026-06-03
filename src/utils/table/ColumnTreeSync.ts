import type {
  TableElement,
  Column,
  ColumnGroup,
  Cell,
} from "../../types/table";
import { TableUtils } from "./ColumnFactory";

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
    if (!("children" in child)) {
      // ungrouped root-level leaf column
      if (child.tableHeader) {
        child.tableHeader.rowSpan = requiredRowSpan;
        if (child.tableHeader.rowSpan > 1) {
          const singleRowHeight = getSingleRowHeight(child.tableHeader);
          child.tableHeader.height =
            singleRowHeight * child.tableHeader.rowSpan;
          if (child.tableHeader.element)
            child.tableHeader.element.height = child.tableHeader.height;
        }
      }
      if (child.columnHeader) {
        child.columnHeader.rowSpan = requiredRowSpan;
        if (child.columnHeader.rowSpan > 1) {
          const singleRowHeight = getSingleRowHeight(child.columnHeader);
          child.columnHeader.height =
            singleRowHeight * child.columnHeader.rowSpan;
          if (child.columnHeader.element)
            child.columnHeader.element.height = child.columnHeader.height;
        }
      }
      if (child.columnFooter) {
        child.columnFooter.rowSpan = requiredRowSpan;
        if (child.columnFooter.rowSpan > 1) {
          const singleRowHeight = getSingleRowHeight(child.columnFooter);
          child.columnFooter.height =
            singleRowHeight * child.columnFooter.rowSpan;
          if (child.columnFooter.element)
            child.columnFooter.element.height = child.columnFooter.height;
        }
      }
      if (child.tableFooter) {
        child.tableFooter.rowSpan = requiredRowSpan;
        if (child.tableFooter.rowSpan > 1) {
          const singleRowHeight = getSingleRowHeight(child.tableFooter);
          child.tableFooter.height =
            singleRowHeight * child.tableFooter.rowSpan;
          if (child.tableFooter.element)
            child.tableFooter.element.height = child.tableFooter.height;
        }
      }
    }
  });

  // 递归处理分组内嵌套的独立叶子列的 rowSpan 和高度
  inflateNestedStandaloneHeights(children, maxDepth, 0);

  // 更新表格总宽度
  tableElement.width = children.reduce((sum, c) => sum + c.width, 0);
}

/**
 * 递归计算树的最大深度
 */
function calculateMaxDepth(
  node: { children?: (Column | ColumnGroup)[] },
  depth: number = 0,
): number {
  if (!node.children || node.children.length === 0) return depth;
  let maxDepth = depth;
  for (const child of node.children) {
    if ("children" in child) {
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
        type: "staticText",
        x: 0,
        y: 0,
        width,
        height: 30,
        text: name,
        textAlignment: "Center",
        verticalAlignment: "Middle",
      },
    },
    detailCell: {
      enable: true,
      element: {
        type: "textField",
        x: 0,
        y: 0,
        width,
        height: 30,
        expression: "",
        textAlignment: "Center",
        verticalAlignment: "Middle",
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
        type: "staticText",
        x: 0,
        y: 0,
        width: 0,
        height: 30,
        text: name,
        textAlignment: "Center",
        verticalAlignment: "Middle",
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
    const child = children[i];
    if (!child) continue;
    if (child.uuid === targetUuid) {
      return { parent: children, index: i };
    }
    if ("children" in child) {
      const found = findInParentArray(
        (child as ColumnGroup).children,
        targetUuid,
      );
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
  if (!("children" in group)) return;

  // 替换组为它的子列
  parent.splice(index, 1, ...group.children);
}

/**
 * 从单元格中提取单行高度（如果已 inflate 过则除以 rowSpan 还原，否则返回默认值）
 */
function getSingleRowHeight(cell: Cell): number {
  const h = cell.height || (cell as any).element?.height || 30;
  const rs = cell.rowSpan || 1;
  if (rs <= 1) return h;
  // 如果高度等于默认值，说明从未 inflate 过，直接返回默认值
  if (h === 30) return 30;
  return Math.round(h / rs);
}

/**
 * 递归处理分组内嵌套的独立叶子列，设置 rowSpan 并 inflate 高度
 */
function inflateNestedStandaloneHeights(
  children: (Column | ColumnGroup)[],
  maxDepth: number,
  depth: number,
): void {
  for (const child of children) {
    if ("children" in child) {
      inflateNestedStandaloneHeights(
        (child as ColumnGroup).children,
        maxDepth,
        depth + 1,
      );
    } else {
      // 独立叶子列
      const rowSpan = Math.max(1, maxDepth - depth + 1);
      if (child.tableHeader && rowSpan > 1) {
        child.tableHeader.rowSpan = rowSpan;
        const singleRowHeight = getSingleRowHeight(child.tableHeader);
        child.tableHeader.height = singleRowHeight * rowSpan;
        if (child.tableHeader.element)
          child.tableHeader.element.height = child.tableHeader.height;
      }
      if (child.columnHeader && rowSpan > 1) {
        child.columnHeader.rowSpan = rowSpan;
        const singleRowHeight = getSingleRowHeight(child.columnHeader);
        child.columnHeader.height = singleRowHeight * rowSpan;
        if (child.columnHeader.element)
          child.columnHeader.element.height = child.columnHeader.height;
      }
      if (child.columnFooter && rowSpan > 1) {
        child.columnFooter.rowSpan = rowSpan;
        const singleRowHeight = getSingleRowHeight(child.columnFooter);
        child.columnFooter.height = singleRowHeight * rowSpan;
        if (child.columnFooter.element)
          child.columnFooter.element.height = child.columnFooter.height;
      }
      if (child.tableFooter && rowSpan > 1) {
        child.tableFooter.rowSpan = rowSpan;
        const singleRowHeight = getSingleRowHeight(child.tableFooter);
        child.tableFooter.height = singleRowHeight * rowSpan;
        if (child.tableFooter.element)
          child.tableFooter.element.height = child.tableFooter.height;
      }
    }
  }
}
