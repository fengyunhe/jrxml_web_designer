# AI助手配置指南

## 概述

AI助手面板现在支持动态配置AI服务参数。用户可以在界面中随时修改配置，无需重启应用。

## 配置选项

### 1. API接口地址

**默认值**: `http://127.0.0.1:1234/v1`

支持的AI服务：

| 服务 | 接口地址 | 说明 |
|------|---------|------|
| LMStudio | http://127.0.0.1:1234/v1 | 本地运行，推荐 |
| Ollama | http://localhost:11434/v1 | 本地运行 |
| OpenAI | https://api.openai.com/v1 | 云端API |
| Claude | https://api.anthropic.com/v1 | 需要兼容层 |
| 其他 | 自定义地址 | 任何OpenAI兼容API |

### 2. API密钥

**默认值**: `lm-studio`

- LMStudio本地服务：使用 `lm-studio` 或留空
- Ollama：使用 `ollama` 或留空
- OpenAI：需要有效的API密钥
- Claude：需要Anthropic API密钥

### 3. 模型名称

**默认值**: `local-model`

- LMStudio：会自动检测加载的模型
- Ollama：指定模型名（如 `llama2`、`mistral`）
- OpenAI：`gpt-4`、`gpt-3.5-turbo` 等
- Claude：`claude-3-sonnet-20240229` 等

### 4. 最大Token数

**默认值**: `4096`

控制AI响应的最大长度。根据模型和任务调整：

- 简单任务：1024-2048
- 复杂任务：4096-8192
- 大量代码生成：16384+

### 5. 温度参数

**默认值**: `0.7`

控制AI响应的随机性：

- `0.0`：确定性输出（每次相同输入得到相同结果）
- `0.5`：平衡创造性和准确性
- `0.7`：推荐值（默认）
- `1.0`：更随机、更有创造性
- `2.0`：最高随机性（可能产生无意义输出）

## 使用流程

### 步骤1：启动AI服务

选择以下任一方式：

#### 方式A：LMStudio（推荐）

