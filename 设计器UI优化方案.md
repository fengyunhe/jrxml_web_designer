# 设计器UI优化方案

## 📋 优化目标

**核心目标**：让用户通过设计界面的操作最终生成JRXML

**具体目标**：
1. 在属性面板中添加新属性的编辑控件
2. 让用户可以方便地编辑Frame、Table、基础组件的新属性
3. 优化用户体验，提升设计器易用性

---

## 🎯 优化计划

### 阶段1：Frame组件属性面板优化（1天）

**需要添加的控件**：

| 属性 | 控件类型 | 说明 |
|-----|---------|------|
| `printWhenExpression` | 表达式编辑器 | 条件打印表达式 |
| `isIgnorePagination` | 开关 | 忽略分页 |
| `isSplitAllowed` | 开关 | 允许分割 |
| `splitType` | 下拉选择 | 分页类型 |
| `isRemoveLineWhenBlank` | 开关 | 移除空白行 |
| `isPrintRepeatedValues` | 开关 | 打印重复值 |
| `layout` | 下拉选择 | 布局模式 |

**涉及的文件**：
- `src/components/designer/properties/ElementProperties.vue`
- `src/components/designer/properties/FrameProperties.vue`（新建）

---

### 阶段2：Table组件属性面板优化（1天）

**需要添加的控件**：

| 属性 | 控件类型 | 说明 |
|-----|---------|------|
| `rowGroups` | 行分组管理器 | 行分组支持 |
| `styles` | 样式选择器 | 表格样式 |
| `whenNoDataType` | 下拉选择 | 无数据类型 |
| `printHeaders` | 开关 | 打印表头 |
| `ignoreWidth` | 开关 | 忽略宽度 |
| `isIgnorePagination` | 开关 | 忽略分页 |
| `style` / `parentStyle` | 样式选择器 | 样式继承 |

**涉及的文件**：
- `src/components/designer/properties/ElementProperties.vue`
- `src/components/designer/properties/TableProperties.vue`（新建）

---

### 阶段3：TextField组件属性面板优化（0.5天）

**需要添加的控件**：

| 属性 | 控件类型 | 说明 |
|-----|---------|------|
| `evaluationTime` | 下拉选择 | 求值时间 |
| `evaluationGroup` | 分组选择 | 求值分组 |
| `hyperlinkType` | 下拉选择 | 超链接类型 |
| `hyperlinkReferenceExpression` | 表达式编辑器 | 超链接URL |
| `bookmarkLevel` | 数字输入 | 书签层级 |
| `isIgnorePagination` | 开关 | 忽略分页 |

**涉及的文件**：
- `src/components/designer/properties/ElementProperties.vue`

---

### 阶段4：基础组件属性面板优化（0.5天）

**需要添加的控件**：

| 组件 | 属性 | 控件类型 |
|-----|------|---------|
| Rectangle | `isPrintRepeatedValues` | 开关 |
| Rectangle | `isRemoveLineWhenBlank` | 开关 |
| Rectangle | `printWhenExpression` | 表达式编辑器 |
| Ellipse | `isPrintRepeatedValues` | 开关 |
| Ellipse | `isRemoveLineWhenBlank` | 开关 |
| Ellipse | `printWhenExpression` | 表达式编辑器 |
| Line | `isPrintRepeatedValues` | 开关 |
| Line | `printWhenExpression` | 表达式编辑器 |
| Break | `isResetPageNumber` | 开关 |

**涉及的文件**：
- `src/components/designer/properties/ElementProperties.vue`

---

## 🛠️ 实施步骤

### 步骤1：创建通用属性组件（0.5天）

创建可复用的属性编辑组件：

```
src/components/designer/properties/common/
├── ExpressionEditor.vue        # 表达式编辑器
├── SwitchControl.vue           # 开关控件
├── SelectControl.vue           # 下拉选择控件
└── StyleSelector.vue           # 样式选择器
```

### 步骤2：优化Frame属性面板（1天）

1. 创建 `FrameProperties.vue`
2. 添加Frame特有属性编辑控件
3. 集成到主属性面板

