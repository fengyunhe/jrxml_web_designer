import { ref, computed, watch } from 'vue';

export interface BoundaryConfig {
  // 检测模式
  realtime: boolean;
  onDrop: boolean;
  onResize: boolean;
  // 检测行为
  autoCorrect: boolean;
  showWarning: boolean;
  preventOutOfBounds: boolean;
  suggestFix: boolean;
  // 视觉反馈
  highlightOutOfBounds: boolean;
  showBoundaryLines: boolean;
  animateCorrection: boolean;
  // 边界容差
  tolerance: number;
}

export interface BoundaryViolation {
  id: string;
  elementId: string;
  bandIndex: number;
  elementIndex: number;
  type: 'left' | 'right' | 'top' | 'bottom';
  severity: 'warning' | 'error';
  currentValue: number;
  boundaryValue: number;
  overflow: number;
  suggestion: BoundaryFix;
}

export interface BoundaryFix {
  action: 'move' | 'resize' | 'both';
  newX?: number;
  newY?: number;
  newWidth?: number;
  newHeight?: number;
  description: string;
}

export interface BoundaryState {
  // 越界元素列表
  outOfBoundsElements: BoundaryViolation[];
  // 是否显示边界线
  showBoundaryLines: boolean;
  // 边界线位置
  boundaryLines: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  // 是否正在检测
  isChecking: boolean;
}

