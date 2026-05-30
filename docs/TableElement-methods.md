# TableElement.vue 方法文档

文件路径: `src/components/elements/TableElement.vue`

## 模板相关

### 单元格内容渲染

表格使用原生 HTML `<table>` 元素渲染，分为 `<thead>`、`<tbody>`、`<tfoot>` 三个区域：

| 区域 | 行类型 | 条件 | 用途 |
|------|--------|------|------|
| thead | tableHeader | `hasTableHeader && tableHeaderHeight > 0` | 表格标题行（默认禁用） |
| thead | columnHeader | `columnHeaderHeight > 0` | 列标题行（始终显示） |
| tfoot | columnFooter | `columnFooterHeight > 0` | 列脚行 |
| tfoot | tableFooter | `tableFooterHeight > 0` | 表格脚注行 |
| tbody | detailCell | `detailCellHeight > 0` | 数据详情行 |

---

## 计算属性 (Computed)

### `getMaxCellHeight(getCell: (col: any) => any): number`
- **作用**: 遍历所有列，获取指定单元格类型的最大高度
- **参数**: `getCell` - 回调函数，从列对象中提取目标单元格
- **返回**: 所有列中该单元格类型的最大高度（默认 30px）
- **用途**: 用于计算行高，确保所有列的同一行高度一致

### `tableHeaderHeight`
- **作用**: 计算表头行高度
- **逻辑**: 调用 `getMaxCellHeight(col => col.tableHeader)` 取所有列中表头的最大高度

### `columnHeaderHeight`
- **作用**: 计算列头行高度
- **逻辑**: 调用 `getMaxCellHeight(col => col.columnHeader)` 取所有列中列头的最大高度

### `detailCellHeight`
- **作用**: 计算数据行高度
- **逻辑**: 调用 `getMaxCellHeight(col => col.detailCell)` 取所有列中数据单元格的最大高度

### `columnFooterHeight`
- **作用**: 计算列脚行高度
- **逻辑**: 调用 `getMaxCellHeight(col => col.columnFooter)` 取所有列中列脚的最大高度

### `tableFooterHeight`
- **作用**: 计算表格脚注行高度
- **逻辑**: 调用 `getMaxCellHeight(col => col.tableFooter)` 取所有列中表格脚注的最大高度

### `hasTableHeaderGroups`
- **作用**: 判断表格是否有分组表头
- **逻辑**: 递归检查 `element.children` 中是否有包含子列且定义了 `tableHeader` 的列组

### `hasColumnHeaderGroups`
- **作用**: 判断表格是否有分组列头
- **逻辑**: 递归检查 `element.children` 中是否有包含子列且定义了 `columnHeader` 的列组

### `hasTableHeader`
- **作用**: 判断表格是否应该显示表头行
- **逻辑**: 如果有分组则递归检查所有组；否则检查 `columns.some(c => c.hasTableHeader)`

### `rootGroup`
- **作用**: 将 `element.children` 包装为根组对象供 `RenderColumnGroup` 使用
- **结构**: `{ children: element.children || [] }`

### `columns`
- **作用**: 获取表格列数组
- **逻辑**: `tableElement.value.columns || []`

### `isSelected`
- **作用**: 判断表格元素是否被选中
- **逻辑**: 支持多选和单选，通过 `bandIndex + elementIndex + parentFrameIndex` 比较

---

## 方法 (Methods)

### 列操作

#### `isColumnSelected(index: number): boolean`
- **作用**: 判断指定索引的列是否被选中
- **参数**: `index` - 列索引
- **返回**: 是否在 `selectedColumns` 数组中

#### `handleColumnClick(index: number, event: MouseEvent)`
- **作用**: 处理列点击事件
- **逻辑**: 支持 Ctrl/Shift/Cmd 多选列

#### `moveColumn(index: number, direction: 'left' | 'right')`
- **作用**: 移动列顺序（左移或右移）
- **参数**: 
  - `index` - 当前列索引
  - `direction` - 移动方向
- **事件**: 触发 `moveColumn` 事件，冒泡到 PDFDesigner 执行实际移动

#### `handleRenderColumnClick(column: any, event: MouseEvent)`
- **作用**: 处理 RenderColumnGroup 组件中的列点击事件
- **逻辑**: 直接触发表格元素的选择事件

### 列宽拖拽

#### `startColumnResize(columnIndex: number, event: MouseEvent)`
- **作用**: 开始列宽拖拽调整
- **参数**:
  - `columnIndex` - 被拖拽列的索引
  - `event` - 鼠标事件
