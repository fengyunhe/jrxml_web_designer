/**
 * MCP Server - 主入口
 *
 * 统一导出所有MCP相关工具、处理器和接口
 */

// Schema定义
export * from './schemas/toolSchemas';

// 工具处理器
export * from './handlers';

// AI服务
export * from './aiService';

// 确认处理器
export * from './confirmHandler';

// ============================================
// 统一API接口
// ============================================

import { MCPToolHandlers, executeMCPTool, type MCPContext, type MCPToolCall, type MCPToolResult } from './handlers';
import { processUserInput, type Message } from './aiService';
import { shouldConfirm, createConfirmDialogManager, type ConfirmResponse } from './confirmHandler';
import { ALL_MCP_TOOL_SCHEMAS, generateAIToolDefinitions } from './schemas/toolSchemas';
import { useAIConfigManager } from '@/composables/useAIConfigManager';

/**
 * MCP Server 主接口
 */
export class MCPServer {
  private context: MCPContext;
  private confirmManager = createConfirmDialogManager();
  private conversationHistory: Message[] = [];

  constructor(context: MCPContext) {
    this.context = context;
  }

  /**
   * 更新上下文
   */
  updateContext(context: Partial<MCPContext>) {
    this.context = { ...this.context, ...context };
  }

  /**
   * 处理用户输入
   */
  async processUserInput(userInput: string): Promise<{
    response: string;
    toolResults: MCPToolResult[];
    error?: string;
  }> {
    try {
      // 获取AI配置
      const { config } = useAIConfigManager();

      // 调用AI服务
      const aiResponse = await processUserInput(
        userInput,
        this.conversationHistory,
        ALL_MCP_TOOL_SCHEMAS,
        config
      );

      if (!aiResponse.success) {
        return {
          response: '',
          toolResults: [],
          error: aiResponse.error
        };
      }

      // 执行工具调用
      const toolResults: MCPToolResult[] = [];

      for (const toolCall of aiResponse.toolCalls) {
        // 检查是否需要确认
        if (shouldConfirm(toolCall)) {
          const confirmResponse = await this.confirmManager.requestConfirm(toolCall);

          if (!confirmResponse.confirmed) {
            toolResults.push({
              success: false,
              error: `操作被用户拒绝: ${confirmResponse.reason || '未指定原因'}`
            });
            continue;
          }
        }

        // 执行工具
        const result = await executeMCPTool(toolCall, this.context);
        toolResults.push(result);
      }

      return {
        response: aiResponse.content,
        toolResults
      };

    } catch (error) {
      return {
        response: '',
        toolResults: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 直接执行工具（跳过AI解析）
   */
  async executeToolDirectly(toolCall: MCPToolCall): Promise<MCPToolResult> {
    // 检查是否需要确认
    if (shouldConfirm(toolCall)) {
      const confirmResponse = await this.confirmManager.requestConfirm(toolCall);

      if (!confirmResponse.confirmed) {
        return {
          success: false,
          error: `操作被用户拒绝: ${confirmResponse.reason || '未指定原因'}`
        };
      }
    }

    return executeMCPTool(toolCall, this.context);
  }

  /**
   * 获取工具列表
   */
  getAvailableTools() {
    return ALL_MCP_TOOL_SCHEMAS;
  }

  /**
   * 获取AI模型可理解的工具定义
   */
  getAIToolDefinitions() {
    return generateAIToolDefinitions();
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * 获取确认管理器
   */
  getConfirmManager() {
    return this.confirmManager;
  }
}

// ============================================
// 工厂函数
// ============================================

/**
 * 创建MCP Server实例
 */
export function createMCPServer(context: MCPContext): MCPServer {
  return new MCPServer(context);
}

/**
 * 创建独立的MCP上下文（用于测试）
 */
export function createMockMCPContext(overrides: Partial<MCPContext> = {}): MCPContext {
  return {
    bands: [],
    reportProperties: {},
    fields: [],
    parameters: [],
    variables: [],
    saveStateToHistory: () => {},
    updateJRXML: () => {},
    selectElement: () => {},
    ...overrides
  };
}
