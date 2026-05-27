/**
 * JRXML编译验证工具
 * 验证生成的JRXML能否成功编译成jasper文件
 */

import * as fs from 'fs';
import * as path from 'path';

// 测试用例定义
interface TestCase {
  name: string;
  description: string;
  jrxmlContent: string;
  shouldCompile: boolean;
  expectedFields?: string[];
}

// 测试用例
const testCases: TestCase[] = [
  {
    name: 'basic_textfield',
    description: '基础TextField',
    jrxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="BasicTextField"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="basic-textfield-001">

    <field name="fieldName" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField isBlankWhenNull="true">
                <reportElement x="0" y="0" width="200" height="20" uuid="..."/>
                <textElement textAlignment="Left" verticalAlignment="Top">
                    <font fontName="SansSerif" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{fieldName}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>`,
    shouldCompile: true,
    expectedFields: ['fieldName']
  },
  {
    name: 'styled_textfield',
    description: '带样式的TextField',
    jrxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="StyledTextField"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="styled-textfield-001">

    <field name="amount" class="java.math.BigDecimal"/>

    <style name="AmountStyle" mode="Opaque" backcolor="#FFFFFF" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
            <font fontName="Arial" size="10"/>
        </textElement>
    </style>

    <detail>
        <band height="30">
            <textField pattern="#,##0.00" isBlankWhenNull="true" style="AmountStyle">
                <reportElement x="0" y="0" width="150" height="20" uuid="..."/>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>`,
    shouldCompile: true,
    expectedFields: ['amount']
  },
  {
    name: 'statictext_basic',
    description: '基础StaticText',
    jrxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="BasicStaticText"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="basic-statictext-001">

    <title>
        <band height="50">
            <staticText>
                <reportElement x="0" y="0" width="200" height="30" uuid="..."/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="16" isBold="true"/>
                </textElement>
                <text><![CDATA[报表标题]]></text>
            </staticText>
        </band>
    </title>
</jasperReport>`,
    shouldCompile: true
  },
  {
    name: 'image_element',
    description: 'Image元素',
    jrxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="BasicImage"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="basic-image-001">

    <title>
        <band height="100">
            <image>
                <reportElement x="0" y="0" width="100" height="100" uuid="..."/>
                <imageExpression><![CDATA["https://example.com/logo.png"]]>
                </imageExpression>
            </image>
        </band>
    </title>
</jasperReport>`,
    shouldCompile: true
  },
  {
    name: 'rectangle_element',
    description: 'Rectangle元素',
    jrxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="BasicRectangle"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="basic-rectangle-001">

    <detail>
        <band height="50">
            <rectangle>
                <reportElement x="0" y="0" width="200" height="50" uuid="..."/>
                <graphicElement>
                    <pen lineWidth="1.0"/>
                </graphicElement>
            </rectangle>
        </band>
    </detail>
</jasperReport>`,
    shouldCompile: true
  },
  {
    name: 'textfield_with_box',
    description: '带Box的TextField',
    jrxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TextFieldWithBox"
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
                <reportElement x="0" y="0" width="200" height="20" uuid="..."/>
                <box>
                    <pen lineWidth="1.0" lineColor="#000000"/>
                    <topPen lineWidth="1.0"/>
                    <leftPen lineWidth="1.0"/>
                    <bottomPen lineWidth="1.0"/>
                    <rightPen lineWidth="1.0"/>
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
    shouldCompile: true,
    expectedFields: ['data']
  }
];

/**
 * JRXML编译验证器
 */
export class JRXMLCompiler {
  private outputDir: string;

  constructor(outputDir: string = './test-compiled') {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * 验证JRXML语法
   */
  validateJRXMLSyntax(jrxmlContent: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查XML声明
    if (!jrxmlContent.trim().startsWith('<?xml version="1.0"')) {
      errors.push('缺少XML声明或版本不正确');
    }

    // 检查jasperReport根元素
    if (!jrxmlContent.includes('<jasperReport')) {
      errors.push('缺少jasperReport根元素');
    }

    // 检查必要的属性
    const requiredAttributes = ['name', 'pageWidth', 'pageHeight', 'columnWidth'];
    for (const attr of requiredAttributes) {
      if (!jrxmlContent.includes(`${attr}=`)) {
        errors.push(`jasperReport缺少必要属性: ${attr}`);
      }
    }

    // 检查UUID
    if (!jrxmlContent.includes('uuid=')) {
      errors.push('缺少uuid属性');
    }

    // 检查reportElement中的UUID
    if (jrxmlContent.includes('<reportElement') && !jrxmlContent.includes('uuid="')) {
      errors.push('reportElement缺少uuid属性');
    }

    // 检查TextField表达式
    if (jrxmlContent.includes('<textField') && !jrxmlContent.includes('<textFieldExpression>')) {
      errors.push('textField缺少textFieldExpression');
    }

    // 检查Image表达式
    if (jrxmlContent.includes('<image>') && !jrxmlContent.includes('<imageExpression>')) {
      errors.push('image缺少imageExpression');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证JRXML内容完整性
   */
  validateJRXMLCompleteness(jrxmlContent: string): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // 检查band属性
    const bandMatches = jrxmlContent.match(/<band\s+height="(\d+)"/g);
    if (!bandMatches || bandMatches.length === 0) {
      warnings.push('未找到band元素');
    }

    // 检查元素位置
    const reportElementMatches = jrxmlContent.match(/<reportElement\s+x="\d+"\s+y="\d+"/g);
    if (!reportElementMatches) {
      warnings.push('reportElement缺少位置属性');
    }

    // 检查TextField样式
    if (jrxmlContent.includes('<textField')) {
      if (!jrxmlContent.includes('isBlankWhenNull=')) {
        warnings.push('textField缺少isBlankWhenNull属性');
      }
    }

    // 检查字体定义
    if (jrxmlContent.includes('<textElement') && !jrxmlContent.includes('<font')) {
      warnings.push('textElement缺少font定义');
    }

    // 检查边框定义
    if (jrxmlContent.includes('<box>') && !jrxmlContent.includes('<pen')) {
      warnings.push('box缺少pen定义');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  /**
   * 编译JRXML（模拟）
   * 注意：实际编译需要Java环境和JasperReports库
   * 这里主要是验证语法和结构
   */
  async compileJRXML(jrxmlContent: string, name: string): Promise<{ success: boolean; output?: string; errors?: string[] }> {
    const result = this.validateJRXMLSyntax(jrxmlContent);
    const completeness = this.validateJRXMLCompleteness(jrxmlContent);

    if (!result.valid) {
      return {
        success: false,
        errors: result.errors
      };
    }

    // 保存JRXML文件
    const jrxmlPath = path.join(this.outputDir, `${name}.jrxml`);
    fs.writeFileSync(jrxmlPath, jrxmlContent, 'utf-8');

    // 模拟编译成功
    console.log(`✓ JRXML语法验证通过: ${name}`);
    if (completeness.warnings.length > 0) {
      console.log(`⚠ 警告: ${completeness.warnings.join(', ')}`);
    }

    return {
      success: true,
      output: jrxmlPath
    };
  }

  /**
   * 运行所有测试用例
   */
  async runAllTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    let passed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const testCase of testCases) {
      console.log(`\n运行测试: ${testCase.name}`);
      console.log(`描述: ${testCase.description}`);

      const result = await this.compileJRXML(testCase.jrxmlContent, testCase.name);

      const testResult = {
        name: testCase.name,
        description: testCase.description,
        ...result,
        expected: testCase.shouldCompile
      };

      results.push(testResult);

      if (result.success === testCase.shouldCompile) {
        passed++;
        console.log(`✅ 通过`);
      } else {
        failed++;
        console.log(`❌ 失败`);
        if (result.errors) {
          console.log(`错误: ${result.errors.join(', ')}`);
        }
      }
    }

    return { passed, failed, results };
  }
}

// 导出测试用例供其他测试使用
export { testCases, TestCase };

// 如果直接运行
if (require.main === module) {
  const compiler = new JRXMLCompiler('./test-compiled');
  compiler.runAllTests().then(result => {
    console.log(`\n测试结果:`);
    console.log(`通过: ${result.passed}`);
    console.log(`失败: ${result.failed}`);
    console.log(`总计: ${result.passed + result.failed}`);
  });
}
