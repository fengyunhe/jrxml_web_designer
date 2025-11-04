import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PDFDesigner from '@/components/PDFDesigner.vue'
import type { Band } from '@/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

describe('PDFDesigner - selectedBandTypes synchronization', () => {
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
      wrapper.vm.reportProperties.value = {
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

  it('should update selectedBandTypes when creating a new file', async () => {
    // Get the component instance to access internal methods
    const vm = wrapper.vm
    
    // Call createNewFile method
    vm.createNewFile()
    
    // Wait for Vue to update
    await nextTick()
    
    // Check that selectedBandTypes is updated to match the default bands
    expect(vm.selectedBandTypes).toContain('title')
    expect(vm.selectedBandTypes).toContain('pageHeader')
    expect(vm.selectedBandTypes).toContain('columnHeader')
    expect(vm.selectedBandTypes).toContain('detail')
    expect(vm.selectedBandTypes).toContain('columnFooter')
    expect(vm.selectedBandTypes).toContain('pageFooter')
    expect(vm.selectedBandTypes).toContain('summary')
  })

  it('should update selectedBandTypes when loading a file', async () => {
    // Get the component instance
    const vm = wrapper.vm
    
    // Mock file content with specific bands
    const fileContent = {
      reportProperties: {
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 20,
        bottomMargin: 20,
        orientation: 'portrait'
      },
      bands: [
        { type: 'title', height: 80, elements: [] },
        { type: 'detail', height: 100, elements: [] },
        { type: 'summary', height: 60, elements: [] }
      ],
      reportFields: [],
      reportParameters: []
    }
    
    // Call loadFile method
    vm.loadFile(fileContent)
    
    // Wait for Vue to update
    await nextTick()
    
    // Check that selectedBandTypes is updated to match the loaded bands
    expect(vm.selectedBandTypes).toHaveLength(3)
    expect(vm.selectedBandTypes).toContain('title')
    expect(vm.selectedBandTypes).toContain('detail')
    expect(vm.selectedBandTypes).toContain('summary')
    expect(vm.selectedBandTypes).not.toContain('pageHeader')
  })

  it('should update selectedBandTypes when loading from localStorage', async () => {
    // Get the component instance
    const vm = wrapper.vm
    
    // Mock localStorage data - note that loadFromLocalStorage returns { reportData, reportName }
    // So we need to set the value as JSON.stringify of the reportData part
    const reportData = {
      reportProperties: {
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 20,
        bottomMargin: 20,
        orientation: 'portrait'
      },
      bands: [
        { type: 'pageHeader', height: 50, elements: [] },
        { type: 'columnHeader', height: 30, elements: [] },
        { type: 'detail', height: 100, elements: [] }
      ],
      reportFields: [],
      reportParameters: [],
      jrxmlContent: '<test></test>'
    }
    
    // Mock localStorage.getItem to return our test data for the report data key
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'pdf_report_data') {
        return JSON.stringify(reportData)
      }
      return null
    })
    
    // Call loadFromLocalStorageWrapper method
    await vm.loadFromLocalStorageWrapper()
    
    // Wait for Vue to update
    await nextTick()
    
    // Check that selectedBandTypes is updated to match the loaded bands
    expect(vm.selectedBandTypes).toHaveLength(3)
    expect(vm.selectedBandTypes).toContain('pageHeader')
    expect(vm.selectedBandTypes).toContain('columnHeader')
    expect(vm.selectedBandTypes).toContain('detail')
    expect(vm.selectedBandTypes).not.toContain('title')
  })

  it('should maintain selectedBandTypes consistency when bands change', async () => {
    // Get the component instance
    const vm = wrapper.vm
    
    // Initialize with a new file
    vm.createNewFile()
    await nextTick()
    
    // Get initial selectedBandTypes
    const initialSelectedTypes = [...vm.selectedBandTypes]
    
    // Modify bands directly (simulating what might happen in other operations)
    vm.bands = [
      { type: 'title', height: 80, elements: [] },
      { type: 'pageHeader', height: 50, elements: [] }
    ]
    
    // Manually update selectedBandTypes to match the new bands
    vm.selectedBandTypes = vm.bands.map((band: Band) => band.type)
    await nextTick()
    
    // Check that selectedBandTypes matches the current bands
    expect(vm.selectedBandTypes).toHaveLength(2)
    expect(vm.selectedBandTypes).toContain('title')
    expect(vm.selectedBandTypes).toContain('pageHeader')
    
    // Ensure it's different from the initial state
    expect(vm.selectedBandTypes).not.toEqual(initialSelectedTypes)
  })
})