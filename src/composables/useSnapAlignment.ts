import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Band, DesignElement, ReportProperties } from '@/types';

export function useSnapAlignment(options: {
  bands: Ref<Band[]>;
  reportProperties: Ref<ReportProperties>;
  highlightedBandIndex: Ref<number | null>;
  bandSpacing: number;
  threshold?: number;
}) {
  const enableSnapToGrid = ref(false);
  const enableSnapToAlignment = ref(true);

  const alignmentLines = ref({
    horizontal: [] as number[],
    vertical: [] as number[]
  });

  const threshold = options.threshold ?? 3;

  const detectAlignmentLines = (currentElement: DesignElement, currentBandIndex: number, updateState: boolean = true) => {
    const verticalAlignmentLines: number[] = [];
    const horizontalAlignmentLines: number[] = [];

    const snapInfo = {
      horizontal: null as { position: number; offset: number } | null,
      vertical: null as { position: number; offset: number } | null
    };

    const { leftMargin = 0, topMargin = 0 } = options.reportProperties.value || ({} as ReportProperties);

    let bandOffsetY = 0;
    options.bands.value.forEach((band, bandIndex) => {
      band.elements.forEach((element) => {
        if (bandIndex === currentBandIndex && element === currentElement) return;

        const currentLeft = currentElement.x;
        const currentRight = currentElement.x + currentElement.width;
        const currentTop = currentElement.y;
        const currentBottom = currentElement.y + currentElement.height;
        const currentCenterX = currentElement.x + currentElement.width / 2;
        const currentCenterY = currentElement.y + currentElement.height / 2;

        const otherLeft = element.x;
        const otherRight = element.x + element.width;
        const otherTop = element.y;
        const otherBottom = element.y + element.height;
        const otherCenterX = element.x + element.width / 2;
        const otherCenterY = element.y + element.height / 2;

        if (Math.abs(currentLeft - otherLeft) < threshold) {
          const linePosition = otherLeft + leftMargin;
          verticalAlignmentLines.push(linePosition);
          if (!snapInfo.horizontal || Math.abs(currentLeft - otherLeft) < Math.abs(snapInfo.horizontal.offset)) {
            snapInfo.horizontal = { position: linePosition, offset: otherLeft - currentLeft };
          }
        }

        if (Math.abs(currentRight - otherRight) < threshold) {
          const linePosition = otherRight + leftMargin;
          verticalAlignmentLines.push(linePosition);
          if (!snapInfo.horizontal || Math.abs(currentRight - otherRight) < Math.abs(snapInfo.horizontal.offset)) {
            snapInfo.horizontal = { position: linePosition, offset: otherRight - currentRight };
          }
        }

        if (Math.abs(currentCenterX - otherCenterX) < threshold) {
          const linePosition = otherCenterX + leftMargin;
          verticalAlignmentLines.push(linePosition);
          if (!snapInfo.horizontal || Math.abs(currentCenterX - otherCenterX) < Math.abs(snapInfo.horizontal.offset)) {
            snapInfo.horizontal = { position: linePosition, offset: otherCenterX - currentCenterX };
          }
        }

        if (Math.abs(currentLeft - otherRight) < threshold) {
          const linePosition = otherRight + leftMargin;
          verticalAlignmentLines.push(linePosition);
          if (!snapInfo.horizontal || Math.abs(currentLeft - otherRight) < Math.abs(snapInfo.horizontal.offset)) {
            snapInfo.horizontal = { position: linePosition, offset: otherRight - currentLeft };
          }
        }

        if (Math.abs(currentRight - otherLeft) < threshold) {
          const linePosition = otherLeft + leftMargin;
          verticalAlignmentLines.push(linePosition);
          if (!snapInfo.horizontal || Math.abs(currentRight - otherLeft) < Math.abs(snapInfo.horizontal.offset)) {
            snapInfo.horizontal = { position: linePosition, offset: otherLeft - currentRight };
          }
        }

        if (bandIndex === currentBandIndex) {
          if (Math.abs(currentTop - otherTop) < threshold) {
            const linePosition = otherTop + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
            if (!snapInfo.vertical || Math.abs(currentTop - otherTop) < Math.abs(snapInfo.vertical.offset)) {
              snapInfo.vertical = { position: linePosition, offset: otherTop - currentTop };
            }
          }

          if (Math.abs(currentBottom - otherBottom) < threshold) {
            const linePosition = otherBottom + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
            if (!snapInfo.vertical || Math.abs(currentBottom - otherBottom) < Math.abs(snapInfo.vertical.offset)) {
              snapInfo.vertical = { position: linePosition, offset: otherBottom - currentBottom };
            }
          }

          if (Math.abs(currentCenterY - otherCenterY) < threshold) {
            const linePosition = otherCenterY + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
            if (!snapInfo.vertical || Math.abs(currentCenterY - otherCenterY) < Math.abs(snapInfo.vertical.offset)) {
              snapInfo.vertical = { position: linePosition, offset: otherCenterY - currentCenterY };
            }
          }

          if (Math.abs(currentTop - otherBottom) < threshold) {
            const linePosition = otherBottom + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
            if (!snapInfo.vertical || Math.abs(currentTop - otherBottom) < Math.abs(snapInfo.vertical.offset)) {
              snapInfo.vertical = { position: linePosition, offset: otherBottom - currentTop };
            }
          }

          if (Math.abs(currentBottom - otherTop) < threshold) {
            const linePosition = otherTop + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
            if (!snapInfo.vertical || Math.abs(currentBottom - otherTop) < Math.abs(snapInfo.vertical.offset)) {
              snapInfo.vertical = { position: linePosition, offset: otherTop - currentBottom };
            }
          }
        } else if (options.highlightedBandIndex.value === bandIndex) {
          let sourceBandOffsetY = 0;
          let targetBandOffsetY = 0;

          for (let i = 0; i < currentBandIndex; i++) {
            sourceBandOffsetY += options.bands.value[i]?.height || 0;
            if (i < currentBandIndex - 1) {
              sourceBandOffsetY += options.bandSpacing;
            }
          }

          for (let i = 0; i < bandIndex; i++) {
            targetBandOffsetY += options.bands.value[i]?.height || 0;
            if (i < bandIndex - 1) {
              targetBandOffsetY += options.bandSpacing;
            }
          }

          const relativeY = currentTop + (sourceBandOffsetY - targetBandOffsetY);
          const relativeBottom = currentBottom + (sourceBandOffsetY - targetBandOffsetY);
          const relativeCenterY = currentCenterY + (sourceBandOffsetY - targetBandOffsetY);

          if (Math.abs(relativeY - otherTop) < threshold) {
            horizontalAlignmentLines.push(otherTop + topMargin + targetBandOffsetY);
          }
          if (Math.abs(relativeBottom - otherBottom) < threshold) {
            horizontalAlignmentLines.push(otherBottom + topMargin + targetBandOffsetY);
          }
          if (Math.abs(relativeCenterY - otherCenterY) < threshold) {
            horizontalAlignmentLines.push(otherCenterY + topMargin + targetBandOffsetY);
          }
          if (Math.abs(relativeY - otherBottom) < threshold) {
            horizontalAlignmentLines.push(otherBottom + topMargin + targetBandOffsetY);
          }
          if (Math.abs(relativeBottom - otherTop) < threshold) {
            horizontalAlignmentLines.push(otherTop + topMargin + targetBandOffsetY);
          }
        }
      });

      bandOffsetY += band.height + options.bandSpacing;
    });

    if (updateState) {
      alignmentLines.value = {
        horizontal: [...new Set(horizontalAlignmentLines)],
        vertical: [...new Set(verticalAlignmentLines)]
      };
    }

    return snapInfo;
  };

  const clearAlignmentLines = () => {
    alignmentLines.value = { horizontal: [], vertical: [] };
  };

  return {
    enableSnapToGrid,
    enableSnapToAlignment,
    alignmentLines,
    detectAlignmentLines,
    clearAlignmentLines
  };
}