- **逻辑**: 
  1. 记录起始鼠标位置和两列原始宽度
  2. 注册 `mousemove` 和 `mouseup` 事件监听
  3. 设置鼠标样式为 `col-resize`
- **约束**: 最小列宽 30px，总宽度保持不变

#### `handleColumnResizeMove(e: MouseEvent)`
- **作用**: 处理拖拽过程中的鼠标移动
- **逻辑**:
  1. 计算鼠标移动距离 delta
  2. 更新左列和右列宽度（保持总宽度不变）
  3. 同步更新 `element.children` 中对应列的宽度
  4. 重新计算表格总宽度

#### `handleColumnResizeEnd()`
- **作用**: 结束列宽拖拽
- **逻辑**:
  1. 清理事件监听器
  2. 恢复鼠标样式
  3. 触发 `update-jrxml` 事件更新 JRXML

#### `updateChildrenColumnWidth(uuid: string, width: number)`
- **作用**: 递归在 `element.children` 树中查找并更新列宽
- **参数**:
  - `uuid` - 列的唯一标识
  - `width` - 新宽度值
- **逻辑**: 同步更新列的 `width` 属性和所有单元格的 `element.width`

#### `updateChildrenColumnWidthInGroup(children: any[], uuid: string, width: number)`
- **作用**: 在列组中递归查找并更新列宽
- **参数**:
  - `children` - 子列数组
  - `uuid` - 列的唯一标识
  - `width` - 新宽度值

### 单元格内联编辑

#### `startCellEditing(columnIndex: number, cellType: string)`
- **作用**: 开始单元格内联编辑
- **参数**:
  - `columnIndex` - 列索引
  - `cellType` - 单元格类型（'columnHeader' 或 'detailCell'）
- **逻辑**:
  1. 获取目标列和单元格
  2. 设置 `editingCell` 状态
  3. 提取当前文本/表达式值到 `cellEditValue`
  4. 下一帧自动聚焦输入框并选中全部文本

#### `updateCellEditingValue(event: Event)`
- **作用**: 更新编辑中的值
- **参数**: `event` - 输入事件
- **逻辑**: 从 `event.target.value` 更新 `cellEditValue`

#### `finishCellEditing()`
- **作用**: 完成单元格编辑
- **逻辑**:
  1. 获取目标列和单元格
  2. 根据单元格类型更新 `text`（staticText）或 `expression`（textField）
  3. 清除 `editingCell` 状态
  4. 触发 `update-jrxml` 事件

#### `cancelCellEditing()`
- **作用**: 取消单元格编辑
- **逻辑**: 清除 `editingCell` 状态，不保存修改

### 事件处理

#### `handleSelect(bandIndex, elementIndex, isMultiSelect?, parentFrameIndex?)`
- **作用**: 处理选择事件
- **逻辑**: 转发到父组件

#### `handleDragStart(event, bandIndex, elementIndex, parentFrameIndex?)`
- **作用**: 处理拖拽开始事件
- **逻辑**: 转发到父组件

#### `handleContextMenu(event, bandIndex, elementIndex, parentFrameIndex?)`
- **作用**: 处理右键菜单事件
- **逻辑**: 阻止默认行为，转发到父组件

#### `handleResize(newWidth, newHeight)`
- **作用**: 处理大小调整事件
- **逻辑**: 通过父组件处理实际大小更新

---

## 事件定义 (Emits)

| 事件名 | 参数 | 用途 |
|--------|------|------|
| `select` | bandIndex, elementIndex, isMultiSelect, parentFrameIndex? | 选择表格元素 |
| `dragStart` | event, bandIndex, elementIndex, parentFrameIndex? | 开始拖拽 |
| `resizeStart` | event, bandIndex, elementIndex, parentFrameIndex? | 开始调整大小 |
| `resizeEnd` | - | 结束调整大小 |
| `contextmenu` | event, bandIndex, elementIndex, parentFrameIndex? | 右键菜单 |
| `moveColumn` | elementIndex, fromIndex, toIndex | 移动列顺序 |
| `update-jrxml` | - | 触发 JRXML 更新 |

---

## 样式系统

### `getCellStyle(cell, cellType)`
- **作用**: 获取单元格的内联样式
- **优先级**: 表格级样式 → 单元格自身样式 → 单元格内联属性 → 单元格内元素属性

### `getColumnHeaderStyle(column)`
- **作用**: 获取列头单元格的特殊样式处理
- **逻辑**: 处理列头的样式继承和合并

### `getRowStyle(rowType)`
- **作用**: 获取行的内联样式
- **参数**: `rowType` - 行类型（'tableHeader' | 'columnHeader' | 'detailCell' | 'columnFooter' | 'tableFooter'）
