# JasperReports表格列组合逻辑分析

## 一、核心概念

### 1. 列层次结构
- **BaseColumn**：基础列接口，定义了列的基本属性和方法
- **Column**：普通列，继承自BaseColumn
- **ColumnGroup**：列组合，继承自BaseColumn，可以包含子列
- **StandardColumnGroup**：ColumnGroup的具体实现类

### 2. 列组合的核心属性
- **children**：存储子列的列表，类型为`List<BaseColumn>`
- 子列可以是普通列（Column）或其他列组合（ColumnGroup）
- 支持任意深度的嵌套结构

## 二、列组合的实现逻辑

### 1. 列组合的创建
```java
public StandardColumnGroup() {
    children = new ArrayList<>();
}

public StandardColumnGroup(ColumnGroup columnGroup, ColumnFactory factory) {
    super(columnGroup, factory);
    children = factory.createColumns(columnGroup.getColumns());
}
```

### 2. 子列管理方法
- **addColumn(BaseColumn column)**：添加子列到末尾
- **addColumn(int index, BaseColumn column)**：在指定位置添加子列
- **removeColumn(BaseColumn column)**：移除指定子列
- **setColumns(List<BaseColumn> columns)**：设置子列列表

### 3. 表头组合逻辑
- 每个列（包括列组合）都可以有自己的表头单元格：`getColumnHeader()`
- 表头单元格可以设置`rowSpan`属性，表示跨行
- 表格验证时会检查表头的行高和跨行设置

### 4. 表格验证逻辑
- **verifyColumnHeights**方法处理表头的行高验证
- 使用访问者模式遍历列结构
- 对于列组合，会递归处理其子列的表头
- 计算每行的高度，并验证单元格的`rowSpan`是否合法

## 三、设计器实现建议

### 1. 数据结构设计
- 采用树形结构表示列层次
- 每个节点可以是普通列或列组合
- 存储列的宽度、表头信息等属性

### 2. 表头组合实现
- 为每个列（包括列组合）提供表头编辑功能
- 支持设置表头的`rowSpan`属性
- 实现表头的可视化编辑界面

### 3. 验证逻辑
- 实现类似`TableCompiler`的验证逻辑
- 检查列组合的宽度是否等于其子列宽度之和
- 验证表头的跨行设置是否合法
- 确保表头行高一致

### 4. 渲染逻辑
- 采用深度优先遍历方式渲染列结构
- 对于列组合，先渲染其表头，再递归渲染子列
- 处理表头的跨行显示

## 四、关键注意事项

1. **嵌套结构处理**：支持任意深度的列组合嵌套
2. **宽度计算**：列组合的宽度必须等于其子列宽度之和
3. **表头对齐**：确保表头的跨行设置正确，避免布局错乱
4. **验证机制**：在设计时提供实时验证，确保生成的JRXML符合规范
5. **性能优化**：对于大型表格，考虑使用虚拟滚动等技术优化渲染性能

## 五、参考实现

- 参考`StandardColumnGroup`类的实现
- 参考`TableCompiler.verifyColumnHeights`方法的表头验证逻辑
- 参考`ColumnVisitor`访问者模式的使用

通过遵循这些逻辑，可以实现与JasperReports兼容的表格列组合和表头组合功能，确保生成的JRXML能够正确渲染。