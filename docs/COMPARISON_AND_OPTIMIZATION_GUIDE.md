# JRXML Web Designer vs Jaspersoft Studio 6 功能特性对比与优化指南

## 📋 文档概述

本文档对比当前 **JRXML Web Designer**（网页版）与官方 **Jaspersoft Studio 6**（Eclipse桌面版）的功能特性差异，并提供下一步优化方向建议。

---

## 一、功能特性对比

### 1.1 支持的元素类型

| 元素类型 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|---------|:------------:|:----------:|---------|
| Static Text (静态文本) | ✅ | ✅ | 功能完整 |
| Text Field (文本字段) | ✅ | ✅ | 功能完整 |
| Image (图像) | ✅ | ✅ | 功能完整 |
| Line (线条) | ✅ | ✅ | 功能完整 |
| Rectangle (矩形) | ✅ | ✅ | 功能完整 |
| Ellipse (椭圆) | ✅ | ✅ | 功能完整 |
| Break (分页符) | ✅ | ✅ | 功能完整 |
| Frame (框架) | ✅ | ✅ | 功能完整 |
| Table (表格) | ✅ | ✅ | 功能完整 |
| **List (列表)** | ✅ | ❌ | **缺失** |
| **Chart (图表)** | ✅ | ❌ | **缺失，支持30+图表类型** |
| **Crosstab (交叉表)** | ✅ | ❌ | **缺失** |
| **Subreport (子报表)** | ✅ | ❌ | **缺失** |
| **Barcode (条形码)** | ✅ | ❌ | **缺失，支持10+条码类型** |
| **Sparkline (迷你图)** | ✅ | ❌ | **缺失** |
| **Table of Contents (目录)** | ✅ | ❌ | **缺失** |
| **Map (地图)** | ✅ | ❌ | **缺失** |
| **Component (自定义组件)** | ✅ | ❌ | **缺失** |

### 1.2 Band（带区）支持

| Band 类型 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|----------|:------------:|:----------:|---------|
| Title (标题) | ✅ | ✅ | 功能完整 |
| Page Header (页眉) | ✅ | ✅ | 功能完整 |
| Page Footer (页脚) | ✅ | ✅ | 功能完整 |
| Column Header (列头) | ✅ | ✅ | 功能完整 |
| Column Footer (列脚) | ✅ | ✅ | 功能完整 |
| Detail (详情) | ✅ | ✅ | 功能完整 |
| Summary (摘要) | ✅ | ✅ | 功能完整 |
| Last Page Footer (末页脚) | ✅ | ✅ | 功能完整 |
| No Data (无数据) | ✅ | ✅ | 功能完整 |
| Background (背景) | ✅ | ✅ | 功能完整 |
| **Group Header (组头)** | ✅ | ❌ | **缺失** |
| **Group Footer (组脚)** | ✅ | ❌ | **缺失** |

### 1.3 数据模型支持

| 功能 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|-----|:------------:|:----------:|---------|
| Fields (字段) | ✅ | ✅ | 功能完整 |
| Parameters (参数) | ✅ | ✅ | 功能完整 |
| Variables (变量) | ✅ | ✅ | 功能完整 |
| SubDataset (子数据集) | ✅ | ✅ | 功能完整 |
| Styles (样式) | ✅ | ✅ | 功能完整 |
| **Query (查询)** | ✅ | ⚠️ | 部分支持，仅基本查询 |
| **Connection/DataSource** | ✅ | ❌ | **缺失，无法配置数据源** |
| **Sort (排序)** | ✅ | ❌ | **缺失** |
| **Filter (过滤)** | ✅ | ❌ | **缺失** |

### 1.4 属性配置

