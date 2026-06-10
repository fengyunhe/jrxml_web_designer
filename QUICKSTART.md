# 快速开始 - AI对话框功能

## 🚀 5分钟快速启动

### 第一步：启动AI服务（任选其一）

#### 选项1：LMStudio（推荐）
1. 下载并安装 [LMStudio](https://lmstudio.ai/)
2. 下载一个模型（如 Llama 2、Mistral 等）
3. 启动本地服务器：`http://127.0.0.1:1234/v1`

#### 选项2：Ollama
1. 安装 Ollama：`curl -fsSL https://ollama.ai/install.sh | sh`
2. 下载模型：`ollama pull llama2`
3. 服务自动运行在：`http://localhost:11434/v1`

#### 选项3：云端API（可选）
- OpenAI：需要API密钥
- Claude：需要Anthropic API密钥

### 第二步：配置环境变量

```bash
# 复制配置示例
cp .env.example .env

# 编辑配置文件
nano .env
```

根据你选择的AI服务，修改配置：

```bash
# LMStudio（默认）
VITE_AI_API_ENDPOINT=http://127.0.0.1:1234/v1
VITE_AI_API_KEY=lm-studio

# Ollama
VITE_AI_API_ENDPOINT=http://localhost:11434/v1
VITE_AI_API_KEY=ollama

# OpenAI
VITE_AI_API_ENDPOINT=https://api.openai.com/v1
VITE_AI_API_KEY=your-api-key
VITE_AI_MODEL_NAME=gpt-4
```

### 第三步：启动应用

```bash
# 安装依赖
pnpm install

# 启动开发服务器
npm run dev
```

### 第四步：使用AI助手

1. 在浏览器中打开应用
2. 点击顶部工具栏的 **"🤖 显示AI助手"** 按钮
3. 在对话框中输入自然语言指令
4. AI会自动执行工具调用并更新界面

## 📝 使用示例

### 创建静态文本

```
你：在detail band中创建一个标题，内容是"订单列表"，字体大小16，加粗

AI：好的，我将为您创建这个标题。

执行工具：create_static_text
参数：
- bandType: "detail"
- x: 10
- y: 10
- width: 500
- height: 30
- text: "订单列表"
- fontSize: 16
- isBold: true

结果：✅ 已成功创建

AI：已成功在detail band中创建标题"订单列表"，字体大小16，加粗显示。
```

### 批量修改

```
你：将detail band中所有文本框的字体大小改为14

AI：好的，我将为您批量更新所有文本框。

执行工具：find_elements
参数：elementType: "textField"
结果：找到3个文本框

执行工具：update_element（3次）
参数：fontSize: 14

结果：✅ 已成功更新3个元素

AI：已成功将detail band中所有3个文本框的字体大小改为14。
```

### 删除操作

```
你：删除detail band中的所有矩形

AI：⚠️ 这将删除detail band中的2个矩形，操作不可撤销。确定要继续吗？

你：确定

AI：好的，正在执行删除操作。

执行工具：delete_element（2次）
结果：✅ 已成功删除2个矩形

AI：已成功删除detail band中的所有矩形。
```

## 🎯 支持的指令

### 创建类指令
- "创建一个静态文本，内容是..."
- "创建一个动态文本框，显示字段..."
- "创建一个矩形，背景色是..."
- "创建一个Frame容器..."

### 修改类指令
- "将元素的字体大小改为..."
- "移动元素到位置..."
- "更新元素的属性..."

### 查询类指令
- "获取当前设计状态"
- "查找所有使用字段XXX的元素"
- "获取元素的详细信息"

### 删除类指令
- "删除元素"
- "删除所有XXX"

### Band操作指令
- "调整detail band的高度为..."

## ⚠️ 注意事项

1. **AI响应时间**：本地模型响应可能需要几秒，取决于模型大小和硬件性能
2. **工具确认**：删除等危险操作会需要用户确认
3. **撤销支持**：所有操作都可以通过Ctrl+Z撤销
4. **坐标系**：原点在左上角，X轴向右，Y轴向下，单位为像素
5. **Band类型**：detail、title、pageHeader、pageFooter、columnHeader、columnFooter、summary

## 🔧 故障排除

### 问题1：无法连接到AI服务

**症状**：对话框显示"无法连接到AI服务"

**解决方案**：
1. 确保AI服务已启动（LMStudio/Ollama等）
2. 检查服务地址是否正确：`http://127.0.0.1:1234/v1`
3. 检查防火墙设置
4. 查看浏览器控制台的错误信息

### 问题2：AI不执行工具调用

**症状**：AI回复但没有执行任何操作

**解决方案**：
1. 检查AI是否返回了有效的工具调用格式
2. 尝试使用更明确的指令
3. 查看控制台日志

### 问题3：性能问题

**症状**：响应缓慢或卡顿

**解决方案**：
1. 使用更小的模型（如7B而非13B）
2. 减少token限制：`VITE_AI_MAX_TOKENS=2048`
3. 确保有足够的内存和GPU资源

## 📚 更多信息

- 完整API文档：`docs/mcp-interface.md`
- 配置示例：`.env.example`
- 项目README：`README-AI-CHAT.md`

## 💬 获取帮助

如果遇到问题：
1. 查看浏览器控制台日志
2. 检查AI服务是否正常运行
3. 查看故障排除部分
4. 在GitHub Issues中提问

---

**享受使用AI助手设计报表的乐趣！** 🎉
