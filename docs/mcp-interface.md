# MCP 接口规范文档

## 概述

MCP (Model Context Protocol) 是JRXML Web Designer中用于AI大模型与设计工具交互的接口规范。通过这套接口，AI可以动态创建、修改、删除和查询报表元素。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **AI模型**: @huggingface/transformers (本地模型)
- **状态管理**: Vue Composition API + reactive refs

## MCP工具概览

### 查询工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `get_design_state` | 获取当前报表设计状态 | 无 |
| `get_element` | 获取指定元素信息 | `uuid`: 元素UUID |
| `find_elements` | 按条件查找元素 | `fieldName`?, `parameterName`?, `elementType`?, `text`? |

### 创建工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `create_static_text` | 创建静态文本 | `bandType`, `x`, `y`, `width`, `height`, `text` |
| `create_text_field` | 创建动态文本框 | `bandType`, `x`, `y`, `width`, `height`, `expression` |
| `create_rectangle` | 创建矩形 | `bandType`, `x`, `y`, `width`, `height` |
| `create_frame` | 创建Frame容器 | `bandType`, `x`, `y`, `width`, `height` |

### 修改工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `update_element` | 更新元素属性 | `uuid`, `properties` |
| `move_element` | 移动元素位置 | `uuid`, `x`, `y` |

### 删除工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `delete_element` | 删除指定元素 | `uuid` |

### Band操作工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `update_band_height` | 调整Band高度 | `bandType`, `height` |

## 工具详细定义

### get_design_state

获取当前报表的设计状态，包括所有元素、band、字段、参数等信息。

**参数**: 无

**返回**:
```typescript
{
  reportProperties: ReportProperties,
  bands: Array<{
    type: BandType,
    height: number,
    elementsCount: number
  }>,
  fields: Field[],
  parameters: Parameter[],
  variables: ReportVariable[]
}
```

**示例**:
```typescript
const result = await executeMCPTool('get_design_state', {});
// result.data.bands = [
//   { type: 'title', height: 50, elementsCount: 0 },
//   { type: 'detail', height: 100, elementsCount: 2 }
// ]
```

### get_element

获取指定元素的详细信息。

**参数**:
- `uuid` (string, 必需): 元素的UUID标识符

**返回**:
```typescript
{
  ...DesignElement,
  bandType: BandType
}
```

**示例**:
```typescript
const result = await executeMCPTool('get_element', {
  uuid: 'a1b2c3d4-...'
});
// result.data = {
//   uuid: 'a1b2c3d4-...',
//   type: 'staticText',
//   x: 10,
//   y: 10,
//   width: 200,
//   height: 30,
//   text: 'Customer Name',
//   bandType: 'detail'
// }
```

### find_elements

按条件查找元素。

**参数**:
- `fieldName` (string, 可选): 按字段名查找（用于textField）
- `parameterName` (string, 可选): 按参数名查找（用于textField）
- `elementType` (string, 可选): 按元素类型查找
- `text` (string, 可选): 按显示文本查找（部分匹配）

**返回**:
```typescript
Array<{
  element: DesignElement,
  bandType: BandType,
  index: number,
  parentFrameIndex?: number
}>
```

**示例**:
```typescript
// 查找所有使用字段customerName的元素
const result = await executeMCPTool('find_elements', {
  fieldName: 'customerName'
});

// 查找所有静态文本
const result2 = await executeMCPTool('find_elements', {
  elementType: 'staticText'
});
```

### create_static_text

创建静态文本元素。

**参数**:
- `bandType` (BandType, 必需): 目标Band类型
- `x` (number, 必需): X坐标位置
- `y` (number, 必需): Y坐标位置
- `width` (number, 必需): 元素宽度
- `height` (number, 必需): 元素高度
- `text` (string, 必需): 静态文本内容
- `fontSize` (number, 可选): 字体大小（默认12）
- `fontFamily` (string, 可选): 字体名称（默认Arial）
- `isBold` (boolean, 可选): 是否加粗
- `isItalic` (boolean, 可选): 是否斜体
- `forecolor` (string, 可选): 前景色（如"#000000"）
- `backcolor` (string, 可选): 背景色
- `textAlignment` ('Left' | 'Center' | 'Right' | 'Justified', 可选): 文本对齐方式