| 属性类型 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|---------|:------------:|:----------:|---------|
| 字体设置 | ✅ | ✅ | 功能完整 |
| 颜色/背景 | ✅ | ✅ | 功能完整 |
| 边框/Box | ✅ | ✅ | 功能完整 |
| 对齐方式 | ✅ | ✅ | 功能完整 |
| 填充模式 | ✅ | ✅ | 功能完整 |
| **Pattern (格式化)** | ✅ | ⚠️ | 部分支持 |
| **Print When Expression** | ✅ | ⚠️ | 部分支持 |
| **Evaluation Time** | ✅ | ✅ | 功能完整 |
| **Hyperlink (超链接)** | ✅ | ⚠️ | 部分支持 |
| **Bookmark Level** | ✅ | ⚠️ | 部分支持 |
| **Conditional Style** | ✅ | ⚠️ | 部分支持 |
| **Stretch/Position Type** | ✅ | ❌ | **缺失** |
| **Is Remove Line When Blank** | ✅ | ⚠️ | 部分支持 |
| **Is Print Repeated Values** | ✅ | ⚠️ | 部分支持 |
| **Markup (标记语言)** | ✅ | ✅ | 功能完整 |
| **Rotation (旋转)** | ✅ | ⚠️ | 部分支持 |
| **Text Adjust** | ✅ | ⚠️ | 部分支持 |

### 1.5 UI/交互功能

| 功能 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|-----|:------------:|:----------:|---------|
| 拖拽添加元素 | ✅ | ✅ | 功能完整 |
| 元素缩放 | ✅ | ✅ | 功能完整 |
| 元素对齐/磁吸 | ✅ | ✅ | 功能完整 |
| 撤销/重做 | ✅ | ✅ | 功能完整 |
| 复制/粘贴 | ✅ | ✅ | 功能完整 |
| 多选 | ✅ | ✅ | 功能完整 |
| 画布缩放 | ✅ | ✅ | 功能完整 |
| 属性面板 | ✅ | ✅ | 功能完整 |
| **Outline View (大纲视图)** | ✅ | ❌ | **缺失** |
| **Palette (组件面板)** | ✅ | ✅ | 基本实现 |
| **Expression Builder (表达式构建器)** | ✅ | ❌ | **缺失，需手动输入** |
| **Dataset Editor (数据集编辑器)** | ✅ | ❌ | **缺失** |
| **Style Editor (样式编辑器)** | ✅ | ⚠️ | 基本实现 |
| **Grid/Snap Settings** | ✅ | ✅ | 功能完整 |
| **Element Constraints** | ✅ | ❌ | **缺失，无法设置拉伸/位置约束** |

### 1.5.1 Table Component (表格组件) 详细对比

| 功能 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|-----|:------------:|:----------:|---------|
| 基础表格创建 | ✅ | ✅ | 功能完整 |
| 列添加/删除/排序 | ✅ | ✅ | 功能完整 |
| 列宽调整 | ✅ | ✅ | 功能完整 |
| **列分组 (Column Groups)** | ✅ | ✅ | 功能完整，支持嵌套多层分组 |
| **列合并 (rowSpan)** | ✅ | ✅ | 功能完整，正确处理高度计算 |
| 行高配置 | ✅ | ✅ | 支持5种行高：tableHeader, columnHeader, detailCell, columnFooter, tableFooter |
| **分组列行高同步** | ✅ | ✅ | 自动同步分组内所有列的行高 |
| **嵌套分组高度递归计算** | ✅ | ✅ | 递归处理多层嵌套的列分组 |
| 表格样式 | ✅ | ✅ | 支持5种表格样式：Table_TH, Table_CH, Table_TD, Table_FOOTER, Table_GROUP |
| **单元格内容对齐** | ✅ | ✅ | 支持水平和垂直对齐 |
| 单元格边框 | ✅ | ✅ | 功能完整 |
| **数据集 (Dataset)** | ✅ | ✅ | 支持独立的数据集配置 |
| **动态列** | ✅ | ❌ | **缺失，无法动态添加/删除列** |
| **行组 (Row Groups)** | ✅ | ❌ | **缺失，无法按数据分组** |
| **表格计算 (Table Calculations)** | ✅ | ❌ | **缺失，无法进行表格内计算** |
| **表格导出优化** | ✅ | ⚠️ | 基本导出支持 |

#### 表格处理关键技术点

**1. 高度计算逻辑**
- **单行高度 (Base Height)**: 用户配置的原始高度值
- **合并高度 (Merged Height)**: `单行高度 × rowSpan`
- **高度同步**: 修改任意单元格高度时，自动同步所有同类型单元格
- **避免重复计算**: 使用 `processedColumns` Set 跟踪已处理的列

