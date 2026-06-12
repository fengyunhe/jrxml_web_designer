import type { DesignElement } from '../../types';

// 元素配置接口
export interface ElementConfig {
  type: string;
  name: string;
  icon: string;
  category?: string;
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
      name: 'elementNames.staticText',
      icon: 'T',
      category: 'text',
      defaultProps: {
        type: 'staticText',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        text: '静态文本',
        markup: 'none',
        textAdjust: 'CutText',
        rotation: 'None',
        // 样式属性
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
      name: 'elementNames.textField',
      icon: '{ }',
      category: 'text',
      defaultProps: {
        type: 'textField',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        expression: '"文本域"',
        evaluationTime: 'Now',
        evaluationGroup: '',
        pattern: '',
        isBlankWhenNull: false,
        hyperlinkType: 'None',
        bookmarkLevel: 0,
        isIgnorePagination: false,
        // 过时属性（向后兼容）
        isStretchWithOverflow: false,
        // 样式属性
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
      name: 'elementNames.image',
      icon: '🖼',
      category: 'shape',
      defaultProps: {
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        imageExpression: '"https://raw.githubusercontent.com/fengyunhe/jrxml_web_designer/refs/heads/master/src/assets/FIREGOD_CN.jpg"',
        scaleType: 'FillFrame',
        hAlign: 'Center',
        vAlign: 'Middle',
        isUsingCache: true,
        isLazy: false,
        onErrorType: 'Error',
        evaluationTime: 'Now'
      }
    });

    this.registerElement({
      type: 'line',
      name: 'elementNames.line',
      icon: '─',
      category: 'shape',
      defaultProps: {
        type: 'line',
        x: 0,
        y: 0,
        width: 100,
        height: 2,
        lineDirection: 'TopDown',
        lineWidth: 1,
        // 新增属性
        isPrintRepeatedValues: true,
        printWhenExpression: ''
      }
    });

    this.registerElement({
      type: 'rectangle',
      name: 'elementNames.rectangle',
      icon: '▭',
      category: 'shape',
      defaultProps: {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        mode: 'Transparent',
        // 新增属性
        isPrintRepeatedValues: true,
        isRemoveLineWhenBlank: false,
        printWhenExpression: ''
      }
    });

    this.registerElement({
      type: 'ellipse',
      name: 'elementNames.ellipse',
      icon: '◯',
      category: 'shape',
      defaultProps: {
        type: 'ellipse',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        mode: 'Transparent',
        // 新增属性
        isPrintRepeatedValues: true,
        isRemoveLineWhenBlank: false,
        printWhenExpression: ''
      }
    });

    this.registerElement({
      type: 'break',
      name: 'elementNames.break',
      icon: '⤓',
      category: 'container',
      defaultProps: {
        type: 'break',
        x: 0,
        y: 0,
        width: 100,
        height: 1, // Break通常很扁
        breakType: 'Page',
        // 新增属性
        isResetPageNumber: false
      }
    });

    this.registerElement({
      type: 'frame',
      name: 'elementNames.frame',
      icon: '☐',
      category: 'container',
      defaultProps: {
        type: 'frame',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        backcolor: '#FFFFFF',
        mode: 'Transparent', // 默认为透明
        elements: [],
        layout: 'FreeLayout',
        // 新增属性
        printWhenExpression: '',
        isIgnorePagination: false,
        isSplitAllowed: true,
        splitType: 'Stretch',
        isRemoveLineWhenBlank: false,
        isPrintRepeatedValues: true
      }
    });

