import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PDFDesigner from '@/components/PDFDesigner.vue'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

describe('PDFDesigner - undo/redo functionality', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset localStorage mock before each test
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    
    // Mount component
    wrapper = mount(PDFDesigner, {
      global: {
        stubs: {
          'el-button': true,
          'el-input': true,
          'el-select': true,
          'el-option': true,
          'el-checkbox': true,
          'el-checkbox-group': true,
          'el-dialog': true,
          'el-form': true,
          'el-form-item': true,
          'el-tabs': true,
          'el-tab-pane': true,
          'el-table': true,
          'el-table-column': true,
          'el-switch': true,
          'el-color-picker': true,
          'el-tooltip': true,
          'el-dropdown': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
          'el-upload': true,
          'el-icon': true,
          'resizable-panel': true,
          'designer-canvas': true,
          'element-properties': true,
          'report-properties': true,
          'jrxml-preview': true,
          'base-element': true,
          'static-text-element': true,
          'text-field-element': true,
          'image-element': true,
          'line-element': true,
          'rectangle-element': true
        }
      }
    })
    
    // Wait for component to be fully mounted
    nextTick().then(() => {
      // Initialize reportProperties with name property using Vue's reactivity
      wrapper.vm.reportProperties = {
        name: 'Test Report',
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
        }
      }
    })
  })

  it('should initialize with correct history stack state', async () => {
    const vm = wrapper.vm
    await nextTick()
    // History stack might have an initial state, but redo stack should be empty
    expect(vm.redoStack).toEqual([])
  })

  it('should save state to history when adding an element', async () => {
    const vm = wrapper.vm
    await nextTick()
    
    // Initial state
    const initialHistoryLength = vm.historyStack.length
    
    // Mock element data
    const elementData = { type: 'staticText' }
    
    // Mock lastClickedBandIndex
    vm.lastClickedBandIndex = 3 // Detail band
    
    // Add element
    vm.handleElementDoubleClick(elementData)
    await nextTick()
    
    // Check that history stack has grown
    expect(vm.historyStack.length).toBeGreaterThan(initialHistoryLength)
  })

  it('should save state to history when deleting an element', async () => {
    const vm = wrapper.vm
    await nextTick()
    
    // Add an element first
    const elementData = { type: 'staticText' }
    vm.lastClickedBandIndex = 3 // Detail band
    vm.handleElementDoubleClick(elementData)
    await nextTick()
    
    // Select the element
    vm.selectElement(3, 0)
    await nextTick()
    
    const initialHistoryLength = vm.historyStack.length
    
    // Delete the element
    vm.deleteElement()
    await nextTick()
    
    // Check that history stack has grown
    expect(vm.historyStack.length).toBeGreaterThan(initialHistoryLength)
  })

  it('should undo changes correctly', async () => {
    const vm = wrapper.vm
    await nextTick()
    
    // Add an element
    const elementData = { type: 'staticText' }
    vm.lastClickedBandIndex = 3 // Detail band
    vm.handleElementDoubleClick(elementData)
    await nextTick()
    
    // Get the number of elements after addition
    const elementsAfterAddition = vm.bands[3].elements.length
    expect(elementsAfterAddition).toBeGreaterThan(0)
    
    // Undo
    vm.undo()
    await nextTick()
    
    // Check that element was removed
    const elementsAfterUndo = vm.bands[3].elements.length
    expect(elementsAfterUndo).toBeLessThan(elementsAfterAddition)
  })

  it('should redo changes correctly', async () => {
    const vm = wrapper.vm
    await nextTick()
    
    // Add an element
    const elementData = { type: 'staticText' }
    vm.lastClickedBandIndex = 3 // Detail band
    vm.handleElementDoubleClick(elementData)
    await nextTick()
    
    // Undo
    vm.undo()
    await nextTick()
    
    // Get the number of elements after undo
    const elementsAfterUndo = vm.bands[3].elements.length
    
    // Redo
    vm.redo()
    await nextTick()
    
    // Check that element was added back
    const elementsAfterRedo = vm.bands[3].elements.length
    expect(elementsAfterRedo).toBeGreaterThan(elementsAfterUndo)
  })

  it('should clear redo stack when new action is performed after undo', async () => {
    const vm = wrapper.vm
    await nextTick()
    
    // Add first element
    const elementData1 = { type: 'staticText' }
    vm.lastClickedBandIndex = 3 // Detail band
    vm.handleElementDoubleClick(elementData1)
    await nextTick()
    
    // Add second element
    const elementData2 = { type: 'textField' }
    vm.handleElementDoubleClick(elementData2)
    await nextTick()
    
    // Undo twice
    vm.undo()
    await nextTick()
    vm.undo()
    await nextTick()
    
    // Check that redo stack has items
    expect(vm.redoStack.length).toBeGreaterThan(0)
    
    // Perform new action
    vm.handleElementDoubleClick(elementData1)
    await nextTick()
    
    // Check that redo stack is cleared
    expect(vm.redoStack).toEqual([])
  })

  it('should handle multiple undo/redo operations', async () => {
    const vm = wrapper.vm
    await nextTick()
    
    // Add multiple elements
    const elementTypes = ['staticText', 'textField', 'image']
    elementTypes.forEach(type => {
      const elementData = { type }
      vm.lastClickedBandIndex = 3 // Detail band
      vm.handleElementDoubleClick(elementData)
    })
    await nextTick()
    
    const elementsAfterAdditions = vm.bands[3].elements.length
    expect(elementsAfterAdditions).toBe(elementTypes.length)
    
    // Undo all
    for (let i = 0; i < elementTypes.length; i++) {
      vm.undo()
      await nextTick()
    }
    
    expect(vm.bands[3].elements.length).toBe(0)
    
    // Redo all
    for (let i = 0; i < elementTypes.length; i++) {
      vm.redo()
      await nextTick()
    }
    
    expect(vm.bands[3].elements.length).toBe(elementTypes.length)
  })
})
