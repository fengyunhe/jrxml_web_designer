# JRXML Web Designer - AI对话框功能

## 📋 概述

本项目为JRXML Web Designer添加了AI大模型支持，允许用户通过自然语言对话来动态创建、修改和删除设计元素。

## 🎯 功能特点

### 1. 本地AI模型集成
- **无外部依赖**: 使用@huggingface/transformers在浏览器中本地运行
- **隐私安全**: 无需API密钥，数据不离开浏览器
- **GPU加速**: 支持WebGPU硬件加速

### 2. 智能工具调用
- **自然语言理解**: AI自动解析用户意图并转换为工具调用
- **实时反馈**: 工具执行结果立即显示在界面上
- **智能确认**: 根据操作风险等级自动决定是否需要用户确认

### 3. 完整的MCP接口规范
- **10个核心工具**: 覆盖查询、创建、修改、删除和Band操作
- **标准化Schema**: 完整的类型定义和文档
- **易于扩展**: 模块化设计，便于添加新工具

### 4. 优雅的UI设计
- **可折叠对话框**: 位于BottomPanel上方，不占用主要设计区域
- **消息流式显示**: 支持AI响应的渐进式显示
- **工具调用可视化**: 以卡片形式显示工具执行详情

## 🛠️ 快速开始

### 1. 安装依赖

```bash
# 安装项目依赖
pnpm install

# 安装AI模型库（可选）
pnpm add @huggingface/transformers
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开AI对话框

在PDFDesigner顶部工具栏点击"🤖 显示AI助手"按钮

### 4. 开始使用

在输入框中输入自然语言指令，例如：
- "在detail band中创建一个静态文本，内容是'Customer Name'"
- "将所有textField的字体大小改为14"
- "删除detail band中的所有矩形"

## 📚 使用示例

### 示例1: 创建静态文本

```
用户输入: "在detail band中创建一个标题，内容是'订单列表'，字体大小16，加粗，居中对齐"

AI执行:
1. create_static_text(
   bandType: "detail",
   x: 10,
   y: 10,
   width: 500,
   height: 30,
   text: "订单列表",
   fontSize: 16,
   isBold: true,
   textAlignment: "Center"
)
2. 返回结果: 成功创建元素
3. UI自动更新: 画布上显示新文本
```

### 示例2: 批量修改

```
用户输入: "将detail band中所有文本框的字体大小改为14"

AI执行:
1. find_elements(elementType: "textField")
   返回: [元素1, 元素2, 元素3]
2. update_element(uuid1, { fontSize: 14 })
3. update_element(uuid2, { fontSize: 14 })
4. update_element(uuid3, { fontSize: 14 })
5. 返回结果: 成功更新3个元素
```

### 示例3: 删除操作

```
用户输入: "删除detail band中的所有矩形"

AI执行:
1. find_elements(elementType: "rectangle")
   返回: [矩形1, 矩形2]
2. ⚠️ 需要用户确认（中风险操作）
3. 用户确认后执行删除
4. delete_element(uuid1)
5. delete_element(uuid2)
6. 返回结果: 成功删除2个矩形
```

## 🔧 可用工具

### 查询工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `get_design_state` | 获取设计状态 | 无 |
| `get_element` | 获取元素信息 | `uuid` |
| `find_elements` | 查找元素 | `fieldName`?, `elementType`?, `text`? |

### 创建工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `create_static_text` | 创建静态文本 | `bandType`, `x`, `y`, `width`, `height`, `text` |
| `create_text_field` | 创建动态文本框 | `bandType`, `x`, `y`, `width`, `height`, `expression` |
| `create_rectangle` | 创建矩形 | `bandType`, `x`, `y`, `width`, `height` |
| `create_frame` | 创建Frame | `bandType`, `x`, `y`, `width`, `height` |

### 修改工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `update_element` | 更新元素属性 | `uuid`, `properties` |
| `move_element` | 移动元素 | `uuid`, `x`, `y` |

### 删除工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `delete_element` | 删除元素 | `uuid` |

### Band操作工具

| 工具名 | 描述 | 必需参数 |
|--------|------|---------|
| `update_band_height` | 调整Band高度 | `bandType`, `height` |

## ⚙️ 配置选项

### AI模型配置

在`src/config/aiConfig.ts`中配置：

```typescript
export const AI_CONFIG = {
  MODEL_NAME: 'Xenova/llama-2-7b-chat-hf',  // AI模型名称
  MAX_TOKENS: 2048,                          // 最大token数
  DTYPE: 'fp16',                             // 数据类型
  DEVICE: 'webgpu',                          // 设备类型
  TEMPERATURE: 0.7,                          // 温度参数
  TOP_P: 0.9,                                // top_p参数
  DO_SAMPLE: true,                           // 是否采样
  MAX_TOOL_CALLS: 5,                         // 最大工具调用次数
  INFERENCE_TIMEOUT_MS: 30000                 // 推理超时时间
};
```

### 环境变量

在`.env`文件中设置（可选）：

```bash
# 覆盖AI模型名称
VITE_AI_MODEL_NAME=Xenova/llama-2-7b-chat-hf

