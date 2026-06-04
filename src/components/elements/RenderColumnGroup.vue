<template>
    <!-- 渲染所有分组行 -->
    <template v-for="(row, rowIndex) in groupRows" :key="rowIndex">
        <!-- 只有当行高大于0时才渲染该行 -->
        <template v-if="calculateRowHeight(row) > 0">
            <tr
                :class="['column-group-row', type]"
                :style="{
                    height: `${calculateRowHeight(row)}px`,
                    ...getRowStyle(type),
                }"
                @mousedown="(e) => handleRowMouseDown(e, rowIndex, row)"
            >
                <template v-for="(cell, cellIndex) in row" :key="cell.key">
                    <!-- 根据类型选择使用th还是td -->
                    <template v-if="type === 'tableHeader'">
                        <th
                            :class="[
                                'column-group-cell',
                                { 'column-selected': isCellSelected(cell) },
                            ]"
                            :colspan="cell.colspan"
                            :rowspan="cell.rowspan"
                            :style="getCellContainerStyle(cell, type)"
                            @click="handleCellClick(cell, $event)"
                            @contextmenu.stop="
                                handleCellContextMenu(cell, $event)
                            "
                        >
                            <div
                                class="cell-content"
                                :style="getCellContentStyle(cell, type)"
                            >
                                <template v-if="cell.content.tableHeader">
                                    <template
                                        v-if="
                                            cell.content.tableHeader.element
                                                ?.type === 'staticText'
                                        "
                                    >
                                        <div class="static-text">
                                            {{
                                                cell.content.tableHeader.element
                                                    ?.text || ""
                                            }}
                                        </div>
                                    </template>
                                    <template
                                        v-else-if="
                                            cell.content.tableHeader.element
                                                ?.type === 'textField'
                                        "
                                    >
                                        <div class="text-field">
                                            {{
                                                cell.content.tableHeader.element
                                                    ?.expression || ""
                                            }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="static-text">
                                            {{
                                                cell.content.tableHeader.element
                                                    ?.text || ""
                                            }}
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <div class="static-text"></div>
                                </template>
                            </div>
                        </th>
                    </template>
                    <template v-else-if="type === 'columnHeader'">
                        <th
                            :class="[
                                'column-group-cell',
                                { 'column-selected': isCellSelected(cell) },
                            ]"
                            :colspan="cell.colspan"
                            :rowspan="cell.rowspan"
                            :style="getCellContainerStyle(cell, type)"
                            @click="handleCellClick(cell, $event)"
                            @contextmenu.stop="
                                handleCellContextMenu(cell, $event)
                            "
                        >
                            <div
                                class="cell-content"
                                :style="getCellContentStyle(cell, type)"
                            >
                                <template v-if="cell.content.columnHeader">
                                    <template
                                        v-if="
                                            cell.content.columnHeader.element
                                                ?.type === 'staticText'
                                        "
                                    >
                                        <div class="static-text">
                                            {{
                                                cell.content.columnHeader
                                                    .element?.text || ""
                                            }}
                                        </div>
                                    </template>
                                    <template
                                        v-else-if="
                                            cell.content.columnHeader.element
                                                ?.type === 'textField'
                                        "
                                    >
                                        <div class="text-field">
                                            {{
                                                cell.content.columnHeader
                                                    .element?.expression || ""
                                            }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="column-name">
                                            {{ cell.content.name }}
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <div class="static-text"></div>
                                </template>
                            </div>
                        </th>
                    </template>
                    <template v-else-if="type === 'columnFooter'">
                        <th
                            :class="[
                                'column-group-cell',
                                { 'column-selected': isCellSelected(cell) },
                            ]"
                            :colspan="cell.colspan"
                            :rowspan="cell.rowspan"
                            :style="getCellContainerStyle(cell, type)"
                            @click="handleCellClick(cell, $event)"
                            @contextmenu.stop="
                                handleCellContextMenu(cell, $event)
                            "
                        >
                            <div
                                class="cell-content"
                                :style="getCellContentStyle(cell, type)"
                            >
                                <template v-if="cell.content.columnFooter">
                                    <template
                                        v-if="
                                            cell.content.columnFooter.element
                                                ?.type === 'staticText'
                                        "
                                    >
                                        <div class="static-text">
                                            {{
                                                cell.content.columnFooter
                                                    .element?.text || ""
                                            }}
                                        </div>
                                    </template>
                                    <template
                                        v-else-if="
                                            cell.content.columnFooter.element
                                                ?.type === 'textField'
                                        "
                                    >
                                        <div class="text-field">
                                            {{
                                                cell.content.columnFooter
                                                    .element?.expression || ""
                                            }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="static-text">
                                            {{
                                                cell.content.columnFooter
                                                    .element?.text || ""
                                            }}
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <div class="static-text"></div>
                                </template>
                            </div>
                        </th>
                    </template>
                    <template v-else-if="type === 'tableFooter'">
                        <th
                            :class="[
                                'column-group-cell',
                                { 'column-selected': isCellSelected(cell) },
                            ]"
                            :colspan="cell.colspan"
                            :rowspan="cell.rowspan"
                            :style="getCellContainerStyle(cell, type)"
                            @click="handleCellClick(cell, $event)"
                            @contextmenu.stop="
                                handleCellContextMenu(cell, $event)
                            "
                        >
                            <div
                                class="cell-content"
                                :style="getCellContentStyle(cell, type)"
                            >
                                <template v-if="cell.content.tableFooter">
                                    <template
                                        v-if="
                                            cell.content.tableFooter.element
                                                ?.type === 'staticText'
                                        "
                                    >
                                        <div class="static-text">
                                            {{
                                                cell.content.tableFooter.element
                                                    ?.text || ""
                                            }}
                                        </div>
                                    </template>
                                    <template
                                        v-else-if="
                                            cell.content.tableFooter.element
                                                ?.type === 'textField'
                                        "
                                    >
                                        <div class="text-field">
                                            {{
                                                cell.content.tableFooter.element
                                                    ?.expression || ""
                                            }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="static-text">
                                            {{
                                                cell.content.tableFooter.element
                                                    ?.text || ""
                                            }}
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <div class="static-text"></div>
                                </template>
                            </div>
                        </th>
                    </template>
                </template>
            </tr>
        </template>
    </template>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    group: any;
    level: number;
    type: "tableHeader" | "columnHeader" | "columnFooter" | "tableFooter";
    columns?: any[];
    reportStyles?: any[];
    tableStyles?: {
        tableHeader: string;
        columnHeader: string;
        columnFooter: string;
        detailCell: string;
    };
}>();

