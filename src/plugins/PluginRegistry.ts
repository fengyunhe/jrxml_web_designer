import type { DesignElement, Band, ReportProperties } from '../types';

// 插件接口
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  
  // 插件初始化
  initialize?: () => void;
  
  // 插件销毁
  destroy?: () => void;
  
  // 元素相关钩子
  onElementCreated?: (element: DesignElement, bandIndex: number, elementIndex: number) => void;
  onElementSelected?: (element: DesignElement, bandIndex: number, elementIndex: number) => void;
  onElementModified?: (element: DesignElement, bandIndex: number, elementIndex: number) => void;
  onElementDeleted?: (element: DesignElement, bandIndex: number, elementIndex: number) => void;
  
  // Band相关钩子
  onBandCreated?: (band: Band) => void;
  onBandModified?: (band: Band) => void;
  onBandDeleted?: (band: Band) => void;
  
  // 报表相关钩子
  onReportLoaded?: (reportProperties: ReportProperties) => void;
  onReportSaved?: (reportProperties: ReportProperties) => void;
  
  // 自定义元素类型
  customElements?: Array<{
    type: string;
    name: string;
    icon: string;
    defaultProps: Partial<DesignElement>;
    component?: any;
  }>;
}

// 插件注册器类
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, Plugin> = new Map();
  private initializedPlugins: Set<string> = new Set();

  private constructor() {
    // 初始化时加载内置插件
    this.loadBuiltInPlugins();
  }

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  // 加载内置插件
  private loadBuiltInPlugins(): void {
    // 这里可以加载内置插件
    // 例如：this.registerPlugin(builtInPlugin);
  }

  // 注册插件
  public registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id ${plugin.id} already registered.`);
      return;
    }

    this.plugins.set(plugin.id, plugin);
    console.log(`Plugin ${plugin.name} v${plugin.version} registered.`);
  }

  // 注册多个插件
  public registerPlugins(plugins: Plugin[]): void {
    plugins.forEach(plugin => this.registerPlugin(plugin));
  }

  // 卸载插件
  public unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin with id ${pluginId} not found.`);
      return false;
    }

    // 销毁插件
    if (plugin.destroy && this.initializedPlugins.has(pluginId)) {
      plugin.destroy();
      this.initializedPlugins.delete(pluginId);
    }

    this.plugins.delete(pluginId);
    console.log(`Plugin ${plugin.name} unregistered.`);
    return true;
  }

  // 获取插件
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  // 获取所有插件
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // 初始化所有插件
  public initializeAllPlugins(): void {
    this.plugins.forEach((plugin, pluginId) => {
      if (plugin.initialize && !this.initializedPlugins.has(pluginId)) {
        try {
          plugin.initialize();
          this.initializedPlugins.add(pluginId);
          console.log(`Plugin ${plugin.name} initialized.`);
        } catch (error) {
          console.error(`Failed to initialize plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 销毁所有插件
  public destroyAllPlugins(): void {
    this.plugins.forEach((plugin, pluginId) => {
      if (plugin.destroy && this.initializedPlugins.has(pluginId)) {
        try {
          plugin.destroy();
          this.initializedPlugins.delete(pluginId);
          console.log(`Plugin ${plugin.name} destroyed.`);
        } catch (error) {
          console.error(`Failed to destroy plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发元素创建事件
  public triggerElementCreated(element: DesignElement, bandIndex: number, elementIndex: number): void {
    this.plugins.forEach(plugin => {
      if (plugin.onElementCreated) {
        try {
          plugin.onElementCreated(element, bandIndex, elementIndex);
        } catch (error) {
          console.error(`Error in onElementCreated hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发元素选择事件
  public triggerElementSelected(element: DesignElement, bandIndex: number, elementIndex: number): void {
    this.plugins.forEach(plugin => {
      if (plugin.onElementSelected) {
        try {
          plugin.onElementSelected(element, bandIndex, elementIndex);
        } catch (error) {
          console.error(`Error in onElementSelected hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发元素修改事件
  public triggerElementModified(element: DesignElement, bandIndex: number, elementIndex: number): void {
    this.plugins.forEach(plugin => {
      if (plugin.onElementModified) {
        try {
          plugin.onElementModified(element, bandIndex, elementIndex);
        } catch (error) {
          console.error(`Error in onElementModified hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发元素删除事件
  public triggerElementDeleted(element: DesignElement, bandIndex: number, elementIndex: number): void {
    this.plugins.forEach(plugin => {
      if (plugin.onElementDeleted) {
        try {
          plugin.onElementDeleted(element, bandIndex, elementIndex);
        } catch (error) {
          console.error(`Error in onElementDeleted hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发Band创建事件
  public triggerBandCreated(band: Band): void {
    this.plugins.forEach(plugin => {
      if (plugin.onBandCreated) {
        try {
          plugin.onBandCreated(band);
        } catch (error) {
          console.error(`Error in onBandCreated hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发Band修改事件
  public triggerBandModified(band: Band): void {
    this.plugins.forEach(plugin => {
      if (plugin.onBandModified) {
        try {
          plugin.onBandModified(band);
        } catch (error) {
          console.error(`Error in onBandModified hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发Band删除事件
  public triggerBandDeleted(band: Band): void {
    this.plugins.forEach(plugin => {
      if (plugin.onBandDeleted) {
        try {
          plugin.onBandDeleted(band);
        } catch (error) {
          console.error(`Error in onBandDeleted hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发报表加载事件
  public triggerReportLoaded(reportProperties: ReportProperties): void {
    this.plugins.forEach(plugin => {
      if (plugin.onReportLoaded) {
        try {
          plugin.onReportLoaded(reportProperties);
        } catch (error) {
          console.error(`Error in onReportLoaded hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 触发报表保存事件
  public triggerReportSaved(reportProperties: ReportProperties): void {
    this.plugins.forEach(plugin => {
      if (plugin.onReportSaved) {
        try {
          plugin.onReportSaved(reportProperties);
        } catch (error) {
          console.error(`Error in onReportSaved hook for plugin ${plugin.name}:`, error);
        }
      }
    });
  }

  // 获取所有自定义元素
  public getCustomElements(): Array<{
    type: string;
    name: string;
    icon: string;
    defaultProps: Partial<DesignElement>;
    component?: any;
  }> {
    const customElements: Array<{
      type: string;
      name: string;
      icon: string;
      defaultProps: Partial<DesignElement>;
      component?: any;
    }> = [];

    this.plugins.forEach(plugin => {
      if (plugin.customElements) {
        customElements.push(...plugin.customElements);
      }
    });

    return customElements;
  }
}

// 导出默认实例
export const pluginRegistry = PluginRegistry.getInstance();

// 导出注册辅助函数
export function registerPlugin(plugin: Plugin): void {
  pluginRegistry.registerPlugin(plugin);
}

export function registerPlugins(plugins: Plugin[]): void {
  pluginRegistry.registerPlugins(plugins);
}

export function getPlugin(pluginId: string): Plugin | undefined {
  return pluginRegistry.getPlugin(pluginId);
}

export function getAllPlugins(): Plugin[] {
  return pluginRegistry.getAllPlugins();
}

export function initializeAllPlugins(): void {
  pluginRegistry.initializeAllPlugins();
}

export function destroyAllPlugins(): void {
  pluginRegistry.destroyAllPlugins();
}
