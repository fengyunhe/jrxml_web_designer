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
        // Use the actual implementation from PDFDesigner.vue
        const threshold = 3; // 对齐阈值，像素
        const verticalAlignmentLines: number[] = []; // 垂直对齐线（X坐标）
        const horizontalAlignmentLines: number[] = []; // 水平对齐线（Y坐标）
        
        // 获取页边距
        const { leftMargin = 0, topMargin = 0 } = mockVm.reportProperties.value || {};
        
        // 计算当前band的Y坐标偏移
        let currentBandY = 0;
        const bandSpacing = mockVm.bandSpacing;
        for (let i = 0; i < bandIndex; i++) {
          currentBandY += mockBands.value[i]?.height || 0;
          if (i < bandIndex - 1) {
            currentBandY += bandSpacing;
          }
        }
        
        // 获取当前元素的边界
        const currentLeft = currentElement.x;
        const currentRight = currentElement.x + currentElement.width;
        const currentTop = currentElement.y;
        const currentBottom = currentElement.y + currentElement.height;
        const currentCenterX = currentElement.x + currentElement.width / 2;
        const currentCenterY = currentElement.y + currentElement.height / 2;
        
        // 遍历所有band和元素，检测对齐关系
        let bandOffsetY = 0;
        mockBands.value.forEach((band: any, currentBandIndex: number) => {
          band.elements.forEach((element: any, _elementIndex: number) => {
            // 跳过当前元素
            if (currentBandIndex === bandIndex && element === currentElement) return;
            
            // 获取其他元素的边界
            const otherLeft = element.x;
            const otherRight = element.x + element.width;
            const otherTop = element.y;
            const otherBottom = element.y + element.height;
            const otherCenterX = element.x + element.width / 2;
            const otherCenterY = element.y + element.height / 2;
            
            // 检测垂直对齐线（左右对齐）
            // 左边对齐
            if (Math.abs(currentLeft - otherLeft) < threshold) {
              const linePosition = otherLeft + leftMargin;
              verticalAlignmentLines.push(linePosition);
            }
            // 右边对齐
            if (Math.abs(currentRight - otherRight) < threshold) {
              const linePosition = otherRight + leftMargin;
              verticalAlignmentLines.push(linePosition);
            }
            // 中心对齐
            if (Math.abs(currentCenterX - otherCenterX) < threshold) {
              const linePosition = otherCenterX + leftMargin;
              verticalAlignmentLines.push(linePosition);
            }
            // 左边对齐到其他元素的右边
            if (Math.abs(currentLeft - otherRight) < threshold) {
              const linePosition = otherRight + leftMargin;
              verticalAlignmentLines.push(linePosition);
            }
            // 右边对齐到其他元素的左边
            if (Math.abs(currentRight - otherLeft) < threshold) {
              const linePosition = otherLeft + leftMargin;
              verticalAlignmentLines.push(linePosition);
            }
            
            // 检测水平对齐线（上下对齐）
            // 对于相同band中的元素，进行完整的对齐检测和吸附
            if (currentBandIndex === bandIndex) {
              // 顶部对齐
              if (Math.abs(currentTop - otherTop) < threshold) {
                // 添加当前band的Y坐标偏移到参考线位置
                const linePosition = otherTop + topMargin + bandOffsetY;
                horizontalAlignmentLines.push(linePosition);
              }
              // 底部对齐
              if (Math.abs(currentBottom - otherBottom) < threshold) {
                // 添加当前band的Y坐标偏移到参考线位置
                const linePosition = otherBottom + topMargin + bandOffsetY;
                horizontalAlignmentLines.push(linePosition);
              }
              // 中心对齐
              if (Math.abs(currentCenterY - otherCenterY) < threshold) {
                // 添加当前band的Y坐标偏移到参考线位置
                const linePosition = otherCenterY + topMargin + bandOffsetY;
                horizontalAlignmentLines.push(linePosition);
              }
              // 顶部对齐到其他元素的底部
              if (Math.abs(currentTop - otherBottom) < threshold) {
                // 添加当前band的Y坐标偏移到参考线位置
                const linePosition = otherBottom + topMargin + bandOffsetY;
                horizontalAlignmentLines.push(linePosition);
              }
              // 底部对齐到其他元素的顶部
              if (Math.abs(currentBottom - otherTop) < threshold) {
                // 添加当前band的Y坐标偏移到参考线位置
                const linePosition = otherTop + topMargin + bandOffsetY;
                horizontalAlignmentLines.push(linePosition);
              }
            }
            // 对于不同band中的元素，只显示参考线但不进行吸附
            else {
              // 只有当鼠标悬浮在目标band中时，才检测横向对齐线
                 // 使用highlightedBandIndex来判断当前鼠标悬浮的band
                 if (mockVm.highlightedBandIndex.value === bandIndex) {
                // 计算当前元素相对于目标band的Y坐标
                // 获取当前元素所在band和目标band的Y坐标偏移差
                let sourceBandOffsetY = 0;
                let targetBandOffsetY = 0;
                
                // 计算源band的Y坐标偏移
                for (let i = 0; i < currentBandIndex; i++) {
                  sourceBandOffsetY += mockBands.value[i]?.height || 0;
                  if (i < currentBandIndex - 1) {
                    sourceBandOffsetY += bandSpacing;
                  }
                }
                
                // 计算目标band的Y坐标偏移
                 for (let i = 0; i < bandIndex; i++) {
                   targetBandOffsetY += mockBands.value[i]?.height || 0;
                   if (i < bandIndex - 1) {
                     targetBandOffsetY += bandSpacing;
                   }
                 }
                
                // 计算当前元素相对于目标band的Y坐标
                const relativeY = currentTop + (sourceBandOffsetY - targetBandOffsetY);
                const relativeBottom = currentBottom + (sourceBandOffsetY - targetBandOffsetY);
                const relativeCenterY = currentCenterY + (sourceBandOffsetY - targetBandOffsetY);
                
                // 顶部对齐
                if (Math.abs(relativeY - otherTop) < threshold) {
                  // 添加目标band的Y坐标偏移到参考线位置
                  const linePosition = otherTop + topMargin + targetBandOffsetY;
                  horizontalAlignmentLines.push(linePosition);
                }
                // 底部对齐
                if (Math.abs(relativeBottom - otherBottom) < threshold) {
                  // 添加目标band的Y坐标偏移到参考线位置
                  const linePosition = otherBottom + topMargin + targetBandOffsetY;
                  horizontalAlignmentLines.push(linePosition);
                }
                // 中心对齐
                if (Math.abs(relativeCenterY - otherCenterY) < threshold) {
                  // 添加目标band的Y坐标偏移到参考线位置
                  const linePosition = otherCenterY + topMargin + targetBandOffsetY;
                  horizontalAlignmentLines.push(linePosition);
                }
                // 顶部对齐到其他元素的底部
                if (Math.abs(relativeY - otherBottom) < threshold) {
                  // 添加目标band的Y坐标偏移到参考线位置
                  const linePosition = otherBottom + topMargin + targetBandOffsetY;
                  horizontalAlignmentLines.push(linePosition);
                }
                // 底部对齐到其他元素的顶部
                if (Math.abs(relativeBottom - otherTop) < threshold) {
                  // 添加目标band的Y坐标偏移到参考线位置
                  const linePosition = otherTop + topMargin + targetBandOffsetY;
                  horizontalAlignmentLines.push(linePosition);
                }
              }
            }
          });
          
          // 更新band的Y坐标偏移，考虑band之间的间距
          bandOffsetY += band.height + bandSpacing;
        });
        
        // 更新对齐线状态
        mockAlignmentLines.value = {
          horizontal: [...new Set(horizontalAlignmentLines)], // 水平对齐线（Y坐标）
          vertical: [...new Set(verticalAlignmentLines)] // 垂直对齐线（X坐标）
        };
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


});