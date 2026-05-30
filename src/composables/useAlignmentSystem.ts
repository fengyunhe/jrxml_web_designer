import { ref, computed } from 'vue';

export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  source: 'element' | 'band' | 'grid' | 'custom';
  label?: string;
  visible: boolean;
  active: boolean;
}

export interface AlignmentPoint {
  id: string;
  x: number;
  y: number;
  type: 'edge' | 'center' | 'corner';
  active: boolean;
}

export interface AlignmentResult {
  alignedX: number;
  alignedY: number;
  alignedGuides: AlignmentGuide[];
  snappedToX: boolean;
  snappedToY: boolean;
  snapStrength: number; // 0-1, 吸附强度
}

export function useAlignmentSystem() {
  // 对齐指南列表
  const guides = ref<AlignmentGuide[]>([]);

  // 对齐点列表
  const alignmentPoints = ref<AlignmentPoint[]>([]);

  // 当前活跃的对齐指南
  const activeGuides = computed(() =>
    guides.value.filter(g => g.active && g.visible)
  );

  // 添加对齐指南
  const addGuide = (guide: Omit<AlignmentGuide, 'id' | 'visible' | 'active'>) => {
    const id = `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    guides.value.push({
      ...guide,
      id,
      visible: true,
      active: false,
    });
    return id;
  };

  // 移除对齐指南
  const removeGuide = (id: string) => {
    guides.value = guides.value.filter(g => g.id !== id);
  };

  // 清除所有对齐指南
  const clearGuides = () => {
    guides.value = [];
  };

  // 更新对齐指南
  const updateGuide = (id: string, updates: Partial<AlignmentGuide>) => {
    const index = guides.value.findIndex(g => g.id === id);
    if (index !== -1) {
      const existing = guides.value[index];
      if (existing) {
        guides.value[index] = { ...existing, ...updates };
      }
    }
  };

  // 激活对齐指南
  const activateGuide = (id: string) => {
    updateGuide(id, { active: true });
  };

  // 停用对齐指南
  const deactivateGuide = (id: string) => {
    updateGuide(id, { active: false });
  };

  // 停用所有对齐指南
  const deactivateAllGuides = () => {
    guides.value = guides.value.map(g => ({ ...g, active: false }));
  };

  // 计算对齐位置
  const calculateAlignment = (
    x: number,
    y: number,
    width: number,
    height: number,
    otherElements: Array<{ x: number; y: number; width: number; height: number }>,
    snapDistance: number = 5
  ): AlignmentResult => {
    let alignedX = x;
    let alignedY = y;
    let snappedToX = false;
    let snappedToY = false;
    let snapStrength = 0;
    const alignedGuides: AlignmentGuide[] = [];

    // 计算当前元素的边缘和中心
    const leftEdge = x;
    const rightEdge = x + width;
    const centerX = x + width / 2;
    const topEdge = y;
    const bottomEdge = y + height;
    const centerY = y + height / 2;

    // 检查与其他元素的对齐
    otherElements.forEach((element, index) => {
      const elLeft = element.x;
      const elRight = element.x + element.width;
      const elCenterX = element.x + element.width / 2;
      const elTop = element.y;
      const elBottom = element.y + element.height;
      const elCenterY = element.y + element.height / 2;

      // 水平对齐检查（左右边缘、中心）
      const horizontalChecks = [
        { value: leftEdge, target: elLeft, label: '左对齐' },
        { value: rightEdge, target: elRight, label: '右对齐' },
        { value: centerX, target: elCenterX, label: '水平居中' },
      ];

      horizontalChecks.forEach(check => {
        if (Math.abs(check.value - check.target) < snapDistance) {
          alignedX = x + (check.target - check.value);
          snappedToX = true;
          snapStrength = Math.max(snapStrength, 1 - Math.abs(check.value - check.target) / snapDistance);

          // 创建对齐指南
          const guide: AlignmentGuide = {
            id: `align-h-${index}-${check.label}`,
            type: 'vertical',
            position: check.target,
            source: 'element',
            label: check.label,
            visible: true,
            active: true,
          };
          alignedGuides.push(guide);
          guides.value.push(guide);
        }
      });

      // 垂直对齐检查（上下边缘、中心）
      const verticalChecks = [
        { value: topEdge, target: elTop, label: '上对齐' },
        { value: bottomEdge, target: elBottom, label: '下对齐' },
        { value: centerY, target: elCenterY, label: '垂直居中' },
      ];

      verticalChecks.forEach(check => {
        if (Math.abs(check.value - check.target) < snapDistance) {
          alignedY = y + (check.target - check.value);
          snappedToY = true;
          snapStrength = Math.max(snapStrength, 1 - Math.abs(check.value - check.target) / snapDistance);

          // 创建对齐指南
          const guide: AlignmentGuide = {
            id: `align-v-${index}-${check.label}`,
            type: 'horizontal',
            position: check.target,
            source: 'element',
            label: check.label,
            visible: true,
            active: true,
          };
          alignedGuides.push(guide);
          guides.value.push(guide);
        }
      });
    });

    return {
      alignedX,
      alignedY,
      alignedGuides,
      snappedToX,
      snappedToY,
      snapStrength,
    };
  };

  // 计算元素之间的间距
  const calculateSpacing = (
    elements: Array<{ x: number; y: number; width: number; height: number }>,
    direction: 'horizontal' | 'vertical'
  ): number[] => {
    if (elements.length < 2) return [];

    const spacings: number[] = [];

    if (direction === 'horizontal') {
      // 按X坐标排序
      const sorted = [...elements].sort((a, b) => a.x - b.x);

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        if (current && next) {
          const spacing = next.x - (current.x + current.width);
          spacings.push(spacing);
        }
      }
    } else {
      // 按Y坐标排序
      const sorted = [...elements].sort((a, b) => a.y - b.y);

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        if (current && next) {
          const spacing = next.y - (current.y + current.height);
          spacings.push(spacing);
        }
      }
    }

    return spacings;
  };

  // 计算均匀分布的位置
  const calculateDistribution = (
    elements: Array<{ x: number; y: number; width: number; height: number }>,
    direction: 'horizontal' | 'vertical',
    containerWidth?: number,
    containerHeight?: number
  ): Array<{ x: number; y: number }> => {
    if (elements.length < 3) {
      return elements.map(el => ({ x: el.x, y: el.y }));
    }

    const result: Array<{ x: number; y: number }> = [];

    if (direction === 'horizontal') {
      // 按X坐标排序
      const sorted = [...elements].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      if (!first || !last) return result;

      // 计算总宽度和总间距
      const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
      const totalSpace = (containerWidth || last.x + last.width) - first.x;
      const totalGap = totalSpace - totalWidth;
      const gap = totalGap / (sorted.length - 1);

      let currentX = first.x;
      sorted.forEach((el, index) => {
        result.push({ x: currentX, y: el.y });
        currentX += el.width + gap;
      });
    } else {
      // 按Y坐标排序
      const sorted = [...elements].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      if (!first || !last) return result;

      // 计算总高度和总间距
      const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
      const totalSpace = (containerHeight || last.y + last.height) - first.y;
      const totalGap = totalSpace - totalHeight;
      const gap = totalGap / (sorted.length - 1);

      let currentY = first.y;
      sorted.forEach((el, index) => {
        result.push({ x: el.x, y: currentY });
        currentY += el.height + gap;
      });
    }

    return result;
  };

  // 对齐元素
  const alignElements = (
    elements: Array<{ x: number; y: number; width: number; height: number }>,
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Array<{ x: number; y: number }> => {
    if (elements.length < 2) {
      return elements.map(el => ({ x: el.x, y: el.y }));
    }

    const result: Array<{ x: number; y: number }> = [];

    if (alignment === 'left') {
      const minX = Math.min(...elements.map(el => el.x));
      elements.forEach(el => {
        result.push({ x: minX, y: el.y });
      });
    } else if (alignment === 'right') {
      const maxRight = Math.max(...elements.map(el => el.x + el.width));
      elements.forEach(el => {
        result.push({ x: maxRight - el.width, y: el.y });
      });
    } else if (alignment === 'center') {
      const minX = Math.min(...elements.map(el => el.x));
      const maxRight = Math.max(...elements.map(el => el.x + el.width));
      const centerX = (minX + maxRight) / 2;
      elements.forEach(el => {
        result.push({ x: centerX - el.width / 2, y: el.y });
      });
    } else if (alignment === 'top') {
      const minY = Math.min(...elements.map(el => el.y));
      elements.forEach(el => {
        result.push({ x: el.x, y: minY });
      });
    } else if (alignment === 'bottom') {
      const maxBottom = Math.max(...elements.map(el => el.y + el.height));
      elements.forEach(el => {
        result.push({ x: el.x, y: maxBottom - el.height });
      });
    } else if (alignment === 'middle') {
      const minY = Math.min(...elements.map(el => el.y));
      const maxBottom = Math.max(...elements.map(el => el.y + el.height));
      const centerY = (minY + maxBottom) / 2;
      elements.forEach(el => {
        result.push({ x: el.x, y: centerY - el.height / 2 });
      });
    }

    return result;
  };

  // 获取对齐提示信息
  const getAlignmentTooltip = (alignedGuides: AlignmentGuide[]): string => {
    if (alignedGuides.length === 0) return '';

    const labels = alignedGuides.map(g => g.label).filter(Boolean);
    return labels.join(' + ');
  };

  return {
    guides,
    alignmentPoints,
    activeGuides,
    addGuide,
    removeGuide,
    clearGuides,
    updateGuide,
    activateGuide,
    deactivateGuide,
    deactivateAllGuides,
    calculateAlignment,
    calculateSpacing,
    calculateDistribution,
    alignElements,
    getAlignmentTooltip,
  };
}
