# JRXML Web Designer — 架构文档

> 面向 AI 和人类开发者的代码导航手册。帮助快速理解项目结构、核心数据流、关键文件和架构模式。

## 1. 项目概述

**JRXML Web Designer** 是一个基于浏览器的可视化报表设计器，用于设计和编辑 JasperReports 的 JRXML 模板文件。

- **技术栈**: Vue 3 + TypeScript + Vite + Naive UI + vue-i18n
- **版本**: 0.4.6（截至 2026-06）
- **核心不变量**: **往返一致性（Round-Trip Integrity）** — 在设计器中编辑 → 导出 JRXML → 重新导入 → 必须产生相同的视觉结果。parse/generate/bind 中的任何 bug 都会破坏此不变量。

### 双向数据流

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Vue Canvas  │ ⇄   │  Structured JSON │ ⇄   │  JRXML (XML) │
│  (UI Layer)  │     │  (Data Model)    │     │  (File)      │
└─────────────┘     └─────────────────┘     └──────────────┘
       ↑                    ↑                      ↑
  DesignerCanvas.vue   PDFDesigner.vue       jrxmlGenerator.ts
  元素渲染/交互        集中状态管理          parse.ts
```

---

## 2. 目录结构

```
jrxml_web_designer/
├── jasperreport6Fork/            # JasperReports 官方库源码 — 仅供参考，勿修改
├── docs/                         # 文档
│   └── ARCHITECTURE.md           # 本文档
├── tests/                        # 测试 fixtures 和集成测试
│   ├── unit/                     # 单元测试
│   ├── *.jrxml                   # JRXML fixture 文件
│   ├── build_by_jasper_studio_jrxml/   # Jaspers Studio 生成的测试文件
│   └── build_by_this_designer_jrxml/   # 本设计器生成的测试文件
├── src/
│   ├── main.ts                   # 应用入口
│   ├── App.vue                   # 根组件
│   ├── i18n.ts                   # vue-i18n 国际化配置
│   ├── locales/                  # 翻译文件 (zh-CN, en)
│   ├── types/                    # TypeScript 类型定义
│   │   ├── index.ts              # UI 层类型 (DesignElement, Band, ReportProperties 等)
│   │   └── table.ts              # 表格内部类型 (Column, ColumnGroup, Cell, TableElement)
│   ├── components/
│   │   ├── PDFDesigner.vue       # ★ 核心编排组件（状态管理中枢）
│   │   ├── BottomPanel.vue       # 底部工具栏
│   │   ├── designer/
│   │   │   ├── DesignerCanvas.vue     # 画布组件（元素渲染）
│   │   │   ├── AlignmentGuides.vue    # 对齐辅助线
│   │   │   ├── SelectionBox.vue       # 框选组件
│   │   │   ├── DragFeedbackLayer.vue  # 拖拽反馈层
│   │   │   ├── MultiSelectToolbar.vue # 多选工具栏
│   │   │   ├── controls/              # 画布控件
│   │   │   │   ├── FileManager.vue    # 文件管理器
│   │   │   │   └── ZoomControls.vue   # 缩放控制
│   │   │   ├── properties/            # 属性面板
│   │   │   │   ├── ElementProperties.vue      # ★ 元素属性面板（表格列编辑在此）
│   │   │   │   ├── ColumnTreeNode.vue         # 列树节点（递归组件）
│   │   │   │   ├── TableProperties.vue        # 表格属性
│   │   │   │   ├── FrameProperties.vue        # 框架属性
│   │   │   │   ├── FontStyleSettings.vue      # 字体样式设置
│   │   │   │   ├── BorderStyleSettings.vue    # 边框样式设置
│   │   │   │   ├── BandHeightControls.vue     # Band 高度控制
│   │   │   │   ├── ElementTypeBasedSettings.vue # 元素类型特定设置
│   │   │   │   ├── ColorPickerWithOpacity.vue  # 颜色选择器
│   │   │   │   └── common/                    # 通用属性控件
│   │   │   │       ├── ExpressionEditor.vue
│   │   │   │       ├── SelectControl.vue
│   │   │   │       └── SwitchControl.vue
│   │   │   └── layout/                      # 布局组件（当前为空）
│   │   └── modals/                          # 弹窗组件
│   │       ├── BaseModal.vue                # 弹窗基类
│   │       ├── PdfPreviewModal.vue          # PDF 预览弹窗
│   │       ├── PreviewServerSettingsModal.vue # 预览服务器设置
│   │       ├── ColumnSelectionModal.vue     # 列选择弹窗（用于列分组）
│   │       ├── FieldManagementModal.vue     # 字段管理
│   │       ├── StyleManagementModal.vue     # 样式管理
│   │       ├── VariableManagementModal.vue  # 变量管理
│   │       ├── SubDatasetManagementModal.vue # 子数据集管理
│   │       ├── HelpModal.vue / HelpModalEn.vue # 帮助弹窗
│   │       ├── InputModal.vue / ConfirmModal.vue # 通用输入/确认弹窗
│   │       └── RewardModal.vue / RewardModalEn.vue # 打赏弹窗
│   ├── composables/              # Vue 组合式函数
│   │   ├── useZoom.ts            # 缩放控制
│   │   ├── useUndoRedo.ts        # 撤销/重做
│   │   ├── useAlignmentSystem.ts # 对齐系统
│   │   ├── useSnapAlignment.ts   # 吸附对齐
│   │   ├── useBoundaryDetection.ts # 边界检测
│   │   ├── useDragFeedback.ts    # 拖拽反馈
│   │   ├── useDesignerFiles.ts   # 文件操作
│   │   └── useLivePreview.ts     # 实时预览
│   ├── utils/
│   │   ├── jrxml/
│   │   │   ├── parse.ts          # ★ JRXML → JSON 解析器
│   │   │   ├── parse.test.ts     # 解析器测试 (34 tests)
│   │   │   ├── jrxmlGenerator.ts # → 误放在此，实际为 jrxmlGenerator.ts
│   │   │   ├── types.ts          # 解析/生成的辅助类型 (ReportProperties, Field 等)
│   │   │   ├── xmlBuilder.ts     # XML 标签构建辅助函数
│   │   │   ├── validator.ts      # JRXML 验证规则
│   │   │   └── officialCompiler.ts # 官方编译器引用（如有）
│   │   ├── jrxmlGenerator.ts     # ★ JSON → JRXML 生成器
│   │   ├── jrxmlGenerator.test.ts # 生成器测试 (29 tests)
│   │   ├── jrxmlHtmlRenderer.ts  # JRXML → HTML 渲染器
│   │   ├── table/
│   │   │   ├── index.ts          # 表格工具入口
│   │   │   ├── ColumnFactory.ts  # 列工厂 + TableUtils 静态工具类
│   │   │   ├── ColumnTreeSync.ts # 列树同步工具 (syncTableColumns 等)
│   │   │   └── TableModel.ts     # 表格模型
│   │   ├── elementUtils.ts       # 元素通用工具
│   │   ├── elementBoundsValidator.ts # 元素边界校验
│   │   ├── bandUtils.ts          # Band 工具
│   │   ├── fileUtils.ts          # 文件操作工具
│   │   ├── fontUtils.ts          # 字体工具
│   │   ├── panelUtils.ts         # 面板工具
│   │   ├── notification.ts       # 通知工具
│   │   └── mockDataGenerator.ts  # Mock 数据生成器
│   ├── constants/                # 常量定义
│   ├── plugins/                  # Vue 插件
│   ├── styles/                   # 全局样式
│   └── test/
│       └── setup.ts              # Vitest 全局 mock 配置
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 3. 类型系统

