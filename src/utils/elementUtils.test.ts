import { describe, it, expect, vi } from 'vitest'
import {
  getElementKey,
  getElementTypeName,
  getElementIcon,
  getElementDisplayInfoWithoutBand,
  isElementSelected,
  selectElementFromList,
  selectElementsByParameter,
  selectElementsByField,
  createNewElement,
  duplicateElement,
  isPointInElement,
  getElementBounds,
  getElementsBounds
} from '@/utils/elementUtils'
import type { DesignElement } from '@/types'
import { ELEMENT_TYPE_CONSTANTS } from '@/constants/constants'

describe('elementUtils', () => {
  describe('getElementKey', () => {
    it('should return a unique key for an element', () => {
      const element = {
        element: { type: 'staticText' as any, x: 10, y: 20, width: 100, height: 30 },
        bandIndex: 1,
        elementIndex: 2
      }
      
      expect(getElementKey(element)).toBe('staticText-1-2')
    })
  })

  describe('getElementTypeName', () => {
    it('should return the correct type name for static text', () => {
      expect(getElementTypeName(ELEMENT_TYPE_CONSTANTS.STATIC_TEXT)).toBe('静态文本')
    })

    it('should return the correct type name for text field', () => {
      expect(getElementTypeName(ELEMENT_TYPE_CONSTANTS.TEXT_FIELD)).toBe('动态文本')
    })

    it('should return the correct type name for image', () => {
      expect(getElementTypeName(ELEMENT_TYPE_CONSTANTS.IMAGE)).toBe('图片')
    })

    it('should return the correct type name for line', () => {
      expect(getElementTypeName(ELEMENT_TYPE_CONSTANTS.LINE)).toBe('线条')
    })

    it('should return the correct type name for rectangle', () => {
      expect(getElementTypeName(ELEMENT_TYPE_CONSTANTS.RECTANGLE)).toBe('矩形')
    })

    it('should return the type itself for unknown types', () => {
      expect(getElementTypeName('unknown')).toBe('unknown')
    })
  })

  describe('getElementIcon', () => {
    it('should return the correct icon for static text', () => {
      expect(getElementIcon(ELEMENT_TYPE_CONSTANTS.STATIC_TEXT)).toBe('T')
    })

    it('should return the correct icon for text field', () => {
      expect(getElementIcon(ELEMENT_TYPE_CONSTANTS.TEXT_FIELD)).toBe('{ }')
    })

    it('should return the correct icon for image', () => {
      expect(getElementIcon(ELEMENT_TYPE_CONSTANTS.IMAGE)).toBe('🖼')
    })

    it('should return the correct icon for line', () => {
      expect(getElementIcon(ELEMENT_TYPE_CONSTANTS.LINE)).toBe('─')
    })

    it('should return the correct icon for rectangle', () => {
      expect(getElementIcon(ELEMENT_TYPE_CONSTANTS.RECTANGLE)).toBe('▭')
    })

    it('should return question mark for unknown types', () => {
      expect(getElementIcon('unknown')).toBe('?')
    })
  })

  describe('getElementDisplayInfoWithoutBand', () => {
    it('should return truncated text for static text element', () => {
      const element = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        text: 'This is a very long text that should be truncated'
      }
      
      expect(getElementDisplayInfoWithoutBand(element)).toBe('This is a very ...')
    })

    it('should return full text for short static text element', () => {
      const element = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        text: 'Short text'
      }
      
      expect(getElementDisplayInfoWithoutBand(element)).toBe('Short text')
    })

    it('should return field name for text field element', () => {
      const element = {
        type: 'textField' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        fieldName: 'customer_name'
      }
      
      expect(getElementDisplayInfoWithoutBand(element)).toBe('$F{customer_name}')
    })

    it('should return image path for image element', () => {
      const element = {
        type: 'image' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        imagePath: '/path/to/image.png'
      }
      
      expect(getElementDisplayInfoWithoutBand(element)).toBe('/path/to/image.png')
    })

    it('should return empty string for elements without display info', () => {
      const element = {
        type: 'rectangle' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30
      }
      
      expect(getElementDisplayInfoWithoutBand(element)).toBe('')
    })
  })

  describe('isElementSelected', () => {
    it('should return true when element is selected', () => {
      const element = {
        element: { type: 'staticText' as any, x: 10, y: 20, width: 100, height: 30 },
        bandIndex: 1,
        elementIndex: 2
      }
      
      const selectedElement = { bandIndex: 1, elementIndex: 2 }
      
      expect(isElementSelected(element, selectedElement)).toBe(true)
    })

    it('should return false when element is not selected', () => {
      const element = {
        element: { type: 'staticText' as any, x: 10, y: 20, width: 100, height: 30 },
        bandIndex: 1,
        elementIndex: 2
      }
      
      const selectedElement = { bandIndex: 2, elementIndex: 3 }
      
      expect(isElementSelected(element, selectedElement)).toBe(false)
    })

    it('should return false when no element is selected', () => {
      const element = {
        element: { type: 'staticText' as any, x: 10, y: 20, width: 100, height: 30 },
        bandIndex: 1,
        elementIndex: 2
      }
      
      expect(isElementSelected(element, undefined)).toBe(false)
    })
  })

  describe('selectElementFromList', () => {
    it('should call selectElement with correct indices', () => {
      const element = {
        element: { type: 'staticText' as any, x: 10, y: 20, width: 100, height: 30 },
        bandIndex: 1,
        elementIndex: 2
      }
      
      const selectElement = vi.fn()
      
      selectElementFromList(element, selectElement)
      
      expect(selectElement).toHaveBeenCalledWith(1, 2)
    })
  })

  describe('selectElementsByParameter', () => {
    it('should select elements that use the specified parameter', () => {
      const bands = [
        {
          elements: [
            {
              type: 'textField' as any,
              expression: '$P{param1} + $P{param2}'
            },
            {
              type: 'textField' as any,
              expression: '$F{field1}'
            }
          ]
        },
        {
          elements: [
            {
              type: 'textField' as any,
              expression: '$P{param1}'
            }
          ]
        }
      ]
      
      const selectElement = vi.fn()
      
      selectElementsByParameter(bands, 'param1', selectElement)
      
      expect(selectElement).toHaveBeenCalledTimes(2)
      expect(selectElement).toHaveBeenCalledWith(0, 0)
      expect(selectElement).toHaveBeenCalledWith(1, 0)
    })

    it('should not select elements that do not use the specified parameter', () => {
      const bands = [
        {
          elements: [
            {
              type: 'textField' as any,
              expression: '$P{param1}'
            }
          ]
        }
      ]
      
      const selectElement = vi.fn()
      
      selectElementsByParameter(bands, 'param2', selectElement)
      
      expect(selectElement).not.toHaveBeenCalled()
    })
  })

  describe('selectElementsByField', () => {
    it('should select elements that use the specified field', () => {
      const bands = [
        {
          elements: [
            {
              type: 'textField' as any,
              fieldName: 'field1'
            },
            {
              type: 'textField' as any,
              expression: '$F{field2}'
            }
          ]
        },
        {
          elements: [
            {
              type: 'textField' as any,
              fieldName: 'field1'
            }
          ]
        }
      ]
      
      const selectElement = vi.fn()
      
      selectElementsByField(bands, 'field1', selectElement)
      
      expect(selectElement).toHaveBeenCalledTimes(2)
      expect(selectElement).toHaveBeenCalledWith(0, 0)
      expect(selectElement).toHaveBeenCalledWith(1, 0)
    })

    it('should select elements that use the specified field in expression', () => {
      const bands = [
        {
          elements: [
            {
              type: 'textField' as any,
              expression: '$F{field1}'
            }
          ]
        }
      ]
      
      const selectElement = vi.fn()
      
      selectElementsByField(bands, 'field1', selectElement)
      
      expect(selectElement).toHaveBeenCalledTimes(1)
      expect(selectElement).toHaveBeenCalledWith(0, 0)
    })

    it('should not select elements that do not use the specified field', () => {
      const bands = [
        {
          elements: [
            {
              type: 'textField' as any,
              fieldName: 'field1'
            }
          ]
        }
      ]
      
      const selectElement = vi.fn()
      
      selectElementsByField(bands, 'field2', selectElement)
      
      expect(selectElement).not.toHaveBeenCalled()
    })
  })

  describe('createNewElement', () => {
    it('should create a new static text element', () => {
      const element = createNewElement(ELEMENT_TYPE_CONSTANTS.STATIC_TEXT, 10, 20)
      
      expect(element.type).toBe('staticText')
      expect(element.x).toBe(10)
      expect(element.y).toBe(20)
      expect(element.width).toBe(100)
      expect(element.height).toBe(30)
      expect((element as any).text).toBe('静态文本')
    })

    it('should create a new text field element', () => {
      const element = createNewElement(ELEMENT_TYPE_CONSTANTS.TEXT_FIELD, 10, 20)
      
      expect(element.type).toBe('textField')
      expect(element.x).toBe(10)
      expect(element.y).toBe(20)
      expect(element.width).toBe(100)
      expect(element.height).toBe(30)
      expect((element as any).fieldName).toBe('field')
    })

    it('should create a new image element', () => {
      const element = createNewElement(ELEMENT_TYPE_CONSTANTS.IMAGE, 10, 20)
      
      expect(element.type).toBe('image')
      expect(element.x).toBe(10)
      expect(element.y).toBe(20)
      expect(element.width).toBe(100)
      expect(element.height).toBe(30)
      expect((element as any).imagePath).toBe('')
    })

    it('should create a new line element', () => {
      const element = createNewElement(ELEMENT_TYPE_CONSTANTS.LINE, 10, 20)
      
      expect(element.type).toBe('line')
      expect(element.x).toBe(10)
      expect(element.y).toBe(20)
      expect(element.width).toBe(100)
      expect(element.height).toBe(30)
      expect((element as any).lineDirection).toBe('Horizontal')
    })

    it('should create a new rectangle element', () => {
      const element = createNewElement(ELEMENT_TYPE_CONSTANTS.RECTANGLE, 10, 20)
      
      expect(element.type).toBe('rectangle')
      expect(element.x).toBe(10)
      expect(element.y).toBe(20)
      expect(element.width).toBe(100)
      expect(element.height).toBe(30)
    })

    it('should create a base element for unknown types', () => {
      const element = createNewElement('unknown', 10, 20)
      
      expect(element.type).toBe('unknown')
      expect(element.x).toBe(10)
      expect(element.y).toBe(20)
      expect(element.width).toBe(100)
      expect(element.height).toBe(30)
    })
  })

  describe('duplicateElement', () => {
    it('should duplicate an element with default offset', () => {
      const original: DesignElement = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        text: 'Original text'
      }
      
      const duplicate = duplicateElement(original)
      
      expect(duplicate.x).toBe(20)
      expect(duplicate.y).toBe(30)
      expect(duplicate.width).toBe(100)
      expect(duplicate.height).toBe(30)
      expect(duplicate.type).toBe('staticText')
      expect((duplicate as any).text).toBe('Original text')
    })

    it('should duplicate an element with custom offset', () => {
      const original: DesignElement = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        text: 'Original text'
      }
      
      const duplicate = duplicateElement(original, 50, 60)
      
      expect(duplicate.x).toBe(60)
      expect(duplicate.y).toBe(80)
      expect(duplicate.width).toBe(100)
      expect(duplicate.height).toBe(30)
      expect(duplicate.type).toBe('staticText')
      expect((duplicate as any).text).toBe('Original text')
    })
  })

  describe('isPointInElement', () => {
    it('should return true for point inside element', () => {
      const element: DesignElement = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30
      }
      
      expect(isPointInElement(50, 30, element)).toBe(true)
    })

    it('should return true for point on element border', () => {
      const element: DesignElement = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30
      }
      
      expect(isPointInElement(10, 20, element)).toBe(true)
      expect(isPointInElement(110, 50, element)).toBe(true)
    })

    it('should return false for point outside element', () => {
      const element: DesignElement = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30
      }
      
      expect(isPointInElement(5, 30, element)).toBe(false)
      expect(isPointInElement(50, 10, element)).toBe(false)
      expect(isPointInElement(120, 30, element)).toBe(false)
      expect(isPointInElement(50, 60, element)).toBe(false)
    })
  })

  describe('getElementBounds', () => {
    it('should return the bounds of an element', () => {
      const element: DesignElement = {
        type: 'staticText' as any,
        x: 10,
        y: 20,
        width: 100,
        height: 30
      }
      
      const bounds = getElementBounds(element)
      
      expect(bounds.x).toBe(10)
      expect(bounds.y).toBe(20)
      expect(bounds.width).toBe(100)
      expect(bounds.height).toBe(30)
    })
  })

  describe('getElementsBounds', () => {
    it('should return the bounds of multiple elements', () => {
      const elements: DesignElement[] = [
        {
          type: 'staticText' as any,
          x: 10,
          y: 20,
          width: 100,
          height: 30
        },
        {
          type: 'textField' as any,
          x: 50,
          y: 60,
          width: 80,
          height: 40
        }
      ]
      
      const bounds = getElementsBounds(elements)
      
      if (bounds) {
        expect(bounds.x).toBe(10)
        expect(bounds.y).toBe(20)
        expect(bounds.width).toBe(120) // 50 + 80 - 10
        expect(bounds.height).toBe(80) // 60 + 40 - 20
      }
    })

    it('should return null for empty elements array', () => {
      const bounds = getElementsBounds([])
      
      expect(bounds).toBeNull()
    })

    it('should return the bounds of a single element', () => {
      const elements: DesignElement[] = [
        {
          type: 'staticText' as any,
          x: 10,
          y: 20,
          width: 100,
          height: 30
        }
      ]
      
      const bounds = getElementsBounds(elements)
      
      if (bounds) {
        expect(bounds.x).toBe(10)
        expect(bounds.y).toBe(20)
        expect(bounds.width).toBe(100)
        expect(bounds.height).toBe(30)
      }
    })
  })
})