    this.registerElement({
      type: 'table',
      name: 'elementNames.table',
      icon: '⊞',
      category: 'container',
      defaultProps: {
        type: 'table',
        x: 0,
        y: 0,
        width: 555,
        height: 60,
        dataset: {
          uuid: crypto.randomUUID(),
          name: 'tableDataset'
        },
        columns: [
          {
            uuid: crypto.randomUUID(),
            width: 160,
            name: 'Column1',
            tableHeader: {
              enable: false,
              element: {
                type: 'staticText',
                x: 0,
                y: 0,
                width: 160,
                height: 30,
                text: 'Header',
                forecolor: '#000000',
                backcolor: '#FFFFFF',
                fontFamily: 'SansSerif',
                fontSize: 19,
                isBold: true,
                textAlignment: 'Center',
                verticalAlignment: 'Middle'
              }
            },
            columnHeader: {
              enable: true,
              element: {
                type: 'staticText',
                x: 0,
                y: 0,
                width: 160,
                height: 30,
                text: 'Column Header',
                textAlignment: 'Center',
                verticalAlignment: 'Middle'
              }
            },
            detailCell: {
              enable: true,
              element: {
                type: 'textField',
                x: 0,
                y: 0,
                width: 160,
                height: 30,
                expression: '$F{FIELD_NAME}',
                textAlignment: 'Center',
                verticalAlignment: 'Middle'
              }
            }
          },
          {
            uuid: crypto.randomUUID(),
            width: 180,
            name: 'Column2',
            tableHeader: {
              enable: false,
              element: {
                type: 'staticText',
                x: 0,
                y: 0,
                width: 180,
                height: 30,
                text: '',
                forecolor: '#000000',
                backcolor: '#FFFFFF',
                fontFamily: 'SansSerif',
                fontSize: 19,
                isBold: true,
                textAlignment: 'Center',
                verticalAlignment: 'Middle'
              }
            },
            columnHeader: {
              enable: true,
              element: {
                type: 'staticText',
                x: 0,
                y: 0,
                width: 180,
                height: 30,
                text: 'Column Header',
                textAlignment: 'Center',
                verticalAlignment: 'Middle'
              }
            },
            detailCell: {
              enable: true,
              element: {
                type: 'textField',
                x: 0,
                y: 0,
                width: 180,
                height: 30,
                expression: '$F{FIELD_NAME}',
                textAlignment: 'Center',
                verticalAlignment: 'Middle'
              }
            }
          }
        ],
        styles: {
          tableHeader: 'Table_TH',
          columnHeader: 'Table_CH',
          detail: 'Table_TD'
        },
        whenNoDataType: 'AllSectionsNoDetail'
      }
    });

    // 子报表元素
    this.registerElement({
      type: 'subreport',
      name: 'elementNames.subreport',
      icon: '📋',
      category: 'container',
      defaultProps: {
        type: 'subreport',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        subreportExpression: '""',
        parametersMapExpression: '',
        connectionExpression: '',
        dataSourceExpression: '',
        evaluationTime: 'Now',
        printWhenExpression: '',
        isUsingCache: false,
        isIgnorePagination: false
      }
    });

    // 列表元素
    this.registerElement({
      type: 'list',
      name: 'elementNames.list',
      icon: '📝',
      category: 'container',
      defaultProps: {
        type: 'list',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        listContents: {
          elements: [],
          height: 100
        },
        printWhenExpression: '',
        evaluationTime: 'Now',
        splitType: 'Stretch'
      }
    });

    // 图表元素
    this.registerElement({
      type: 'chart',
      name: 'elementNames.chart',
      icon: '📊',
      category: 'shape',
      defaultProps: {
        type: 'chart',
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        chartType: 'pie',
        title: 'Chart',
        titleExpression: '',
        subtitleExpression: '',
        legendExpression: '',
        evaluationTime: 'Now',
        printWhenExpression: ''
      }
    });

    // 条码元素
    this.registerElement({
      type: 'barcode',
      name: 'elementNames.barcode',
      icon: '▌▐',
      category: 'shape',
      defaultProps: {
        type: 'barcode',
        x: 0,
        y: 0,
        width: 150,
        height: 60,
        barcodeType: 'Code128',
        codeExpression: '"1234567890"',
        evaluationTime: 'Now',
        printWhenExpression: ''
      }
    });

    // 地图元素
    this.registerElement({
      type: 'map',
      name: 'elementNames.map',
      icon: '📍',
      category: 'container',
      defaultProps: {
        type: 'map',
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        mapType: 'html',
        latExpression: '',
        lngExpression: '',
        zoomExpression: '',
        languageExpression: '',
        evaluationTime: 'Now',
        printWhenExpression: ''
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

  // 按分类获取元素配置
  public getByCategory(category: string): ElementConfig[] {
    return Array.from(this.elements.values()).filter(e => e.category === category);
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
        rectangle: './RectangleElement.vue',
        ellipse: './EllipseElement.vue',
        break: './BreakElement.vue',
        frame: './FrameElement.vue',
        table: './TableElement.vue'
      };

      const componentPath = componentMap[type];
      if (componentPath) {
        const module = await import(/* @vite-ignore */ componentPath);
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