**返回**:
```typescript
{
  uuid: string,
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('create_static_text', {
  bandType: 'detail',
  x: 10,
  y: 10,
  width: 200,
  height: 30,
  text: 'Customer Name',
  fontSize: 14,
  fontFamily: 'Arial',
  isBold: true,
  forecolor: '#333333',
  textAlignment: 'Left'
});
// result.data.uuid = 'a1b2c3d4-...'
```

### create_text_field

创建动态文本框，用于显示字段值或表达式。

**参数**:
- `bandType` (BandType, 必需): 目标Band类型
- `x` (number, 必需): X坐标位置
- `y` (number, 必需): Y坐标位置
- `width` (number, 必需): 元素宽度
- `height` (number, 必需): 元素高度
- `expression` (string, 必需): 表达式，如"$F{fieldName}"或"$V{variableName}"
- `fontSize` (number, 可选): 字体大小（默认12）
- `fontFamily` (string, 可选): 字体名称（默认Arial）
- `isBold` (boolean, 可选): 是否加粗
- `pattern` (string, 可选): 格式化模式（如"#,##0.00"）

**返回**:
```typescript
{
  uuid: string,
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('create_text_field', {
  bandType: 'detail',
  x: 10,
  y: 50,
  width: 150,
  height: 25,
  expression: '$F{customerName}',
  fontSize: 12,
  pattern: '@'
});
```

### create_rectangle

创建矩形元素。

**参数**:
- `bandType` (BandType, 必需): 目标Band类型
- `x` (number, 必需): X坐标位置
- `y` (number, 必需): Y坐标位置
- `width` (number, 必需): 元素宽度
- `height` (number, 必需): 元素高度
- `forecolor` (string, 可选): 前景色（边框色）
- `backcolor` (string, 可选): 背景色
- `mode` ('Opaque' | 'Transparent', 可选): 显示模式
- `lineWidth` (number, 可选): 边框宽度
- `lineStyle` ('Solid' | 'Dashed' | 'Dotted', 可选): 边框样式

**返回**:
```typescript
{
  uuid: string,
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('create_rectangle', {
  bandType: 'columnHeader',
  x: 0,
  y: 0,
  width: 555,
  height: 30,
  backcolor: '#E3F2FD',
  lineWidth: 1,
  lineStyle: 'Solid'
});
```

### create_frame

创建Frame容器元素，可包含其他元素。

**参数**:
- `bandType` (BandType, 必需): 目标Band类型
- `x` (number, 必需): X坐标位置
- `y` (number, 必需): Y坐标位置
- `width` (number, 必需): Frame宽度
- `height` (number, 必需): Frame高度
- `borderColor` (string, 可选): 边框颜色
- `backgroundColor` (string, 可选): 背景颜色

**返回**:
```typescript
{
  uuid: string,
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('create_frame', {
  bandType: 'detail',
  x: 10,
  y: 10,
  width: 300,
  height: 100,
  borderColor: '#2196F3',
  backgroundColor: '#F5F5F5'
});
```

### update_element

更新指定元素的一个或多个属性。

**参数**:
- `uuid` (string, 必需): 元素的UUID标识符
- `properties` (object, 必需): 要更新的属性键值对
  - `x` (number, 可选): 新的X坐标
  - `y` (number, 可选): 新的Y坐标
  - `width` (number, 可选): 新的宽度
  - `height` (number, 可选): 新的高度
  - `text` (string, 可选): 文本内容
  - `expression` (string, 可选): 表达式
  - `fontSize` (number, 可选): 字体大小
  - `fontFamily` (string, 可选): 字体名称
  - `isBold` (boolean, 可选): 是否加粗
  - `forecolor` (string, 可选): 前景色
  - `backcolor` (string, 可选): 背景色
  - `textAlignment` (string, 可选): 文本对齐方式

