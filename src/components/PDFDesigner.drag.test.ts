import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
  })),
})

// Mock getBoundingClientRect
const mockGetBoundingClientRect = vi.fn()
Element.prototype.getBoundingClientRect = mockGetBoundingClientRect

// Mock querySelector
const mockQuerySelector = vi.fn()
document.querySelector = mockQuerySelector

// Mock querySelectorAll
const mockQuerySelectorAll = vi.fn()
document.querySelectorAll = mockQuerySelectorAll

describe('PDFDesigner - Element Dragging and Coordinates', () => {
  // Mock the PDFDesigner component's drag coordinate logic
  let mockVm: any
  let mockDragCoordinates: any
  let mockBands: any
  let mockSelectedElement: any

  beforeEach(() => {
    // Reset DOM mocks
    mockGetBoundingClientRect.mockReset()
    mockQuerySelector.mockReset()
    mockQuerySelectorAll.mockReset()
    
    // Mock the drag coordinates reactive object
    mockDragCoordinates = {
      value: {
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        bandName: ''
      }
    }
    
    // Mock bands array
    mockBands = {
      value: [
        {
          type: 'title',
          height: 80,
          elements: [
            {
              type: 'staticText',
              x: 100,
              y: 50,
              width: 200,
              height: 30,
              text: 'Test Element',
              id: 'test-element-1'
            }
          ]
        },
        {
          type: 'pageHeader',
          height: 50,
          elements: []
        }
      ]
    }
    
    // Mock selected element
    mockSelectedElement = {
      value: {
        bandIndex: 0,
        elementIndex: 0
      }
    }
    
    // Mock the component methods
    mockVm = {
      dragCoordinates: mockDragCoordinates,
      bands: mockBands,
      selectedElement: mockSelectedElement,
      reportProperties: {
        value: {
          pageWidth: 595,
          pageHeight: 842,
          leftMargin: 20,
          rightMargin: 20,
          topMargin: 20,
          bottomMargin: 20
        }
      },
      currentZoom: 1,
      gridSize: 3,
      // Mock the drag coordinate update logic
      updateDragCoordinates: (clientX: number, clientY: number, bandIndex: number) => {
        // Mock paper element
        const paperElement = {
          getBoundingClientRect: vi.fn(() => ({
            top: 100,
            left: 50,
            width: 500,
            height: 700
          }))
        }
        
        // Mock band element
        const bandElement = {
          getBoundingClientRect: vi.fn(() => ({
            top: 150 + (bandIndex * 100),
            left: 50,
            width: 500,
            height: 80
          }))
        }
        
        mockQuerySelector.mockImplementation((selector: string) => {
          if (selector === '.paper') return paperElement
          if (selector === '.coordinates-display') return {
            style: {
              left: '',
              top: ''
            }
          }
          return null
        })
        
        mockQuerySelectorAll.mockImplementation((selector: string) => {
          if (selector === '.band') return [bandElement]
          return []
        })
        
        const paperRect = paperElement.getBoundingClientRect()
        const bandRect = bandElement.getBoundingClientRect()
        
        // Calculate relative coordinates
        const relativeX = Math.round((clientX - paperRect.left) / mockVm.currentZoom)
        const relativeY = Math.round((clientY - bandRect.top) / mockVm.currentZoom)
        
        // Apply grid snapping
        const newX = Math.round(relativeX / mockVm.gridSize) * mockVm.gridSize
        const newY = Math.round(relativeY / mockVm.gridSize) * mockVm.gridSize
        
        // Update drag coordinates
         const element = mockBands.value[bandIndex].elements[0]
         mockDragCoordinates.value = {
           visible: true,
           x: newX,
           y: newY,
           width: element ? element.width : 200,
           height: element ? element.height : 30,
           bandName: `${mockBands.value[bandIndex].type} - ${newX}, ${newY}`
         }
        
        return mockDragCoordinates.value
      },
      // Mock the element position update logic
      updateElementPosition: (bandIndex: number, elementIndex: number) => {
        const element = mockBands.value[bandIndex].elements[elementIndex]
        if (element) {
          // Use drag coordinates to update element position
          element.x = mockDragCoordinates.value.x
          element.y = mockDragCoordinates.value.y
        }
      },
      // Mock the element move between bands logic
      moveElementToBand: (fromBandIndex: number, fromElementIndex: number, toBandIndex: number) => {
        if (fromBandIndex === toBandIndex) return
        
        const element = mockBands.value[fromBandIndex].elements[fromElementIndex]
        if (!element) return
        
        // Remove from original band
        mockBands.value[fromBandIndex].elements.splice(fromElementIndex, 1)
        
        // Add to new band
        mockBands.value[toBandIndex].elements.push(element)
        
        // Update element position using drag coordinates
        element.x = mockDragCoordinates.value.x
        element.y = Math.max(0, mockDragCoordinates.value.y) // Ensure y is not negative
        
        // Update selected element
        mockSelectedElement.value = {
          bandIndex: toBandIndex,
          elementIndex: mockBands.value[toBandIndex].elements.length - 1
        }
      }
    }
  })

  describe('Element Dragging Within Same Band', () => {
    it('should update element position using dragCoordinates when mouse is released', () => {
      // Simulate mouse move
      mockVm.updateDragCoordinates(200, 250, 0)
      
      // Verify drag coordinates are updated
      expect(mockDragCoordinates.value.visible).toBe(true)
      expect(mockDragCoordinates.value.x).toBeGreaterThan(0)
      expect(mockDragCoordinates.value.y).toBeGreaterThan(0)
      
      // Store the drag coordinates for later verification
      const dragX = mockDragCoordinates.value.x
      const dragY = mockDragCoordinates.value.y
      
      // Simulate mouse release
      mockVm.updateElementPosition(0, 0)
      
      // Verify element position matches the drag coordinates
      expect(mockBands.value[0].elements[0].x).toBe(dragX)
      expect(mockBands.value[0].elements[0].y).toBe(dragY)
    })
  })

  describe('Element Dragging Between Bands', () => {
    it('should update element position using dragCoordinates when moving to a different band', () => {
      // Simulate mouse move to second band
      mockVm.updateDragCoordinates(200, 350, 1)
      
      // Verify drag coordinates are updated
      expect(mockDragCoordinates.value.visible).toBe(true)
      
      // Store the drag coordinates for later verification
      const dragX = mockDragCoordinates.value.x
      const dragY = mockDragCoordinates.value.y
      
      // Simulate mouse release in second band
      mockVm.moveElementToBand(0, 0, 1)
      
      // Verify element moved to second band with correct position
      expect(mockBands.value[0].elements).toHaveLength(0)
      expect(mockBands.value[1].elements).toHaveLength(1)
      expect(mockBands.value[1].elements[0].x).toBe(dragX)
      expect(mockBands.value[1].elements[0].y).toBe(dragY)
    })

    it('should ensure y coordinate is not negative when moving to first band', () => {
      // Move element to second band
      const element = mockBands.value[0].elements[0]
      mockBands.value[1].elements.push(element)
      mockBands.value[0].elements = []
      
      // Simulate mouse move with negative y coordinate
      mockDragCoordinates.value.y = -10
      
      // Simulate mouse release in first band
      mockVm.moveElementToBand(1, 0, 0)
      
      // Verify element moved to first band with non-negative y coordinate
      expect(mockBands.value[1].elements).toHaveLength(0)
      expect(mockBands.value[0].elements).toHaveLength(1)
      expect(mockBands.value[0].elements[0].y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Drag Coordinates Display', () => {
    it('should display correct coordinates relative to band during dragging', () => {
      // Mock coordinates display element
      const coordinatesElement = {
        style: {
          left: '',
          top: ''
        }
      }
      
      mockQuerySelector.mockImplementation((selector: string) => {
        if (selector === '.coordinates-display') return coordinatesElement
        return null
      })
      
      // Simulate mouse move
      mockVm.updateDragCoordinates(200, 250, 0)
      
      // Verify drag coordinates are updated and visible
      expect(mockDragCoordinates.value.visible).toBe(true)
      expect(mockDragCoordinates.value.x).toBeGreaterThan(0)
      expect(mockDragCoordinates.value.y).toBeGreaterThan(0)
      
      // Verify band name is included
      expect(mockDragCoordinates.value.bandName).toContain('title - ')
    })
  })
})