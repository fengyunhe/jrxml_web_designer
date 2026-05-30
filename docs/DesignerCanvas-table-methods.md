# DesignerCanvas.vue 表格相关方法文档

文件路径: `src/components/designer/DesignerCanvas.vue`

## 概述

DesignerCanvas 是设计器的主画布组件，负责渲染所有区域（Band）和其中的设计元素。

---

## 表格相关事件处理

### `handleMoveColumn(elementIndex, fromIndex, toIndex, bandIndex, parentFrameIndex?)`
- **作用**: 处理列移动事件
- **参数**:
  - `elementIndex` - 表格元素索引
  - `fromIndex` - 源列索引
  - `toIndex` - 目标列索引
  - `bandIndex` - 区域索引
  - `parentFrameIndex?` - 父容器索引
- **逻辑**: 向上冒泡到 PDFDesigner 执行实际的列移动操作
- **事件**: 触发 `move-column` 事件

### `handleAddColumnsToGroup(elementIndex, columnIndices, bandIndex, parentFrameIndex?)`
- **作用**: 处理将多列添加到新组的事件
- **参数**:
  - `elementIndex` - 表格元素索引
  - `columnIndices` - 要分组的列索引数组
  - `bandIndex` - 区域索引
  - `parentFrameIndex?` - 父容器索引
- **逻辑**: 向上冒泡到 PDFDesigner 创建新的列组

### `handleJoinColumnsToExistingGroup(elementIndex, columnIndices, bandIndex, parentFrameIndex?)`
- **作用**: 处理将列加入现有组的事件
- **参数**:
  - `elementIndex` - 表格元素索引
  - `columnIndices` - 要加入的列索引数组
  - `bandIndex` - 区域索引
  - `parentFrameIndex?` - 父容器索引
- **逻辑**: 向上冒泡到 PDFDesigner 将列添加到现有列组

---

## 事件定义 (Emits)

| 事件名 | 参数 | 用途 |
|--------|------|------|
| `set-design-area-focused` | - | 设计区域获得焦点 |
| `handle-drop` | event | 处理拖放事件 |
| `handle-drag-over` | event | 处理拖放悬停 |
| `handle-drag-leave` | event | 处理拖放离开 |
| `select-band` | bandIndex | 选择区域 |
| `select-element` | bandIndex, elementIndex, isMultiSelect, parentFrameIndex? | 选择元素 |
| `start-dragging` | event, bandIndex, elementIndex, parentFrameIndex? | 开始拖拽 |
| `start-resizing-element` | event, bandIndex, elementIndex, 'se', parentFrameIndex? | 开始调整大小 |
| `start-editing` | bandIndex, elementIndex, parentFrameIndex? | 开始编辑 |
| `finish-editing` | - | 完成编辑 |
| `cancel-editing` | - | 取消编辑 |
| `start-resizing-band` | event, bandIndex | 开始调整区域高度 |
| `zoom-change` | zoomLevel | 缩放级别变化 |
| `select-elements-in-rect` | rect | 框选元素 |
| `clear-selection` | - | 清空选择 |
| `check-fields` | fields: string[] | 检查字段 |
| `contextmenu` | event | 右键菜单 |
| `move-column` | elementIndex, fromIndex, toIndex, bandIndex, parentFrameIndex? | 移动列 |
| `add-columns-to-group` | elementIndex, columnIndices, bandIndex, parentFrameIndex? | 添加列到组 |
| `join-columns-to-existing-group` | elementIndex, columnIndices, bandIndex, parentFrameIndex? | 将列加入现有组 |
| `update:enableSnapToGrid` | enabled | 启用/禁用网格吸附 |
| `update:enableSnapToAlignment` | enabled | 启用/禁用对齐线吸附 |
| `update:showGrid` | show | 显示/隐藏网格 |
| `update:table-styles` | styles | 更新表格样式 |
| `reset-zoom` | - | 重置缩放 |
| `update-jrxml` | - | 触发 JRXML 更新 |

---

## ElementFactory 事件绑定

在模板中，ElementFactory 通过以下事件绑定传递事件：

```vue
<ElementFactory
  @select="selectElement"
  @drag-start="startDragging"
  @resize-start="startResizingElement"
  @contextmenu="handleElementContextMenu"
  @start-editing="startEditing"
  @finish-editing="finishEditing"
  @cancel-editing="cancelEditing"
  @check-fields="checkFields"
  @move-column="handleMoveColumn"
  @add-columns-to-group="handleAddColumnsToGroup"
  @join-columns-to-existing-group="handleJoinColumnsToExistingGroup"
  @update-jrxml="emit('update-jrxml')"
/>
```

### `@update-jrxml="emit('update-jrxml')"`
- **作用**: 将表格的 JRXML 更新事件直接冒泡到父组件
- **触发时机**: 
  - 列宽拖拽调整完成
  - 单元格内联编辑完成
- **用途**: PDFDesigner 接收此事件后调用 `updateJRXML()` 重新生成 JRXML

---

## Props 传递

### `tableStyles`
- **类型**: `{ tableHeader: string; columnHeader: string; columnFooter: string; detailCell: string }`
- **用途**: 传递表格样式映射到 ElementFactory，最终传递到 TableElement
- **来源**: 从 PDFDesigner 通过 props 传入