const emit = defineEmits<{
    columnClick: [column: any, event: MouseEvent, index?: number];
    columnContextMenu: [column: any, event: MouseEvent, index?: number];
    "row-resize-start": [
        info: {
            rowIndex: number;
            startY: number;
            originalHeight: number;
            type: string;
            rows: any[][];
        },
    ];
}>();

// 计算每个分组包含的叶子节点数量（用于计算colspan）
function countLeafColumns(node: any): number {
    if (!node.children || node.children.length === 0) {
        return 1;
    }
    return node.children.reduce(
        (sum: number, child: any) => sum + countLeafColumns(child),
        0,
    );
}

// 计算节点的总宽度（用于设置单元格宽度）
function calculateNodeWidth(node: any): number {
    if (!node.children || node.children.length === 0) {
        // 叶子节点，返回自身宽度
        return node.width || 0;
    }
    // 分组节点，计算所有子节点宽度总和
    return node.children.reduce(
        (sum: number, child: any) => sum + calculateNodeWidth(child),
        0,
    );
}

// 计算节点的深度
function calculateNodeDepth(node: any, depth: number = 0): number {
    if (!node.children || node.children.length === 0) {
        return depth;
    }
    let maxDepth = depth;
    for (const child of node.children) {
        const childDepth = calculateNodeDepth(child, depth + 1);
        if (childDepth > maxDepth) {
            maxDepth = childDepth;
        }
    }
    return maxDepth;
}

// 获取所有叶子节点
function getLeafNodes(node: any): any[] {
    const leaves: any[] = [];
    if (!node.children || node.children.length === 0) {
        leaves.push(node);
    } else {
        for (const child of node.children) {
            leaves.push(...getLeafNodes(child));
        }
    }
    return leaves;
}

