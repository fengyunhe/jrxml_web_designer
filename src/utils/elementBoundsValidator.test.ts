import { describe, it, expect } from 'vitest'
import { getOutOfBoundsElements, validateElementBounds } from '@/utils/elementBoundsValidator'
import type { Band, ReportProperties, StaticTextElement } from '@/types'

describe('elementBoundsValidator', () => {
  const mockReportProperties: ReportProperties = {
    name: 'test',
    pageWidth: 595,
    pageHeight: 842,
    leftMargin: 20,
    rightMargin: 20,
    topMargin: 20,
    bottomMargin: 20,
    defaultFont: {
      name: 'Arial',
      size: 12,
      isBold: false,
      isItalic: false,
      isUnderline: false
    },
    orientation: 'portrait'
  }

  const mockStaticTextElement: StaticTextElement = {
    type: 'staticText',
    x: 20,
    y: 10,
    width: 100,
    height: 20,
    text: 'Test Text',
    fontFamily: 'Arial',
    fontSize: 12,
    isBold: false,
    isItalic: false,
    isUnderline: false
  }

  const mockBands: Band[] = [
    {
      type: 'title',
      height: 80,
      elements: [mockStaticTextElement]
    },
    {
      type: 'detail',
      height: 100,
      elements: [
        {
          ...mockStaticTextElement,
          x: 500,
          text: 'Out of bounds text'
        }
      ]
    }
  ]

  describe('validateElementBounds', () => {
    it('should return true for element within bounds', () => {
      const band = mockBands[0]
      const element = band?.elements[0]
      
      if (band && element) {
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).isOutOfBounds).toBe(false)
      }
    })

    it('should return false for element outside left margin', () => {
      // 元素坐标是相对于band的，所以x=0对应的是band的左边界（即页面的leftMargin位置）
      // 因此x=-10才是超出band左边界的情况
      const element = { ...mockStaticTextElement, x: -10 }
      const band = mockBands[0]
      
      if (band) {
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).exceedsLeft).toBe(true)
      }
    })

    it('should return false for element outside right margin', () => {
      // 元素坐标是相对于band的，可用宽度为pageWidth - leftMargin - rightMargin = 595 - 20 - 20 = 555
      // 因此x=500, width=100时，元素右边界为600，超出了可用宽度555
      const element = { ...mockStaticTextElement, x: 500, width: 100 }
      const band = mockBands[0]
      
      if (band) {
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).exceedsRight).toBe(true)
      }
    })

    it('should return false for element outside top of band', () => {
      const element = { ...mockStaticTextElement, y: -10 }
      const band = mockBands[0]
      
      if (band) {
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).exceedsBandTop).toBe(true)
      }
    })

    it('should return false for element outside bottom of band', () => {
      const element = { ...mockStaticTextElement, y: 70, height: 20 }
      const band = mockBands[0]
      
      if (band) {
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).exceedsBandBottom).toBe(true)
      }
    })
  })

  describe('getOutOfBoundsElements', () => {
    it('should return empty array for all elements within bounds', () => {
      const validBands: Band[] = [
        {
          type: 'title',
          height: 80,
          elements: [mockStaticTextElement]
        }
      ]
      
      const result = getOutOfBoundsElements(validBands, mockReportProperties)
      expect(result).toHaveLength(0)
    })

    it('should return out of bounds elements', () => {
      const result = getOutOfBoundsElements(mockBands, mockReportProperties)
      expect(result).toHaveLength(1)
      if (result[0]) {
        expect(result[0].bandIndex).toBe(1)
        expect(result[0].elementIndex).toBe(0)
        expect(result[0].exceedsRight).toBe(true)
      }
    })

    it('should handle empty bands array', () => {
      const result = getOutOfBoundsElements([], mockReportProperties)
      expect(result).toHaveLength(0)
    })

    it('should handle bands with no elements', () => {
      const emptyBands: Band[] = [
        {
          type: 'title',
          height: 80,
          elements: []
        }
      ]
      
      const result = getOutOfBoundsElements(emptyBands, mockReportProperties)
      expect(result).toHaveLength(0)
    })
  })
})