**2. JSON 数据结构**
```typescript
interface TableElement {
  columns: TableColumn[];          // 扁平列数组
  children: (ColumnGroup | TableColumn)[]; // 嵌套结构
}

interface TableColumn {
  uuid: string;
  width: number;
  columnHeader: {
    height: number;      // 合并后的实际高度
    rowSpan: number;     // 跨度行数
    element: { height: number; };
  };
  detailCell: {
    height: number;      // 数据行高度
    element: { height: number; };
  };
  // ... 其他 cell 类型
}
```

**3. JRXML 生成时高度处理**
```typescript
// 避免重复乘以 rowSpan
const isAlreadyMerged = columnHeader.height % chRowSpan === 0;
if (!isAlreadyMerged) {
  // 还是单行高度，乘以 rowSpan
  columnHeader.height *= chRowSpan;
}
// 否则保持不变（已经是正确的合并高度）
```

**4. 设计器画布渲染**
- 使用 `table-layout: fixed` 防止内容撑开列
- 高度完全由 JSON 数据的内联样式设置（不使用 CSS 默认值）
- 添加 `overflow: hidden` 防止单元格内容撑开行高
- 使用 `vertical-align: top` 防止表格内容垂直拉伸

### 1.6 预览与导出

| 功能 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|-----|:------------:|:----------:|---------|
| PDF 预览 | ✅ | ✅ | 需要服务器 |
| **HTML 预览** | ✅ | ❌ | **缺失** |
| **Excel 导出** | ✅ | ❌ | **缺失** |
| **Word 导出** | ✅ | ❌ | **缺失** |
| **CSV 导出** | ✅ | ❌ | **缺失** |
| **RTF 导出** | ✅ | ❌ | **缺失** |
| **ODT 导出** | ✅ | ❌ | **缺失** |
| **打印功能** | ✅ | ❌ | **缺失** |

### 1.7 高级功能

| 功能 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|-----|:------------:|:----------:|---------|
| **Subreport (子报表)** | ✅ | ❌ | **缺失** |
| **Chart Wizard (图表向导)** | ✅ | ❌ | **缺失** |
| **Crosstab Designer** | ✅ | ❌ | **缺失** |
| **Barcode Support** | ✅ | ❌ | **缺失** |
| **Resource Bundles** | ✅ | ❌ | **缺失** |
| **Scriptlets** | ✅ | ❌ | **缺失** |
| **Custom Components** | ✅ | ❌ | **缺失** |
| **Report Templates** | ✅ | ❌ | **缺失** |
| **Style Templates** | ✅ | ⚠️ | 基本实现 |
| **Drill-Down/Drill-Through** | ✅ | ❌ | **缺失** |
| **Conditional Printing** | ✅ | ⚠️ | 部分支持 |
| **Group Management** | ✅ | ❌ | **缺失** |

### 1.8 文件管理

| 功能 | 官方 Studio 6 | 当前 Web 版 | 差距说明 |
|-----|:------------:|:----------:|---------|
| JRXML 导入 | ✅ | ✅ | 功能完整 |
| JRXML 导出 | ✅ | ✅ | 功能完整 |
| **Jasper 文件编译** | ✅ | ❌ | **缺失** |
| **模板保存/加载** | ✅ | ⚠️ | 本地存储 |
| **版本控制集成** | ✅ | ❌ | **缺失** |
| **多文件项目管理** | ✅ | ⚠️ | 基本实现 |

---

## 二、差距分析总结

### 2.1 核心缺失功能（高优先级）

1. **图表支持 (Chart)** — 支持柱状图、折线图、饼图、散点图等 30+ 图表类型
2. **子报表 (Subreport)** — 支持报表嵌套，实现复杂报表布局
3. **交叉表 (Crosstab)** — 支持数据透视表式布局
4. **条形码 (Barcode)** — 支持 Code 128、QR Code、EAN 等 10+ 条码类型
5. ~~**分组管理 (Groups)**~~ — ✅ **已完成**：支持 `<group>` 标签解析/生成，含 groupHeader、groupFooter
6. **表达式构建器 (Expression Builder)** — 可视化表达式编辑，字段/参数/变量自动补全
7. **多格式导出** — HTML、Excel、Word、CSV 等导出格式