// 构建分组行数据，正确处理colspan和rowspan
function buildGroupRows(group: any): any[][] {
    console.log("group", group);
    // 获取所有叶子节点
    const allLeaves = getLeafNodes(group);
    const totalColumns = allLeaves.length;

    // 计算所有节点的最大深度
    function getMaxDepth(nodes: any[]): number {
        let max = 0;
        for (const node of nodes) {
            const depth = calculateNodeDepth(node);
            if (depth > max) {
                max = depth;
            }
        }
        return max;
    }

    const maxDepth = getMaxDepth(group.children);

    // 创建行数组
    const rows: any[][] = [];
    for (let i = 0; i <= maxDepth; i++) {
        rows[i] = [];
    }

    // 递归构建表格
    function buildTable(node: any, startColumn: number, depth: number) {
        // 计算该节点应该跨越的列数（colspan）
        const colspan = countLeafColumns(node);

        // 检查节点是否定义了对应的 header
        const hasHeader = node[props.type];

        // 计算该节点应该跨越的行数（rowspan）
        let rowspan: number;

        // 根据类型调整渲染逻辑
        if (props.type === "columnHeader") {
            // 对于Column Header，检查是否实际定义了columnHeader
            if (node.children && node.children.length > 0) {
                if (hasHeader) {
                    // 有子节点且定义了columnHeader，渲染为组合单元格
                    rowspan = 1;
                } else {
                    // 有子节点但没有定义columnHeader，不创建单元格，直接递归子节点
                    let currentColumn = startColumn;
                    for (const child of node.children) {
                        buildTable(child, currentColumn, depth);
                        currentColumn += countLeafColumns(child);
                    }
                    return;
                }
            } else {
                // 叶子节点，rowspan为从当前深度到最大深度的行数
                rowspan = maxDepth - depth + 1;
            }
        } else if (props.type === "columnFooter") {
            // 对于Column Footer，检查是否实际定义了columnFooter
            if (node.children && node.children.length > 0) {
                if (hasHeader) {
                    rowspan = 1;
                } else {
                    let currentColumn = startColumn;
                    for (const child of node.children) {
                        buildTable(child, currentColumn, depth);
                        currentColumn += countLeafColumns(child);
                    }
                    return;
                }
            } else {
                rowspan = maxDepth - depth + 1;
            }
        } else if (props.type === "tableFooter") {
            // 对于Table Footer，检查是否实际定义了tableFooter
            if (node.children && node.children.length > 0) {
                if (hasHeader) {
                    rowspan = 1;
                } else {
                    let currentColumn = startColumn;
                    for (const child of node.children) {
                        buildTable(child, currentColumn, depth);
                        currentColumn += countLeafColumns(child);
                    }
                    return;
                }
            } else {
                rowspan = maxDepth - depth + 1;
            }
        } else {
            // 对于Table Header，检查是否实际定义了tableHeader
            if (node.children && node.children.length > 0) {
                if (hasHeader) {
                    rowspan = 1;
                } else {
                    let currentColumn = startColumn;
                    for (const child of node.children) {
                        buildTable(child, currentColumn, depth);
                        currentColumn += countLeafColumns(child);
                    }
                    return;
                }
            } else {
                rowspan = maxDepth - depth + 1;
            }
        }

        // 创建单元格
        const cell = {
            key: `${node.uuid || Math.random()}-${depth}-${startColumn}`,
            content: node,
            colspan,
            rowspan,
        };

        // 确保当前行存在
        if (!rows[depth]) {
            rows[depth] = [];
        }

        // 添加到当前行
        rows[depth].push(cell);

        // 如果有子节点，继续递归构建
        if (node.children && node.children.length > 0) {
            let currentColumn = startColumn;
            for (const child of node.children) {
                buildTable(child, currentColumn, depth + 1);
                currentColumn += countLeafColumns(child);
            }
        }
    }

    // 开始构建表格，处理根分组的所有子节点
    let currentColumn = 0;
    for (const child of group.children) {
        buildTable(child, currentColumn, 0);
        currentColumn += countLeafColumns(child);
    }

    // 移除空行
    return rows.filter((row) => row.length > 0);
}

// 计算所有分组行
const groupRows = computed(() => buildGroupRows(props.group));

// 计算行高
function calculateRowHeight(row: any[]) {
    // 默认行高
    let defaultHeight = 30;

    if (row && row.length > 0) {
        const firstCell = row[0];
        const cellContent = firstCell.content;

        // 根据类型获取对应的高度
        if (cellContent && cellContent[props.type]) {
            return cellContent[props.type].height || defaultHeight;
        }
    }

    // 根据类型设置默认行高
    if (props.type === "tableHeader") {
        defaultHeight = 30;
    } else if (props.type === "columnHeader") {
        defaultHeight = 30;
    }

    return defaultHeight;
}

