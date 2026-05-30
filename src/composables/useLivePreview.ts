import { ref, computed, watch, onUnmounted } from 'vue';

export interface PreviewConfig {
  // 启用实时预览
  enabled: boolean;
  // 预览延迟（毫秒）
  debounceDelay: number;
  // 预览范围
  previewScope: 'element' | 'band' | 'page';
  // 预览动画
  animated: boolean;
  // 动画持续时间（毫秒）
  animationDuration: number;
}

export interface PreviewState {
  // 是否正在预览
  isPreviewing: boolean;
  // 预览的属性
  previewedProperty: string | null;
  // 预览的原始值
  originalValue: any;
  // 预览的新值
  previewValue: any;
  // 预览开始时间
  previewStartTime: number;
}

export interface PreviewStyle {
  // 字体相关
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  // 颜色相关
  color?: string;
  backgroundColor?: string;
  // 尺寸相关
  width?: number;
  height?: number;
  // 位置相关
  x?: number;
  y?: number;
  // 对齐相关
  textAlign?: string;
  verticalAlign?: string;
  // 边框相关
  border?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  borderRadius?: number;
  // 边距相关
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

export function useLivePreview(config?: Partial<PreviewConfig>) {
  // 配置
  const previewConfig = ref<PreviewConfig>({
    enabled: true,
    debounceDelay: 100,
    previewScope: 'element',
    animated: true,
    animationDuration: 200,
    ...config,
  });

  // 预览状态
  const previewState = ref<PreviewState>({
    isPreviewing: false,
    previewedProperty: null,
    originalValue: null,
    previewValue: null,
    previewStartTime: 0,
  });

  // 防抖定时器
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // 动画帧ID
  let animationFrameId: number | null = null;

  // 预览元素缓存
  const previewElementCache = new Map<HTMLElement, PreviewStyle>();

  // 应用预览样式
  const applyPreviewStyle = (
    element: HTMLElement,
    property: string,
    value: any,
    originalValue: any
  ) => {
    if (!previewConfig.value.enabled) return;

    // 保存原始值
    if (!previewElementCache.has(element)) {
      previewElementCache.set(element, {});
    }
    const cache = previewElementCache.get(element)!;

    // 应用新值
    switch (property) {
      case 'fontFamily':
        cache.fontFamily = element.style.fontFamily;
        element.style.fontFamily = value;
        break;
      case 'fontSize':
        cache.fontSize = parseInt(element.style.fontSize) || undefined;
        element.style.fontSize = `${value}px`;
        break;
      case 'fontWeight':
        cache.fontWeight = element.style.fontWeight;
        element.style.fontWeight = value ? 'bold' : 'normal';
        break;
      case 'fontStyle':
        cache.fontStyle = element.style.fontStyle;
        element.style.fontStyle = value ? 'italic' : 'normal';
        break;
      case 'textDecoration':
        cache.textDecoration = element.style.textDecoration;
        element.style.textDecoration = value ? 'underline' : 'none';
        break;
      case 'color':
        cache.color = element.style.color;
        element.style.color = value;
        break;
      case 'backgroundColor':
        cache.backgroundColor = element.style.backgroundColor;
        element.style.backgroundColor = value;
        break;
      case 'width':
        cache.width = parseInt(element.style.width) || undefined;
        element.style.width = `${value}px`;
        break;
      case 'height':
        cache.height = parseInt(element.style.height) || undefined;
        element.style.height = `${value}px`;
        break;
      case 'x':
        cache.x = parseInt(element.style.left) || undefined;
        element.style.left = `${value}px`;
        break;
      case 'y':
        cache.y = parseInt(element.style.top) || undefined;
        element.style.top = `${value}px`;
        break;
      case 'textAlign':
        cache.textAlign = element.style.textAlign;
        element.style.textAlign = value;
        break;
      case 'verticalAlign':
        cache.verticalAlign = element.style.verticalAlign;
        element.style.verticalAlign = value;
        break;
      case 'border':
        cache.border = element.style.border;
        element.style.border = value;
        break;
      case 'borderColor':
        cache.borderColor = element.style.borderColor;
        element.style.borderColor = value;
        break;
      case 'borderWidth':
        cache.borderWidth = parseInt(element.style.borderWidth) || undefined;
        element.style.borderWidth = `${value}px`;
        break;
      case 'borderStyle':
        cache.borderStyle = element.style.borderStyle;
        element.style.borderStyle = value;
        break;
      case 'borderRadius':
        cache.borderRadius = parseInt(element.style.borderRadius) || undefined;
        element.style.borderRadius = `${value}px`;
        break;
      case 'padding':
        cache.padding = parseInt(element.style.padding) || undefined;
        element.style.padding = `${value}px`;
        break;
      case 'paddingTop':
        cache.paddingTop = parseInt(element.style.paddingTop) || undefined;
        element.style.paddingTop = `${value}px`;
        break;
      case 'paddingRight':
        cache.paddingRight = parseInt(element.style.paddingRight) || undefined;
        element.style.paddingRight = `${value}px`;
        break;
      case 'paddingBottom':
        cache.paddingBottom = parseInt(element.style.paddingBottom) || undefined;
        element.style.paddingBottom = `${value}px`;
        break;
      case 'paddingLeft':
        cache.paddingLeft = parseInt(element.style.paddingLeft) || undefined;
        element.style.paddingLeft = `${value}px`;
        break;
      default:
        console.warn(`Unsupported preview property: ${property}`);
        return;
    }

    // 添加过渡动画
    if (previewConfig.value.animated) {
      element.style.transition = `all ${previewConfig.value.animationDuration}ms ease`;
    }

    // 更新预览状态
    previewState.value = {
      isPreviewing: true,
      previewedProperty: property,
      originalValue,
      previewValue: value,
      previewStartTime: Date.now(),
    };
  };

  // 恢复原始样式
  const restoreOriginalStyle = (element: HTMLElement) => {
    const cache = previewElementCache.get(element);
    if (!cache) return;

    // 恢复所有缓存的原始值
    Object.entries(cache).forEach(([property, value]) => {
      if (value !== undefined) {
        (element.style as any)[property] = value;
      }
    });

    // 清除过渡动画
    element.style.transition = '';

    // 清除缓存
    previewElementCache.delete(element);

    // 更新预览状态
    previewState.value = {
      isPreviewing: false,
      previewedProperty: null,
      originalValue: null,
      previewValue: null,
      previewStartTime: 0,
    };
  };

  // 防抖预览
  const debouncedPreview = (
    element: HTMLElement,
    property: string,
    value: any,
    originalValue: any
  ) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      applyPreviewStyle(element, property, value, originalValue);
    }, previewConfig.value.debounceDelay);
  };

  // 开始预览
  const startPreview = (
    element: HTMLElement,
    property: string,
    value: any,
    originalValue: any
  ) => {
    if (!previewConfig.value.enabled) return;

    // 如果已经在预览同一个属性，直接更新
    if (previewState.value.isPreviewing && previewState.value.previewedProperty === property) {
      applyPreviewStyle(element, property, value, originalValue);
    } else {
      // 否则，先停止之前的预览
      if (previewState.value.isPreviewing) {
        stopPreview(element);
      }
      // 开始新的预览
      debouncedPreview(element, property, value, originalValue);
    }
  };

  // 停止预览
  const stopPreview = (element: HTMLElement) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    restoreOriginalStyle(element);
  };

  // 确认预览（应用为最终值）
  const confirmPreview = (element: HTMLElement) => {
    // 清除缓存，保留当前样式
    previewElementCache.delete(element);

    // 清除过渡动画
    element.style.transition = '';

    // 更新状态
    previewState.value = {
      isPreviewing: false,
      previewedProperty: null,
      originalValue: null,
      previewValue: null,
      previewStartTime: 0,
    };
  };

  // 切换预览状态
  const togglePreview = () => {
    previewConfig.value.enabled = !previewConfig.value.enabled;

    // 如果禁用预览，恢复所有正在预览的元素
    if (!previewConfig.value.enabled) {
      previewElementCache.forEach((_, element) => {
        restoreOriginalStyle(element);
      });
    }
  };

  // 更新预览配置
  const updateConfig = (newConfig: Partial<PreviewConfig>) => {
    previewConfig.value = { ...previewConfig.value, ...newConfig };
  };

  // 获取预览持续时间
  const getPreviewDuration = computed(() => {
    if (!previewState.value.isPreviewing) return 0;
    return Date.now() - previewState.value.previewStartTime;
  });

  // 清理
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    // 恢复所有正在预览的元素
    previewElementCache.forEach((_, element) => {
      restoreOriginalStyle(element);
    });
  });

  return {
    previewConfig,
    previewState,
    startPreview,
    stopPreview,
    confirmPreview,
    togglePreview,
    updateConfig,
    getPreviewDuration,
  };
}
