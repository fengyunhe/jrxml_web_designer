# ElementProperties.vue 表格相关方法文档

文件路径: `src/components/designer/properties/ElementProperties.vue`

## 表格属性面板结构

当选择表格元素时，属性面板显示三个标签页：
1. **基本属性** - 位置（X, Y, 宽度, 高度）
2. **表格属性** - 数据集、样式、行为、列管理、行高设置
3. **样式设置** - 边框、颜色、字体、对齐

---

## 数据管理

### `tableRowHeights`
- **类型**: `ref<{ tableHeader: number; columnHeader: number; detailCell: number; columnFooter: number; tableFooter: number }>`
- **作用**: 存储表格各行的高度值
- **默认值**: 所有行高均为 30px
- **更新时机**: 当 `currentElement` 变化时，从第一列读取当前行高值

### `tableStyles`
- **类型**: `ref<{ tableHeader: string; columnHeader: string; columnFooter: string; detailCell: string }>`
- **作用**: 存储表格各区域的样式名称
- **默认值**: `Table_TH`（表头）、`Table_CH`（列头/列脚）、`Table_TD`（数据）

---

## 列操作方法

### `addColumn()`
- **作用**: 向表格添加新列
- **逻辑**:
  1. 检查当前元素是否为表格类型
  2. 创建新列对象，包含：
     - `uuid`: 随机唯一标识
     - `name`: 列名（格式：`列 N`）
     - `width`: 默认宽度 100px
     - `columnHeader`: 静态文本单元格（默认启用，居中对齐）
     - `detailCell`: 动态文本单元格（默认启用，居中对齐）
  3. 将新列推入 `currentElement.value.columns`
  4. 触发 `update-jrxml` 事件
- **注意**: 新列不包含 `tableHeader`（默认禁用）

### `removeColumn(index: number)`
- **作用**: 删除指定索引的列
- **参数**: `index` - 要删除的列索引
- **逻辑**: 从 `currentElement.value.columns` 中移除指定列
- **约束**: 至少保留 1 列（在其他地方强制）

### `updateColumnWidth(column: any, index: number)`
- **作用**: 更新列宽并同步所有相关单元格
- **参数**:
  - `column` - 要更新的列对象
  - `index` - 列索引
- **逻辑**:
  1. 更新列的 `tableHeader.element.width`
  2. 更新列的 `columnHeader.element.width`
  3. 更新列的 `detailCell.element.width`
  4. 更新列的 `columnFooter.element.width`
  5. 更新列的 `tableFooter.element.width`
  6. 在 `element.children` 中递归查找并更新对应列
  7. 重新计算表格总宽度：`columns.reduce((sum, col) => sum + col.width, 0)`

### `updateChildrenColumnWidth(uuid: string, width: number)`
- **作用**: 在 `element.children` 树中递归查找并更新列宽
- **参数**:
  - `uuid` - 列的唯一标识
  - `width` - 新宽度值
- **用途**: 保持 `columns` 数组和 `children` 树的数据同步

---

## 行高操作方法

### `updateAllColumnRowHeights()`
- **作用**: 更新所有列和列组的行高
- **逻辑**:
  1. 检查当前元素是否为表格类型
  2. 遍历 `currentElement.value.columns`，对每列调用 `updateColumnRowHeights()`
  3. 遍历 `currentElement.value.children`，对列组调用 `updateGroupRowHeights()`
- **触发时机**: 用户在行高输入框中修改值后

### `updateColumnRowHeights(column: any)`
- **作用**: 更新单个列的所有行高
- **参数**: `column` - 要更新的列对象
- **逻辑**:
  1. 更新 `column.tableHeader.height` 和 `column.tableHeader.reportElement.height`
  2. 更新 `column.columnHeader.height` 和 `column.columnHeader.reportElement.height`
  3. 更新 `column.detailCell.height`
  4. 更新 `column.columnFooter.height` 和 `column.columnFooter.reportElement.height`
  5. 更新 `column.tableFooter.height` 和 `column.tableFooter.reportElement.height`
  6. 处理 `rowSpan` 乘数（合并单元格时高度需要乘以行跨度）

### `updateGroupRowHeights(group: any)`
- **作用**: 递归更新列组的行高
- **参数**: `group` - 列组对象
- **逻辑**:
  1. 更新组级别的行高
  2. 递归处理所有子列/子组

---

## 样式操作方法

### `updateTableStyles()`
- **作用**: 更新表格所有单元格的样式
- **逻辑**:
  1. 遍历所有列和列组
  2. 对每个单元格设置对应的样式名称
  3. 样式名称来自 `tableStyles` 对象

### `getFirstTableCellStyle(cellType: string)`
- **作用**: 获取指定单元格类型的第一个样式名称
- **参数**: `cellType` - 单元格类型（'tableHeader' | 'columnHeader' | 'detail' | 'columnFooter' | 'tableFooter'）
- **返回**: 样式名称字符串
- **用途**: 在样式下拉框中显示当前选中的样式

### `updateAllTableCellStyles(cellType: string, styleName: string)`
- **作用**: 批量更新所有单元格的样式
- **参数**:
  - `cellType` - 单元格类型
  - `styleName` - 新样式名称
- **逻辑**: 递归遍历所有列和列组，更新指定类型的单元格样式

---

## 表格属性更新

### `handleTablePropertyUpdate(property: string, value: any)`
- **作用**: 处理表格级属性更新
- **参数**:
  - `property` - 属性名称
  - `value` - 新值
- **逻辑**: 更新 `currentElement.value` 的对应属性

### `updateDatasetProperty(property: string, value: any)`
- **作用**: 更新数据集属性
- **参数**:
  - `property` - 属性名称（如 'name', 'connectionExpression'）
  - `value` - 新值
- **逻辑**: 更新 `currentElement.value.dataset[property]`

### `updateQueryProperty(property: string, value: any)`
- **作用**: 更新查询属性
- **参数**:
  - `property` - 属性名称（如 'text', 'language'）
  - `value` - 新值
- **逻辑**: 更新 `currentElement.value.dataset.query[property]`

### `updateStyleProperty(property: string, value: string)`
- **作用**: 更新表格样式属性
- **参数**:
  - `property` - 样式类型（如 'tableHeader', 'columnHeader'）
  - `value` - 样式名称
- **逻辑**: 更新 `currentElement.value.styles[property]`

---

## 行分组操作

### `addGroupRow()`
- **作用**: 添加行分组
- **逻辑**: 创建新的行分组对象并推入 `currentElement.value.rowGroups`

### `removeGroupRow(index: number)`
- **作用**: 删除指定索引的行分组
- **参数**: `index` - 要删除的分组索引

### `updateGroupRowProperty(index: number, property: string, value: any)`
- **作用**: 更新行分组属性
- **参数**:
  - `index` - 分组索引
  - `property` - 属性名称
  - `value` - 新值
