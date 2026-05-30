import { ref, computed, watch, onUnmounted } from 'vue';

export interface DragFeedback {
  // 拖拽预览元素
  previewElement: HTMLElement | null;
  // 拖拽预览位置
  previewPosition: { x: number; y: number } | null;
  // 拖拽预览尺寸
  previewSize: { width: number; height: number } | null;
  // 可放置区域
  droppableZones: Array<{
    id: string;
    bandIndex: number;
    bounds: { x: number; y: number; width: number; height: number };
    highlighted: boolean;
  }>;
  // 吸附点
  snapPoints: Array<{
    id: string;
    position: { x: number; y: number };
    type: 'horizontal' | 'vertical';
    active: boolean;
  }>;
  // 吸附指示线
  snapLines: Array<{
    id: string;
    type: 'horizontal' | 'vertical';
    position: number;
    active: boolean;
  }>;
  // 拖拽状态
  isDragging: boolean;
  // 拖拽元素信息
  draggedElementInfo: {
    bandIndex: number;
    elementIndex: number;
    type: string;
  } | null;
}

export function useDragFeedback() {
  // 拖拽反馈状态
  const feedback = ref<DragFeedback>({
    previewElement: null,
    previewPosition: null,
    previewSize: null,
    droppableZones: [],
    snapPoints: [],
    snapLines: [],
    isDragging: false,
    draggedElementInfo: null,
  });

  // 动画帧ID
  let animationFrameId: number | null = null;

  // 计算可放置区域
  const updateDroppableZones = (
    bands: Array<{ type: string; height: number; elements: any[] }>,
    paperWidth: number,
    currentBandIndex: number
  ) => {
    const zones: DragFeedback['droppableZones'] = [];
    let yOffset = 0;

    bands.forEach((band, index) => {
      zones.push({
        id: `band-${index}`,
        bandIndex: index,
        bounds: {
          x: 0,
          y: yOffset,
          width: paperWidth,
          height: band.height,
        },
        highlighted: index === currentBandIndex,
      });
      yOffset += band.height;
    });

    feedback.value.droppableZones = zones;
  };

  // 计算吸附点
  const updateSnapPoints = (
    currentX: number,
    currentY: number,
    elementWidth: number,
    elementHeight: number,
    bands: Array<{ type: string; height: number; elements: any[] }>,
    currentBandIndex: number,
    snapDistance: number = 5
  ) => {
    const points: DragFeedback['snapPoints'] = [];
    const lines: DragFeedback['snapLines'] = [];

    // 获取当前band中的其他元素
    const currentBand = bands[currentBandIndex];
    if (!currentBand) return;

    const otherElements = currentBand.elements.filter(
      (_, index) => index !== feedback.value.draggedElementInfo?.elementIndex
    );

    // 计算水平对齐点（左、中、右）
    const leftEdge = currentX;
    const centerX = currentX + elementWidth / 2;
    const rightEdge = currentX + elementWidth;

    // 计算垂直对齐点（上、中、下）
    const topEdge = currentY;
    const centerY = currentY + elementHeight / 2;
    const bottomEdge = currentY + elementHeight;

    // 检查与其他元素的对齐
    otherElements.forEach((element, index) => {
      const elLeft = element.x;
      const elCenterX = element.x + element.width / 2;
      const elRight = element.x + element.width;
      const elTop = element.y;
      const elCenterY = element.y + element.height / 2;
      const elBottom = element.y + element.height;

      // 左对齐检查
      if (Math.abs(leftEdge - elLeft) < snapDistance) {
        points.push({
          id: `snap-left-${index}`,
          position: { x: elLeft, y: currentY },
          type: 'vertical',
          active: true,
        });
        lines.push({
          id: `line-left-${index}`,
          type: 'vertical',
          position: elLeft,
          active: true,
        });
      }

      // 右对齐检查
      if (Math.abs(rightEdge - elRight) < snapDistance) {
        points.push({
          id: `snap-right-${index}`,
          position: { x: elRight, y: currentY },
          type: 'vertical',
          active: true,
        });
        lines.push({
          id: `line-right-${index}`,
          type: 'vertical',
          position: elRight,
          active: true,
        });
      }

      // 中心X对齐检查
      if (Math.abs(centerX - elCenterX) < snapDistance) {
        points.push({
          id: `snap-centerx-${index}`,
          position: { x: elCenterX, y: currentY },
          type: 'vertical',
          active: true,
        });
        lines.push({
          id: `line-centerx-${index}`,
          type: 'vertical',
          position: elCenterX,
          active: true,
        });
      }

      // 上对齐检查
      if (Math.abs(topEdge - elTop) < snapDistance) {
        points.push({
          id: `snap-top-${index}`,
          position: { x: currentX, y: elTop },
          type: 'horizontal',
          active: true,
        });
        lines.push({
          id: `line-top-${index}`,
          type: 'horizontal',
          position: elTop,
          active: true,
        });
      }

      // 下对齐检查
      if (Math.abs(bottomEdge - elBottom) < snapDistance) {
        points.push({
          id: `snap-bottom-${index}`,
          position: { x: currentX, y: elBottom },
          type: 'horizontal',
          active: true,
        });
        lines.push({
          id: `line-bottom-${index}`,
          type: 'horizontal',
          position: elBottom,
          active: true,
        });
      }

      // 中心Y对齐检查
      if (Math.abs(centerY - elCenterY) < snapDistance) {
        points.push({
          id: `snap-centery-${index}`,
          position: { x: currentX, y: elCenterY },
          type: 'horizontal',
          active: true,
        });
        lines.push({
          id: `line-centery-${index}`,
          type: 'horizontal',
          position: elCenterY,
          active: true,
        });
      }
    });

    feedback.value.snapPoints = points;
    feedback.value.snapLines = lines;
  };

  // 开始拖拽
  const startDrag = (
    elementInfo: { bandIndex: number; elementIndex: number; type: string },
    previewElement: HTMLElement | null = null
  ) => {
    feedback.value.isDragging = true;
    feedback.value.draggedElementInfo = elementInfo;
    feedback.value.previewElement = previewElement;

    // 创建预览元素（如果未提供）
    if (!previewElement) {
      const preview = document.createElement('div');
      preview.className = 'drag-preview';
      preview.style.position = 'fixed';
      preview.style.pointerEvents = 'none';
      preview.style.opacity = '0.6';
      preview.style.border = '2px dashed #1890ff';
      preview.style.backgroundColor = 'rgba(24, 144, 255, 0.1)';
      preview.style.zIndex = '1000';
      preview.style.transition = 'transform 0.1s ease';
      document.body.appendChild(preview);
      feedback.value.previewElement = preview;
    }
  };

  // 更新拖拽预览位置
  const updatePreviewPosition = (x: number, y: number, width: number, height: number) => {
    feedback.value.previewPosition = { x, y };
    feedback.value.previewSize = { width, height };

    if (feedback.value.previewElement) {
      feedback.value.previewElement.style.left = `${x}px`;
      feedback.value.previewElement.style.top = `${y}px`;
      feedback.value.previewElement.style.width = `${width}px`;
      feedback.value.previewElement.style.height = `${height}px`;
    }
  };

  // 停止拖拽
  const stopDrag = () => {
    feedback.value.isDragging = false;
    feedback.value.draggedElementInfo = null;
    feedback.value.previewPosition = null;
    feedback.value.previewSize = null;
    feedback.value.snapPoints = [];
    feedback.value.snapLines = [];

    // 移除预览元素
    if (feedback.value.previewElement) {
      feedback.value.previewElement.remove();
      feedback.value.previewElement = null;
    }
  };

  // 高亮可放置区域
  const highlightDroppableZone = (bandIndex: number) => {
    feedback.value.droppableZones = feedback.value.droppableZones.map(zone => ({
      ...zone,
      highlighted: zone.bandIndex === bandIndex,
    }));
  };

  // 清除高亮
  const clearHighlights = () => {
    feedback.value.droppableZones = feedback.value.droppableZones.map(zone => ({
      ...zone,
      highlighted: false,
    }));
  };

  // 获取吸附位置
  const getSnappedPosition = (
    x: number,
    y: number,
    width: number,
    height: number,
    snapDistance: number = 5
  ): { x: number; y: number; snappedX: boolean; snappedY: boolean } => {
    let snappedX = false;
    let snappedY = false;
    let newX = x;
    let newY = y;

    // 检查所有吸附线
    feedback.value.snapLines.forEach(line => {
      if (line.type === 'vertical' && !snappedX) {
        // 左边缘吸附
        if (Math.abs(x - line.position) < snapDistance) {
          newX = line.position;
          snappedX = true;
        }
        // 右边缘吸附
        else if (Math.abs((x + width) - line.position) < snapDistance) {
          newX = line.position - width;
          snappedX = true;
        }
        // 中心X吸附
        else if (Math.abs((x + width / 2) - line.position) < snapDistance) {
          newX = line.position - width / 2;
          snappedX = true;
        }
      }

      if (line.type === 'horizontal' && !snappedY) {
        // 上边缘吸附
        if (Math.abs(y - line.position) < snapDistance) {
          newY = line.position;
          snappedY = true;
        }
        // 下边缘吸附
        else if (Math.abs((y + height) - line.position) < snapDistance) {
          newY = line.position - height;
          snappedY = true;
        }
        // 中心Y吸附
        else if (Math.abs((y + height / 2) - line.position) < snapDistance) {
          newY = line.position - height / 2;
          snappedY = true;
        }
      }
    });

    return { x: newX, y: newY, snappedX, snappedY };
  };

  // 清理
  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    stopDrag();
  });

  return {
    feedback,
    startDrag,
    stopDrag,
    updatePreviewPosition,
    updateDroppableZones,
    updateSnapPoints,
    highlightDroppableZone,
    clearHighlights,
    getSnappedPosition,
  };
}