// 获取单元格容器样式（应用到th元素）
function getCellContainerStyle(cell: any, type: string) {
    const content = cell.content;
    let element;
    if (type === "tableHeader" && content.tableHeader) {
        element = content.tableHeader;
    } else if (type === "columnHeader" && content.columnHeader) {
        element = content.columnHeader;
    }

    const styles: any = {
        padding: "0",
        margin: "0",
        boxSizing: "border-box",
    };

    // 计算并设置宽度，基于JRXML中定义的宽度
    const width = calculateNodeWidth(content);
    if (width > 0) {
        styles.width = `${width}px`;
    }

    if (element) {
        // 背景颜色
        if (element.mode === "Opaque" && element.backcolor) {
            styles.backgroundColor = element.backcolor;
        }

        // 边框样式
        if (element.box && element.box.pen) {
            const pen = element.box.pen;
            if (pen.lineWidth && pen.lineWidth > 0) {
                styles.border = `${pen.lineWidth}px ${pen.lineStyle || "solid"} ${pen.lineColor || "#000000"}`;
            }
        } else if (element.borderWidth && element.borderWidth > 0) {
            styles.border = `${element.borderWidth}px solid #000000`;
        } else {
            styles.border = "1px solid #ccc";
        }
    } else {
        // 默认样式
        styles.backgroundColor = type === "tableHeader" ? "#FFFFFF" : "#FFFFFF";
        styles.border = "1px solid #ccc";
    }

    return styles;
}

// 根据style名称获取样式对象
function getStyleByName(styleName: string) {
    if (!props.reportStyles || !styleName) return null;
    return (
        props.reportStyles.find((style: any) => style.name === styleName) ||
        null
    );
}

// 从JRXML style转换为CSS样式
function convertStyleToCSS(style: any) {
    if (!style) return {};

    const styles: any = {};

    // 文本样式
    if (style.fontSize) {
        styles.fontSize = `${style.fontSize}px`;
    }
    if (style.forecolor) {
        styles.color = style.forecolor;
    }
    if (style.isBold) {
        styles.fontWeight = "bold";
    }
    if (style.isItalic) {
        styles.fontStyle = "italic";
    }
    if (style.isUnderline) {
        styles.textDecoration = "underline";
    }
    if (style.mode === "Opaque" && style.backcolor) {
        styles.backgroundColor = style.backcolor;
    }

    // 文本对齐方式
    if (style.textAlignment) {
        const align = style.textAlignment.toLowerCase();
        switch (align) {
            case "left":
                styles.justifyContent = "flex-start";
                break;
            case "center":
                styles.justifyContent = "center";
                break;
            case "right":
                styles.justifyContent = "flex-end";
                break;
            case "justified":
                styles.justifyContent = "space-between";
                break;
            default:
                styles.justifyContent = "center";
        }
    }
    // 垂直对齐方式
    if (style.verticalAlignment) {
        const align = style.verticalAlignment.toLowerCase();
        switch (align) {
            case "top":
                styles.alignItems = "flex-start";
                break;
            case "middle":
                styles.alignItems = "center";
                break;
            case "bottom":
                styles.alignItems = "flex-end";
                break;
            default:
                styles.alignItems = "center";
        }
    }

    // 边框样式
    let borderWidth = 0;
    let borderStyle = "solid";
    let borderColor = "#000000";

    if (style.box && style.box.pen) {
        borderWidth = style.box.pen.lineWidth || 0;
        borderStyle = style.box.pen.lineStyle || "solid";
        borderColor = style.box.pen.lineColor || "#000000";
    }

    if (borderWidth > 0) {
        styles.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
    }

    return styles;
}

// 获取行样式
function getRowStyle(rowType: string) {
    // 从tableStyles中获取样式
    if (props.tableStyles) {
        let styleName = "";
        switch (rowType) {
            case "tableHeader":
                styleName = props.tableStyles.tableHeader;
                break;
            case "columnHeader":
                styleName = props.tableStyles.columnHeader;
                break;
        }

        if (styleName) {
            const style = getStyleByName(styleName);
            if (style) {
                return convertStyleToCSS(style);
            }
        }
    }
    return {};
}