1. 下载并安装 [LMStudio](https://lmstudio.ai/)
2. 下载模型（如 Llama 2、Mistral 等）
3. 在LMStudio中启动本地服务器
4. 确保服务运行在 `http://127.0.0.1:1234/v1`

#### 方式B：Ollama

1. 安装 Ollama：
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```
2. 下载模型：
   ```bash
   ollama pull llama2
   ```
3. 服务自动运行在 `http://localhost:11434/v1`

#### 方式C：云端API

1. 注册OpenAI/Claude账号
2. 获取API密钥
3. 使用云端接口地址

### 步骤2：启动前端应用

```bash
cd jrxml_web_designer
npm run dev
```

### 步骤3：打开AI对话框

在PDFDesigner顶部工具栏点击 **"🤖 显示AI助手"** 按钮

### 步骤4：配置AI服务

1. 点击对话框头部的 **"⚙️ 设置"** 按钮
2. 在配置面板中修改参数
3. 点击 **"保存配置"** 按钮

### 步骤5：开始使用

在输入框中输入自然语言指令，例如：
- "在detail band中创建一个标题'订单列表'"
- "将所有textField的字体大小改为14"
- "删除detail band中的所有矩形"

## 配置示例

### 示例1：使用LMStudio本地服务

```
API接口地址: http://127.0.0.1:1234/v1
API密钥: lm-studio
模型名称: local-model
最大Token数: 4096
温度参数: 0.7
```

### 示例2：使用Ollama本地服务

```
API接口地址: http://localhost:11434/v1
API密钥: ollama
模型名称: llama2
最大Token数: 4096
温度参数: 0.7
```

### 示例3：使用OpenAI API

```
API接口地址: https://api.openai.com/v1
API密钥: sk-your-openai-api-key
模型名称: gpt-4
最大Token数: 4096
温度参数: 0.7
```

### 示例4：使用Claude API

```
API接口地址: https://your-claude-proxy.com/v1
API密钥: your-anthropic-api-key
模型名称: claude-3-sonnet-20240229
最大Token数: 4096
温度参数: 0.7
```

**注意**: Claude需要OpenAI兼容的代理层

## 配置持久化

配置会自动保存到浏览器的localStorage中：

- **存储位置**: `localStorage['jrxml_ai_config']`
- **数据格式**: JSON
- **加载时机**: 应用启动时自动加载
- **更新时机**: 每次保存配置时自动更新

配置示例（JSON格式）：
```json
{
  "apiEndpoint": "http://127.0.0.1:1234/v1",
  "apiKey": "lm-studio",
  "modelName": "local-model",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

## 故障排除

### 问题1：无法连接到AI服务

**症状**: 对话框显示"无法连接到AI服务"

**可能原因**:
1. AI服务未启动
2. 接口地址错误
3. 端口被占用
4. 防火墙阻止

**解决方案**:
1. 确保AI服务已启动
2. 检查接口地址是否正确
3. 查看浏览器控制台的错误信息
4. 尝试使用curl测试API：
   ```bash
   curl http://127.0.0.1:1234/v1/models
   ```

### 问题2：API密钥错误

**症状**: 返回401或403错误

**解决方案**:
1. 检查API密钥是否正确
2. 确认密钥是否有效
3. 检查账户余额（云端API）

### 问题3：模型不存在

**症状**: 返回模型未找到错误

**解决方案**:
1. 确认模型名称是否正确
2. 检查AI服务是否加载了该模型
3. 查看AI服务的模型列表

### 问题4：响应超时

**症状**: 请求超过30秒无响应

**解决方案**:
1. 检查网络连接
2. 减少最大Token数
3. 使用更快的模型
4. 检查AI服务性能

### 问题5：配置未生效

**症状**: 修改配置后仍使用旧配置

**解决方案**:
1. 确保点击了"保存配置"按钮
2. 清除浏览器缓存
3. 刷新页面重新加载配置

## 高级配置

### 环境变量配置（可选）

可以通过环境变量覆盖默认配置：

```bash
# .env文件
VITE_AI_API_ENDPOINT=http://127.0.0.1:1234/v1
VITE_AI_API_KEY=lm-studio
VITE_AI_MODEL_NAME=local-model
VITE_AI_MAX_TOKENS=4096
VITE_AI_TEMPERATURE=0.7
```

**注意**: 环境变量只在应用启动时加载，运行时修改配置需要通过界面

### 重置配置

点击配置面板中的 **"重置默认"** 按钮，将所有配置恢复为默认值：

```
API接口地址: http://127.0.0.1:1234/v1
API密钥: lm-studio
模型名称: local-model
最大Token数: 4096
温度参数: 0.7
```

## 最佳实践

### 1. 本地开发

使用LMStudio或Ollama进行本地开发：
- ✅ 无需网络连接
- ✅ 数据隐私安全
- ✅ 响应快速
- ✅ 无API费用

### 2. 生产环境

使用云端API（OpenAI/Claude）：
- ✅ 更强的模型能力
- ✅ 更稳定的服务
- ✅ 无需本地硬件
- ❌ 需要网络连接
- ❌ 有API费用

### 3. 混合使用

- 开发阶段：使用本地模型
- 测试阶段：使用云端API验证
- 生产环境：根据需求选择

### 4. 性能优化

- 减少Token数以提高响应速度
- 降低温度参数以提高准确性
- 使用较小的模型以提高性能

## 安全注意事项

1. **API密钥安全**:
   - 不要在代码中硬编码API密钥
   - 使用环境变量或配置界面
   - 定期轮换API密钥

2. **数据隐私**:
   - 本地模型：数据不离开电脑
   - 云端API：数据会发送到AI服务
   - 根据需求选择合适的方案

3. **网络访问**:
   - 本地服务：无需网络
   - 云端API：需要网络连接
   - 检查防火墙设置

## 扩展阅读

- [LMStudio文档](https://lmstudio.ai/docs)
- [Ollama文档](https://ollama.ai/library)
- [OpenAI API文档](https://platform.openai.com/docs)
- [Claude API文档](https://docs.anthropic.com/claude/reference)
- [MCP协议规范](https://modelcontextprotocol.io/)

---

**版本**: 1.0
**更新日期**: 2026-06-10
**维护者**: JRXML Web Designer团队
