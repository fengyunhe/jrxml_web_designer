/**
 * AI Service - OpenAI兼容API调用
 *
 * 使用配置的参数调用AI服务
 */

import { SYSTEM_PROMPT } from '@/config/aiConfig';
import type { MCPToolCall } from './handlers';
import type { AIConfiguration } from '@/composables/useAIConfigManager';

// ============================================
// 类型定义
// ============================================

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  };
  tool_call_id?: string;
}

export interface AIResponse {
  content: string;
  toolCalls: MCPToolCall[];
  success: boolean;
  error?: string;
}

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

// ============================================
// API调用函数
// ============================================

/**
 * 调用OpenAI兼容API
 */
export async function callOpenAICompatibleAPI(
  messages: Message[],
  tools: OpenAITool[],
  config: AIConfiguration
): Promise<AIResponse> {
  try {
    const requestBody: any = {
      model: config.modelName,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    };

    // 如果提供了工具定义，添加到请求中
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    console.log('Calling AI API:', config.apiEndpoint);
    console.log('Model:', config.modelName);

    // 发送请求
    const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.requestTimeout), // 使用配置的超时时间
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // 解析响应
    const choice = data.choices[0];
    if (!choice) {
      throw new Error('No response from AI');
    }

    const assistantMessage = choice.message;
    const toolCalls: MCPToolCall[] = [];

    // 提取工具调用
    if (assistantMessage.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          toolCalls.push({
            name: toolCall.function.name,
            params: args
          });
        } catch (error) {
          console.error('Failed to parse tool call arguments:', error);
        }
      }
    }

    return {
      content: assistantMessage.content || '',
      toolCalls,
      success: true
    };

  } catch (error) {
    console.error('AI API call failed:', error);
    return {
      content: '',
      toolCalls: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 从纯文本中提取工具调用（备用方案）
 */
function extractToolCallsFromText(text: string): MCPToolCall[] {
  const toolCalls: MCPToolCall[] = [];

  // 匹配 ```json ... ``` 格式
  const jsonBlockPattern = /```json\s*([\s\S]*?)```/g;
  let match;

  while ((match = jsonBlockPattern.exec(text)) !== null) {
    try {
      const jsonStr = match[1]?.trim() || '';
      if (!jsonStr) continue;

      const parsed = JSON.parse(jsonStr);

      // 处理单个工具调用
      if (parsed.tool_name && parsed.parameters) {
        toolCalls.push({
          name: parsed.tool_name,
          params: parsed.parameters
        });
      }

      // 处理多个工具调用
      if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
        for (const tc of parsed.tool_calls) {
          if (tc.tool_name && tc.parameters) {
            toolCalls.push({
              name: tc.tool_name,
              params: tc.parameters
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse JSON block:', error);
    }
  }

  return toolCalls;
}

/**
 * 准备对话历史
 */
export function prepareConversationHistory(
  messages: Message[]
): Message[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];
}

/**
 * 创建用户消息
 */
export function createUserMessage(content: string): Message {
  return { role: 'user', content };
}

/**
 * 创建助手消息
 */
export function createAssistantMessage(content: string, toolCalls?: MCPToolCall[]): Message {
  const message: Message = { role: 'assistant', content };

  if (toolCalls && toolCalls.length > 0 && toolCalls[0]) {
    message.tool_call = {
      id: `call_${Date.now()}`,
      type: 'function',
      function: {
        name: toolCalls[0].name,
        arguments: JSON.stringify(toolCalls[0].params)
      }
    };
  }

  return message;
}

/**
 * 创建设计状态消息
 */
function createDesignStateMessage(designState: any): Message {
  const stateDescription = formatDesignState(designState);
  return {
    role: 'system',
    content: `[当前设计状态]\n${stateDescription}\n[/当前设计状态]`
  };
}

/**
 * 格式化设计状态为可读格式
 */
function formatDesignState(designState: any): string {
  const lines: string[] = [];

  // 当前选中的元素
  if (designState.selectedElement) {
    const element = designState.selectedElement;
    lines.push('【当前选中的元素】');
    lines.push(`- UUID: ${element.uuid}`);
    lines.push(`- 类型: ${element.type}`);
    lines.push(`- 位置: (${element.x}, ${element.y})`);
    lines.push(`- 大小: ${element.width}x${element.height}`);

    if (element.type === 'staticText') {
      lines.push(`- 文本: "${element.text || ''}"`);
    } else if (element.type === 'textField') {
      lines.push(`- 表达式: "${element.expression || ''}"`);
    }

    if (element.forecolor) {
      lines.push(`- 颜色: ${element.forecolor}`);
    }
    lines.push('');
  }

  // Band信息
  if (designState.bands && Array.isArray(designState.bands)) {
    lines.push('报表结构：');
    for (const band of designState.bands) {
      const elementsCount = band.elements?.length || 0;
      lines.push(`- ${band.type} band: 高度${band.height}px, 包含${elementsCount}个元素`);

      // 列出元素详情
      if (band.elements && band.elements.length > 0) {
        for (const element of band.elements) {
          const elementType = element.type;
          const uuid = element.uuid;
          let description = '';

          if (elementType === 'staticText') {
            description = `静态文本"${element.text || ''}"`;
          } else if (elementType === 'textField') {
            description = `动态文本框"${element.expression || ''}"`;
          } else if (elementType === 'rectangle') {
            description = '矩形';
          } else if (elementType === 'frame') {
            description = 'Frame容器';
          } else {
            description = elementType;
          }

          lines.push(`    - UUID: ${uuid} - ${description} (位置: ${element.x},${element.y}, 大小: ${element.width}x${element.height})`);
        }
      }
    }
  }

  // 字段信息
  if (designState.fields && designState.fields.length > 0) {
    lines.push('\n可用字段：');
    for (const field of designState.fields) {
      lines.push(`- $F{${field.name}} (${field.class})`);
    }
  }

  // 参数信息
  if (designState.parameters && designState.parameters.length > 0) {
    lines.push('\n可用参数：');
    for (const param of designState.parameters) {
      lines.push(`- $P{${param.name}}`);
    }
  }

  return lines.join('\n');
}

// ============================================
// 从工具Schema生成OpenAI工具定义
// ============================================

/**
 * 将MCP工具Schema转换为OpenAI工具格式
 */
export function convertToOpenAITools(
  mcpTools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>
): OpenAITool[] {
  return mcpTools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));
}

// ============================================
// 主要接口
// ============================================

/**
 * 处理用户输入并调用AI
 */
export async function processUserInput(
  userMessage: string,
  conversationHistory: Message[],
  availableTools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>,
  config: AIConfiguration,
  designState?: any  // 新增：当前设计状态
): Promise<AIResponse> {
  // 如果提供了设计状态，将其添加到对话历史中
  if (designState) {
    const stateMessage = createDesignStateMessage(designState);
    // 避免重复添加相同的状态消息
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    if (!lastMessage || lastMessage.content !== stateMessage.content) {
      conversationHistory.push(stateMessage);
    }
  }

  // 添加用户消息到历史
  conversationHistory.push(createUserMessage(userMessage));

  // 准备消息（包含系统提示）
  const messages = prepareConversationHistory(conversationHistory);

  // 转换工具定义为OpenAI格式
  const openAITools = convertToOpenAITools(availableTools);

  // 调用API
  const response = await callOpenAICompatibleAPI(messages, openAITools, config);

  // 如果API调用失败，尝试从纯文本中提取工具调用
  if (!response.success || response.toolCalls.length === 0) {
    if (response.content) {
      const textToolCalls = extractToolCallsFromText(response.content);
      if (textToolCalls.length > 0) {
        response.toolCalls = textToolCalls;
      }
    }
  }

  // 添加助手响应到历史
  conversationHistory.push(createAssistantMessage(
    response.content,
    response.toolCalls.length > 0 ? response.toolCalls : undefined
  ));

  return response;
}
