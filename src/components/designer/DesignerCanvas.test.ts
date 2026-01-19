import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DesignerCanvas from './DesignerCanvas.vue'
import { nextTick } from 'vue'

describe('DesignerCanvas.vue', () => {
  const defaultProps = {
    paperWidth: 595,
    paperHeight: 842,
    zoomLevel: 1,
    bands: [],
    horizontalRulerTicks: [],
    horizontalRulerLabels: [],
    verticalRulerTicks: [],
    verticalRulerLabels: [],
    uiConstants: { GRID_SIZE: 10 },
    reportProperties: { defaultFont: { name: 'Arial', size: 12, isBold: false, isItalic: false, isUnderline: false }, topMargin: 20, bottomMargin: 20, leftMargin: 20, rightMargin: 20 },
    selectedBandIndex: null,
    highlightedBandIndex: null,
    selectedElement: null,
    selectedElements: [],
    editingElement: null,
    isDraggingOrResizing: false,
    alignmentLines: { horizontal: [], vertical: [] },
    isDesignAreaFocused: false,
    outOfBoundsElements: []
  }

  it('synchronizes ruler scrolling with paper container', async () => {
    const wrapper = mount(DesignerCanvas, {
      props: defaultProps,
      global: {
        stubs: {
          ElementFactory: true,
          SelectionBox: true
        }
      }
    })

    const paperContainer = wrapper.find('.paper-container').element as HTMLElement
    const horizontalRuler = wrapper.find('.horizontal-ruler').element as HTMLElement
    const verticalRuler = wrapper.find('.vertical-ruler').element as HTMLElement

    // Simulate scroll
    paperContainer.scrollLeft = 50
    paperContainer.scrollTop = 100
    
    // Dispatch scroll event
    paperContainer.dispatchEvent(new Event('scroll'))
    
    // Wait for DOM updates if necessary (though the listener is synchronous)
    await nextTick()

    expect(horizontalRuler.scrollLeft).toBe(50)
    expect(verticalRuler.scrollTop).toBe(100)
  })
  
  it('cleans up scroll listener on unmount', () => {
    const wrapper = mount(DesignerCanvas, {
      props: defaultProps,
      global: {
        stubs: {
          ElementFactory: true,
          SelectionBox: true
        }
      }
    })
    
    const paperContainer = wrapper.find('.paper-container').element
    const removeEventListenerSpy = vi.spyOn(paperContainer, 'removeEventListener')
    
    wrapper.unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
