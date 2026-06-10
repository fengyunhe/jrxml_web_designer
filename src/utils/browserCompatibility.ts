/**
 * Browser Compatibility Checker - 浏览器兼容性检查
 *
 * 检测浏览器是否支持WebMCP特性
 */

import { ref, onMounted } from 'vue';

export interface BrowserSupportResult {
  isSupported: boolean;
  features: {
    webassembly: boolean;
    webWorkers: boolean;
    fetch: boolean;
    bigUint64Array: boolean;
  };
  missingFeatures: string[];
  message: string;
}

/**
 * 检测浏览器是否支持WebMCP
 */
export function checkWebMCPSupport(): BrowserSupportResult {
  const features = {
    webassembly: typeof WebAssembly !== 'undefined',
    webWorkers: typeof Worker !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    bigUint64Array: typeof BigUint64Array !== 'undefined'
  };

  const missingFeatures: string[] = [];

  if (!features.webassembly) {
    missingFeatures.push('WebAssembly');
  }
  if (!features.webWorkers) {
    missingFeatures.push('Web Workers');
  }
  if (!features.fetch) {
    missingFeatures.push('Fetch API');
  }
  if (!features.bigUint64Array) {
    missingFeatures.push('BigUint64Array');
  }

  const isSupported = missingFeatures.length === 0;

  let message: string;
  if (isSupported) {
    message = '浏览器支持WebMCP，可以使用AI助手功能';
  } else {
    message = `浏览器不支持以下特性，无法使用AI助手：${missingFeatures.join('、')}`;
  }

  return {
    isSupported,
    features,
    missingFeatures,
    message
  };
}

/**
 * Vue Composable：检测WebMCP支持
 */
export function useWebMCPSupport() {
  const supportResult = ref<BrowserSupportResult | null>(null);
  const isLoading = ref(true);

  onMounted(() => {
    try {
      supportResult.value = checkWebMCPSupport();
    } catch (error) {
      supportResult.value = {
        isSupported: false,
        features: {
          webassembly: false,
          webWorkers: false,
          fetch: false,
          bigUint64Array: false
        },
        missingFeatures: ['WebAssembly', 'Web Workers', 'Fetch API', 'BigUint64Array'],
        message: '检测浏览器支持时出错'
      };
    } finally {
      isLoading.value = false;
    }
  });

  return {
    supportResult,
    isLoading,
    isSupported: supportResult.value?.isSupported ?? false
  };
}

export default checkWebMCPSupport;