**返回**:
```typescript
{
  success: boolean,
  message: string
}
```

**示例**:
```typescript
// 更新元素位置和样式
const result = await executeMCPTool('update_element', {
  uuid: 'a1b2c3d4-...',
  properties: {
    x: 20,
    y: 30,
    fontSize: 16,
    isBold: true,
    forecolor: '#1565C0'
  }
});
```

### move_element

移动元素到新位置。

**参数**:
- `uuid` (string, 必需): 元素的UUID标识符
- `x` (number, 必需): 新的X坐标
- `y` (number, 必需): 新的Y坐标

**返回**:
```typescript
{
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('move_element', {
  uuid: 'a1b2c3d4-...',
  x: 100,
  y: 50
});
```

### delete_element

删除指定元素。

**参数**:
- `uuid` (string, 必需): 元素的UUID标识符

**返回**:
```typescript
{
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('delete_element', {
  uuid: 'a1b2c3d4-...'
});
```

### update_band_height

调整指定Band的高度。

**参数**:
- `bandType` (BandType, 必需): Band类型
- `height` (number, 必需): 新的Band高度

**返回**:
```typescript
{
  success: boolean,
  message: string
}
```

**示例**:
```typescript
const result = await executeMCPTool('update_band_height', {
  bandType: 'detail',
  height: 150
});
```

## Band类型枚举

| 值 | 描述 |
|----|------|
| `title` | 标题区域 |
| `pageHeader` | 页面头部 |
| `pageFooter` | 页面底部 |
| `columnHeader` | 列头部 |
| `columnFooter` | 列底部 |
| `detail` | 详细数据区域 |
| `summary` | 汇总区域 |
| `background` | 背景区域 |
| `lastPageFooter` | 最后一页底部 |
| `noData` | 无数据时显示 |

## AI交互流程

### 1. 用户输入 → AI解析

```
用户: "在detail band中创建一个静态文本，内容是'Customer Name'，字体大小14，加粗"
        ↓
AI模型: 解析意图
        ↓
输出工具调用: create_static_text(bandType: "detail", x: 10, y: 10, width: 200, height: 30, text: "Customer Name", fontSize: 14, isBold: true)
```

### 2. 工具执行 → UI更新

```
MCP Tool Handler: 接收工具调用
        ↓
创建元素: 使用createNewElement()
        ↓
添加到Band: band.elements.push(newElement)
        ↓
保存历史: saveStateToHistory()
        ↓
更新JRXML: updateJRXML()
        ↓
UI重绘: Vue响应式系统自动更新画布
```

### 3. 结果反馈

```
工具执行结果: { success: true, uuid: "a1b2c3d4-..." }
        ↓
AI模型: 生成响应消息
        ↓
显示给用户: "已成功在detail band中创建静态文本'Customer Name'"
```

## 智能确认机制

MCP工具调用会根据操作风险等级自动决定是否需要用户确认：

### 风险等级定义

| 等级 | 描述 | 需要确认 |
|------|------|---------|
| SAFE | 只读操作（查询） | 否 |
| LOW | 单个元素创建/修改 | 否 |
| MEDIUM | 多个元素修改或单个删除 | 是 |
| HIGH | 批量删除或不可逆操作 | 是 |
| CRITICAL | 极高风险操作 | 强制确认 |

### 工具风险等级

| 工具名 | 风险等级 |
|--------|---------|
| `get_design_state` | SAFE |
| `get_element` | SAFE |
| `find_elements` | SAFE |
| `create_static_text` | LOW |
| `create_text_field` | LOW |
| `create_rectangle` | LOW |
| `create_frame` | LOW |
| `update_element` | LOW |
| `move_element` | LOW |
| `delete_element` | MEDIUM |
| `update_band_height` | LOW |

## 错误处理

### 常见错误类型

