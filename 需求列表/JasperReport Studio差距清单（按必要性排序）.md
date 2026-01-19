# JasperReport Studio 差距清单（按必要性排序）

本文以“JasperReport Studio（桌面端）常见能力”为参照，列出当前 Web 设计器中**尚未看到闭环实现**的能力，并按“对可用性/兼容性/落地价值”的必要性从高到低排序，便于逐步完善。

## 0. 当前 Web 设计器能力边界（基线）

- 画布交互：拖拽放置、移动、缩放、对齐线/网格、框选多选、Band 高度调整（见 [DesignerCanvas.vue](../src/components/designer/DesignerCanvas.vue)、[BaseElement.vue](../src/components/elements/BaseElement.vue)）
- 元素类型：staticText、textField、image、line、rectangle（见 [types/index.ts](../src/types/index.ts#L1)）
- Band：title/pageHeader/columnHeader/detail/columnFooter/pageFooter/summary/background/lastPageFooter/noData（见 [types/index.ts](../src/types/index.ts#L4)）
- 属性编辑：位置尺寸、字体、对齐、背景色、边框/box/padding，部分 textField/image 专有属性（见 [ElementProperties.vue](../src/components/designer/properties/ElementProperties.vue)）
- JRXML：可从模型生成、也可从 JRXML 解析回模型（覆盖范围有限，仅针对已支持元素与少量属性，见 [jrxmlGenerator.ts](../src/utils/jrxmlGenerator.ts)）
- 文件管理：localStorage 文件列表 + 导入/导出 jrxml/json（见 [FileManager.vue](../src/components/designer/controls/FileManager.vue)、[fileUtils.ts](../src/utils/fileUtils.ts)）
- 预览：依赖外部接口生成预览 PDF（见 [PdfPreviewModal.vue](../src/components/modals/PdfPreviewModal.vue)、[apiConfig.ts](../src/config/apiConfig.ts)）

## 1. P0（必须优先补齐）：兼容性与可交付闭环

这部分决定“能不能在真实项目里稳定用”，优先级最高。

### 1.1 JRXML 覆盖面与 XSD 兼容性（生成 + 反向导入）

- 报表级：更多 report 属性（语言/脚本、whenNoDataType、columnCount/columnWidth/columnSpacing、多列、忽略分页等）
- 元素级：printWhenExpression、positionType/stretchType、removeLineWhenBlank、blankWhenNull、textAdjust/markup 的完整互转
- 元素通用：UUID/属性集、JasperReports property 扩展（`<property name="...">`）的保留与回写
- 命名空间与组件：对 `jr:` / `c:` 等组件命名空间的“保留不丢失”（即便暂不支持可视化，也要做到导入-导出不破坏）

落地建议：
- 先把“导入后再导出不丢信息（round-trip）”作为硬指标；未支持的节点做 passthrough 保存到模型中，避免用户打开再保存导致 JRXML 被破坏。
- 以 [参考信息/jasperreport.xsd](../参考信息/jasperreport.xsd) 为准，把当前生成子集与 XSD 对齐并补齐关键必需属性。

### 1.2 数据链路最小闭环：参数/字段/表达式的可用性

JasperReport Studio 的核心工作流是：数据源/Query → 字段/参数/变量 → 表达式 → 预览/导出。

当前缺口（建议按顺序）：
- 参数完善：prompting（是否提示）、默认值表达式、参数描述、参数顺序/分组（当前仅 `name/class/defaultValue?`）
- 字段完善：字段来源信息（dataset/query）、字段显示名/描述
- 表达式编辑体验：语法高亮、函数/参数/字段自动完成、错误提示（目前主要是文本输入）

### 1.3 预览/导出能力的“可控性”

- 本地预览（可选）：在无外部服务时仍可跑“基础预览”（哪怕只支持静态数据/JSON 数据源）
- 预览配置：明确选择数据适配器/参数输入/数据集，并可保存为“预览配置”
- 导出格式：Studio 支持多格式导出（PDF/XLSX/HTML/CSV/DOCX 等）；Web 端至少需要明确“目前只生成 JRXML/预览 PDF”的边界或逐步增加导出能力

### 1.4 校验与诊断（替代 Studio 的 Problems 视图）

- XSD/规则校验：缺失必填属性、越界、负尺寸、重叠风险等
- 表达式校验：引用不存在字段/参数、基本语法检查
- 导入兼容报告：导入时提示“哪些节点被忽略/降级”

## 2. P1（强需求）：生产级报表常用能力

这部分决定“能不能覆盖 60%+ 常见报表场景”。

### 2.1 报表结构建模：分组/变量/排序/分页控制

- Group：groupHeader/groupFooter band、groupExpression、分组分页（startNewPage 等）
- Variable：计算变量（sum/count/avg…）、resetType/resetGroup、incrementType
- 排序：按字段/表达式排序（对 Detail 输出影响很大）
- 分页与溢出策略：元素/容器的伸展、浮动、拆分策略建模（当前 band 有 splitType，但元素级策略不足）

### 2.2 组件生态（最常用优先）

- Frame（容器）：作为布局/边框组合的基础
- List / Table Component：明细列表、表格是报表最常见形态之一
- Subreport：主从报表拆分、复用模板（以及 subreportParameter 的传递）
- 图表（Chart）：柱状/折线/饼图（可先做最小集）
- 条码/二维码：很多业务单据必须

### 2.3 样式体系（替代 Studio 的 Styles）

- Style：全局样式定义、样式引用、继承与覆盖
- 条件样式：根据表达式切换颜色/字体等
- 主题/模板：企业统一风格复用

### 2.4 资源管理（图片/字体/子报表文件）

- 资源库：图片上传/引用（classpath/url/file/参数），导出时资源打包策略
- 字体：字体选择、fallback、导出时字体嵌入/映射策略
- 子报表与模板片段：以工程维度管理依赖

## 3. P2（增量价值）：高级排版与复杂场景

这部分提升“复杂单据/多语言/多模板场景”的上限。

- 多列（columns）与列流式布局：columnCount/columnWidth/columnSpacing
- 复杂文本：富文本/markup 的可视化编辑（HTML/RTF/styled text 等）
- Crosstab：交叉表（实现成本高，建议在 Table 稳定后再做）
- 多 dataset/子数据集：图表/表格通常需要子数据集
- 国际化：resource bundle、字体与文本方向（RTL）、多语言模板管理

## 4. P3（体验与生态）：替代 Studio 的“工程化能力”

这部分不一定影响“能用”，但会显著影响“好用、可维护、可协作”。

- Report Inspector（大纲树）：按 band/元素层级展示、重命名、锁定/隐藏、快速定位
- 属性体系增强：属性分组、搜索、属性继承、批量编辑、右键菜单
- 对齐/分布工具：等间距分布、尺寸一致、对齐到页面边界、智能参考线
- 模板与片段：组件/样式/片段的导入导出与复用
- 与 JasperReports Server 集成：发布、资源仓库、权限、版本
- Git/协作：在 Web 侧提供差异对比、冲突提示（至少对 JRXML 有稳定 diff 体验）

## 5. 建议的渐进式路线（可作为迭代里程碑）

1) P0.1：JRXML round-trip 不丢信息（未支持节点 passthrough）
2) P0.2：参数/字段/表达式编辑体验 + 校验提示
3) P0.3：预览链路可配置（数据/参数）并可保存
4) P1.1：Group/Variable 基础闭环
5) P1.2：Frame + Table（或 List）作为第一个“复杂组件”
6) P1.3：Style 全局样式与引用
7) P1.4：资源库（图片/字体/子报表）
8) P2/P3：按业务场景补齐图表/条码/交叉表与工程化体验

