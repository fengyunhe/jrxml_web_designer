import { ref } from 'vue';
import type { Ref } from 'vue';

export function useZoom(options: {
  paperWidth: Ref<number>;
  zoomConstants: {
    DEFAULT_ZOOM: number;
    MIN_ZOOM: number;
    MAX_ZOOM: number;
    OPTIMAL_ZOOM_MARGIN: number;
    ZOOM_LEVELS: number[];
  };
}) {
  const zoomLevel = ref(options.zoomConstants.DEFAULT_ZOOM);

  function resetZoom() {
    zoomLevel.value = options.zoomConstants.DEFAULT_ZOOM;
  }

  function calculateOptimalZoom(): number {
    const designerContainer = document.querySelector('.designer-canvas') || document.querySelector('.pdf-designer');
    if (!designerContainer) {
      return options.zoomConstants.DEFAULT_ZOOM;
    }

    const availableWidth = (designerContainer as HTMLElement).clientWidth - 40;
    const widthRatio = availableWidth / options.paperWidth.value;
    const optimalZoom = widthRatio * options.zoomConstants.OPTIMAL_ZOOM_MARGIN;

    const zoomLevels = options.zoomConstants.ZOOM_LEVELS;
    let closestZoom = zoomLevels[0] ?? options.zoomConstants.DEFAULT_ZOOM;
    let minDiff = Math.abs(closestZoom - optimalZoom);

    for (let i = 1; i < zoomLevels.length; i++) {
      const level = zoomLevels[i];
      if (level === undefined) continue;
      const diff = Math.abs(level - optimalZoom);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = level;
      }
    }

    return Math.max(options.zoomConstants.MIN_ZOOM, Math.min(options.zoomConstants.MAX_ZOOM, closestZoom));
  }

  function handleZoomChange(delta: number) {
    const bounded = Math.max(
      options.zoomConstants.MIN_ZOOM,
      Math.min(options.zoomConstants.MAX_ZOOM, zoomLevel.value + delta)
    );

    const zoomLevels = options.zoomConstants.ZOOM_LEVELS;
    let closestZoom = zoomLevels[0] ?? options.zoomConstants.DEFAULT_ZOOM;
    let minDiff = Math.abs(closestZoom - bounded);

    for (let i = 1; i < zoomLevels.length; i++) {
      const level = zoomLevels[i];
      if (level === undefined) continue;
      const diff = Math.abs(level - bounded);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = level;
      }
    }

    zoomLevel.value = closestZoom;
  }

  return {
    zoomLevel,
    resetZoom,
    calculateOptimalZoom,
    handleZoomChange
  };
}

