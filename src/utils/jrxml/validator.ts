// @ts-nocheck
/**
 * JRXML编译验证器
 * 用于验证生成的JRXML是否符合JasperReports规范
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ValidationRule {
  name: string;
  validate: (content: string) => boolean;
  errorMessage: string;
}

export class JRXMLValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // 规则1：XML声明
    this.rules.push({
      name: 'XML声明',
      validate: (content) => content.trim().startsWith('<?xml version="1.0"'),
      errorMessage: 'JRXML必须以XML声明开始'
    });

    // 规则2：jasperReport根元素
    this.rules.push({
      name: 'jasperReport根元素',
      validate: (content) => /<jasperReport[\s>]/.test(content),
      errorMessage: '缺少jasperReport根元素'
    });

    // 规则3：必要的jasperReport属性
    this.rules.push({
      name: 'jasperReport必要属性',
      validate: (content) => {
        const requiredAttrs = ['name', 'pageWidth', 'pageHeight', 'columnWidth'];
        return requiredAttrs.every(attr => new RegExp(`${attr}="[^"]*"`).test(content));
      },
      errorMessage: 'jasperReport缺少必要的属性(name, pageWidth, pageHeight, columnWidth)'
    });

    // 规则4：UUID属性
    this.rules.push({
      name: 'UUID属性',
      validate: (content) => /uuid="[^"]*"/.test(content),
      errorMessage: 'jasperReport缺少uuid属性'
    });

    // 规则5：reportElement中的UUID
    this.rules.push({
      name: 'reportElement UUID',
      validate: (content) => {
        const reportElements = content.match(/<reportElement[^>]*>/g) || [];
        return reportElements.every(elem => /uuid="[^"]*"/.test(elem));
      },
      errorMessage: 'reportElement缺少uuid属性'
    });

    // 规则6：TextField表达式
    this.rules.push({
      name: 'TextField表达式',
      validate: (content) => {
        if (!content.includes('<textField')) return true;
        return content.includes('<textFieldExpression>');
      },
      errorMessage: 'textField缺少textFieldExpression'
    });

    // 规则7：Image表达式
    this.rules.push({
      name: 'Image表达式',
      validate: (content) => {
        if (!content.includes('<image>')) return true;
        return content.includes('<imageExpression>');
      },
      errorMessage: 'image缺少imageExpression'
    });

    // 规则8：band属性
    this.rules.push({
      name: 'band属性',
      validate: (content) => {
        const bands = content.match(/<band[^>]*>/g) || [];
        return bands.every(band => /height="\d+"/.test(band));
      },
      errorMessage: 'band缺少height属性'
    });

    // 规则9：字段定义语法
    this.rules.push({
      name: '字段定义语法',
      validate: (content) => {
        const fields = content.match(/<field[^>]*>/g) || [];
        return fields.every(field => /name="[^"]*"/.test(field) && /class="[^"]*"/.test(field));
      },
      errorMessage: 'field缺少name或class属性'
    });

    // 规则10：样式引用有效性
    this.rules.push({
      name: '样式引用有效性',
      validate: (content) => {
        const styles = content.match(/<style[^>]*name="([^"]*)"/g) || [];
        const styleNames = styles.map(s => s.match(/name="([^"]*)"/)?.[1] || '');

        const elements = content.match(/style="([^"]*)"/g) || [];
        const referencedStyles = elements.map(e => e.match(/style="([^"]*)"/)?.[1] || '');

        return referencedStyles.every(ref => styleNames.includes(ref) || ref === '');
      },
      errorMessage: '引用的样式未定义'
    });

    // 规则11：表达式语法
    this.rules.push({
      name: '表达式语法',
      validate: (content) => {
        const expressions = content.match(/<textFieldExpression><!\[CDATA\[(.*?)\]\]><\/textFieldExpression>/g) || [];
        return expressions.every(expr => {
          const exprContent = expr.match(/CDATA\[(.*?)\]/)?.[1] || '';
          // 基本的表达式语法检查
          return exprContent.includes('$F{') || exprContent.includes('"') || exprContent.includes('$P{');
        });
      },
      errorMessage: '表达式语法错误'
    });

    // 规则12：元素位置有效性
    this.rules.push({
      name: '元素位置有效性',
      validate: (content) => {
        const elements = content.match(/<reportElement[^>]*>/g) || [];
        return elements.every(elem => {
          const x = parseInt(elem.match(/x="(\d+)"/)?.[1] || '0');
          const y = parseInt(elem.match(/y="(\d+)"/)?.[1] || '0');
          const width = parseInt(elem.match(/width="(\d+)"/)?.[1] || '0');
          const height = parseInt(elem.match(/height="(\d+)"/)?.[1] || '0');
          return x >= 0 && y >= 0 && width >= 0 && height >= 0;
        });
      },
      errorMessage: '元素位置或大小无效'
    });

    // 规则13：字体属性有效性
    this.rules.push({
      name: '字体属性有效性',
      validate: (content) => {
        const fonts = content.match(/<font[^>]*>/g) || [];
        return fonts.every(font => {
          const size = font.match(/size="(\d+)"/)?.[1];
          return !size || parseInt(size) > 0;
        });
      },
      errorMessage: '字体大小无效'
    });

    // 规则14：边框属性有效性
    this.rules.push({
      name: '边框属性有效性',
      validate: (content) => {
        const pens = content.match(/<pen[^>]*>/g) || [];
        return pens.every(pen => {
          const lineWidth = pen.match(/lineWidth="([^"]*)"/)?.[1];
          if (!lineWidth) return true;
          const width = parseFloat(lineWidth);
          return !isNaN(width) && width >= 0;
        });
      },
      errorMessage: '边框宽度无效'
    });
  }

  /**
   * 验证JRXML内容
   */
  validate(content: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      try {
        if (!rule.validate(content)) {
          errors.push(`[${rule.name}] ${rule.errorMessage}`);
        }
      } catch (error) {
        warnings.push(`[${rule.name}] 验证时发生错误: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证JRXML文件
   */
  validateFile(filePath: string): { valid: boolean; errors: string[]; warnings: string[] } {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.validate(content);
    } catch (error) {
      return {
        valid: false,
        errors: [`无法读取文件: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * 生成验证报告
   */
  generateReport(content: string, fileName: string = 'JRXML Report'): string {
    const result = this.validate(content);
    const timestamp = new Date().toISOString();

    let report = `
=================================================================
JRXML验证报告
=================================================================
文件: ${fileName}
时间: ${timestamp}
状态: ${result.valid ? '✅ 通过' : '❌ 失败'}
=================================================================

详细信息:
`;

    if (result.errors.length > 0) {
      report += `\n错误 (${result.errors.length}):\n`;
      result.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error}\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += `\n警告 (${result.warnings.length}):\n`;
      result.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning}\n`;
      });
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      report += `\n✅ 所有验证规则通过\n`;
    }

    report += `\n=================================================================\n`;

    return report;
  }
}

// 导出单例实例
export const jrxmlValidator = new JRXMLValidator();

// 使用示例
if (require.main === module) {
  const validator = new JRXMLValidator();

  const testJRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestReport"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-report-001">

    <field name="fieldName" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField>
                <reportElement x="0" y="0" width="200" height="20" uuid="..."/>
                <textElement textAlignment="Left" verticalAlignment="Top">
                    <font fontName="SansSerif" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{fieldName}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>`;

  console.log(validator.generateReport(testJRXML, 'test_report.jrxml'));
}