项目有 **两套并行的类型定义**，需注意区分：

### UI 层类型 (`src/types/index.ts`)

用于 Vue 组件和状态管理的主要类型：

| 类型 | 说明 |
|------|------|
| `DesignElement` | 联合类型：`StaticTextElement \| TextFieldElement \| ImageElement \| LineElement \| RectangleElement \| EllipseElement \| BreakElement \| FrameElement \| TableElement` |
| `Band` | 布局区域（title, detail, pageHeader 等），包含 elements 数组 |
| `BandType` | `'detail' \| 'pageHeader' \| 'pageFooter' \| 'title' \| 'summary' \| 'columnHeader' \| 'columnFooter' \| 'background' \| 'lastPageFooter' \| 'noData'` |
| `TableElement` | 表格元素，包含 `columns` (flat) 和 `children` (hierarchical) |
| `TableColumn` | 表格列，包含 uuid, width, name, 各区域 Cell |
| `ColumnGroup` | 列分组，递归结构，包含 children: `(ColumnGroup \| TableColumn)[]` |
| `TableCell` | `{ enable: boolean; element?: DesignElement; rowSpan?: number }` |
| `ReportProperties` | 报表属性（页面大小、边距、默认字体等） |
| `Box` | 边框样式（支持各边独立设置） |

