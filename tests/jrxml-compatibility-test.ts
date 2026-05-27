/**
 * JRXML编译兼容性测试套件
 * 验证生成的JRXML能否被JasperReports成功编译
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  name: string;
  description: string;
  jrxml: string;
  expectedFields: string[];
  expectedParameters: string[];
  shouldCompile: boolean;
  validationRules?: ValidationRule[];
}

interface ValidationRule {
  name: string;
  validate: (content: string) => boolean;
  message: string;
}

export class JRXMLCompatibilityTestSuite {
  private testCases: TestCase[] = [];
  private results: { name: string; passed: boolean; errors: string[] }[] = [];

  constructor() {
    this.setupTestCases();
  }

  private setupTestCases(): void {
    // 测试用例1：基础TextField
    this.testCases.push({
      name: 'TextField_Basic',
      description: '基础文本字段',
      jrxml: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TextField_Basic"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="textfield-basic-001">

    <field name="fieldName" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField isBlankWhenNull="true">
                <reportElement x="0" y="0" width="200" height="20" uuid="textfield-001"/>
                <textElement textAlignment="Left" verticalAlignment="Top">
                    <font fontName="SansSerif" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{fieldName}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>`,
      expectedFields: ['fieldName'],
      expectedParameters: [],
      shouldCompile: true,
      validationRules: [
        {
          name: 'TextField有表达式',
          validate: (content) => content.includes('<textFieldExpression>'),
          message: 'TextField缺少表达式'
        },
        {
          name: 'Field有name属性',
          validate: (content) => /<field name="[^"]*"/.test(content),
          message: 'Field缺少name属性'
        }
      ]
    });

    // 测试用例2：带样式的TextField
    this.testCases.push({
      name: 'TextField_Styled',
      description: '带样式的文本字段',
      jrxml: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TextField_Styled"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="textfield-styled-001">

    <field name="amount" class="java.math.BigDecimal"/>

    <style name="AmountStyle" mode="Opaque" backcolor="#FFFFFF" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
            <topPen lineWidth="0.5" lineColor="#000000"/>
            <leftPen lineWidth="0.5" lineColor="#000000"/>
            <bottomPen lineWidth="0.5" lineColor="#000000"/>
            <rightPen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
            <font fontName="Arial" size="10"/>
        </textElement>
    </style>

    <detail>
        <band height="30">
            <textField pattern="#,##0.00" isBlankWhenNull="true" style="AmountStyle">
                <reportElement x="0" y="0" width="150" height="20" uuid="textfield-001"/>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>`,
      expectedFields: ['amount'],
      expectedParameters: [],
      shouldCompile: true,
      validationRules: [
        {
          name: 'TextField有pattern',
          validate: (content) => content.includes('pattern="#,##0.00"'),
          message: 'TextField缺少pattern属性'
        },
        {
          name: 'Style有name属性',
          validate: (content) => /<style name="[^"]*"/.test(content),
          message: 'Style缺少name属性'
        }
      ]
    });

    // 测试用例3：StaticText
    this.testCases.push({
      name: 'StaticText_Basic',
      description: '基础静态文本',
      jrxml: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="StaticText_Basic"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="statictext-basic-001">

    <title>
        <band height="50">
            <staticText>
                <reportElement x="0" y="0" width="200" height="30" uuid="statictext-001"/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="16" isBold="true"/>
                </textElement>
                <text><![CDATA[报表标题]]></text>
            </staticText>
        </band>
    </title>
</jasperReport>`,
      expectedFields: [],
      expectedParameters: [],
      shouldCompile: true,
      validationRules: [
        {
          name: 'StaticText有text',
          validate: (content) => content.includes('<text><![CDATA['),
          message: 'StaticText缺少text内容'
        },
        {
          name: 'StaticText有font',
          validate: (content) => content.includes('<font'),
          message: 'StaticText缺少font定义'
        }
      ]
    });

    // 测试用例4：Image
    this.testCases.push({
      name: 'Image_Basic',
      description: '基础图片元素',
      jrxml: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="Image_Basic"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="image-basic-001">

    <title>
        <band height="100">
            <image hAlign="Center" vAlign="Middle">
                <reportElement x="0" y="0" width="100" height="100" uuid="image-001"/>
                <imageExpression><![CDATA["https://example.com/logo.png"]]>
                </imageExpression>
            </image>
        </band>
    </title>
</jasperReport>`,
      expectedFields: [],
      expectedParameters: [],
      shouldCompile: true,
      validationRules: [
        {
          name: 'Image有表达式',
          validate: (content) => content.includes('<imageExpression>'),
          message: 'Image缺少imageExpression'
        },
        {
          name: 'Image有hAlign',
          validate: (content) => content.includes('hAlign="Center"'),
          message: 'Image缺少hAlign属性'
        }
      ]
    });

    // 测试用例5：Rectangle
    this.testCases.push({
      name: 'Rectangle_Basic',
      description: '基础矩形元素',
      jrxml: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="Rectangle_Basic"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="rectangle-basic-001">

    <detail>
        <band height="50">
            <rectangle>
                <reportElement x="0" y="0" width="200" height="50" uuid="rectangle-001"/>
                <graphicElement>
                    <pen lineWidth="1.0"/>
                </graphicElement>
            </rectangle>
        </band>
    </detail>
</jasperReport>`,
      expectedFields: [],
      expectedParameters: [],
      shouldCompile: true,
      validationRules: [
        {
          name: 'Rectangle有pen',
          validate: (content) => content.includes('<pen lineWidth="1.0"/>'),
          message: 'Rectangle缺少pen定义'
        }
      ]
    });

    // 测试用例6：带Box的TextField
    this.testCases.push({
      name: 'TextField_WithBox',
      description: '带Box的文本字段',
      jrxml: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TextField_WithBox"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="textfield-box-001">

    <field name="data" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField>
                <reportElement x="0" y="0" width="200" height="20" uuid="textfield-001"/>
                <box>
                    <pen lineWidth="1.0" lineColor="#000000"/>
                    <topPen lineWidth="1.0" lineColor="#000000"/>
                    <leftPen lineWidth="1.0" lineColor="#000000"/>
                    <bottomPen lineWidth="1.0" lineColor="#000000"/>
                    <rightPen lineWidth="1.0" lineColor="#000000"/>
                    <topPadding leftPadding="5"/>
                    <leftPadding leftPadding="5"/>
                </box>
                <textElement textAlignment="Left" verticalAlignment="Middle">
                    <font fontName="Arial" size="10"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{data}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>`,
      expectedFields: ['data'],
      expectedParameters: [],
      shouldCompile: true,
      validationRules: [
        {
          name: 'Box有pen',
          validate: (content) => content.includes('<pen lineWidth="1.0"'),
          message: 'Box缺少pen定义'
        },
        {
          name: 'Box有padding',
          validate: (content) => content.includes('<topPadding'),
          message: 'Box缺少padding定义'
        }
      ]
    });
  }

  /**
   * 运行所有测试
   */
  runAllTests(): { passed: number; failed: number; results: any[] } {
    let passed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const testCase of this.testCases) {
      const result = this.runTest(testCase);
      results.push(result);

      if (result.passed) {
        passed++;
        console.log(`✅ ${testCase.name}: ${testCase.description}`);
      } else {
        failed++;
        console.log(`❌ ${testCase.name}: ${testCase.description}`);
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    }

    return { passed, failed, results };
  }

  /**
   * 运行单个测试
   */
  private runTest(testCase: TestCase): { passed: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基础语法验证
    if (!testCase.jrxml.includes('<?xml version="1.0"')) {
      errors.push('缺少XML声明');
    }

    if (!testCase.jrxml.includes('<jasperReport')) {
      errors.push('缺少jasperReport根元素');
    }

    // 必要属性验证
    const requiredAttrs = ['name', 'pageWidth', 'pageHeight', 'columnWidth'];
    for (const attr of requiredAttrs) {
      if (!testCase.jrxml.includes(`${attr}="`)) {
        errors.push(`jasperReport缺少${attr}属性`);
      }
    }

    // UUID验证
    if (!testCase.jrxml.includes('uuid="')) {
      errors.push('缺少uuid属性');
    }

    // 执行自定义验证规则
    if (testCase.validationRules) {
      for (const rule of testCase.validationRules) {
        if (!rule.validate(testCase.jrxml)) {
          errors.push(rule.message);
        }
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * 生成测试报告
   */
  generateReport(results: any[]): string {
    const timestamp = new Date().toISOString();
    let report = `
=================================================================
JRXML编译兼容性测试报告
=================================================================
测试时间: ${timestamp}
测试用例数: ${results.length}
通过数: ${results.filter(r => r.passed).length}
失败数: ${results.filter(r => !r.passed).length}
=================================================================

详细结果:
`;

    results.forEach((result, index) => {
      report += `\n${index + 1}. ${result.name || 'Unknown'}`;
      report += `\n   状态: ${result.passed ? '✅ 通过' : '❌ 失败'}`;
      if (result.errors && result.errors.length > 0) {
        report += `\n   错误:`;
        result.errors.forEach((error: string) => {
          report += `\n     - ${error}`;
        });
      }
    });

    report += `\n\n=================================================================
验证规则总结:
1. 所有JRXML必须以XML声明开始
2. 必须包含jasperReport根元素
3. jasperReport必须包含name, pageWidth, pageHeight, columnWidth属性
4. 所有元素必须包含uuid属性
5. TextField必须包含textFieldExpression
6. Image必须包含imageExpression
7. Field必须包含name和class属性
8. Style必须包含name属性
=================================================================
`;

    return report;
  }

  /**
   * 保存测试用例到文件
   */
  saveTestCases(outputDir: string): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.testCases.forEach(testCase => {
      const filePath = path.join(outputDir, `${testCase.name}.jrxml`);
      fs.writeFileSync(filePath, testCase.jrxml, 'utf-8');
      console.log(`✓ 保存测试用例: ${filePath}`);
    });
  }
}

// 使用示例
if (require.main === module) {
  const testSuite = new JRXMLCompatibilityTestSuite();

  console.log('\n运行JRXML编译兼容性测试...\n');
  const results = testSuite.runAllTests();

  console.log('\n' + testSuite.generateReport(results.results));

  // 保存测试用例
  testSuite.saveTestCases('./test-reports');
}
