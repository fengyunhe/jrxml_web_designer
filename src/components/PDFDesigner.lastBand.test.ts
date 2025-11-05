import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PDFDesigner from './PDFDesigner.vue';

// 模拟浏览器环境
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => ''
  })
});

// 模拟DOM方法
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0
}));

describe('最后一个band中元素的拖动限制', () => {
  let wrapper: any;
  let vm: any;
  
  beforeEach(async () => {
    // 创建一个基本的报告结构
    const mockReportProperties = {
      name: 'Test Report',
      pageWidth: 595,
      pageHeight: 842,
      leftMargin: 20,
      rightMargin: 20,
      topMargin: 20,
      bottomMargin: 20
    };
    
    const mockBands = [
      {
        type: 'title',
        height: 50,
        elements: []
      },
      {
        type: 'pageHeader',
        height: 40,
        elements: []
      },
      {
        type: 'detail',
        height: 100,
        elements: []
      },
      {
        type: 'pageFooter',
        height: 30,
        elements: [
          {
            id: 'test-element',
            type: 'staticText',
            text: 'Test Text',
            x: 50,
            y: 10,
            width: 100,
            height: 20
          }
        ]
      }
    ];
    
    wrapper = mount(PDFDesigner, {
      props: {
        reportProperties: mockReportProperties,
        bands: mockBands,
        reportFields: []
      }
    });
    
    vm = wrapper.vm;
    
    // 模拟DOM元素
    const mockPaperElement = {
      getBoundingClientRect: () => ({
        top: 100,
        left: 50,
        bottom: 942,
        right: 645,
        width: 595,
        height: 842
      })
    };
    
    const mockBandElements = [
      { // title band
        getBoundingClientRect: () => ({
          top: 120,
          left: 70,
          bottom: 170,
          right: 625,
          width: 555,
          height: 50
        })
      },
      { // pageHeader band
        getBoundingClientRect: () => ({
          top: 170,
          left: 70,
          bottom: 210,
          right: 625,
          width: 555,
          height: 40
        })
      },
      { // detail band
        getBoundingClientRect: () => ({
          top: 210,
          left: 70,
          bottom: 310,
          right: 625,
          width: 555,
          height: 100
        })
      },
      { // pageFooter band (最后一个band)
        getBoundingClientRect: () => ({
          top: 310,
          left: 70,
          bottom: 340,
          right: 625,
          width: 555,
          height: 30
        })
      }
    ];
    
    // 模拟document.querySelector
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '.paper') {
        return mockPaperElement as any;
      }
      return null;
    });
    
    // 模拟document.querySelectorAll
    vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
      if (selector === '.band') {
        return mockBandElements as any;
      }
      return [];
    });
  });
  
  it('应该限制最后一个band中的元素不能超出band的顶部边界', () => {
    // 设置拖动信息，模拟在最后一个band中拖动元素
    vm.draggingInfo.value = {
      bandIndex: 3, // 最后一个band
      elementIndex: 0,
      startX: 0,
      startY: 0
    };
    
    // 模拟鼠标移动事件，尝试将元素移动到band顶部之上
    const mockEvent = {
      clientX: 100,
      clientY: 100 // 这个位置会导致元素超出band的顶部
    };
    
    // 执行拖动逻辑
    vm.cachedMouseMoveHandler(mockEvent);
    
    // 验证元素的y坐标被限制在band范围内
    const element = vm.bands.value[3].elements[0];
    expect(element.y).toBeGreaterThanOrEqual(0); // 相对于band的坐标应该>=0
  });
  
  it('应该限制最后一个band中的元素不能超出band的底部边界', () => {
    // 设置拖动信息，模拟在最后一个band中拖动元素
    vm.draggingInfo.value = {
      bandIndex: 3, // 最后一个band
      elementIndex: 0,
      startX: 0,
      startY: 0
    };
    
    // 模拟鼠标移动事件，尝试将元素移动到band底部之下
    const mockEvent = {
      clientX: 100,
      clientY: 400 // 这个位置会导致元素超出band的底部
    };
    
    // 执行拖动逻辑
    vm.cachedMouseMoveHandler(mockEvent);
    
    // 验证元素的y坐标被限制在band范围内
    const element = vm.bands.value[3].elements[0];
    const bandHeight = vm.bands.value[3].height;
    expect(element.y + element.height).toBeLessThanOrEqual(bandHeight); // 元素底部应该在band内
  });
  
  it('应该允许非最后一个band中的元素正常拖动', () => {
    // 设置拖动信息，模拟在非最后一个band中拖动元素
    vm.draggingInfo.value = {
      bandIndex: 2, // 非最后一个band
      elementIndex: 0,
      startX: 0,
      startY: 0
    };
    
    // 模拟鼠标移动事件
    const mockEvent = {
      clientX: 100,
      clientY: 250
    };
    
    // 执行拖动逻辑
    vm.cachedMouseMoveHandler(mockEvent);
    
    // 验证元素可以正常移动
    const element = vm.bands.value[2].elements[0];
    expect(element.y).toBeDefined();
  });
});