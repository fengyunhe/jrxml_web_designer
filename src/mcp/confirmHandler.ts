/**
 * Confirm Handler - 智能确认机制
 *
 * 根据操作风险等级自动决定是否需要用户确认
 */

import type { MCPToolCall } from './handlers';

// ============================================
// 类型定义
// ============================================

export type OperationRisk = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export const OperationRisk = {
  SAFE: 'safe' as const,
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const
};

export interface ConfirmRequest {
  toolName: string;
  description: string;
  riskLevel: OperationRisk;
  params: Record<string, any>;
  affectedCount?: number;
}

export interface ConfirmResponse {
  confirmed: boolean;
  reason?: string;
}

// ============================================
// 风险等级映射
// ============================================

const RISK_LEVELS: Record<string, OperationRisk> = {
  // 查询工具 - 安全
  'get_design_state': OperationRisk.SAFE,
  'get_element': OperationRisk.SAFE,
  'find_elements': OperationRisk.SAFE,

  // 创建工具 - 低风险
  'create_static_text': OperationRisk.LOW,
  'create_text_field': OperationRisk.LOW,
  'create_rectangle': OperationRisk.LOW,
  'create_frame': OperationRisk.LOW,

  // 修改工具 - 低风险
  'update_element': OperationRisk.LOW,
  'move_element': OperationRisk.LOW,

  // 删除工具 - 中/高风险
  'delete_element': OperationRisk.MEDIUM,

  // Band操作工具 - 低风险
  'update_band_height': OperationRisk.LOW
};

// ============================================
// 智能确认逻辑
// ============================================

/**
 * 获取操作的风险等级
 */
export function getOperationRisk(toolName: string): OperationRisk {
  return (RISK_LEVELS as Record<string, OperationRisk>)[toolName] || OperationRisk.HIGH;
}

/**
 * 检查是否需要用户确认
 */
export function shouldConfirm(toolCall: MCPToolCall): boolean {
  const riskLevel = getOperationRisk(toolCall.name);

  // 安全操作无需确认
  if (riskLevel === OperationRisk.SAFE) {
    return false;
  }

  // 低风险操作无需确认
  if (riskLevel === OperationRisk.LOW) {
    return false;
  }

  // 中等风险 - 批量操作需要确认
  if (riskLevel === OperationRisk.MEDIUM) {
    // 如果涉及多个元素（超过3个），需要确认
    if (toolCall.params.uuids && Array.isArray(toolCall.params.uuids)) {
      return toolCall.params.uuids.length > 3;
    }
    // 单个删除操作需要确认
    if (toolCall.name === 'delete_element') {
      return true;
    }
    return false;
  }

  // 高风险和极高风险 - 必须确认
  if (riskLevel === OperationRisk.HIGH || riskLevel === OperationRisk.CRITICAL) {
    return true;
  }

  return true;
}

/**
 * 生成确认请求
 */
export function generateConfirmRequest(toolCall: MCPToolCall): ConfirmRequest {
  const riskLevel = getOperationRisk(toolCall.name);
  const description = generateToolDescription(toolCall);

  let affectedCount: number | undefined;

  // 计算受影响的元素数量
  if (toolCall.params.uuids && Array.isArray(toolCall.params.uuids)) {
    affectedCount = toolCall.params.uuids.length;
  }

  return {
    toolName: toolCall.name,
    description,
    riskLevel,
    params: toolCall.params,
    affectedCount
  };
}

/**
 * 生成工具操作描述
 */
function generateToolDescription(toolCall: MCPToolCall): string {
  const { name, params } = toolCall;

  switch (name) {
    case 'create_static_text':
      return `创建静态文本 "${params.text || '未命名'}" 在 ${params.bandType} band`;

    case 'create_text_field':
      return `创建动态文本框 "${params.expression || '未定义'}" 在 ${params.bandType} band`;

    case 'create_rectangle':
      return `创建矩形在 ${params.bandType} band`;

    case 'create_frame':
      return `创建Frame容器在 ${params.bandType} band`;

    case 'update_element':
      return `更新元素 ${params.uuid} 的属性: ${Object.keys(params.properties || {}).join(', ')}`;

    case 'move_element':
      return `移动元素 ${params.uuid} 到位置 (${params.x}, ${params.y})`;

    case 'delete_element':
      return `删除元素 ${params.uuid}`;

    case 'update_band_height':
      return `调整 ${params.bandType} band 高度为 ${params.height}px`;

    default:
      return `执行工具 ${name}`;
  }
}

/**
 * 获取风险等级描述
 */
export function getRiskLevelDescription(riskLevel: OperationRisk): string {
  switch (riskLevel) {
    case OperationRisk.SAFE:
      return '安全操作 - 只读';
    case OperationRisk.LOW:
      return '低风险 - 单个元素修改';
    case OperationRisk.MEDIUM:
      return '中风险 - 多个元素修改或删除';
    case OperationRisk.HIGH:
      return '高风险 - 批量删除或不可逆操作';
    case OperationRisk.CRITICAL:
      return '极高风险 - 需要立即确认';
    default:
      return '未知风险';
  }
}

/**
 * 获取风险等级颜色（用于UI显示）
 */
export function getRiskLevelColor(riskLevel: OperationRisk): string {
  switch (riskLevel) {
    case OperationRisk.SAFE:
      return '#4CAF50'; // 绿色
    case OperationRisk.LOW:
      return '#8BC34A'; // 浅绿色
    case OperationRisk.MEDIUM:
      return '#FFC107'; // 黄色
    case OperationRisk.HIGH:
      return '#FF9800'; // 橙色
    case OperationRisk.CRITICAL:
      return '#F44336'; // 红色
    default:
      return '#9E9E9E'; // 灰色
  }
}

// ============================================
// 确认对话框接口
// ============================================

export interface ConfirmDialogState {
  visible: boolean;
  request: ConfirmRequest | null;
  resolve: ((response: ConfirmResponse) => void) | null;
}

/**
 * 创建确认对话框状态管理
 */
export function createConfirmDialogManager() {
  const state: ConfirmDialogState = {
    visible: false,
    request: null,
    resolve: null
  };

  /**
   * 请求用户确认
   */
  function requestConfirm(toolCall: MCPToolCall): Promise<ConfirmResponse> {
    return new Promise((resolve) => {
      const request = generateConfirmRequest(toolCall);

      // 如果不需要确认，直接通过
      if (!shouldConfirm(toolCall)) {
        resolve({ confirmed: true, reason: '自动批准' });
        return;
      }

      state.visible = true;
      state.request = request;
      state.resolve = resolve;
    });
  }

  /**
   * 用户确认
   */
  function confirm(reason?: string) {
    if (state.resolve) {
      state.resolve({ confirmed: true, reason });
    }
    state.visible = false;
    state.request = null;
    state.resolve = null;
  }

  /**
   * 用户拒绝
   */
  function reject(reason?: string) {
    if (state.resolve) {
      state.resolve({ confirmed: false, reason });
    }
    state.visible = false;
    state.request = null;
    state.resolve = null;
  }

  return {
    state,
    requestConfirm,
    confirm,
    reject
  };
}

// ============================================
// 工具风险等级映射表（用于文档和调试）
// ============================================

export const TOOL_RISK_LEVELS_DOCUMENTATION = Object.entries(RISK_LEVELS).map(([toolName, riskLevel]) => ({
  toolName,
  riskLevel,
  description: getRiskLevelDescription(riskLevel),
  needsConfirmation: shouldConfirm({ name: toolName, params: {} })
}));
