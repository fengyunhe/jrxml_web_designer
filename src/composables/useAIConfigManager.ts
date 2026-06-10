/**
 * AI Configuration Manager - 配置管理
 *
 * 支持动态配置AI服务参数，并持久化到localStorage
 */

import { ref, watch } from 'vue';

// ============================================
// 类型定义
// ============================================

export interface AIConfiguration {
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  requestTimeout: number; // 超时时间，单位毫秒
}

export interface AIConfigManagerReturn {
  config: AIConfiguration;
  updateConfig: (newConfig: Partial<AIConfiguration>) => void;
  resetConfig: () => void;
  getConfigFromStorage: () => AIConfiguration;
}

// ============================================
// 默认配置
// ============================================

const DEFAULT_CONFIG: AIConfiguration = {
  apiEndpoint: 'http://127.0.0.1:1234/v1',
  apiKey: 'lm-studio',
  modelName: 'local-model',
  maxTokens: 4096,
  temperature: 0.7,
  requestTimeout: 300000 // 5分钟
};

const STORAGE_KEY = 'jrxml_ai_config';

// ============================================
// 配置管理实现
// ============================================

/**
 * 创建配置管理器
 */
export function useAIConfigManager(): AIConfigManagerReturn {
  // 从localStorage加载配置
  const loadConfigFromStorage = (): AIConfiguration => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load AI config from storage:', error);
    }
    return { ...DEFAULT_CONFIG };
  };

  // 当前配置
  const config = ref<AIConfiguration>(loadConfigFromStorage());

  // 保存配置到localStorage
  const saveConfigToStorage = (newConfig: AIConfiguration) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save AI config to storage:', error);
    }
  };

  // 更新配置
  const updateConfig = (newConfig: Partial<AIConfiguration>) => {
    config.value = { ...config.value, ...newConfig };
    saveConfigToStorage(config.value);
  };

  // 重置配置为默认值
  const resetConfig = () => {
    config.value = { ...DEFAULT_CONFIG };
    saveConfigToStorage(config.value);
  };

  // 获取配置
  const getConfigFromStorage = (): AIConfiguration => {
    return loadConfigFromStorage();
  };

  return {
    config: config.value,
    updateConfig,
    resetConfig,
    getConfigFromStorage
  };
}

/**
 * 导出默认配置供外部使用
 */
export { DEFAULT_CONFIG, STORAGE_KEY };
