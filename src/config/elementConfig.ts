import type { ElementConfig } from '../components/elements/ElementRegistry';

// 元素配置管理
export const elementConfigs: ElementConfig[] = [
  {
    type: 'staticText',
    name: '静态文本',
    icon: '📝',
    defaultProps: {
      type: 'staticText',
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      text: '静态文本',
      fontFamily: 'SansSerif',
      fontSize: 12,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      textAlignment: 'Left',
      verticalAlignment: 'Top'
    }
  },
  {
    type: 'textField',
    name: '动态文本',
    icon: '📊',
    defaultProps: {
      type: 'textField',
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      fieldName: '',
      expression: '',
      isStretchWithOverflow: false,
      evaluationTime: 'Now',
      pattern: '',
      isBlankWhenNull: false,
      fontFamily: 'SansSerif',
      fontSize: 12,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      textAlignment: 'Left',
      verticalAlignment: 'Top'
    }
  },
  {
    type: 'image',
    name: '图片',
    icon: '🖼️',
    defaultProps: {
      type: 'image',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      imagePath: ''
    }
  },
  {
    type: 'line',
    name: '线条',
    icon: '📏',
    defaultProps: {
      type: 'line',
      x: 0,
      y: 0,
      width: 100,
      height: 2,
      lineDirection: 'TopDown',
      lineWidth: 1
    }
  },
  {
    type: 'rectangle',
    name: '矩形',
    icon: '⬜',
    defaultProps: {
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      backcolor: '#f0f0f0'
    }
  }
];

// 元素图标映射
export const elementIcons: Record<string, string> = {
  staticText: '📝',
  textField: '📊',
  image: '🖼️',
  line: '📏',
  rectangle: '⬜'
};

// 元素显示名称映射
export const elementNames: Record<string, string> = {
  staticText: '静态文本',
  textField: '动态文本',
  image: '图片',
  line: '线条',
  rectangle: '矩形'
};

// 获取元素图标
export function getElementIcon(type: string): string {
  return elementIcons[type] || '📄';
}

// 获取元素显示名称
export function getElementName(type: string): string {
  return elementNames[type] || type;
}

// 验证元素类型
export function isValidElementType(type: string): boolean {
  return elementConfigs.some(config => config.type === type);
}

// 获取元素配置
export function getElementConfig(type: string): ElementConfig | undefined {
  return elementConfigs.find(config => config.type === type);
}

// 获取所有元素类型
export function getAllElementTypes(): string[] {
  return elementConfigs.map(config => config.type);
}

// 获取所有元素配置
export function getAllElementConfigs(): ElementConfig[] {
  return [...elementConfigs];
}

// 扩展元素配置
export function extendElementConfig(config: ElementConfig): void {
  const existingIndex = elementConfigs.findIndex(c => c.type === config.type);
  if (existingIndex !== -1) {
    elementConfigs[existingIndex] = {
      ...elementConfigs[existingIndex],
      ...config
    };
  } else {
    elementConfigs.push(config);
    elementIcons[config.type] = config.icon;
    elementNames[config.type] = config.name;
  }
}

// 扩展多个元素配置
export function extendElementConfigs(configs: ElementConfig[]): void {
  configs.forEach(config => extendElementConfig(config));
}
