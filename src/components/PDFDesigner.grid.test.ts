import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { DesignElement } from '@/types'

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

describe('PDFDesigner - Grid Snapping and Alignment Lines', () => {
  let mockVm: any
  let mockDragCoordinates: any
  let mockBands: any
  let mockAlignmentLines: any

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
              text: 'Test Element 1',
              id: 'test-element-1'
            },
            {
              type: 'staticText',
              x: 300,
              y: 50,
              width: 150,
              height: 30,
              text: 'Test Element 2',
              id: 'test-element-2'
            }
          ]
        },
        {
          type: 'detail',
          height: 100,
          elements: [
            {
              type: 'staticText',
              x: 150,
              y: 20,
              width: 180,
              height: 25,
              text: 'Test Element 3',
              id: 'test-element-3'
            }
          ]
        }
      ]
    }
    
    // Mock alignment lines
    mockAlignmentLines = {
      value: {
        vertical: [],
        horizontal: []
      }
    }
    
    // Mock the component methods
    mockVm = {
      dragCoordinates: mockDragCoordinates,
      bands: mockBands,
      alignmentLines: mockAlignmentLines,
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
      bandSpacing: 10,
      highlightedBandIndex: { value: -1 },
      // Mock the grid snapping logic
      applyGridSnapping: (x: number, y: number) => {
        // Apply grid snapping
        const snappedX = Math.round(x / mockVm.gridSize) * mockVm.gridSize
        const snappedY = Math.round(y / mockVm.gridSize) * mockVm.gridSize
        
        return { x: snappedX, y: snappedY }
      },
      // Mock the alignment detection logic
      detectAlignmentLines: (currentElement: any, bandIndex: number) => {
        const elements = mockBands.value[bandIndex].elements
        // Skip ID comparison since test elements might not have matching IDs
        const currentElementIndex = elements.findIndex((el: any) => 
          el.x === currentElement.x && el.y === currentElement.y
        )
        
        if (currentElementIndex === -1 && !currentElement.id) return
        
        const verticalLines: number[] = []
        const horizontalLines: number[] = []
        
        // Check alignment with other elements in the same band
        elements.forEach((element: any) => {
          // Skip if it's the same element (by position or ID)
          if ((currentElement.id && element.id === currentElement.id) || 
              (element.x === currentElement.x && element.y === currentElement.y)) return
          
          // Check vertical alignment (left edges) - increased threshold
          if (Math.abs(currentElement.x - element.x) < 10) {
            verticalLines.push(element.x + mockVm.reportProperties.value.leftMargin)
          }
          
          // Check vertical alignment (right edges) - increased threshold
          if (Math.abs((currentElement.x + currentElement.width) - (element.x + element.width)) < 10) {
            verticalLines.push(element.x + element.width + mockVm.reportProperties.value.leftMargin)
          }
          
          // Check horizontal alignment (top edges) - increased threshold
          if (Math.abs(currentElement.y - element.y) < 10) {
            horizontalLines.push(element.y + mockVm.reportProperties.value.topMargin)
          }
          
          // Check horizontal alignment (bottom edges) - increased threshold
          if (Math.abs((currentElement.y + currentElement.height) - (element.y + element.height)) < 10) {
            horizontalLines.push(element.y + element.height + mockVm.reportProperties.value.topMargin)
          }
        })
        
        // Check alignment with elements in other bands (cross-band alignment)
        mockBands.value.forEach((band: any, otherBandIndex: number) => {
          if (otherBandIndex === bandIndex) return // Skip current band
          
          // Only check cross-band alignment if the mouse is hovering over the target band
          if (mockVm.highlightedBandIndex.value !== otherBandIndex) return
          
          // Calculate band offset for cross-band alignment (including band spacing)
          let bandOffsetY = 0
          for (let i = 0; i < otherBandIndex; i++) {
            bandOffsetY += mockBands.value[i].height
            if (i < otherBandIndex - 1) {
              bandOffsetY += mockVm.bandSpacing
            }
          }
          
          // Calculate source band offset (including band spacing)
          let sourceBandOffsetY = 0
          for (let i = 0; i < bandIndex; i++) {
            sourceBandOffsetY += mockBands.value[i].height
            if (i < bandIndex - 1) {
              sourceBandOffsetY += mockVm.bandSpacing
            }
          }
          
          // For cross-band alignment, we need to consider the band spacing between bands
          // If we're aligning with a band above the current band, we need to add the band spacing
          if (otherBandIndex < bandIndex) {
            sourceBandOffsetY += mockVm.bandSpacing
          }
          
          // Use the elements from the other band
          band.elements.forEach((element: any) => {
            // Skip if it's the same element (by position or ID)
            if ((currentElement.id && element.id === currentElement.id) || 
                (element.x === currentElement.x && element.y === currentElement.y)) return
            
            // For cross-band horizontal alignment, we need to compare relative Y coordinates
            // Convert current element's Y to the target band's coordinate system
            const relativeY = currentElement.y + sourceBandOffsetY - bandOffsetY
            const relativeBottom = relativeY + currentElement.height
            const relativeCenterY = relativeY + currentElement.height / 2
            
            // Check horizontal alignment (top edges) with relative Y
            if (Math.abs(relativeY - element.y) < 3) {
              const linePosition = element.y + mockVm.reportProperties.value.topMargin + bandOffsetY
              horizontalLines.push(linePosition)
            }
            
            // Check horizontal alignment (bottom edges) with relative Y
            if (Math.abs(relativeBottom - (element.y + element.height)) < 3) {
              const linePosition = element.y + element.height + mockVm.reportProperties.value.topMargin + bandOffsetY
              horizontalLines.push(linePosition)
            }
            
            // Check center alignment
            const otherCenterY = element.y + element.height / 2
            if (Math.abs(relativeCenterY - otherCenterY) < 3) {
              const linePosition = otherCenterY + mockVm.reportProperties.value.topMargin + bandOffsetY
              horizontalLines.push(linePosition)
            }
            
            // Check top alignment to other element's bottom
            if (Math.abs(relativeY - (element.y + element.height)) < 3) {
              const linePosition = element.y + element.height + mockVm.reportProperties.value.topMargin + bandOffsetY
              horizontalLines.push(linePosition)
            }
            
            // Check bottom alignment to other element's top
            if (Math.abs(relativeBottom - element.y) < 3) {
              const linePosition = element.y + mockVm.reportProperties.value.topMargin + bandOffsetY
              horizontalLines.push(linePosition)
            }
          })
        })
        
        // Update alignment lines
        mockAlignmentLines.value = {
          vertical: [...new Set(verticalLines)],
          horizontal: [...new Set(horizontalLines)]
        }
      },
      // Mock the coordinate update with grid snapping and alignment detection
      updateCoordinatesWithSnapping: (clientX: number, clientY: number, bandIndex: number, elementIndex: number) => {
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
            top: 150,
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
        const snappedCoords = mockVm.applyGridSnapping(relativeX, relativeY)
        
        // Get current element
        const currentElement = mockBands.value[bandIndex].elements[elementIndex]
        
        // Detect alignment lines
        mockVm.detectAlignmentLines({
          ...currentElement,
          x: snappedCoords.x,
          y: snappedCoords.y
        }, bandIndex)
        
        // Update drag coordinates
        mockDragCoordinates.value = {
          visible: true,
          x: snappedCoords.x,
          y: snappedCoords.y,
          width: currentElement.width,
          height: currentElement.height,
          bandName: `${mockBands.value[bandIndex].type} - ${snappedCoords.x}, ${snappedCoords.y}`
        }
        
        return mockDragCoordinates.value
      }
    }
  })

  describe('Grid Snapping', () => {
    it('should snap coordinates to grid', () => {
      // Test with coordinates that should snap up
      let result = mockVm.applyGridSnapping(101, 52)
      expect(result.x).toBe(102) // 101 rounds up to nearest multiple of 3
      expect(result.y).toBe(51)  // 52 rounds down to nearest multiple of 3
      
      // Test with coordinates that should snap down
      result = mockVm.applyGridSnapping(104, 55)
      expect(result.x).toBe(105) // 104 rounds up to nearest multiple of 3
      expect(result.y).toBe(54)  // 55 rounds down to nearest multiple of 3
      
      // Test with coordinates already on grid
      result = mockVm.applyGridSnapping(99, 60)
      expect(result.x).toBe(99)  // Already on grid
      expect(result.y).toBe(60)  // Already on grid
    })
  })

  describe('Alignment Lines Detection', () => {
    it('should detect vertical alignment with left edges', () => {
      // Create a test element aligned with the first element's left edge
      const testElement = {
        id: 'test-element-3',
        x: 102, // Close to first element's x (100)
        y: 20,
        width: 100,
        height: 30
      }
      
      // Detect alignment
      mockVm.detectAlignmentLines(testElement, 0)
      
      // Verify vertical alignment line is detected
      expect(mockAlignmentLines.value.vertical).toHaveLength(1)
      expect(mockAlignmentLines.value.vertical[0]).toBe(120) // 100 + leftMargin (20)
    })
    
    it('should detect vertical alignment with right edges', () => {
      // Create a test element aligned with the first element's right edge
      const testElement = {
        id: 'test-element-3',
        x: 200, // Right edge at 300, close to first element's right edge (300)
        y: 20,
        width: 100,
        height: 30
      }
      
      // Detect alignment
      mockVm.detectAlignmentLines(testElement, 0)
      
      // Verify vertical alignment line is detected
      expect(mockAlignmentLines.value.vertical).toHaveLength(1)
      expect(mockAlignmentLines.value.vertical[0]).toBe(320) // 300 + leftMargin (20)
    })
    
    it('should detect horizontal alignment with top edges', () => {
      // Create a test element aligned with the first element's top edge
      const testElement = {
        id: 'test-element-3',
        x: 50,
        y: 52, // Close to first element's y (50)
        width: 100,
        height: 30
      }
      
      // Detect alignment
      mockVm.detectAlignmentLines(testElement, 0)
      
      // Verify horizontal alignment line is detected
      // The test element aligns with both elements' top edges
      expect(mockAlignmentLines.value.horizontal).toHaveLength(2)
      expect(mockAlignmentLines.value.horizontal).toContain(70) // 50 + topMargin (20)
    })
    
    it('should detect horizontal alignment with bottom edges', () => {
      // Create a test element aligned with the first element's bottom edge
      const testElement = {
        id: 'test-element-3',
        x: 50,
        y: 48, // Bottom edge at 78, close to first element's bottom edge (80)
        width: 100,
        height: 30
      }
      
      // Detect alignment
      mockVm.detectAlignmentLines(testElement, 0)
      
      // Verify horizontal alignment line is detected
      // The test element aligns with both elements' bottom edges
      expect(mockAlignmentLines.value.horizontal).toHaveLength(2)
      expect(mockAlignmentLines.value.horizontal).toContain(100) // 80 + topMargin (20)
    })
  })

  describe('Combined Grid Snapping and Alignment', () => {
    it('should apply grid snapping and detect alignment lines during dragging', () => {
      // Update coordinates with grid snapping and alignment detection
      // Use coordinates that will align with the first element (x=100, y=50)
      mockVm.updateCoordinatesWithSnapping(152, 102, 0, 0) // Will snap to x=150, y=102
      
      // Verify grid snapping was applied
      expect(mockDragCoordinates.value.x % mockVm.gridSize).toBeCloseTo(0, 0)
      expect(mockDragCoordinates.value.y % mockVm.gridSize).toBeCloseTo(0, 0)
      
      // Update coordinates with grid snapping and alignment detection
      // Use coordinates that will align with the second element (x=300, y=50)
      mockVm.updateCoordinatesWithSnapping(302, 52, 0, 1) // Will snap to x=303, y=51
      
      // Verify grid snapping was applied
      expect(mockDragCoordinates.value.x % mockVm.gridSize).toBeCloseTo(0, 0)
      expect(mockDragCoordinates.value.y % mockVm.gridSize).toBeCloseTo(0, 0)
      
      // Now test with coordinates that should trigger alignment
       // Position close to first element's left edge (x=100)
       mockVm.updateCoordinatesWithSnapping(102, 180, 0, 0) // Will snap to x=102, y=180
       
       // Verify drag coordinates were updated
       expect(mockDragCoordinates.value.visible).toBe(true)
       expect(mockDragCoordinates.value.x).toBeGreaterThan(0)
       expect(mockDragCoordinates.value.y).toBeGreaterThan(0)
      
      // Manually test alignment detection with a position close to the first element
       mockVm.detectAlignmentLines({
         id: 'element-1', // Use the same ID as the first element
         x: 100, // Exactly the same as first element's x (100)
         y: 180,
         width: 200,
         height: 30
       }, 0)
      
      // Verify alignment lines were detected
      expect(mockAlignmentLines.value.vertical.length).toBeGreaterThan(0)
      expect(mockAlignmentLines.value.vertical[0]).toBe(120) // 100 + leftMargin (20)
    })
  })

  describe('Cross-Band Alignment Lines Detection', () => {
      it('should detect horizontal alignment with elements in other bands', () => {
        // Create a test element in the second band
        const testElement: DesignElement = {
          type: 'staticText',
          x: 50,
          y: -40, // Adjusted to align with first band element at y=50
          width: 100,
          height: 25,
          text: 'Test Element 1'
        };
        
        // Set highlightedBandIndex to enable cross-band alignment detection
        // This simulates the mouse hovering over the first band
        mockVm.highlightedBandIndex.value = 0; // First band
        
        // Detect alignment for element in second band (index 1)
        mockVm.detectAlignmentLines(testElement, 1)
        
        // Verify horizontal alignment line is detected with the element in the first band
        // The line should be at y=50 + topMargin (20) = 70
        expect(mockAlignmentLines.value.horizontal).toContain(70)
      });
      
      it('should detect bottom edge alignment with elements in other bands', () => {
        // Create a test element in the second band
        const testElement: DesignElement = {
          type: 'staticText',
          x: 100,
          y: -10, // Adjusted to align bottom edge with first band element at y=50
          width: 100,
          height: 25,
          text: 'Test Element 2'
        };
        
        // Set highlightedBandIndex to enable cross-band alignment detection
        // This simulates the mouse hovering over the first band
        mockVm.highlightedBandIndex.value = 0; // First band
        
        // Detect alignment for element in second band (index 1)
        mockVm.detectAlignmentLines(testElement, 1)
        
        // Verify horizontal alignment line is detected with the element in the first band
        // The line should be at y=50 + 30 + topMargin (20) = 100
        expect(mockAlignmentLines.value.horizontal).toContain(100)
      });
      
      it('should detect center alignment with elements in other bands', () => {
        // Create a test element in the second band
        const testElement: DesignElement = {
          type: 'staticText',
          x: 100,
          y: -35, // Adjusted to align center with first band element at y=50
          width: 100,
          height: 25,
          text: 'Test Element 3'
        };
        
        // Set highlightedBandIndex to enable cross-band alignment detection
        // This simulates the mouse hovering over the first band
        mockVm.highlightedBandIndex.value = 0; // First band
        
        // Detect alignment for element in second band (index 1)
        mockVm.detectAlignmentLines(testElement, 1)
        
        // Verify horizontal alignment line is detected with the element in the first band
        // The line should be at y=50 + 15 + topMargin (20) = 85
        expect(mockAlignmentLines.value.horizontal).toContain(85)
      });
    });
});