### 表格内部类型 (`src/types/table.ts`)

用于 `ColumnFactory`、`ColumnTreeSync` 等表格工具：

| 类型 | 说明 |
|------|------|
| `Column` | extends `BaseColumn`，含 `detailCell` |
| `ColumnGroup` | extends `BaseColumn`，含 `children: (Column \| ColumnGroup)[]` |
| `BaseColumn` | uuid, name, width, tableHeader, columnHeader, columnFooter, tableFooter 等 |
| `Cell` | extends `BaseCell`，含 `rowSpan`, `enable` |
| `BaseCell` | height, width, style, backcolor, forecolor, box, element 等 |
| `TableElement` | 表格元素接口（type: 'table'） |

### 单元格格式

**关键约定**: 单元格内容统一使用 `.element` 包装：

```typescript
{
  enable: true,
  rowSpan: 2,       // 可选，跨越行数
  element: {        // 单元格内容
    type: 'staticText' | 'textField',
    text: '标题文本',           // staticText 使用
    expression: '$F{fieldName}', // textField 使用
    x: 0, y: 0, width: 100, height: 30,
    textAlignment: 'Center',
    verticalAlignment: 'Middle',
  }
}
```

---

## 4. 核心数据流

### 4.1 JSON → JRXML（生成）

```
入口: src/utils/jrxmlGenerator.ts → generateJRXMLContent()
     ↓
构建 XML 头部: src/utils/jrxml/xmlBuilder.ts → buildJasperReportOpenTag()
     ↓
扁平化 JSON 模型为 JasperReports XML
  - 遍历 bands → elements → 属性
  - 表格: columns/children → jr:column/jr:columnGroup
  - rowSpan 计算（见第 8 节）
     ↓
输出: JRXML 字符串
```

**关键函数**:
- `generateJRXMLContent(reportData, options)` — 主入口
- `buildJasperReportOpenTag(props)` — 构建 `<jasperReport>` 开标签
- `calculateMaxGroupDepth(node, depth)` — 计算列分组最大嵌套深度
- `countGroups(node)` — 统计分组节点总数
- `getMaxGroupDepthInChildren(children, baseDepth)` — 获取子节点中的最大分组深度

### 4.2 JRXML → JSON（解析）

```
入口: src/utils/jrxml/parse.ts → parseJRXMLContent()
     ↓
使用浏览器 DOMParser 解析 XML
     ↓
命名空间处理（3 层 fallback 策略）:
  1. tagName（直接获取）
  2. getElementsByTagNameNS（命名空间感知）
  3. localName（本地名称匹配）
     ↓
提取:
  - properties → ReportProperties
  - bands → Band[] (递归包含 elements)
  - fields → Field[]
  - parameters → ReportParameter[]
  - datasets → TableDataset[]
  - variables → ReportVariable[]
  - styles → ReportStyle[]
     ↓
表格解析:
  jr:column → TableColumn
  jr:columnGroup → ColumnGroup (递归 children)
     ↓
输出: JSON 结构
```

**命名空间**: `http://jasperreports.sourceforge.net/jasperreports`

**关键函数**:
- `parseJRXMLContent(xmlString)` — 主入口
- `parseReportProperties(root)` — 解析报表属性
- `parseBands(root)` — 解析所有 Band
- `parseTableElement(tableElement)` — 解析表格（含列分组递归）

### 4.3 JSON → UI（绑定）

```
入口: src/components/PDFDesigner.vue
     ↓
Vue 3 reactive refs 持有 JSON 模型:
  reportProperties, bands, fields, parameters 等
     ↓
DesignerCanvas.vue 渲染 elements
  - 根据 element.type 选择渲染组件
  - 拖拽/缩放/选择操作直接修改 JSON 模型
     ↓
属性面板 (ElementProperties.vue) 显示选中元素属性
  - 编辑属性 → 修改 JSON → 画布实时更新
```

---

## 5. 组件架构

### 5.1 核心编排器: PDFDesigner.vue

`PDFDesigner.vue` 是整个应用的状态管理中枢，不使用外部状态管理库（如 Vuex/Pinia），而是使用 Vue 3 的 reactive refs 管理所有状态：