export function useBoundaryDetection(config?: Partial<BoundaryConfig>) {
  // 配置
  const boundaryConfig = ref<BoundaryConfig>({
    realtime: true,
    onDrop: true,
    onResize: true,
    autoCorrect: false,
    showWarning: true,
    preventOutOfBounds: false,
    suggestFix: true,
    highlightOutOfBounds: true,
    showBoundaryLines: true,
    animateCorrection: true,
    tolerance: 5,
    ...config,
  });

  // 状态
  const boundaryState = ref<BoundaryState>({
    outOfBoundsElements: [],
    showBoundaryLines: false,
    boundaryLines: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    isChecking: false,
  });

  // 计算属性：是否有越界元素
  const hasOutOfBoundsElements = computed(() =>
    boundaryState.value.outOfBoundsElements.length > 0
  );

  // 计算属性：越界元素数量
  const outOfBoundsCount = computed(() =>
    boundaryState.value.outOfBoundsElements.length
  );

  // 计算属性：严重越界元素数量
  const criticalOutOfBoundsCount = computed(() =>
    boundaryState.value.outOfBoundsElements.filter(v => v.severity === 'error').length
  );

  // 检查元素是否越界
  const checkElementBounds = (
    element: { x: number; y: number; width: number; height: number },
    bounds: { left: number; right: number; top: number; bottom: number },
    elementId: string,
    bandIndex: number,
    elementIndex: number
  ): BoundaryViolation[] => {
    const violations: BoundaryViolation[] = [];
    const tolerance = boundaryConfig.value.tolerance;

    // 检查左边界
    if (element.x < bounds.left - tolerance) {
      violations.push({
        id: `${elementId}-left`,
        elementId,
        bandIndex,
        elementIndex,
        type: 'left',
        severity: element.x < bounds.left ? 'error' : 'warning',
        currentValue: element.x,
        boundaryValue: bounds.left,
        overflow: bounds.left - element.x,
        suggestion: {
          action: 'move',
          newX: bounds.left,
          description: '向右移动元素',
        },
      });
    }

    // 检查右边界
    if (element.x + element.width > bounds.right + tolerance) {
      violations.push({
        id: `${elementId}-right`,
        elementId,
        bandIndex,
        elementIndex,
        type: 'right',
        severity: element.x + element.width > bounds.right ? 'error' : 'warning',
        currentValue: element.x + element.width,
        boundaryValue: bounds.right,
        overflow: (element.x + element.width) - bounds.right,
        suggestion: {
          action: 'move',
          newX: bounds.right - element.width,
          description: '向左移动元素',
        },
      });
    }

    // 检查上边界
    if (element.y < bounds.top - tolerance) {
      violations.push({
        id: `${elementId}-top`,
        elementId,
        bandIndex,
        elementIndex,
        type: 'top',
        severity: element.y < bounds.top ? 'error' : 'warning',
        currentValue: element.y,
        boundaryValue: bounds.top,
        overflow: bounds.top - element.y,
        suggestion: {
          action: 'move',
          newY: bounds.top,
          description: '向下移动元素',
        },
      });
    }

    // 检查下边界
    if (element.y + element.height > bounds.bottom + tolerance) {
      violations.push({
        id: `${elementId}-bottom`,
        elementId,
        bandIndex,
        elementIndex,
        type: 'bottom',
        severity: element.y + element.height > bounds.bottom ? 'error' : 'warning',
        currentValue: element.y + element.height,
        boundaryValue: bounds.bottom,
        overflow: (element.y + element.height) - bounds.bottom,
        suggestion: {
          action: 'move',
          newY: bounds.bottom - element.height,
          description: '向上移动元素',
        },
      });
    }

    return violations;
  };

  // 检查所有元素
  const checkAllElements = (
    bands: Array<{
      type: string;
      height: number;
      elements: Array<{
        uuid?: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }>,
    paperWidth: number,
    reportProperties: { leftMargin: number; rightMargin: number; topMargin: number; bottomMargin: number }
  ) => {
    boundaryState.value.isChecking = true;

    const allViolations: BoundaryViolation[] = [];
    const contentWidth = paperWidth - reportProperties.leftMargin - reportProperties.rightMargin;

    let yOffset = reportProperties.topMargin;

    bands.forEach((band, bandIndex) => {
      const bandBounds = {
        left: 0,
        right: contentWidth,
        top: 0,
        bottom: band.height,
      };

      band.elements.forEach((element, elementIndex) => {
        const elementId = element.uuid || `element-${bandIndex}-${elementIndex}`;
        const violations = checkElementBounds(
          element,
          bandBounds,
          elementId,
          bandIndex,
          elementIndex
        );

        allViolations.push(...violations);
      });

      yOffset += band.height;
    });

    boundaryState.value.outOfBoundsElements = allViolations;
    boundaryState.value.isChecking = false;

    return allViolations;
  };

  // 检查单个元素
  const checkSingleElement = (
    element: { x: number; y: number; width: number; height: number },
    bandHeight: number,
    contentWidth: number,
    elementId: string,
    bandIndex: number,
    elementIndex: number
  ) => {
    const bandBounds = {
      left: 0,
      right: contentWidth,
      top: 0,
      bottom: bandHeight,
    };

    const violations = checkElementBounds(
      element,
      bandBounds,
      elementId,
      bandIndex,
      elementIndex
    );

    // 更新该元素的违规状态
    boundaryState.value.outOfBoundsElements = [
      ...boundaryState.value.outOfBoundsElements.filter(v => v.elementId !== elementId),
      ...violations,
    ];

    return violations;
  };

  // 获取元素的修复建议
  const getFixSuggestion = (
    element: { x: number; y: number; width: number; height: number },
    bandHeight: number,
    contentWidth: number,
    violationType: 'left' | 'right' | 'top' | 'bottom'
  ): BoundaryFix | null => {
    const bounds = {
      left: 0,
      right: contentWidth,
      top: 0,
      bottom: bandHeight,
    };

    switch (violationType) {
      case 'left':
        return {
          action: 'move',
          newX: bounds.left,
          description: '移动到左边界内',
        };
      case 'right':
        return {
          action: 'move',
          newX: bounds.right - element.width,
          description: '移动到右边界内',
        };
      case 'top':
        return {
          action: 'move',
          newY: bounds.top,
          description: '移动到上边界内',
        };
      case 'bottom':
        return {
          action: 'move',
          newY: bounds.bottom - element.height,
          description: '移动到下边界内',
        };
      default:
        return null;
    }
  };

  // 自动修复越界元素
  const autoFixElement = (
    element: { x: number; y: number; width: number; height: number },
    violations: BoundaryViolation[]
  ): { x: number; y: number; width: number; height: number } => {
    let newX = element.x;
    let newY = element.y;
    let newWidth = element.width;
    let newHeight = element.height;

    violations.forEach(violation => {
      if (violation.suggestion.action === 'move') {
        if (violation.suggestion.newX !== undefined) {
          newX = violation.suggestion.newX;
        }
        if (violation.suggestion.newY !== undefined) {
          newY = violation.suggestion.newY;
        }
      } else if (violation.suggestion.action === 'resize') {
        if (violation.suggestion.newWidth !== undefined) {
          newWidth = violation.suggestion.newWidth;
        }
        if (violation.suggestion.newHeight !== undefined) {
          newHeight = violation.suggestion.newHeight;
        }
      }
    });

    return { x: newX, y: newY, width: newWidth, height: newHeight };
  };

  // 批量修复所有越界元素
  const autoFixAllElements = (
    bands: Array<{
      type: string;
      height: number;
      elements: Array<{
        uuid?: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }>,
    paperWidth: number,
    reportProperties: { leftMargin: number; rightMargin: number; topMargin: number; bottomMargin: number }
  ) => {
    const contentWidth = paperWidth - reportProperties.leftMargin - reportProperties.rightMargin;

    const fixedBands = bands.map((band, bandIndex) => ({
      ...band,
      elements: band.elements.map((element, elementIndex) => {
        const elementId = element.uuid || `element-${bandIndex}-${elementIndex}`;
        const violations = boundaryState.value.outOfBoundsElements.filter(
          v => v.elementId === elementId
        );

        if (violations.length > 0) {
          return autoFixElement(element, violations);
        }

        return element;
      }),
    }));

    // 清除已修复的违规
    boundaryState.value.outOfBoundsElements = [];

    return fixedBands;
  };

  // 高亮越界元素
  const highlightElement = (elementId: string) => {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (element) {
      element.classList.add('out-of-bounds-highlight');
      setTimeout(() => {
        element.classList.remove('out-of-bounds-highlight');
      }, 2000);
    }
  };

  // 显示边界线
  const showBoundaryLines = (
    paperWidth: number,
    reportProperties: { leftMargin: number; rightMargin: number; topMargin: number; bottomMargin: number }
  ) => {
    const contentWidth = paperWidth - reportProperties.leftMargin - reportProperties.rightMargin;

    boundaryState.value.showBoundaryLines = true;
    boundaryState.value.boundaryLines = {
      left: 0,
      right: contentWidth,
      top: 0,
      bottom: 0, // 需要根据实际band高度计算
    };
  };

  // 隐藏边界线
  const hideBoundaryLines = () => {
    boundaryState.value.showBoundaryLines = false;
  };

  // 清除所有违规记录
  const clearViolations = () => {
    boundaryState.value.outOfBoundsElements = [];
  };

  // 获取违规摘要
  const getViolationSummary = computed(() => {
    const violations = boundaryState.value.outOfBoundsElements;
    if (violations.length === 0) return null;

    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;

    return {
      total: violations.length,
      errors: errorCount,
      warnings: warningCount,
      message: errorCount > 0
        ? `有 ${errorCount} 个元素严重越界，${warningCount} 个轻微越界`
        : `有 ${warningCount} 个元素轻微越界`,
    };
  });

  // 更新配置
  const updateConfig = (newConfig: Partial<BoundaryConfig>) => {
    boundaryConfig.value = { ...boundaryConfig.value, ...newConfig };
  };

  return {
    boundaryConfig,
    boundaryState,
    hasOutOfBoundsElements,
    outOfBoundsCount,
    criticalOutOfBoundsCount,
    checkElementBounds,
    checkAllElements,
    checkSingleElement,
    getFixSuggestion,
    autoFixElement,
    autoFixAllElements,
    highlightElement,
    showBoundaryLines,
    hideBoundaryLines,
    clearViolations,
    getViolationSummary,
    updateConfig,
  };
}
