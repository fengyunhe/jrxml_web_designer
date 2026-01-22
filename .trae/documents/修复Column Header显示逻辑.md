## 问题分析

1. **当前问题**：前端渲染逻辑对Column Header和Table Header使用了相同的分组渲染逻辑
2. **实际差异**：JasperReports引擎在生成PDF时，Column Header不会像Table Header那样进行组合，而是显示为单独的列
3. **根本原因**：
   - `hasColumnGroups`计算属性仅检查是否存在列分组，没有区分Table Header和Column Header
   - `RenderColumnGroup.vue`组件对两种类型的表头使用相同的渲染逻辑
   - 导致前端显示与实际PDF输出不符

## 修复方案

1. **修改`hasColumnGroups`逻辑**，区分Table Header和Column Header：
   - 为Column Header添加独立的判断逻辑
   - 检查列分组是否实际定义了columnHeader内容
   - 如果没有columnHeader内容，则不渲染为分组

2. **改进`RenderColumnGroup.vue`组件**：
   - 根据不同的`type`参数，使用不同的渲染逻辑
   - 对于Column Header，检查是否存在实际的columnHeader属性
   - 如果没有，则渲染为单独的列，而不是组合单元格

3. **优化表格元素渲染**：
   - 在`TableElement.vue`中，为Column Header添加独立的渲染逻辑
   - 确保前端渲染与实际PDF输出一致

## 预期效果

- Table Header：按现有逻辑渲染分组组合
- Column Header：
  - 如果列分组定义了columnHeader，则渲染为组合单元格
  - 否则，渲染为单独的列，与PDF输出一致
- 前端显示与实际PDF输出保持一致
- 符合JasperReports引擎的实际处理逻辑

## 实施步骤

1. 修改`hasColumnGroups`计算属性，添加Column Header的独立判断
2. 改进`RenderColumnGroup.vue`组件，根据type参数使用不同渲染逻辑
3. 在`TableElement.vue`中优化Column Header的渲染条件
4. 测试修复后的显示效果，确保与PDF输出一致
5. 验证与示例JRXML的兼容性

## 文件修改

- `/Users/yan.yang/open/jrxml_web_designer/src/components/elements/TableElement.vue`：修改hasColumnGroups和渲染逻辑
- `/Users/yan.yang/open/jrxml_web_designer/src/components/elements/RenderColumnGroup.vue`：改进组件渲染逻辑

## 技术要点

- 区分Table Header和Column Header的不同处理逻辑
- 根据实际的columnHeader属性决定是否渲染为分组
- 确保前端渲染与JasperReports引擎实际输出一致
- 保持代码的可维护性和扩展性