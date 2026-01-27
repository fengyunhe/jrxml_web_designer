# JRXML表格元素解析与表头布局逻辑

## 1. 表格元素结构

### 1.1 核心元素

根据`components.xsd`定义，表格元素(`<table>`)的核心结构如下：

```xml
<table>
  <datasetRun />
  <columnGroup> <!-- 可选的列组，可嵌套 -->
    <columnGroup> <!-- 嵌套列组 -->
      <column /> <!-- 叶子列 -->
    </columnGroup>
  </columnGroup>
  <column /> <!-- 直接的叶子列 -->
  <tableHeader /> <!-- 表格头部行 -->
  <columnHeader /> <!-- 列头部行 -->
  <detail /> <!-- 详情行 -->
  <columnFooter /> <!-- 列尾部行 -->
  <tableFooter /> <!-- 表格尾部行 -->
</table>
```

### 1.2 列与列组

- **基础列(`BaseColumn`)**：所有列和列组的基类，包含通用属性和单元格定义
- **列组(`<columnGroup>`)**：可以包含子列或子列组，形成层级结构
- **叶子列(`<column>`)**：最终的数据列，包含详情单元格(`<detailCell>`)

### 1.3 单元格类型

- **表格头部单元格(`<tableHeader>`)**：应用于表格级别的头部
- **列头部单元格(`<columnHeader>`)**：应用于列级别的头部
- **组头部单元格(`<groupHeader>`)**：应用于特定组的头部
- **组尾部单元格(`<groupFooter>`)**：应用于特定组的尾部
- **表格尾部单元格(`<tableFooter>`)**：应用于表格级别的尾部

## 2. 表头布局解析逻辑

### 2.1 表头行数确定

表头的行数由列组的**最大深度**决定：

1. **计算节点深度**：递归计算每个列组节点的深度（叶子节点深度为0）
2. **确定最大深度**：找出所有节点中的最大深度值
3. **计算行数**：表头行数 = 最大深度 + 1

### 2.2 Colspan计算

`colspan`（列跨度）表示一个单元格跨越的列数：

1. **叶子节点**：`colspan = 1`
2. **列组节点**：`colspan = 该节点包含的叶子节点总数`
3. **计算方式**：递归统计子节点包含的叶子节点数量

### 2.3 Rowspan计算

`rowspan`（行跨度）表示一个单元格跨越的行数：

1. **叶子节点**：`rowspan = 最大深度 - 当前节点深度 + 1`
2. **列组节点**：
   - 如果节点定义了对应的header（`tableHeader`或`columnHeader`）：`rowspan = 1`
   - 否则：不渲染该节点，由子节点继承其位置

### 2.4 渲染规则

1. **条件渲染**：只有当节点实际定义了对应的header（`tableHeader`或`columnHeader`）时，才会渲染该节点
2. **层级渲染**：从根分组开始，递归渲染所有子节点
3. **空行处理**：移除没有任何单元格的空行
4. **行高计算**：根据第一个单元格的高度确定整行高度，默认为30px

## 3. 不同情况下的表头布局示例

### 3.1 简单表格（无列组）

**JRXML结构**：
```xml
<table>
  <column>
    <columnHeader />
  </column>
  <column>
    <columnHeader />
  </column>
</table>
```

**表头布局**：
- 行数：1行
- 每行单元格数量：2个
- 每个单元格：`colspan=1, rowspan=1`

### 3.2 一级列组

**JRXML结构**：
```xml
<table>
  <columnGroup>
    <columnHeader />
    <column>
      <columnHeader />
    </column>
    <column>
      <columnHeader />
    </column>
  </columnGroup>
</table>
```

**表头布局**：
- 行数：2行
- 第一行：1个单元格，`colspan=2, rowspan=1`
- 第二行：2个单元格，每个`colspan=1, rowspan=1`

### 3.3 嵌套列组

**JRXML结构**：
```xml
<table>
  <columnGroup>
    <tableHeader />
    <columnGroup>
      <tableHeader />
      <column>
        <tableHeader />
        <columnHeader />
      </column>
      <column>
        <tableHeader />
        <columnHeader />
      </column>
    </columnGroup>
    <columnGroup>
      <tableHeader />
      <column>
        <tableHeader />
        <columnHeader />
      </column>
    </columnGroup>
  </columnGroup>
</table>
```

**表头布局**：
- 行数：3行（`tableHeader`） + 1行（`columnHeader`） = 4行
- 每行单元格数量：根据嵌套层级和叶子节点数量动态计算
- 每个单元格的`colspan`和`rowspan`根据节点位置动态计算

## 4. 代码实现与Jaspersoft Report Library的对比

### 4.1 相同点

1. **层级结构处理**：都支持嵌套的列组结构
2. **colspan计算**：都基于叶子节点数量计算
3. **rowspan计算**：都基于节点深度和最大深度的差值计算
4. **条件渲染**：都只渲染实际定义了header的节点

### 4.2 不同点

1. **表头类型**：
   - Jaspersoft Report Library：严格区分`tableHeader`和`columnHeader`
   - 当前实现：在渲染时根据类型选择不同的渲染逻辑

2. **行高处理**：
   - Jaspersoft Report Library：可能支持更复杂的行高计算
   - 当前实现：使用第一个单元格的高度或默认值

3. **空行处理**：
   - Jaspersoft Report Library：可能有更严格的空行处理规则
   - 当前实现：简单移除空行

## 5. 验证与核对建议

### 5.1 验证方法

1. **创建测试用例**：创建各种复杂程度的JRXML表格文件
2. **对比渲染结果**：将当前实现的渲染结果与Jaspersoft Studio的渲染结果进行对比
3. **检查属性值**：验证每个单元格的`colspan`、`rowspan`和行高是否正确
4. **测试边界情况**：测试极端嵌套、空节点等边界情况

### 5.2 核对重点

1. **表头行数**：确保表头行数与Jaspersoft Studio一致
2. **单元格跨度**：确保每个单元格的`colspan`和`rowspan`计算正确
3. **行高计算**：确保行高与JRXML定义一致
4. **嵌套结构**：确保嵌套列组的渲染正确
5. **条件渲染**：确保只渲染实际定义了header的节点

## 6. 优化建议

1. **增强行高计算**：支持每行使用不同的高度，而不是依赖第一个单元格
2. **改进空行处理**：更严格地按照Jaspersoft Report Library的规则处理空行
3. **增强条件渲染**：支持更复杂的渲染条件，如`printWhenExpression`
4. **优化性能**：减少递归计算的次数，提高渲染效率
5. **增强类型定义**：完善TypeScript类型定义，提高代码的可维护性

通过以上文档，可以清晰地了解Jaspersoft Report Library对于JRXML表格元素的解析逻辑，特别是表头的布局方面。在核对当前代码实现时，可以对照文档中的规则，确保实现与Jaspersoft Report Library的逻辑一致。