### 2.2 重要缺失功能（中优先级）

1. **大纲视图 (Outline View)** — 树形结构展示报表元素层次
2. **数据源配置** — JDBC、XML、CSV、JavaBean 等数据源连接
3. **排序/过滤** — 数据排序和过滤表达式配置
4. **元素约束** — Stretch Type、Position Type 等布局约束
5. **资源包 (Resource Bundles)** — 国际化资源管理
6. **条件打印表达式** — Print When Expression 完整支持
7. **超链接配置** — 完整的超链接类型和参数配置

### 2.3 增强功能（低优先级）

1. **迷你图 (Sparkline)** — 行内小型图表
2. **目录 (Table of Contents)** — 自动生成报表目录
3. **地图 (Map)** — 地理数据可视化
4. **自定义组件** — 用户自定义报表组件
5. **脚本 (Scriptlets)** — 自定义 Java 代码集成
6. **打印功能** — 浏览器打印支持

---

## 三、下一步优化指南

### 3.1 第一阶段：核心能力补齐（1-2 个月）

#### 3.1.1 分组管理 (Groups)
**优先级：🔴 高**

```typescript
// 需要添加的数据结构
interface ReportGroup {
  name: string;
  expression: string;
  isStartNewPage: boolean;
  isRepeatHeader: boolean;
  isResetPageNumber: boolean;
  header?: Band;
  footer?: Band;
}

// 在 ReportProperties 中添加
interface ReportProperties {
  // ... existing fields
  groups: ReportGroup[];
}
```

**实现要点：**
- 在类型定义中添加 Group 支持
- 在 UI 中添加分组管理界面
- 在 Band 中支持 Group Header/Footer
- 在 JRXML 生成/解析中添加 Group 支持

#### 3.1.2 表达式构建器 (Expression Builder)
**优先级：🔴 高**

```typescript
// 表达式构建器组件架构
interface ExpressionBuilder {
  // 字段自动补全: $F{field_name}
  // 参数自动补全: $P{param_name}
  // 变量自动补全: $V{variable_name}
  // 运算符: +, -, *, /, ==, !=, <, >, &&, ||
  // 函数: IF, WHEN, SUM, COUNT, etc.
}
```

**实现要点：**
- 创建 ExpressionBuilder 组件
- 集成 CodeMirror 或 Monaco Editor
- 实现字段/参数/变量的自动补全
- 添加常用函数模板

#### 3.1.3 多格式导出
**优先级：🔴 高**

```typescript
// 导出格式枚举
enum ExportFormat {
  PDF = 'pdf',
  HTML = 'html',
  Excel = 'xlsx',
  Word = 'docx',
  CSV = 'csv',
  RTF = 'rtf',
  ODT = 'odt'
}
```

**实现要点：**
- 扩展预览服务器支持多种导出格式
- 在 UI 中添加导出格式选择
- 实现客户端 HTML/CSV 导出
- 集成 SheetJS (xlsx) 实现 Excel 导出

### 3.2 第二阶段：高级元素支持（2-3 个月）

#### 3.2.1 图表支持 (Chart)
**优先级：🟡 中高**

```typescript
// 图表类型枚举
enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Scatter = 'scatter',
  Area = 'area',
  Bubble = 'bubble',
  Candlestick = 'candlestick',
  // ... 更多类型
}

// 图表元素接口
interface ChartElement extends DesignElementBase {
  type: 'chart';
  chartType: ChartType;
  dataset: TableDataset;
  // 图表配置...
}
```

**实现要点：**
- 集成 Chart.js 或 ECharts
- 创建 ChartElement 组件
- 实现图表配置面板
- 在 JRXML 中生成 `<chart>` 标签

#### 3.2.2 子报表 (Subreport)
**优先级：🟡 中高**

```typescript
// 子报表元素接口
interface SubreportElement extends DesignElementBase {
  type: 'subreport';
  subreportExpression: string;
  parametersMapExpression?: string;
  connectionExpression?: string;
  dataset?: TableDataset;
}
```

