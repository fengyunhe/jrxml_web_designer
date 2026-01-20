import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { createApp } from 'vue'

// 模拟i18n翻译函数
const mockT = (key: string) => {
  // 简单的键值映射
  const translations: Record<string, string> = {
    'app.title': 'PDF模板设计器',
    'actions.undo': '撤销',
    'actions.redo': '重做',
    'actions.hideLeftPanel': '隐藏左侧面板',
    'actions.showLeftPanel': '显示左侧面板',
    'actions.hideRightPanel': '隐藏右侧面板',
    'actions.showRightPanel': '显示右侧面板',
    'actions.hideBottomPanel': '隐藏底部面板',
    'actions.showBottomPanel': '显示底部面板',
    'actions.snapToGrid': '吸附到网格',
    'actions.snapToAlignment': '对齐吸附',
    'actions.previewPDF': '预览PDF',
    'actions.generateJRXML': '生成JRXML',
    'actions.donate': '打赏',
    'actions.help': '使用说明',
    'properties.defaultStaticText': '静态文本',
    'properties.defaultTextFieldExpression': '动态文本',
    'elementNames.staticText': '静态文本',
    'elementNames.textField': '动态文本',
    'elementNames.image': '图片',
    'elementNames.line': '线条',
    'elementNames.rectangle': '矩形',
    'elementNames.ellipse': '椭圆',
    'elementNames.break': '分页符',
    'elementNames.frame': '容器'
  }
  return translations[key] || key
}

// 模拟vue-i18n模块
vi.mock('vue-i18n', () => {
  // 创建一个简单的mock i18n实例
  const mockI18nInstance = {
    global: {
      locale: {
        value: 'zh-CN'
      },
      messages: {
        'zh-CN': {
          app: {
            title: 'PDF模板设计器'
          }
        }
      }
    }
  }

  return {
    createI18n: () => mockI18nInstance,
    useI18n: () => ({
      t: mockT,
      locale: 'zh-CN',
      availableLocales: ['zh-CN', 'en']
    })
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)