// 获取单元格内容样式（应用到.cell-content元素）
function getCellContentStyle(cell: any, type: string) {
    const content = cell.content;
    let element;
    if (type === "tableHeader" && content.tableHeader) {
        element = content.tableHeader;
    } else if (type === "columnHeader" && content.columnHeader) {
        element = content.columnHeader;
    }

    const styles: any = {
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: "0 5px",
        boxSizing: "border-box",
    };

    if (element) {
        // 字体样式
        if (element.font) {
            if (element.font.isBold) {
                styles.fontWeight = "bold";
            }
            if (element.font.isItalic) {
                styles.fontStyle = "italic";
            }
            if (element.font.isUnderline) {
                styles.textDecoration = "underline";
            }
            if (element.font.size) {
                styles.fontSize = `${element.font.size}pt`;
            } else {
                // 默认字体大小10，与JasperReport Studio一致
                styles.fontSize = "10px";
            }
        } else {
            // 兼容旧格式
            if (element.fontSize) {
                styles.fontSize = `${element.fontSize}px`;
            } else {
                // 默认字体大小10，与JasperReport Studio一致
                styles.fontSize = "10px";
            }
            if (element.isBold) {
                styles.fontWeight = "bold";
            }
            if (element.isItalic) {
                styles.fontStyle = "italic";
            }
            if (element.isUnderline) {
                styles.textDecoration = "underline";
            }
        }

        // 文字颜色
        if (element.forecolor) {
            styles.color = element.forecolor;
        }
        // 背景颜色
        if (element.mode === "Opaque" && element.backcolor) {
            styles.backgroundColor = element.backcolor;
        }

        // 水平对齐方式
        if (element.textAlignment) {
            const align = element.textAlignment.toLowerCase();
            switch (align) {
                case "left":
                    styles.justifyContent = "flex-start";
                    break;
                case "right":
                    styles.justifyContent = "flex-end";
                    break;
                case "center":
                    styles.justifyContent = "center";
                    break;
                case "justified":
                    styles.justifyContent = "space-between";
                    break;
                default:
                    console.log("未知的水平对齐方式:", align);
                    styles.justifyContent = "center";
            }
        } else {
            styles.justifyContent = "center";
        }

        // 垂直对齐方式
        if (element.verticalAlignment) {
            const align = element.verticalAlignment.toLowerCase();
            switch (align) {
                case "top":
                    styles.alignItems = "flex-start";
                    break;
                case "bottom":
                    styles.alignItems = "flex-end";
                    break;
                case "middle":
                    styles.alignItems = "center";
                    break;
                default:
                    styles.alignItems = "center";
            }
        } else {
            styles.alignItems = "center";
        }
    } else {
        // 默认样式
        styles.fontWeight = "600";
        styles.color = "#333";
        styles.justifyContent = "center";
        styles.alignItems = "center";
    }

    return styles;
}

function isCellSelected(cell: any): boolean {
    return false;
}

function handleCellClick(cell: any, event: MouseEvent) {
    if (!cell.content.children) {
        emit("columnClick", cell.content, event);
    }
    // 不阻止事件冒泡，让事件传递到父组件
}

function handleCellContextMenu(cell: any, event: MouseEvent) {
    if (!cell.content.children) {
        emit("columnContextMenu", cell.content, event);
    }
}

// ===== 行高拖拽调整 =====
function handleRowMouseDown(event: MouseEvent, rowIndex: number, row: any[]) {
    // 只在点击 ::after 伪元素（即 tr 自身）时触发行高拖拽，
    // 点击 th/td 子元素时由元素拖动处理，不冲突
    if (event.target !== event.currentTarget) return;

    const tr = event.currentTarget as HTMLElement;
    const rect = tr.getBoundingClientRect();
    const distanceFromBottom = rect.bottom - event.clientY;

    if (distanceFromBottom <= 5) {
        const height = calculateRowHeight(row);
        emit("row-resize-start", {
            rowIndex,
            startY: event.clientY,
            originalHeight: height,
            type: props.type,
            rows: groupRows.value,
        });
        event.preventDefault();
        event.stopPropagation();
    }
}
</script>

<style scoped>
.column-group-row {
    /* 行高由动态计算确定，不使用硬编码值 */
    position: relative;
}

.column-group-row::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    cursor: ns-resize;
    z-index: 1;
}

.column-group-row:hover::after {
    background-color: rgba(64, 158, 255, 0.2);
}

.column-group-cell {
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    overflow: hidden;
    padding: 0;
    margin: 0;
    border: 1px solid transparent;
}

.column-group-cell:hover {
    background-color: rgba(64, 158, 255, 0.1);
}

.column-selected {
    background-color: rgba(64, 158, 255, 0.15) !important;
    border: 1px solid rgba(64, 158, 255, 0.5) !important;
}

.cell-content {
    width: 100%;
    height: 100%;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    font-style: inherit;
    color: inherit;
}

.cell-content.empty {
    color: #999;
    font-style: italic;
}

.static-text,
.text-field,
.column-name {
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    font-style: inherit;
    color: inherit;
}

.text-field {
    font-family: monospace;
}
</style>