### 步骤3：优化Table属性面板（1天）

1. 创建 `TableProperties.vue`
2. 添加行分组管理器
3. 添加表格样式选择器
4. 集成到主属性面板

### 步骤4：优化TextField属性面板（0.5天）

1. 添加超链接属性编辑控件
2. 添加求值时间选择器
3. 集成到主属性面板

### 步骤5：优化基础组件属性面板（0.5天）

1. 添加打印控制开关
2. 添加条件打印表达式编辑器
3. 集成到主属性面板

---

## 📊 工作量估算

| 阶段 | 任务 | 工作量 | 优先级 |
|-----|------|--------|--------|
| **阶段1** | Frame组件属性面板 | 1天 | P0 |
| **阶段2** | Table组件属性面板 | 1天 | P1 |
| **阶段3** | TextField组件属性面板 | 0.5天 | P2 |
| **阶段4** | 基础组件属性面板 | 0.5天 | P3 |
| **总计** | - | **3天** | - |

---

## 🎯 关键文件

### 需要修改的文件

1. **主属性面板**
   - `src/components/designer/properties/ElementProperties.vue`

2. **新建组件属性面板**
   - `src/components/designer/properties/FrameProperties.vue`
   - `src/components/designer/properties/TableProperties.vue`

3. **通用属性组件**
   - `src/components/designer/properties/common/ExpressionEditor.vue`
   - `src/components/designer/properties/common/SwitchControl.vue`
   - `src/components/designer/properties/common/SelectControl.vue`

4. **国际化文件**
   - `src/locales/zh.json`
   - `src/locales/en.json`

---

## 🎯 验证方案

### 1. 功能验证

- [ ] Frame属性面板可以编辑所有新属性
- [ ] Table属性面板可以编辑所有新属性
- [ ] TextField属性面板可以编辑所有新属性
- [ ] 基础组件属性面板可以编辑所有新属性

### 2. 生成验证

- [ ] 从设计器导出JRXML
- [ ] 使用官方验证器验证
- [ ] 确保生成的JRXML正确

### 3. 用户体验验证

- [ ] 属性面板布局合理
- [ ] 控件响应迅速
- [ ] 操作直观易懂

---

## 📝 实施示例

### Frame属性面板示例

```vue
<template>
  <div class="frame-properties">
    <h4>Frame属性</h4>
    
    <!-- 布局模式 -->
    <div class="form-group">
      <label>布局模式</label>
      <select v-model="element.layout">
        <option value="FreeLayout">自由布局</option>
        <option value="HorizontalLayout">水平布局</option>
        <option value="VerticalLayout">垂直布局</option>
      </select>
    </div>
    
    <!-- 条件打印表达式 -->
    <div class="form-group">
      <label>条件打印表达式</label>
      <ExpressionEditor v-model="element.printWhenExpression" />
    </div>
    
    <!-- 分页控制 -->
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="element.isIgnorePagination" />
        忽略分页
      </label>
    </div>
    
    <!-- 打印控制 -->
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="element.isPrintRepeatedValues" />
        打印重复值
      </label>
    </div>
    
    <!-- 移除空白行 -->
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="element.isRemoveLineWhenBlank" />
        移除空白行
      </label>
    </div>
  </div>
</template>
```

---

## 🎯 核心价值

### 实现后的效果

1. ✅ **用户可以通过设计器编辑新属性**
2. ✅ **设计器生成的JRXML包含新属性**
3. ✅ **与JasperStudio完全兼容**
4. ✅ **提升用户体验**

### 与核心目标的关系

- ✅ **实现核心目标**：用户通过设计界面操作生成JRXML
- ✅ **提升设计器价值**：支持更多JasperStudio功能
- ✅ **增强竞争力**：与官方工具功能对齐

---

## 🚀 立即开始

现在开始实施阶段1：Frame组件属性面板优化。

**下一步行动**：
1. 创建通用属性组件
2. 优化Frame属性面板
3. 集成到主属性面板
4. 测试验证

---

**文档版本**：v1.0
**创建日期**：2026-05-28
**状态**：✅ 准备就绪