**实现要点：**
- 创建 SubreportElement 组件
- 实现子报表参数映射
- 支持连接/数据源传递
- 在 JRXML 中生成 `<subreport>` 标签

#### 3.2.3 交叉表 (Crosstab)
**优先级：🟡 中**

```typescript
// 交叉表元素接口
interface CrosstabElement extends DesignElementBase {
  type: 'crosstab';
  dataset: TableDataset;
  rowGroups: CrosstabGroup[];
  columnGroups: CrosstabGroup[];
  measures: CrosstabMeasure[];
}
```

#### 3.2.4 条形码 (Barcode)
**优先级：🟡 中**

```typescript
// 条形码类型枚举
enum BarcodeType {
  Code128 = 'code128',
  QRCode = 'qrCode',
  EAN13 = 'ean13',
  UPC = 'upc',
  // ... 更多类型
}

// 条形码元素接口
interface BarcodeElement extends DesignElementBase {
  type: 'barcode';
  barcodeType: BarcodeType;
  expression: string;
}
```

### 3.3 第三阶段：UI/UX 增强（2-3 个月）

#### 3.3.1 大纲视图 (Outline View)
**优先级：🟡 中**

```vue
<!-- 大纲视图组件 -->
<template>
  <div class="outline-view">
    <div class="outline-header">大纲</div>
    <div class="outline-tree">
      <div v-for="band in bands" :key="band.type">
        <div class="band-node">{{ band.type }}</div>
        <div v-for="element in band.elements" :key="element.uuid">
          <div class="element-node" @click="selectElement(element)">
            {{ getElementIcon(element.type) }} {{ getElementName(element) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

**实现要点：**
- 创建 OutlineView 组件
- 实现树形结构展示
- 支持点击选中元素
- 支持拖拽调整顺序
- 与选中状态同步

#### 3.3.2 元素约束配置
**优先级：🟢 中低**

```typescript
// 元素约束接口
interface ElementConstraints {
  // 拉伸类型
  stretchType?: 'RelativeToTallestObject' | 'RelativeToBandHeight' | 'NoStretchor';
  // 位置类型
  positionType?: 'FixRelativeToObject' | 'Float' | 'StretchRelativeToBottom';
  // 是否允许拉伸
  isStretchWithOverflow?: boolean;
}
```

#### 3.3.3 数据源配置
**优先级：🟡 中**

```typescript
// 数据源类型
enum DataSourceType {
  JDBC = 'jdbc',
  XML = 'xml',
  CSV = 'csv',
  JavaBean = 'javabean',
  Empty = 'empty'
}

// 数据源配置
interface DataSourceConfig {
  type: DataSourceType;
  // JDBC 配置
  jdbcUrl?: string;
  username?: string;
  password?: string;
  driverClass?: string;
  // 其他配置...
}
```

### 3.4 第四阶段：高级功能（3-4 个月）

#### 3.4.1 资源包 (Resource Bundles)
**优先级：🟢 低**

```typescript
// 资源包配置
interface ResourceBundle {
  name: string;
  locale: string;
  properties: Record<string, string>;
}