```typescript
// 核心状态
const reportProperties = ref<ReportProperties>(...);
const bands = ref<Band[]>([]);
const reportFields = ref<ReportField[]>([]);
const parameters = ref<ReportParameter[]>([]);
const variables = ref<ReportVariable[]>([]);
const styles = ref<ReportStyle[]>([]);

// 选择状态
const selectedElementId = ref<string | null>(null);
const selectedBandType = ref<BandType | null>(null);

// 操作状态
const clipboard = ref<DesignElement | null>(null);
```

**关键职责**:
- 管理所有报表数据的响应式状态
- 处理元素的增删改查
- 协调 undo/redo 状态快照
- 处理 JRXML 导入/导出
- 表格列分组的特殊处理（joinColumnsToGroup, ungroupColumns 等）

### 5.2 画布组件层次

```
PDFDesigner.vue
├── DesignerCanvas.vue          # 画布主体
│   ├── Band components         # 各种 Band 渲染
│   │   ├── TitleBand
│   │   ├── DetailBand
│   │   ├── PageHeaderBand
│   │   ├── PageFooterBand
│   │   ├── ColumnHeaderBand
│   │   └── ...
│   └── Element components      # 元素渲染
│       ├── StaticTextRenderer
│       ├── TextFieldRenderer
│       ├── ImageRenderer
│       ├── LineRenderer
│       ├── RectangleRenderer
│       ├── EllipseRenderer
│       ├── FrameRenderer
│       └── TableRenderer
├── AlignmentGuides.vue         # 对齐辅助线
├── SelectionBox.vue            # 框选
├── DragFeedbackLayer.vue       # 拖拽反馈
└── MultiSelectToolbar.vue      # 多选操作栏
```

### 5.3 属性面板

选中元素后，右侧属性面板 (`ElementProperties.vue`) 显示可编辑属性：

- **通用属性**: 位置 (x, y), 尺寸 (width, height)
- **文本属性**: font, fontSize, color, textAlignment, verticalAlignment
- **边框属性**: 各边独立 border 设置
- **表格属性**: 列管理（树形结构）、数据集配置
- **框架属性**: 子元素列表

### 5.4 Composables（组合式函数）

| Composable | 文件 | 职责 |
|-----------|------|------|
| `useZoom` | `useZoom.ts` | 画布缩放比例、缩放中心 |
| `useUndoRedo` | `useUndoRedo.ts` | 撤销/重做栈管理 |
| `useAlignmentSystem` | `useAlignmentSystem.ts` | 元素对齐辅助线计算 |
| `useSnapAlignment` | `useSnapAlignment.ts` | 吸附对齐（靠近边缘时吸附） |
| `useBoundaryDetection` | `useBoundaryDetection.ts` | 边界检测（防止元素超出画布） |
| `useDragFeedback` | `useDragFeedback.ts` | 拖拽过程中的视觉反馈 |
| `useDesignerFiles` | `useDesignerFiles.ts` | 文件导入/导出/保存 |
| `useLivePreview` | `useLivePreview.ts` | 实时 PDF 预览 |

---

## 6. 表格列分组系统

这是项目中最复杂的子系统，涉及多层数据同步。

### 6.1 双重数据模型

表格有两种表示方式，必须保持同步：

```
element.children (层级结构，数据源)          element.columns (扁平叶子数组，兼容视图)
┌──────────────────────┐                   ┌──────────────────────────┐
│ ColumnGroup A        │                   │ Column 1 (root)          │
│   ├── Column 1       │  syncTableColumns │ Column 2 (root)          │
│   └── Column 2       │ ─────────────────→│ Column A (in group)      │
│ Column 3 (root)      │                   │ Column B (in group)      │
└──────────────────────┘                   └──────────────────────────┘
```

**规则**:
- `children` 是**数据源（source of truth）**
- `columns` 是从 `children` 重建的**只读兼容视图**
- 每次 mutation 后必须调用 `syncTableColumns()` 重建 `columns`

### 6.2 同步工具 (`src/utils/table/ColumnTreeSync.ts`)

```typescript
// 核心同步函数
syncTableColumns(tableElement: TableElement): void
  - 递归更新所有列分组宽度
  - 从 children 重建 columns (通过 TableUtils.getLeafColumns)
  - 计算最大嵌套层级，更新未分组根级列的 rowSpan
  - 更新表格总宽度

// 创建工具
createDefaultColumn(name, width?) → Column       // 创建叶子列
createDefaultColumnGroup(name) → ColumnGroup      // 创建空分组

// 操作工具
findInParentArray(children, targetUuid)           // 递归查找包含目标 UUID 的数组
ungroupColumnGroup(children, groupUuid)           // 解散分组（提升子列到父级）
```

