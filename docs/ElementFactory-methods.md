# ElementFactory.vue 方法文档

文件路径: `src/components/elements/ElementFactory.vue`

## 概述

ElementFactory 是一个动态组件工厂，根据元素类型（type）加载并渲染对应的组件。

---

## 属性 (Props)

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `element` | `DesignElement` | 设计元素对象 |
| `bandIndex` | `number` | 所在区域索引 |
| `elementIndex` | `number` | 元素在区域中的索引 |
| `selectedElement` | `SelectedElementInfo \| null` | 当前选中的元素信息 |
| `selectedElements` | `Array<SelectedElementInfo>` | 多选元素列表 |
| `editingElement` | `EditingElementInfo \| null` | 当前正在编辑的元素 |
| `isDragging` | `boolean` | 是否正在拖拽 |
| `isOutOfBounds` | `boolean` | 是否超出边界 |
| `parentFrameIndex` | `number \| undefined` | 父容器索引（如果在 Frame 内） |
| `reportFontFamily` | `string` | 报表默认字体 |
| `reportFontSize` | `number` | 报表默认字号 |
| `reportIsBold` | `boolean` | 报表默认粗体 |
| `reportIsItalic` | `boolean` | 报表默认斜体 |
| `reportIsUnderline` | `boolean` | 报表默认下划线 |
| `zoomLevel` | `number` | 缩放级别 |
| `reportStyles` | `any[]` | 报表样式列表 |
| `tableStyles` | `TableStyles` | 表格样式映射 |

---

## 事件定义 (Emits)

| 事件名 | 参数 | 用途 |
|--------|------|------|
| `select` | bandIndex, elementIndex, isMultiSelect?, parentFrameIndex? | 选择元素 |
| `dragStart` | event, bandIndex, elementIndex, parentFrameIndex? | 开始拖拽 |
| `resizeStart` | event, bandIndex, elementIndex, parentFrameIndex? | 开始调整大小 |
| `contextmenu` | event, bandIndex, elementIndex, parentFrameIndex? | 右键菜单 |
| `startEditing` | bandIndex, elementIndex, parentFrameIndex? | 开始编辑 |
| `finishEditing` | - | 完成编辑 |
| `cancelEditing` | - | 取消编辑 |
| `checkFields` | fields: string[] | 检查字段 |
| `moveColumn` | elementIndex, fromIndex, toIndex, bandIndex, parentFrameIndex? | 移动列 |
| `addColumnsToGroup` | elementIndex, columnIndices, bandIndex, parentFrameIndex? | 添加列到组 |
| `joinColumnsToExistingGroup` | elementIndex, columnIndices, bandIndex, parentFrameIndex? | 将列加入现有组 |
| `update-jrxml` | - | 触发 JRXML 更新 |

---

## 通用事件处理

所有事件通过 `commonEvents` 对象统一处理，自动附加 `bandIndex` 和 `parentFrameIndex`：

### `select(bandIndex, elementIndex, isMultiSelect, parentFrameIndex)`
- **作用**: 转发选择事件到父组件

### `dragStart(event, bandIndex, elementIndex, parentFrameIndex)`
- **作用**: 转发拖拽开始事件

### `resizeStart(event, bandIndex, elementIndex, parentFrameIndex)`
- **作用**: 转发调整大小开始事件

### `contextmenu(event, bandIndex, elementIndex, parentFrameIndex)`
- **作用**: 转发右键菜单事件

### `startEditing(bandIndex, elementIndex, parentFrameIndex)`
- **作用**: 转发开始编辑事件

### `finishEditing()`
- **作用**: 转发完成编辑事件

### `cancelEditing()`
- **作用**: 转发取消编辑事件

### `checkFields(fields: string[])`
- **作用**: 转发字段检查事件

### `moveColumn(elementIndex, fromIndex, toIndex)`
- **作用**: 转发列移动事件
- **逻辑**: 自动附加 `bandIndex` 和 `parentFrameIndex`

### `addColumnsToGroup(elementIndex, columnIndices)`
- **作用**: 转发添加列到组事件
- **逻辑**: 自动附加 `bandIndex` 和 `parentFrameIndex`

### `joinColumnsToExistingGroup(elementIndex, columnIndices)`
- **作用**: 转发将列加入现有组事件
- **逻辑**: 自动附加 `bandIndex` 和 `parentFrameIndex`

### `update-jrxml()`
- **作用**: 转发 JRXML 更新事件
- **用途**: 当表格列宽调整或单元格编辑完成时触发

---

## 组件加载

### `getElementComponent` (computed)
- **作用**: 根据元素类型计算要渲染的组件
- **逻辑**:
  1. 检查 `componentCache` 缓存
  2. 如果未缓存，调用 `loadComponent()` 动态加载
  3. 返回对应的组件（如 `TableElement`、`StaticTextElement` 等）

### `loadComponent(type: string)`
- **作用**: 动态加载元素组件
- **参数**: `type` - 元素类型
- **逻辑**: 使用 `import()` 动态导入组件并缓存