// 支持表达式中的资源包引用
// $R{resource.key}
```

#### 3.4.2 迷你图 (Sparkline)
**优先级：🟢 低**

```typescript
// 迷你图元素接口
interface SparklineElement extends DesignElementBase {
  type: 'sparkline';
  sparklineType: 'line' | 'bar' | 'area';
  expression: string;
}
```

#### 3.4.3 目录 (Table of Contents)
**优先级：🟢 低**

```typescript
// 目录元素接口
interface TableOfContentsElement extends DesignElementBase {
  type: 'tableOfContents';
  bookmarkLevel: number;
  // 目录样式配置...
}
```

---

## 四、技术实现建议

### 4.1 架构优化

```typescript
// 建议的模块化架构
src/
├── components/
│   ├── elements/
│   │   ├── base/           # 基础元素组件
│   │   ├── text/           # 文本相关元素
│   │   ├── shape/          # 图形相关元素
│   │   ├── container/      # 容器相关元素
│   │   ├── chart/          # 图表相关元素（新增）
│   │   ├── barcode/        # 条形码相关元素（新增）
│   │   └── advanced/       # 高级元素（子报表、交叉表等）
│   ├── panels/
│   │   ├── outline/        # 大纲视图（新增）
│   │   ├── expression/     # 表达式构建器（新增）
│   │   └── datasource/     # 数据源配置（新增）
│   └── editor/
│       └── expression/     # 表达式编辑器
├── utils/
│   ├── jrxml/
│   │   ├── generators/     # 按元素类型拆分生成器
│   │   ├── parsers/        # 按元素类型拆分解析器
│   │   └── validators/     # JRXML 验证器
│   └── export/             # 导出功能模块（新增）
│       ├── html.ts
│       ├── excel.ts
│       └── csv.ts
└── composables/
    ├── useGroups.ts        # 分组管理（新增）
    ├── useExpression.ts    # 表达式管理（新增）
    └── useExport.ts        # 导出管理（新增）
```

### 4.2 JRXML 生成器优化

```typescript
// 建议的生成器模块化
export class JRXMLGenerator {
  // 核心生成
  static generate(properties: ReportProperties, bands: Band[], ...): string
  
  // 子生成器
  static generateGroupXML(group: ReportGroup): string
  static generateChartXML(chart: ChartElement): string
  static generateSubreportXML(subreport: SubreportElement): string
  static generateBarcodeXML(barcode: BarcodeElement): string
  static generateCrosstabXML(crosstab: CrosstabElement): string
}
```

### 4.3 JRXML 解析器优化

```typescript
// 建议的解析器模块化
export class JRXMLParser {
  // 核心解析
  static parse(content: string): ReportData
  
  // 子解析器
  static parseGroupElement(elem: Element): ReportGroup
  static parseChartElement(elem: Element): ChartElement
  static parseSubreportElement(elem: Element): SubreportElement
  static parseBarcodeElement(elem: Element): BarcodeElement
  static parseCrosstabElement(elem: Element): CrosstabElement
}
```

---

## 五、实施路线图

### Phase 1: 基础补齐（1-2 个月）
- [x] 分组管理 (Groups) ✅ 已完成
- [ ] 表达式构建器 (Expression Builder)
- [ ] 多格式导出 (HTML, Excel, CSV)

### Phase 2: 高级元素（2-3 个月）
- [ ] 图表支持 (Chart)
- [ ] 子报表 (Subreport)
- [ ] 条形码 (Barcode)

### Phase 3: UI 增强（2-3 个月）
- [ ] 大纲视图 (Outline View)
- [ ] 元素约束配置
- [ ] 数据源配置

### Phase 4: 高级功能（3-4 个月）
- [ ] 交叉表 (Crosstab)
- [ ] 资源包 (Resource Bundles)
- [ ] 迷你图 (Sparkline)
- [ ] 目录 (Table of Contents)

---

## 六、总结

### 当前项目优势
1. ✅ 轻量级，无需安装，浏览器直接运行
2. ✅ 现代化 UI，用户体验良好
3. ✅ 基础元素类型完整（9种）
4. ✅ 支持中英文国际化
5. ✅ 代码开源，易于扩展

### 主要差距
1. ❌ 缺少图表、子报表、交叉表等高级元素
2. ❌ 缺少表达式构建器，用户需手动输入
3. ❌ 缺少多格式导出支持
4. ✅ 分组管理功能已完成
5. ❌ 缺少大纲视图等辅助设计工具

### 优化优先级建议
1. **P0 (立即)**: ~~分组管理~~ ✅ 已完成、表达式构建器、多格式导出
2. **P1 (1-2月)**: 图表支持、子报表、条形码
3. **P2 (2-3月)**: 大纲视图、数据源配置、元素约束
4. **P3 (3-4月)**: 交叉表、资源包、迷你图

通过以上优化，JRXML Web Designer 将逐步接近官方 Jaspersoft Studio 6 的功能水平，同时保持其轻量级、易用的优势，成为 JasperReport 设计的优秀 Web 替代方案。