### 6.3 列工厂 (`src/utils/table/ColumnFactory.ts`)

```typescript
// 工厂类
ColumnFactoryImpl
  - createColumn(config) → Column
  - createColumnGroup(config) → ColumnGroup
  - createColumns(columns[]) → (Column | ColumnGroup)[]

// 静态工具类
TableUtils
  - getLeafColumns(children) → Column[]           // 提取所有叶子列
  - calculateGroupWidth(group) → number            // 计算分组总宽度
  - updateAllColumnGroupWidths(children)           // 递归更新所有分组宽度
  - findAllColumns(children) → Column[]            // 查找所有列
  - moveColumn(children, uuid, direction)          // 移动列
  - addColumnAfter(children, afterUuid, column)    // 在指定列后添加
  - removeColumn(children, uuid)                   // 删除列
```

### 6.4 rowSpan 计算公式

rowSpan 决定一个单元格跨越多少个 header 行，是表格渲染的关键：

| 场景 | rowSpan 公式 | 说明 |
|------|-------------|------|
| 根级未分组叶子列 | `maxGroupDepth + 1` | 占满所有 header 行 |
| 嵌套的独立叶子列 | `maxDepth - depth + 1` | 占到最底层 group header |
| 分组节点 header | `1` | 只占自己那一行 |

其中 `maxGroupDepth` = 从根到最深 group 节点的路径长度（只计 group，不计 leaf）。

**示例**:
```
Root
├── ColumnGroup A (depth=0, maxDepth=1)
│   ├── Column 1 (rowSpan = 1-0+1 = 2)
│   └── ColumnGroup B (depth=1, maxDepth=1)
│       └── Column 2 (rowSpan = 1-1+1 = 1)
└── Column 3 (root standalone, rowSpan = 1+1 = 2)
```

### 6.5 列树 UI (`ColumnTreeNode.vue`)

递归组件，渲染列层级结构：

```
分组节点:  [▶] [▦] [名称输入] [宽度(自动)] [↑↓⊕+⧉⊟×]
叶子节点:  [  ] [☰] [名称输入] [宽度输入] [↑↓+⧉×]
```

- 分组节点: 展开/折叠、蓝色左边框、子节点缩进
- 叶子节点: 宽度可编辑
- 操作按钮: 上移、下移、组内添加列(⊕)、后添加列(+)、后添加分组(⧉)、取消分组(⊟)、删除(×)

---

## 7. 弹窗系统

所有弹窗继承 `BaseModal.vue`，提供统一的打开/关闭/遮罩层行为：

| 弹窗 | 用途 |
|------|------|
| `PdfPreviewModal` | PDF 预览（调用预览服务器） |
| `PreviewServerSettingsModal` | 配置预览服务器 URL |
| `ColumnSelectionModal` | 选择列进行分组 |
| `FieldManagementModal` | 管理报表字段 |
| `StyleManagementModal` | 管理报表样式 |
| `VariableManagementModal` | 管理报表变量 |
| `SubDatasetManagementModal` | 管理子数据集 |
| `InputModal` | 通用文本输入弹窗 |
| `ConfirmModal` | 通用确认弹窗 |

---

## 8. 拖拽与交互系统

### 8.1 拖拽

- 使用 HTML5 原生 drag/drop API
- 拖拽开始时创建 ghost 元素
- 拖拽过程中实时计算 drop zone
- 支持 snap-to-grid 吸附对齐

### 8.2 选择

- 单击选择单个元素
- 框选（SelectionBox.vue）支持多选
- 多选后显示 MultiSelectToolbar（对齐、分布操作）

### 8.3 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `Delete` | 删除选中元素 |
| `Arrow keys` | 微调元素位置（1px） |
| `Ctrl+C / Ctrl+V` | 复制/粘贴 |
| `Ctrl+A` | 全选当前 Band |

---

## 9. 国际化

- 框架: vue-i18n
- 默认语言: zh-CN
- 翻译文件: `src/locales/` 目录
- 支持中文和英文

---

## 10. 测试

### 10.1 框架

- **测试框架**: Vitest
- **DOM 环境**: jsdom
- **组件测试**: @vue/test-utils
- **配置**: `src/test/setup.ts`（全局 mock）

### 10.2 测试文件分布

