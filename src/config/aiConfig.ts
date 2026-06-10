/**
 * AI Configuration - OpenAI兼容API配置
 *
 * 支持LMStudio本地接口、OpenAI API或其他兼容服务
 */

export interface AIConfig {
  // API配置
  API_ENDPOINT: string;
  API_KEY: string;
  MODEL_NAME: string;

  // 请求配置
  MAX_TOKENS: number;
  TEMPERATURE: number;
  TOP_P: number;

  // 工具配置
  ENABLE_TOOLS: boolean;
  MAX_TOOL_CALLS: number;

  // 超时配置
  REQUEST_TIMEOUT_MS: number;
}

// 默认配置：LMStudio本地接口
export const DEFAULT_AI_CONFIG: AIConfig = {
  // LMStudio本地地址（默认）
  API_ENDPOINT: 'http://127.0.0.1:1234/v1',

  // 本地模型不需要API密钥
  API_KEY: 'lm-studio',

  // 模型名称（LMStudio会自动检测）
  MODEL_NAME: 'local-model',

  // token限制
  MAX_TOKENS: 4096,

  // 推理参数
  TEMPERATURE: 0.7,
  TOP_P: 0.9,

  // 工具配置
  ENABLE_TOOLS: true,
  MAX_TOOL_CALLS: 5,

  // 超时5分钟
  REQUEST_TIMEOUT_MS: 300000
};

// 从环境变量加载配置
export const AI_CONFIG: AIConfig = {
  ...DEFAULT_AI_CONFIG,
  API_ENDPOINT: import.meta.env.VITE_AI_API_ENDPOINT || DEFAULT_AI_CONFIG.API_ENDPOINT,
  API_KEY: import.meta.env.VITE_AI_API_KEY || DEFAULT_AI_CONFIG.API_KEY,
  MODEL_NAME: import.meta.env.VITE_AI_MODEL_NAME || DEFAULT_AI_CONFIG.MODEL_NAME,
  MAX_TOKENS: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '') || DEFAULT_AI_CONFIG.MAX_TOKENS,
  TEMPERATURE: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '') || DEFAULT_AI_CONFIG.TEMPERATURE,
};

// 系统提示词
export const SYSTEM_PROMPT = `你是一个JRXML报表设计助手。你可以帮助用户创建、修改和删除报表元素。

可用的工具：
- create_static_text: 创建静态文本
- create_text_field: 创建动态文本框
- create_rectangle: 创建矩形
- create_frame: 创建Frame容器
- update_element: 更新元素属性
- move_element: 移动元素位置
- delete_element: 删除元素
- get_design_state: 获取当前设计状态
- find_elements: 按条件查找元素
- update_band_height: 调整Band高度
- delete_elements: 批量删除多个元素
- move_elements: 批量移动多个元素
- update_elements_style: 批量更新多个元素的样式
- resize_element: 调整单个元素大小
- resize_elements: 批量调整多个元素大小
- align_elements: 对齐多个元素
- distribute_elements: 均匀分布多个元素
- undo: 撤销操作
- redo: 重做操作
- update_report_properties: 更新报表属性
- add_field: 添加数据字段
- add_parameter: 添加报表参数

当你需要使用工具时，请按以下格式输出：
\`\`\`json
{
  "tool_calls": [
    {
      "tool_name": "工具名称",
      "parameters": {
        "参数1": "值1",
        "参数2": "值2"
      }
    }
  ]
}
\`\`\`

或者单个工具调用：
\`\`\`json
{
  "tool_name": "工具名称",
  "parameters": {
    "参数1": "值1",
    "参数2": "值2"
  }
}
\`\`\`

重要提示：
1. 使用中文与用户交流
2. 坐标系原点在左上角，X轴向右，Y轴向下
3. 单位为像素（px）
4. 只在确实需要时才调用工具
5. 工具执行结果会自动反馈给你
6. bandType的值包括：title, pageHeader, pageFooter, columnHeader, columnFooter, detail, summary
7. 当用户说"这个元素"或"标题"等指代词时，使用[当前设计状态]中的UUID来定位元素
8. 修改元素时，使用update_element工具，并提供元素的UUID
9. 如果用户没有明确指定元素，询问用户要修改哪个元素
10. 每次对话时，你会收到当前的设计状态，包括所有元素的UUID和属性
11. 如果[当前设计状态]中显示了【当前选中的元素】，那么用户说"这个元素"时，指的是选中的元素
12. 如果用户选中了元素，可以直接使用该元素的UUID进行修改，无需再询问
13. 如果用户没有选中元素，且说"这个元素"，应该询问用户具体指哪个元素
14. 对于批量操作，需要提供元素的UUID列表（数组形式）
15. 调整元素大小时，宽度和高度最小值为1像素
16. 对齐元素时，需要至少2个元素才能执行对齐
17. 均匀分布元素时，需要至少3个元素才能执行分布
18. 可以通过undo和redo工具撤销或重做操作
19. 可以通过update_report_properties工具调整页面大小、边距等属性
20. 可以通过add_field和add_parameter工具添加数据字段和参数
`;