1. **元素未找到**: `Element with UUID xxx not found`
2. **Band未找到**: `Band xxx not found`
3. **参数验证失败**: `Invalid parameter: xxx`
4. **模型加载失败**: `本地AI模型库加载失败`
5. **工具执行失败**: `Tool execution failed: xxx`

### 错误恢复策略

- 单个工具执行失败不影响其他工具调用
- 提供详细的错误信息和修复建议
- 支持撤销操作（通过`saveStateToHistory()`）

## 性能优化

1. **模型懒加载**: 只在需要时加载AI模型
2. **结果缓存**: 对常见查询进行缓存
3. **批量操作限制**: 一次最多执行N个操作
4. **内存管理**: 长时间不使用时卸载模型

## 示例场景

### 场景1: 创建完整报表布局

```
用户: "创建一个订单报表，包含标题、列头和详细数据"

AI执行:
1. create_static_text(title, "订单列表")
2. create_rectangle(columnHeader, 背景矩形)
3. create_static_text(columnHeader, "订单ID")
4. create_static_text(columnHeader, "客户名称")
5. create_text_field(detail, "$F{orderId}")
6. create_text_field(detail, "$F{customerName}")

结果: 完整的报表布局已创建
```

### 场景2: 批量修改元素

```
用户: "将所有detail band中的textField字体大小改为14"

AI执行:
1. find_elements(elementType: "textField")
2. update_element(uuid1, { fontSize: 14 })
3. update_element(uuid2, { fontSize: 14 })
4. ...

结果: 所有指定元素已更新
```

### 场景3: 删除并重建

```
用户: "删除所有静态文本，然后重新创建为红色字体"

AI执行:
1. find_elements(elementType: "staticText")
2. delete_element(uuid1)
3. delete_element(uuid2)
4. ...
5. create_static_text(detail, ..., forecolor: "#F44336")
6. ...

结果: 静态文本已替换为新样式
```

## 配置选项

### AI模型配置 (src/config/aiConfig.ts)

```typescript
export const AI_CONFIG = {
  MODEL_NAME: 'Xenova/llama-2-7b-chat-hf',
  MAX_TOKENS: 2048,
  DTYPE: 'fp16',
  DEVICE: 'webgpu',
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  DO_SAMPLE: true,
  ENABLE_TOOLS: true,
  MAX_TOOL_CALLS: 5,
  INFERENCE_TIMEOUT_MS: 30000
};
```

### 环境变量

- `VITE_AI_MODEL_NAME`: 覆盖模型名称
- `VITE_AI_MAX_TOKENS`: 覆盖最大token数
- `VITE_AI_DTYPE`: 覆盖数据类型
- `VITE_AI_DEVICE`: 覆盖设备类型

## 故障排除

### 问题1: 模型加载失败

**症状**: 控制台显示"Failed to load @huggingface/transformers"

**解决方案**:
```bash
npm install @huggingface/transformers
```

### 问题2: 工具调用不执行

**症状**: AI输出了工具调用但没有执行

**解决方案**:
- 检查工具名称拼写
- 检查参数格式（字符串需要双引号）
- 查看控制台错误日志

### 问题3: 内存溢出

**症状**: 页面崩溃或变得无响应

**解决方案**:
- 降低模型大小（改用更小的模型）
- 减少并发工具调用数量
- 定期调用`unloadModel()`释放内存

## 扩展指南

### 添加新工具

1. 在`schemas/toolSchemas.ts`中定义工具schema
2. 在`handlers.ts`中实现工具处理器
3. 在`confirmHandler.ts`中添加风险等级
4. 在`index.ts`中导出

### 自定义AI模型

1. 修改`aiConfig.ts`中的模型配置
2. 调整系统提示词以适应新模型
3. 修改`modelInterface.ts`中的响应解析逻辑

## 参考资源

- [MCP协议规范](https://modelcontextprotocol.io/)
- [JasperReports文档](https://jasperreports.sourceforge.net/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [HuggingFace Transformers.js](https://huggingface.co/docs/transformers.js)

---

**版本**: 1.0
**更新日期**: 2026-06-10
**维护者**: JRXML Web Designer团队
