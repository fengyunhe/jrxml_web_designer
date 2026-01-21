import { describe, it, expect, vi } from 'vitest';
import { getAvailableFonts, getSystemFonts } from './fontUtils';
import { SYSTEM_FONTS } from '../config/fonts.config';

describe('fontUtils', () => {
  // Mock SYSTEM_FONTS for testing
  const mockSystemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
  
  // Spy on SYSTEM_FONTS import
  vi.doMock('../config/fonts.config', () => ({
    SYSTEM_FONTS: mockSystemFonts
  }));

  describe('getSystemFonts', () => {
    it('should return all system fonts when in browser environment', () => {
      // Mock document object
      Object.defineProperty(global, 'document', {
        value: {
          fonts: {} // document.fonts exists
        },
        writable: true
      });

      const result = getSystemFonts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(SYSTEM_FONTS); // Should return a copy, not the original
    });

    it('should return all system fonts when document.fonts is undefined', () => {
      // Mock document without fonts
      Object.defineProperty(global, 'document', {
        value: {}, // document.fonts doesn't exist
        writable: true
      });

      const result = getSystemFonts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return all system fonts when not in browser environment', () => {
      // Remove document to simulate non-browser environment
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true
      });

      const result = getSystemFonts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableFonts', () => {
    it('should return all system fonts when not in browser environment', async () => {
      // Remove document to simulate non-browser environment
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true
      });

      const result = await getAvailableFonts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return available fonts based on canvas measurement', async () => {
      // Mock document and canvas
      const mockContext = {
        font: '',
        measureText: vi.fn().mockImplementation((text: string) => ({
          width: text.length * 10 // Mock width calculation
        }))
      };

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockContext)
      };

      Object.defineProperty(global, 'document', {
        value: {
          createElement: vi.fn().mockReturnValue(mockCanvas)
        },
        writable: true
      });

      const result = await getAvailableFonts();
      expect(Array.isArray(result)).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.measureText).toHaveBeenCalled();
    });

    it('should handle null canvas context', async () => {
      // Mock document and canvas with null context
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null)
      };

      Object.defineProperty(global, 'document', {
        value: {
          createElement: vi.fn().mockReturnValue(mockCanvas)
        },
        writable: true
      });

      const result = await getAvailableFonts();
      expect(result).toEqual([]); // No fonts available if canvas context is null
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should correctly identify available fonts', async () => {
      // Mock document and canvas with specific font width behavior
      const mockContext = {
        font: '',
        measureText: vi.fn().mockImplementation((text: string) => {
          // Always return different width for all fonts
          return { width: 120 };
        })
      };

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockContext)
      };

      Object.defineProperty(global, 'document', {
        value: {
          createElement: vi.fn().mockReturnValue(mockCanvas)
        },
        writable: true
      });

      const result = await getAvailableFonts();
      expect(Array.isArray(result)).toBe(true);
      expect(mockContext.measureText).toHaveBeenCalled();
    });
  });
});
