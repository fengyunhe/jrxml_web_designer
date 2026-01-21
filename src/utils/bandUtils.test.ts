import { describe, it, expect } from 'vitest';
import {
  createNewBand,
  getBandDefaultHeight,
  isPointInBand,
  getBandYPosition,
  getBandAtY,
  getTotalBandsHeight,
  adjustBandHeight,
  addBandAtPosition,
  removeBand,
  bandExists,
  getBandSplitOptions
} from './bandUtils';
import { Band, BandType } from '../types';

describe('bandUtils', () => {
  const mockBands: Band[] = [
    { type: 'pageHeader', height: 100, elements: [], splitType: 'Stretch' },
    { type: 'detail', height: 50, elements: [], splitType: 'Stretch' },
    { type: 'pageFooter', height: 70, elements: [], splitType: 'Stretch' }
  ];

  describe('createNewBand', () => {
    it('should create a new band with correct default values', () => {
      const band = createNewBand('title');
      expect(band).toHaveProperty('type', 'title');
      expect(band).toHaveProperty('splitType', 'Stretch');
      expect(band).toHaveProperty('elements', []);
      expect(band.height).toBeGreaterThan(0);
    });
  });

  describe('getBandDefaultHeight', () => {
    it('should return default height for existing band type', () => {
      const height = getBandDefaultHeight('pageHeader');
      expect(height).toBeGreaterThan(0);
    });

    it('should return 50 for unknown band type', () => {
      const height = getBandDefaultHeight('unknown' as BandType);
      expect(height).toBe(50);
    });
  });

  describe('isPointInBand', () => {
    it('should return true if point is within band', () => {
      const band = { type: 'detail', height: 50, elements: [] };
      expect(isPointInBand(25, band, 0)).toBe(true);
    });

    it('should return false if point is outside band', () => {
      const band = { type: 'detail', height: 50, elements: [] };
      expect(isPointInBand(60, band, 0)).toBe(false);
    });

    it('should return true if point is exactly at band boundary', () => {
      const band = { type: 'detail', height: 50, elements: [] };
      expect(isPointInBand(50, band, 0)).toBe(true);
    });
  });

  describe('getBandYPosition', () => {
    it('should return correct Y position for existing band', () => {
      const yPosition = getBandYPosition(mockBands, 'detail');
      expect(yPosition).toBe(100); // pageHeader height (no spacing according to BAND_CONSTANTS.SPACING = 0)
    });

    it('should return total height if band not found', () => {
      const yPosition = getBandYPosition(mockBands, 'unknown');
      const expectedHeight = 100 + 50 + 70; // Sum of all band heights (no spacing)
      expect(yPosition).toBe(expectedHeight);
    });
  });

  describe('getBandAtY', () => {
    it('should return correct band for given Y position', () => {
      const result = getBandAtY(mockBands, 130); // Within detail band
      expect(result.band).toEqual(mockBands[1]);
      expect(result.bandY).toBe(100); // pageHeader height (no spacing)
    });

    it('should return null if no band at given Y position', () => {
      const result = getBandAtY(mockBands, 500);
      expect(result.band).toBeNull();
    });

    it('should return correct band at band boundary', () => {
      const result = getBandAtY(mockBands, 100 + 20 + 50); // At the end of detail band
      expect(result.band).toEqual(mockBands[2]);
    });
  });

  describe('getTotalBandsHeight', () => {
    it('should return total height including spacing', () => {
      const totalHeight = getTotalBandsHeight(mockBands);
      const expectedHeight = 100 + 50 + 70; // Total band heights (no spacing)
      expect(totalHeight).toBe(expectedHeight);
    });

    it('should return 0 for empty bands array', () => {
      const totalHeight = getTotalBandsHeight([]);
      expect(totalHeight).toBe(0);
    });

    it('should return band height without spacing for single band', () => {
      const singleBand = [{ type: 'detail', height: 50, elements: [] }];
      const totalHeight = getTotalBandsHeight(singleBand);
      expect(totalHeight).toBe(50);
    });
  });

  describe('adjustBandHeight', () => {
    it('should adjust height of specified band', () => {
      const updatedBands = adjustBandHeight(mockBands, 'detail', 100);
      expect(updatedBands[1].height).toBe(100);
      expect(updatedBands[0].height).toBe(100); // Should remain unchanged
      expect(updatedBands[2].height).toBe(70); // Should remain unchanged
    });

    it('should return same bands if band type not found', () => {
      const updatedBands = adjustBandHeight(mockBands, 'unknown', 100);
      expect(updatedBands).toEqual(mockBands);
    });
  });

  describe('addBandAtPosition', () => {
    it('should add band at specified position', () => {
      const updatedBands = addBandAtPosition(mockBands, 'summary', 1);
      expect(updatedBands[1].type).toBe('summary');
      expect(updatedBands.length).toBe(4);
    });

    it('should add band at end if position not specified', () => {
      const updatedBands = addBandAtPosition(mockBands, 'summary');
      expect(updatedBands[updatedBands.length - 1].type).toBe('summary');
      expect(updatedBands.length).toBe(4);
    });
  });

  describe('removeBand', () => {
    it('should remove specified band', () => {
      const updatedBands = removeBand(mockBands, 'detail');
      expect(updatedBands.length).toBe(2);
      expect(updatedBands.find(band => band.type === 'detail')).toBeUndefined();
    });

    it('should return same bands if band type not found', () => {
      const updatedBands = removeBand(mockBands, 'unknown');
      expect(updatedBands).toEqual(mockBands);
    });
  });

  describe('bandExists', () => {
    it('should return true if band exists', () => {
      expect(bandExists(mockBands, 'detail')).toBe(true);
    });

    it('should return false if band does not exist', () => {
      expect(bandExists(mockBands, 'unknown')).toBe(false);
    });
  });

  describe('getBandSplitOptions', () => {
    it('should return correct split options', () => {
      const options = getBandSplitOptions();
      expect(options).toHaveLength(3);
      expect(options).toEqual([
        { value: 'Stretch', label: '拉伸' },
        { value: 'Prevent', label: '防止' },
        { value: 'Immediate', label: '立即' }
      ]);
    });
  });
});