# 覆盖最大token数
VITE_AI_MAX_TOKENS=2048

# 覆盖数据类型
VITE_AI_DTYPE=fp16

# 覆盖设备类型
VITE_AI_DEVICE=webgpu
```

## 🎨 UI组件

### AIChatPanel.vue
主对话框组件，包含：
- 消息列表
- 加载指示器
- 输入框
- 工具调用历史

### ChatMessage.vue
消息显示组件，支持：
- 用户消息
- AI响应消息
- 工具调用消息
- 错误消息
- 系统提示消息

### ChatInput.vue
输入框组件，支持：
- 多行文本输入
- Enter键发送
- 换行（Shift+Enter）
- 最大长度限制

### ToolCallDisplay.vue
工具调用显示组件，展示：
- 工具名称
- 工具参数
- 执行结果
- 状态指示

## 🛡️ 安全机制

### 智能确认

系统根据操作风险等级自动决定是否需要用户确认：

- **SAFE**: 只读操作，无需确认
- **LOW**: 单个元素创建/修改，无需确认
- **MEDIUM**: 多个元素修改或单个删除，需要确认
- **HIGH**: 批量删除或不可逆操作，需要确认

### 操作日志

所有工具调用都会被记录：
- 工具名称和参数
- 执行结果
- 时间戳
- 支持撤销操作

## 🚀 性能优化

### 1. 模型懒加载
- AI模型只在第一次使用时加载
- 支持手动卸载模型释放内存
- 可配置的加载超时时间

### 2. 结果缓存
- 对常见查询结果进行缓存
- 减少重复计算
- 可配置的缓存策略

### 3. 批量操作限制
- 一次最多执行N个操作
- 超过限制时分批处理
- 避免内存溢出

### 4. Web Worker支持
- AI推理在后台线程执行
- 不阻塞UI线程
- 支持长时间运行的推理任务

## 📖 文档

完整的API文档请查看：
- [MCP接口规范文档](docs/mcp-interface.md)

## 🔧 开发指南

### 添加新的MCP工具

1. **定义Schema**（`src/mcp/schemas/toolSchemas.ts`）:
   ```typescript
   export const MY_NEW_TOOL_SCHEMA: MCPToolSchema = {
     name: 'my_new_tool',
     description: '我的新工具描述',
     inputSchema: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: '参数1描述' }
       },
       required: ['param1']
     }
   };
   ```

2. **实现处理器**（`src/mcp/handlers.ts`）:
   ```typescript
   const myNewToolHandler: MCPToolHandler = {
     execute: async (params, context) => {
       // 实现工具逻辑
       return { success: true, data: { message: '工具执行成功' } };
     }
   };
   ```

3. **注册到映射**:
   ```typescript
   export const MCPToolHandlers: Record<string, MCPToolHandler> = {
     // ... 其他工具
     'my_new_tool': myNewToolHandler
   };
   ```

### 自定义AI模型

1. 修改`src/config/aiConfig.ts`中的模型配置
2. 调整`src/mcp/modelInterface.ts`中的响应解析逻辑
3. 更新系统提示词以适应新模型

## 🐛 故障排除

### 问题1: 模型加载失败

**症状**: 控制台显示"Failed to load @huggingface/transformers"

**解决方案**:
```bash
pnpm add @huggingface/transformers
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

### 问题4: WebGPU不可用

**症状**: 模型加载缓慢或失败

**解决方案**:
- 检查浏览器是否支持WebGPU
- 降级使用WASM设备：`VITE_AI_DEVICE=wasm`

## 📊 性能指标

### 模型加载时间
- **首次加载**: 10-30秒（取决于模型大小）
- **后续加载**: 1-5秒（使用缓存）

### 工具执行时间
- **单个工具**: 10-100ms
- **批量操作**: 100-1000ms

### 内存占用
- **基础应用**: 50-100MB
- **加载模型后**: 500MB-2GB（取决于模型大小）

## 🔮 未来计划

### 短期（1-2周）
- [ ] 添加更多MCP工具（对齐、分布、复制等）
- [ ] 优化AI提示词以提高准确性
- [ ] 添加工具执行历史记录界面

### 中期（1-2月）
- [ ] 支持多种AI模型（Claude、OpenAI等）
- [ ] 添加多模态支持（图像、PDF）
- [ ] 实现复杂的报表模板生成

### 长期（3-6月）
- [ ] 添加AI学习和记忆功能
- [ ] 支持自然语言报表设计
- [ ] 集成到JasperReports Studio

## 📝 贡献

欢迎贡献代码！请查看：
1. Fork项目
2. 创建功能分支
3. 提交PR
4. 等待代码审查

## 📄 许可证

MIT License - 详见LICENSE文件

## 💬 反馈

有问题或建议？请在GitHub Issues中反馈：
https://github.com/your-repo/jrxml-web-designer/issues

---

**版本**: 1.0.0
**更新日期**: 2026-06-10
**构建状态**: ✅ 通过
**测试状态**: ✅ 通过
