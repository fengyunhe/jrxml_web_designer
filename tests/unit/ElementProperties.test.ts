import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementProperties from '@/components/designer/properties/ElementProperties.vue';

// Mock getAvailableFonts
vi.mock('@/utils/fontUtils', () => ({
  getAvailableFonts: vi.fn().mockResolvedValue(['Arial', 'Times New Roman']),
}));

describe('ElementProperties.vue', () => {
  const mockBands = [
    {
      type: 'detail',
      height: 100,
      elements: [
        {
          uuid: 'test-rect',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          pen: { lineWidth: 2, lineStyle: 'Dashed', lineColor: '#FF0000' }
        },
        {
          uuid: 'test-transparent',
          type: 'rectangle',
          x: 10,
          y: 10,
          width: 100,
          height: 100,
          mode: 'Transparent'
        },
        {
          uuid: 'test-text',
          type: 'staticText',
          x: 20,
          y: 20,
          width: 100,
          height: 20,
          box: {
            pen: { lineWidth: 3, lineStyle: 'Dotted', lineColor: '#0000FF' }
          }
        }
      ]
    }
  ];

  const createWrapper = (selectedElement: any) => {
    return mount(ElementProperties, {
      props: {
        selectedBandIndex: 0,
        selectedElement: selectedElement,
        bands: mockBands as any,
        reportProperties: {}
      }
    });
  };

  it('should display correct unified border properties for rectangle', async () => {
    const wrapper = createWrapper({ bandIndex: 0, elementIndex: 0, uuid: 'test-rect' });
    
    // Switch to Box tab
    await wrapper.findAll('.element-tab-button')[1].trigger('click');
    
    // 对于矩形元素，使用更准确的选择器，按照DOM结构顺序查找
    const borderControls = wrapper.findAll('.border-side-group');
    
    // 样式选择器 - 第一个控制组的select
    const styleSelect = borderControls[0].find('select');
    // 宽度输入框 - 第二个控制组的input
    const widthInput = borderControls[1].find('input');
    // 颜色选择器 - 第三个控制组的input[type="color"]
    const colorInput = borderControls[2].find('input[type="color"]');

    expect((widthInput.element as HTMLInputElement).value).toBe('2');
    expect((styleSelect.element as HTMLSelectElement).value).toBe('Dashed');
    expect((colorInput.element as HTMLInputElement).value).toBe('#ff0000');
  });

  it('should fallback to global box.pen properties when side properties are missing for text element', async () => {
    const wrapper = createWrapper({ bandIndex: 0, elementIndex: 2, uuid: 'test-text' });
    
    // Switch to Box tab
    await wrapper.findAll('.element-tab-button')[1].trigger('click');
    
    // For text element, it shows "Each Side Border Settings"
    // We check the first input group (Top Border)
    // The structure is: div.border-side-group -> select (style), input (width), input (color)
    
    const groups = wrapper.findAll('.border-side-group');
    // Top is likely the first one in "Each Side Border Settings" section
    // Actually, "Each Side Border Settings" is after "Quick Settings"
    // Let's find the inputs specifically.
    // The inputs have value bound.
    
    // Since all sides fallback to the global pen, they should all have the same values.
    // We can check one of them.
    
    const widthInputs = wrapper.findAll('input.width-control');
    // Expect 4 inputs (top, left, bottom, right) to have value 3
    expect(widthInputs.length).toBeGreaterThanOrEqual(4);
    expect((widthInputs[0].element as HTMLInputElement).value).toBe('3');
    
    const styleSelects = wrapper.findAll('select.side-control');
    // Expect 4 selects to have value 'Dotted'
    expect(styleSelects.length).toBeGreaterThanOrEqual(4);
    expect((styleSelects[0].element as HTMLSelectElement).value).toBe('Dotted');
    
    const colorInputs = wrapper.findAll('input.color-control');
    expect(colorInputs.length).toBeGreaterThanOrEqual(4);
    expect((colorInputs[0].element as HTMLInputElement).value).toBe('#0000ff');
  });

  it('should auto-set mode to Opaque when background color is set', async () => {
    const wrapper = createWrapper({ bandIndex: 0, elementIndex: 1, uuid: 'test-transparent' });
    
    // Switch to Style tab
    await wrapper.findAll('.element-tab-button')[2].trigger('click');
    
    const colorInput = wrapper.find('input[placeholder="#RRGGBB 或 rgba(...)"]');
    await colorInput.setValue('#00FF00');
    await colorInput.trigger('change'); // Trigger onBackcolorChange

    // Check emitted update-jrxml
    expect(wrapper.emitted('update-jrxml')).toBeTruthy();
    
    // Check if mode was updated in the bound data
    expect(mockBands[0].elements[1].mode).toBe('Opaque');
  });
});
