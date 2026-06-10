/**
 * useAIChat - AI对话Composable
 *
 * 使用配置的AI服务与AI交互，并执行工具调用
 */

import { ref, computed } from 'vue';
import { ALL_MCP_TOOL_SCHEMAS, executeMCPTool, type MCPContext } from '@/mcp';
import { processUserInput, type Message } from '@/mcp/aiService';
import { useAIConfigManager } from '@/composables/useAIConfigManager';
import type { MCPToolCall, MCPToolResult } from '@/mcp';

// ============================================
// 类型定义
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'error' | 'system';
  content: string;
  timestamp: Date;
  toolCall?: MCPToolCall;
  toolResult?: MCPToolResult;
  isLoading?: boolean;
}

export interface UseAIChatReturn {
  // 状态
  messages: ChatMessage[];
  isLoading: boolean;

  // 操作
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;

  // 计算属性
  messageCount: number;
  lastMessage: ChatMessage | null;
}

// ============================================
// 实现
// ============================================

export function useAIChat(getMcpContext?: () => MCPContext | undefined, onUpdate?: () => void): UseAIChatReturn {
  // 状态
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);

  // 对话历史
  const conversationHistory: Message[] = [];

  // 配置管理器
  const { config } = useAIConfigManager();

  /**
   * 生成唯一消息ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加消息
   */
  function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      timestamp: new Date(),
      ...message
    };
    messages.value.push(newMessage);
    return newMessage;
  }

  /**
   * 更新消息
   */
  function updateMessage(id: string, updates: Partial<ChatMessage>) {
    const messageIndex = messages.value.findIndex(m => m.id === id);
    if (messageIndex !== -1 && messages.value[messageIndex]) {
      messages.value[messageIndex] = {
        ...messages.value[messageIndex],
        ...updates
      } as ChatMessage;
    }
  }

  /**
   * 执行MCP工具
   */
  async function executeTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const mcpContext = getMcpContext?.();
    if (!mcpContext) {
      return {
        success: false,
        error: 'MCP context not provided'
      };
    }

    try {
      return await executeMCPTool(toolCall, mcpContext);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  /**
   * 获取选中元素的完整信息
   */
  function getSelectedElementInfo(context: MCPContext): any {
    if (!context.selectedElement) {
      return undefined;
    }

    const { bandIndex, elementIndex } = context.selectedElement;

    // 确保索引有效
    if (bandIndex === undefined || elementIndex === undefined) {
      return undefined;
    }

    // 获取band
    const band = context.bands[bandIndex];
    if (!band || !band.elements) {
      return undefined;
    }

    // 获取元素
    const element = band.elements[elementIndex];
    if (!element) {
      return undefined;
    }

    // 返回完整的元素信息
    return {
      uuid: element.uuid,
      type: element.type,
      bandType: band.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      text: (element as any).text,
      expression: (element as any).expression,
      forecolor: element.forecolor,
      backcolor: element.backcolor,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      isBold: element.isBold,
      isItalic: element.isItalic
    };
  }

  /**
   * 发送消息
   */
  async function sendMessage(content: string) {
    if (isLoading.value || !content.trim()) {
      return;
    }

    isLoading.value = true;

    try {
      // 添加用户消息
      addMessage({
        role: 'user',
        content
      });

      // 添加加载提示
      const loadingMessage = addMessage({
        role: 'system',
        content: 'AI 正在处理...',
        isLoading: true
      });

      // 调用AI服务（使用配置的参数）
      const mcpContext = getMcpContext?.();
      const response = await processUserInput(
        content,
        conversationHistory,
        ALL_MCP_TOOL_SCHEMAS,
        config,  // 传递配置
        mcpContext ? {
          bands: mcpContext.bands,
          fields: mcpContext.fields,
          parameters: mcpContext.parameters,
          selectedElement: mcpContext.selectedElement ? getSelectedElementInfo(mcpContext) : undefined,
          selectedElements: mcpContext.selectedElements
        } : undefined  // 传递设计状态
      );

      // 移除加载提示
      updateMessage(loadingMessage.id, { isLoading: false });

      // 如果有工具调用，执行它们
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          // 显示正在执行工具
          addMessage({
            role: 'system',
            content: `执行工具: ${toolCall.name}`
          });

          // 真正执行工具
          const toolResult = await executeTool(toolCall);

          // 触发UI更新
          if (onUpdate && toolResult.success) {
            onUpdate();
          }

          // 显示工具执行结果
          addMessage({
            role: 'tool',
            content: toolResult.success
              ? `✅ 工具 ${toolCall.name} 执行成功`
              : `❌ 工具 ${toolCall.name} 执行失败: ${toolResult.error}`,
            toolCall,
            toolResult
          });
        }
      }

      // 添加AI响应
      if (response.content) {
        addMessage({
          role: 'assistant',
          content: response.content
        });
      }

      // 如果有错误
      if (response.error) {
        addMessage({
          role: 'error',
          content: response.error
        });
      }

    } catch (error) {
      addMessage({
        role: 'error',
        content: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 清空历史
   */
  function clearHistory() {
    messages.value = [];
    conversationHistory.length = 0;
  }

  // 计算属性
  const messageCount = computed(() => messages.value.length);
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null);

  return {
    // 状态
    messages: messages.value,
    isLoading: isLoading.value,

    // 操作
    sendMessage,
    clearHistory,

    // 计算属性
    messageCount: messageCount.value,
    lastMessage: lastMessage.value
  } as UseAIChatReturn;
}
