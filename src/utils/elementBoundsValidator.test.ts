import { describe, it, expect } from 'vitest'
import { getOutOfBoundsElements, validateElementBounds, isReportDesignValid, getReportDesignValidationErrors } from '@/utils/elementBoundsValidator'
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

    it('should return true for element in first band exceeding page top', () => {
      // 第一个band的元素超出页面顶部
      const element = { ...mockStaticTextElement, y: -30 } // 元素在band内的y坐标为负值，会超出页面顶部
      const band = mockBands[0]
      
      if (band) {
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).exceedsTop).toBe(true)
        expect(validateElementBounds(element, band, 0, mockBands, mockReportProperties).isOutOfBounds).toBe(true)
      }
    })

    it('should return true for element in last band exceeding page bottom', () => {
      // 最后一个band的元素超出页面底部
      // 第一个band高度80，第二个band高度100，总高度180
      // 页面高度842，上下边距各20，可用高度802
      // 第二个band的元素y=750，高度=50，实际位置是80+750=830，底部是830+50=880，超出页面底部842-20=822
      const element = { ...mockStaticTextElement, y: 750, height: 50 }
      const band = mockBands[1] // 使用第二个band（最后一个）
      
      if (band) {
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).exceedsBottom).toBe(true)
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).isOutOfBounds).toBe(true)
      }
    })
    
    it('should allow element in last band to touch page bottom', () => {
      // 最后一个band的元素接触页面底部但不超出
      // 第一个band高度80，第二个band高度100，总高度180
      // 页面高度842，上下边距各20，可用高度802
      // 第二个band的元素y=672，高度=50，实际位置是80+672=752，底部是752+50=802，正好接触页面底部842-20=822
      const element = { ...mockStaticTextElement, y: 672, height: 50 }
      const band = mockBands[1] // 使用第二个band（最后一个）
      
      if (band) {
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).exceedsBottom).toBe(false)
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).exceedsBandBottom).toBe(false)
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).isOutOfBounds).toBe(false)
      }
    })
    
    it('should allow element in last band to exceed band height but not page bottom', () => {
      // 最后一个band的元素超出band高度但不超出页面底部
      // 第一个band高度80，第二个band高度100，总高度180
      // 页面高度842，上下边距各20，可用高度802
      // 第二个band的元素y=100，高度=602，实际位置是80+100=180，底部是180+602=782，不超出页面底部842-20=822
      // 但是元素高度602 > band高度100，所以超出band底部
      const element = { ...mockStaticTextElement, y: 100, height: 602 }
      const band = mockBands[1] // 使用第二个band（最后一个）
      
      if (band) {
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).exceedsBottom).toBe(false)
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).exceedsBandBottom).toBe(false) // 修复后应该为false
        expect(validateElementBounds(element, band, 1, mockBands, mockReportProperties).isOutOfBounds).toBe(false)
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

  describe('isReportDesignValid', () => {
    it('should return true for valid report design', () => {
      const validBands: Band[] = [
        {
          type: 'title',
          height: 80,
          elements: [mockStaticTextElement]
        }
      ]
      
      const result = isReportDesignValid(validBands, mockReportProperties)
      expect(result).toBe(true)
    })

    it('should return false for invalid report design', () => {
      const result = isReportDesignValid(mockBands, mockReportProperties)
      expect(result).toBe(false)
    })

    it('should return true for empty bands array', () => {
      const result = isReportDesignValid([], mockReportProperties)
      expect(result).toBe(true)
    })
  })

  describe('getReportDesignValidationErrors', () => {
    it('should return empty array for valid report design', () => {
      const validBands: Band[] = [
        {
          type: 'title',
          height: 80,
          elements: [mockStaticTextElement]
        }
      ]
      
      const result = getReportDesignValidationErrors(validBands, mockReportProperties)
      expect(result).toHaveLength(0)
    })

    it('should return errors for invalid report design', () => {
      const result = getReportDesignValidationErrors(mockBands, mockReportProperties)
      expect(result).toHaveLength(1)
      expect(result[0]).toContain('超出detail区域右边界')
    })

    it('should return error when total bands height exceeds page height', () => {
      // 创建一个高度超出页面的bands数组，元素都在有效范围内
      const tallBands: Band[] = [
        {
          type: 'title',
          height: 800,
          elements: [mockStaticTextElement]
        },
        {
          type: 'detail',
          height: 200,
          elements: [mockStaticTextElement]
        }
      ]
      
      const result = getReportDesignValidationErrors(tallBands, mockReportProperties)
      // 可能会有多个错误，只需要检查是否包含总高度超出的错误
      const hasTotalHeightError = result.some(error => error.includes('报表设计无效'))
      expect(hasTotalHeightError).toBe(true)
    })

    it('should return multiple errors for multiple invalid elements', () => {
      const invalidBands: Band[] = [
        {
          type: 'title',
          height: 80,
          elements: [
            {
              ...mockStaticTextElement,
              x: -10 // 超出左边界
            },
            {
              ...mockStaticTextElement,
              x: 500, // 超出右边界
              width: 100
            }
          ]
        }
      ]
      
      const result = getReportDesignValidationErrors(invalidBands, mockReportProperties)
      expect(result).toHaveLength(2)
    })
  })
})