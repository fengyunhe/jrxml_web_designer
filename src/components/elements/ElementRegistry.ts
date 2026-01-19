import type { DesignElement } from '../../types';

// 元素配置接口
export interface ElementConfig {
  type: string;
  name: string;
  icon: string;
  defaultProps: Partial<DesignElement>;
  component?: any;
  validator?: (element: DesignElement) => boolean;
  serializer?: (element: DesignElement) => any;
  deserializer?: (data: any) => DesignElement;
}

// 元素注册器类
export class ElementRegistry {
  private static instance: ElementRegistry;
  private elements: Map<string, ElementConfig> = new Map();

  private constructor() {
    this.registerDefaultElements();
  }

  public static getInstance(): ElementRegistry {
    if (!ElementRegistry.instance) {
      ElementRegistry.instance = new ElementRegistry();
    }
    return ElementRegistry.instance;
  }

  // 注册默认元素
  private registerDefaultElements(): void {
    this.registerElement({
      type: 'staticText',
      name: '静态文本',
      icon: 'T',
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
    });

    this.registerElement({
      type: 'textField',
      name: '动态文本',
      icon: '{ }',
      defaultProps: {
        type: 'textField',
        x: 0,
        y: 0,
        width: 100,
        height: 30,
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
    });

    this.registerElement({
      type: 'image',
      name: '图片',
      icon: '🖼',
      defaultProps: {
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        imageExpression: ''
      }
    });

    this.registerElement({
      type: 'line',
      name: '线条',
      icon: '─',
      defaultProps: {
        type: 'line',
        x: 0,
        y: 0,
        width: 100,
        height: 2,
        lineDirection: 'TopDown',
        lineWidth: 1
      }
    });

    this.registerElement({
      type: 'rectangle',
      name: '矩形',
      icon: '▭',
      defaultProps: {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        backcolor: '#f0f0f0'
      }
    });
  }

  // 注册元素
  public registerElement(config: ElementConfig): void {
    this.elements.set(config.type, config);
  }

  // 注册多个元素
  public registerElements(configs: ElementConfig[]): void {
    configs.forEach(config => this.registerElement(config));
  }

  // 获取元素配置
  public getElementConfig(type: string): ElementConfig | undefined {
    return this.elements.get(type);
  }

  // 获取所有元素配置
  public getAllElements(): ElementConfig[] {
    return Array.from(this.elements.values());
  }

  // 获取元素类型列表
  public getElementTypes(): string[] {
    return Array.from(this.elements.keys());
  }

  // 创建元素实例
  public createElement(type: string, overrides: Partial<DesignElement> = {}): DesignElement {
    const config = this.getElementConfig(type);
    if (!config) {
      throw new Error(`Unknown element type: ${type}`);
    }

    return {
      ...config.defaultProps,
      ...overrides,
      type
    } as DesignElement;
  }

  // 验证元素
  public validateElement(element: DesignElement): boolean {
    const config = this.getElementConfig(element.type);
    if (!config) {
      return false;
    }

    if (config.validator) {
      return config.validator(element);
    }

    // 默认验证：检查必要属性
    return typeof element.x === 'number' &&
           typeof element.y === 'number' &&
           typeof element.width === 'number' &&
           typeof element.height === 'number' &&
           element.width >= 0 &&
           element.height >= 0;
  }

  // 序列化元素
  public serializeElement(element: DesignElement): any {
    const config = this.getElementConfig(element.type);
    if (config?.serializer) {
      return config.serializer(element);
    }

    // 默认序列化
    return { ...element };
  }

  // 反序列化元素
  public deserializeElement(type: string, data: any): DesignElement {
    const config = this.getElementConfig(type);
    if (!config) {
      throw new Error(`Unknown element type: ${type}`);
    }

    if (config.deserializer) {
      return config.deserializer(data);
    }

    // 默认反序列化
    return {
      ...config.defaultProps,
      ...data,
      type
    } as DesignElement;
  }

  // 加载元素组件
  public async loadElementComponent(type: string): Promise<any> {
    const config = this.getElementConfig(type);
    if (!config) {
      throw new Error(`Unknown element type: ${type}`);
    }

    if (config.component) {
      return config.component;
    }

    // 动态加载组件
    try {
      const componentMap: Record<string, string> = {
        staticText: './StaticTextElement.vue',
        textField: './TextFieldElement.vue',
        image: './ImageElement.vue',
        line: './LineElement.vue',
        rectangle: './RectangleElement.vue'
      };

      const componentPath = componentMap[type];
      if (componentPath) {
        const module = await import(componentPath);
        config.component = module.default;
        return module.default;
      }
    } catch (error) {
      console.error(`Failed to load component for element type ${type}:`, error);
    }

    return null;
  }

  // 检查元素类型是否存在
  public hasElement(type: string): boolean {
    return this.elements.has(type);
  }

  // 移除元素类型
  public removeElement(type: string): boolean {
    return this.elements.delete(type);
  }

  // 清空所有元素
  public clearElements(): void {
    this.elements.clear();
  }
}

// 导出默认实例
export const elementRegistry = ElementRegistry.getInstance();

// 导出注册辅助函数
export function registerElement(config: ElementConfig): void {
  elementRegistry.registerElement(config);
}

export function registerElements(configs: ElementConfig[]): void {
  elementRegistry.registerElements(configs);
}

export function createElement(type: string, overrides: Partial<DesignElement> = {}): DesignElement {
  return elementRegistry.createElement(type, overrides);
}

export function getElementConfig(type: string): ElementConfig | undefined {
  return elementRegistry.getElementConfig(type);
}

export function getAllElements(): ElementConfig[] {
  return elementRegistry.getAllElements();
}
