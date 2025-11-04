// 文件操作相关的工具函数

import type { ReportData } from '@/types';

// 本地存储键名
const STORAGE_KEYS = {
  REPORT_DATA: 'pdf_report_data',
  REPORT_NAME: 'pdf_report_name',
  AUTO_SAVE: 'pdf_auto_save',
};

// 保存报表数据到本地存储
export function saveToLocalStorage(reportData: ReportData, reportName: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORT_DATA, JSON.stringify(reportData));
    localStorage.setItem(STORAGE_KEYS.REPORT_NAME, reportName);
    localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, new Date().toISOString());
  } catch (error) {
    console.error('保存到本地存储失败:', error);
  }
}

// 从本地存储加载报表数据
export function loadFromLocalStorage(): { reportData: ReportData | null, reportName: string | null } {
  try {
    const reportDataStr = localStorage.getItem(STORAGE_KEYS.REPORT_DATA);
    const reportName = localStorage.getItem(STORAGE_KEYS.REPORT_NAME);
    
    if (reportDataStr && reportDataStr !== 'undefined') {
      const reportData = JSON.parse(reportDataStr);
      return { reportData, reportName };
    }
  } catch (error) {
    console.error('从本地存储加载失败:', error);
  }
  
  return { reportData: null, reportName: null };
}

// 清除本地存储
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.REPORT_DATA);
    localStorage.removeItem(STORAGE_KEYS.REPORT_NAME);
    localStorage.removeItem(STORAGE_KEYS.AUTO_SAVE);
  } catch (error) {
    console.error('清除本地存储失败:', error);
  }
}

// 检查本地存储是否有数据
export function hasLocalStorageData(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.REPORT_DATA);
}

// 获取自动保存时间
export function getAutoSaveTime(): Date | null {
  try {
    const autoSaveStr = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
    if (autoSaveStr) {
      return new Date(autoSaveStr);
    }
  } catch (error) {
    console.error('获取自动保存时间失败:', error);
  }
  return null;
}

// 下载文件
export function downloadFile(content: string, fileName: string, contentType: string = 'application/json'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 下载报表模板
export function downloadReportTemplate(reportData: ReportData, reportName: string): void {
  const content = JSON.stringify(reportData, null, 2);
  const fileName = `${reportName || 'report'}.json`;
  downloadFile(content, fileName, 'application/json');
}

// 下载JRXML文件
export function downloadJRXML(jrxmlContent: string, reportName: string): void {
  const fileName = `${reportName || 'report'}.jrxml`;
  downloadFile(jrxmlContent, fileName, 'application/xml');
}

// 上传文件
export function uploadFile(accept: string = '.json,.jrxml'): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('未选择文件'));
      }
    };
    
    input.oncancel = () => {
      reject(new Error('文件选择已取消'));
    };
    
    input.click();
  });
}

// 读取文件内容
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('无法读取文件内容'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取错误'));
    };
    
    reader.readAsText(file);
  });
}

// 加载JSON报表模板
export async function loadJSONTemplate(): Promise<{ reportData: ReportData, fileName: string }> {
  try {
    const file = await uploadFile('.json');
    const content = await readFileAsText(file);
    const reportData = JSON.parse(content) as ReportData;
    return { reportData, fileName: file.name };
  } catch (error) {
    throw new Error(`加载JSON模板失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 加载JRXML模板
export async function loadJRXMLTemplate(): Promise<{ jrxmlContent: string, fileName: string }> {
  try {
    const file = await uploadFile('.jrxml');
    const content = await readFileAsText(file);
    return { jrxmlContent: content, fileName: file.name };
  } catch (error) {
    throw new Error(`加载JRXML模板失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 验证报表数据
export function validateReportData(reportData: any): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  if (!reportData) {
    errors.push('报表数据为空');
    return { isValid: false, errors };
  }
  
  if (!reportData.name || typeof reportData.name !== 'string') {
    errors.push('报表名称无效');
  }
  
  if (!reportData.bands || !Array.isArray(reportData.bands)) {
    errors.push('报表bands配置无效');
  }
  
  if (!reportData.elements || !Array.isArray(reportData.elements)) {
    errors.push('报表elements配置无效');
  }
  
  // 验证元素
  if (reportData.elements) {
    reportData.elements.forEach((element: any, index: number) => {
      if (!element.type) {
        errors.push(`元素${index}缺少type属性`);
      }
      if (typeof element.x !== 'number' || typeof element.y !== 'number') {
        errors.push(`元素${index}位置坐标无效`);
      }
      if (typeof element.width !== 'number' || typeof element.height !== 'number') {
        errors.push(`元素${index}尺寸无效`);
      }
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 导出报表数据为JSON Blob
export function exportToJSON(reportData: ReportData): Blob {
  const jsonString = JSON.stringify(reportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

// 从JSON文件导入报表数据
export async function importFromJSON(file: File): Promise<ReportData> {
  try {
    const content = await readFileAsText(file);
    return JSON.parse(content) as ReportData;
  } catch (error) {
    throw new Error(`导入JSON失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 导出JRXML内容为Blob
export function exportToJRXML(jrxmlContent: string): Blob {
  return new Blob([jrxmlContent], { type: 'application/xml' });
}

// 从JRXML文件导入内容
export async function importFromJRXML(file: File): Promise<string> {
  try {
    return await readFileAsText(file);
  } catch (error) {
    throw new Error(`导入JRXML失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 验证JRXML格式
export function validateJRXML(jrxmlContent: string): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  try {
    // 基本的XML格式检查
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(jrxmlContent.trim(), 'application/xml');
    
    // 检查解析错误 - 不同浏览器可能有不同的错误检测方式
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      errors.push('XML格式错误: 无法解析XML内容');
      return { isValid: false, errors };
    }
    
    // 检查根元素是否为jasperReport
    const rootElement = xmlDoc.documentElement;
    if (rootElement.tagName !== 'jasperReport') {
      errors.push('JRXML必须以jasperReport作为根元素');
      return { isValid: false, errors };
    }
    
    // 检查必要的属性
    if (!rootElement.hasAttribute('name')) {
      errors.push('jasperReport元素缺少name属性');
    }
    
    if (!rootElement.hasAttribute('pageWidth')) {
      errors.push('jasperReport元素缺少pageWidth属性');
    }
    
    if (!rootElement.hasAttribute('pageHeight')) {
      errors.push('jasperReport元素缺少pageHeight属性');
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`验证JRXML时发生错误: ${error instanceof Error ? error.message : String(error)}`);
    return { isValid: false, errors };
  }
}