import { describe, it, expect, vi } from 'vitest';
import {
  adjustBottomPanelHeight,
  adjustLeftPanelWidth,
  adjustPropertyPanelWidth,
  isInResizeArea,
  getResizeCursor,
  getDefaultPanelState,
  togglePanelCollapsed,
  savePanelState,
  loadPanelState,
  getPanelVisibleWidth,
  getPanelVisibleHeight,
  getContentAreaSize
} from './panelUtils';

describe('panelUtils', () => {
  describe('adjustBottomPanelHeight', () => {
    it('should increase height when deltaY is positive', () => {
      const result = adjustBottomPanelHeight(400, 50);
      expect(result).toBe(450);
    });

    it('should decrease height when deltaY is negative and minHeight is specified', () => {
      const result = adjustBottomPanelHeight(400, -50, 300);
      expect(result).toBe(350);
    });

    it('should not go below default minimum height', () => {
      const result = adjustBottomPanelHeight(400, -50);
      expect(result).toBe(350); // 400-50=350, above new default minimum of 320
    });

    it('should not go below minimum height', () => {
      const result = adjustBottomPanelHeight(100, -100, 150);
      expect(result).toBe(150);
    });

    it('should not go above maximum height', () => {
      const result = adjustBottomPanelHeight(700, 200, undefined, 800);
      expect(result).toBe(800);
    });
  });

  describe('adjustLeftPanelWidth', () => {
    it('should increase width when deltaX is positive', () => {
      const result = adjustLeftPanelWidth(200, 50);
      expect(result).toBe(250);
    });

    it('should decrease width when deltaX is negative', () => {
      const result = adjustLeftPanelWidth(200, -50);
      expect(result).toBe(150);
    });

    it('should respect custom min and max values', () => {
      const result1 = adjustLeftPanelWidth(100, -50, 150, 300);
      expect(result1).toBe(150);

      const result2 = adjustLeftPanelWidth(250, 100, 150, 300);
      expect(result2).toBe(300);
    });
  });

  describe('adjustPropertyPanelWidth', () => {
    it('should increase width when deltaX is negative (since it\'s on the right)', () => {
      const result = adjustPropertyPanelWidth(200, -50);
      expect(result).toBe(250);
    });

    it('should decrease width when deltaX is positive (since it\'s on the right)', () => {
      const result = adjustPropertyPanelWidth(400, 50);
      expect(result).toBe(350);
    });

    it('should respect custom min and max values', () => {
      const result1 = adjustPropertyPanelWidth(100, -50, 150, 300);
      expect(result1).toBe(150);

      const result2 = adjustPropertyPanelWidth(250, -100, 150, 300);
      expect(result2).toBe(300);
    });
  });

  describe('isInResizeArea', () => {
    const containerRect = { left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => {} };

    it('should return true if point is in bottom resize area', () => {
      expect(isInResizeArea(400, 595, 'bottom', containerRect)).toBe(true);
    });

    it('should return false if point is not in bottom resize area', () => {
      expect(isInResizeArea(400, 550, 'bottom', containerRect)).toBe(false);
    });

    it('should return true if point is in left resize area', () => {
      expect(isInResizeArea(5, 300, 'left', containerRect)).toBe(true);
    });

    it('should return false if point is not in left resize area', () => {
      expect(isInResizeArea(20, 300, 'left', containerRect)).toBe(false);
    });

    it('should return true if point is in right resize area', () => {
      expect(isInResizeArea(795, 300, 'right', containerRect)).toBe(true);
    });

    it('should return false if point is not in right resize area', () => {
      expect(isInResizeArea(750, 300, 'right', containerRect)).toBe(false);
    });

    it('should use custom threshold', () => {
      expect(isInResizeArea(790, 300, 'right', containerRect, 15)).toBe(true);
    });
  });

  describe('getResizeCursor', () => {
    it('should return ns-resize for bottom area', () => {
      expect(getResizeCursor('bottom')).toBe('ns-resize');
    });

    it('should return ew-resize for left area', () => {
      expect(getResizeCursor('left')).toBe('ew-resize');
    });

    it('should return ew-resize for right area', () => {
      expect(getResizeCursor('right')).toBe('ew-resize');
    });

    it('should return default for unknown area', () => {
      // @ts-expect-error testing unknown area type
      expect(getResizeCursor('unknown')).toBe('default');
    });
  });

  describe('getDefaultPanelState', () => {
    it('should return default panel state with correct values', () => {
      const state = getDefaultPanelState();
      expect(state).toEqual({
        leftPanelWidth: 240,
        bottomPanelHeight: 320,
        propertyPanelWidth: 320,
        leftPanelCollapsed: false,
        bottomPanelCollapsed: false,
        propertyPanelCollapsed: false
      });
    });
  });

  describe('togglePanelCollapsed', () => {
    const initialState = {
      leftPanelWidth: 250,
      bottomPanelHeight: 200,
      propertyPanelWidth: 250,
      leftPanelCollapsed: false,
      bottomPanelCollapsed: false,
      propertyPanelCollapsed: false
    };

    it('should toggle left panel collapsed state', () => {
      const result = togglePanelCollapsed(initialState, 'left');
      expect(result.leftPanelCollapsed).toBe(true);
      expect(result.bottomPanelCollapsed).toBe(false);
      expect(result.propertyPanelCollapsed).toBe(false);
    });

    it('should toggle bottom panel collapsed state', () => {
      const result = togglePanelCollapsed(initialState, 'bottom');
      expect(result.bottomPanelCollapsed).toBe(true);
      expect(result.leftPanelCollapsed).toBe(false);
      expect(result.propertyPanelCollapsed).toBe(false);
    });

    it('should toggle property panel collapsed state', () => {
      const result = togglePanelCollapsed(initialState, 'property');
      expect(result.propertyPanelCollapsed).toBe(true);
      expect(result.leftPanelCollapsed).toBe(false);
      expect(result.bottomPanelCollapsed).toBe(false);
    });

    it('should toggle from collapsed to expanded', () => {
      const collapsedState = {
        ...initialState,
        leftPanelCollapsed: true
      };
      const result = togglePanelCollapsed(collapsedState, 'left');
      expect(result.leftPanelCollapsed).toBe(false);
    });
  });

  describe('savePanelState and loadPanelState', () => {
    it('should save and load panel state correctly', () => {
      const mockState = {
        leftPanelWidth: 300,
        bottomPanelHeight: 250,
        propertyPanelWidth: 300,
        leftPanelCollapsed: true,
        bottomPanelCollapsed: false,
        propertyPanelCollapsed: true
      };

      // Mock localStorage
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => store[key] = value,
          clear: () => store = {}
        };
      })();

      // Replace global localStorage with mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      savePanelState(mockState);
      const loadedState = loadPanelState();
      expect(loadedState).toEqual(mockState);
    });

    it('should return null if no state saved', () => {
      // Mock localStorage with empty store
      const localStorageMock = (() => {
        return {
          getItem: () => null,
          setItem: () => {},
          clear: () => {}
        };
      })();

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      const loadedState = loadPanelState();
      expect(loadedState).toBeNull();
    });
  });

  describe('getPanelVisibleWidth', () => {
    it('should return full width when panel is not collapsed', () => {
      const result = getPanelVisibleWidth(250, false);
      expect(result).toBe(250);
    });

    it('should return 0 when panel is collapsed', () => {
      const result = getPanelVisibleWidth(250, true);
      expect(result).toBe(0);
    });
  });

  describe('getPanelVisibleHeight', () => {
    it('should return full height when panel is not collapsed', () => {
      const result = getPanelVisibleHeight(200, false);
      expect(result).toBe(200);
    });

    it('should return 0 when panel is collapsed', () => {
      const result = getPanelVisibleHeight(200, true);
      expect(result).toBe(0);
    });
  });

  describe('getContentAreaSize', () => {
    const containerWidth = 1200;
    const containerHeight = 800;
    const panelStates = {
      leftPanel: { width: 250, collapsed: false },
      bottomPanel: { height: 200, collapsed: false },
      propertyPanel: { width: 250, collapsed: false }
    };

    it('should calculate content area size correctly when all panels are visible', () => {
      const result = getContentAreaSize(
        containerWidth,
        containerHeight,
        panelStates.leftPanel,
        panelStates.bottomPanel,
        panelStates.propertyPanel
      );
      expect(result.width).toBe(1200 - 250 - 250); // containerWidth - leftPanel - propertyPanel
      expect(result.height).toBe(800 - 200); // containerHeight - bottomPanel
    });

    it('should calculate content area size correctly when some panels are collapsed', () => {
      const result = getContentAreaSize(
        containerWidth,
        containerHeight,
        { ...panelStates.leftPanel, collapsed: true },
        panelStates.bottomPanel,
        panelStates.propertyPanel
      );
      expect(result.width).toBe(1200 - 0 - 250); // leftPanel collapsed, so 0 width
      expect(result.height).toBe(800 - 200);
    });

    it('should calculate content area size correctly when all panels are collapsed', () => {
      const result = getContentAreaSize(
        containerWidth,
        containerHeight,
        { ...panelStates.leftPanel, collapsed: true },
        { ...panelStates.bottomPanel, collapsed: true },
        { ...panelStates.propertyPanel, collapsed: true }
      );
      expect(result.width).toBe(1200); // all panels collapsed
      expect(result.height).toBe(800); // all panels collapsed
    });
  });
});