```
tests/
├── unit/                              # 单元测试
│   ├── parse.test.ts                  # JRXML 解析器测试 (34 tests)
│   ├── jrxmlGenerator.test.ts         # JRXML 生成器测试 (29 tests)
│   ├── elementUtils.test.ts           # 元素工具测试
│   ├── elementBoundsValidator.test.ts # 边界校验测试
│   ├── bandUtils.test.ts              # Band 工具测试
│   ├── fileUtils.test.ts              # 文件工具测试
│   ├── fontUtils.test.ts              # 字体工具测试
│   ├── panelUtils.test.ts             # 面板工具测试
│   ├── notification.test.ts           # 通知测试
│   ├── mockDataGenerator.test.ts      # Mock 数据测试
│   └── deprecatedJrxmlMappings.test.ts # 兼容性映射测试
├── round-trip-integrity.test.ts       # 往返一致性测试
├── borderZeroWidth.test.ts            # 边框宽度测试
├── borderZeroWidthImport.test.ts      # 边框导入测试
└── jrxml-pdf-preview.integration.test.ts # PDF 预览集成测试
```

**总计**: ~89 个测试（1 个已知的 textAdjust 相关失败）

### 10.3 运行测试

```bash
npm run test          # 运行全部测试
npm run test:watch    # 监听模式
npx vitest run tests/unit/parse.test.ts  # 运行指定测试文件
```

### 10.4 Fixture 文件

- `tests/*.jrxml` — JRXML 测试 fixture
- `tests/build_by_jasper_studio_jrxml/` — Jaspers Studio 生成的文件（兼容性测试）
- `tests/build_by_this_designer_jrxml/` — 本设计器生成的文件

---

## 11. 开发命令

```bash
# 开发
npm run dev              # 启动 Vite 开发服务器
npm run build            # 生产构建 (vue-tsc --noEmit && vite build)
npm run preview          # 预览生产构建

# 测试
npm run test             # 运行测试
npm run test:watch       # 监听模式
npm run test:ui          # 测试 UI

# Tauri (桌面应用)
npm run tauri:dev        # 开发模式
npm run tauri:build      # 构建桌面应用

# 验证
npm run verify:jrxml     # 运行 quick-verify.sh 脚本
```

---

## 12. 关键架构模式

### 12.1 集中状态管理（无外部库）

所有状态以 Vue 3 reactive refs 形式集中在 `PDFDesigner.vue` 中，通过 props/emit 在组件间传递。优点是简单直接，缺点是组件层级深时 prop drilling 较多。

### 12.2 双数据源同步（表格）

表格的 `children`（层级）和 `columns`（扁平）需要保持同步。每次 mutation 后必须调用 `syncTableColumns()`。这是最容易出 bug 的地方。

### 12.3 命名空间 Fallback 策略（JRXML 解析）

JasperReports XML 使用命名空间前缀（如 `jr:column`），但不同工具生成的 XML 命名空间处理方式不同。解析器使用 3 层 fallback 策略确保兼容性。

### 12.4 单元格 `.element` 包装

所有单元格内容统一使用 `{ enable, element: { type, text/expression, ... }, rowSpan }` 格式。parse、generate、canvas 三处必须一致。

### 12.5 UUID 必须

JasperReports XSD 要求每个元素必须有 UUID。所有新创建的元素/列/分组都通过 `crypto.randomUUID()` 生成。

---

## 13. 常见开发任务指南

### 添加新的设计元素类型

1. 在 `src/types/index.ts` 中定义新元素接口
2. 在 `DesignElement` 联合类型中添加
3. 在 `parse.ts` 中添加解析逻辑
4. 在 `jrxmlGenerator.ts` 中添加生成逻辑
5. 在 `DesignerCanvas.vue` 中添加渲染分支
6. 在 `ElementProperties.vue` 中添加属性面板
7. 添加测试

### 修改表格列结构

1. 修改 `ColumnTreeSync.ts` 中的同步逻辑
2. 如需修改解析，在 `parse.ts` 的表格解析部分
3. 如需修改生成，在 `jrxmlGenerator.ts` 的表格生成部分
4. 运行 `npm run test` 确保往返一致性

### 调试 JRXML 问题

1. 导出有问题的 JRXML 文件
2. 检查 `parse.test.ts` 中的 fixture
3. 用 Jaspers Studio 打开 JRXML 验证 XML 格式
4. 检查 `round-trip-integrity.test.ts` 确认往返一致性
