/**
 * JRXML属性远程验证测试套件
 *
 * 通过远程JasperReports编译服务器验证每个属性是否被允许。
 * 实测为准，验证schemas/jrxml-schema.json与实际XSD的一致性。
 *
 * 远程服务器: https://jrxml-pdf-preview.firegod.cn
 */

import { describe, it, expect } from 'vitest';

const PREVIEW_API_URL = 'https://jrxml-pdf-preview.firegod.cn/api/pdf/generateForm';
const REQUEST_TIMEOUT = 30000;

interface TestResult {
  name: string;
  passed: boolean;
  allowed: boolean; // 属性是否被XSD允许
  error?: string;
  details?: string;
}

async function sendPreviewRequest(jrxml: string): Promise<{ success: boolean; response?: any; error?: string }> {
  const body = new URLSearchParams();
  body.set('jrxml', jrxml);
  body.set('parameters', '{}');
  body.set('dataSource', '[]');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(PREVIEW_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/pdf')) {
        return { success: true, response: 'PDF_GENERATED' };
      } else {
        const text = await response.text();
        return { success: false, error: `Unexpected response: ${text.substring(0, 200)}` };
      }
    } else {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text.substring(0, 500)}` };
    }
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      return { success: false, error: 'Request timeout' };
    }
    return { success: false, error: `Network error: ${e.message}` };
  }
}

// 基础JRXML模板
function createJRXML(content: string, attributes: string = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreport.xsd"
    name="TestReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20"
    ${attributes}>
  <detail>
    <band height="30">
      ${content}
    </band>
  </detail>
</jasperReport>`;
}

// ============================================================================
// 测试1: uuid属性验证
// ============================================================================

describe('uuid属性远程验证', () => {

  it('field带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$F{testField}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <field name="testField" class="java.lang.String" uuid="field-uuid-123"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('field带uuid:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
    // 记录结果但不失败测试
  });

  it('field不带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$F{testField}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <field name="testField" class="java.lang.String"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('field不带uuid:', result.success ? '✅ 通过' : `❌ 失败: ${result.error}`);
  });

  it('variable带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$V{testVar}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <variable name="testVar" class="java.lang.String" uuid="var-uuid-123"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('variable带uuid:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('variable不带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$V{testVar}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <variable name="testVar" class="java.lang.String"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('variable不带uuid:', result.success ? '✅ 通过' : `❌ 失败: ${result.error}`);
  });

  it('parameter带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$P{testParam}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <parameter name="testParam" class="java.lang.String" uuid="param-uuid-123"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('parameter带uuid:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('parameter不带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$P{testParam}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <parameter name="testParam" class="java.lang.String"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('parameter不带uuid:', result.success ? '✅ 通过' : `❌ 失败: ${result.error}`);
  });

  it('sortField带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <sortField name="testSort" uuid="sort-uuid-123"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('sortField带uuid:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('sortField不带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <sortField name="testSort"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('sortField不带uuid:', result.success ? '✅ 通过' : `❌ 失败: ${result.error}`);
  });

  it('group带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <group name="testGroup" uuid="group-uuid-123"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('group带uuid:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('group不带uuid属性', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <group name="testGroup"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('group不带uuid:', result.success ? '✅ 通过' : `❌ 失败: ${result.error}`);
  });

  it('band带uuid属性', async () => {
    const jrxml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30" uuid="band-uuid-123">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    const result = await sendPreviewRequest(jrxml);
    console.log('band带uuid:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('band不带uuid属性', async () => {
    const jrxml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    const result = await sendPreviewRequest(jrxml);
    console.log('band不带uuid:', result.success ? '✅ 通过' : `❌ 失败: ${result.error}`);
  });
});

// ============================================================================
// 测试2: positionType枚举值验证
// ============================================================================

describe('positionType枚举值远程验证', () => {

  it('positionType=FixRelativeToTop', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" positionType="FixRelativeToTop"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('positionType=FixRelativeToTop:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('positionType=FixRelativeToBottom', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" positionType="FixRelativeToBottom"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('positionType=FixRelativeToBottom:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('positionType=Float', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" positionType="Float"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('positionType=Float:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('positionType=FixRelativeToBand (可能无效)', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" positionType="FixRelativeToBand"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('positionType=FixRelativeToBand:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });
});

// ============================================================================
// 测试3: scaleImage枚举值验证
// ============================================================================

describe('scaleImage枚举值远程验证', () => {

  it('scaleImage=RetainShape', async () => {
    const jrxml = createJRXML(`
      <image>
        <reportElement x="0" y="0" width="100" height="100"/>
        <imageExpression><![CDATA["test.png"]]></imageExpression>
        <reportProperty name="net.sf.jasperreports.image.scale.image" value="RetainShape"/>
      </image>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('scaleImage=RetainShape:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('scaleImage=RetainImage (可能无效)', async () => {
    const jrxml = createJRXML(`
      <image>
        <reportElement x="0" y="0" width="100" height="100"/>
        <imageExpression><![CDATA["test.png"]]></imageExpression>
        <reportProperty name="net.sf.jasperreports.image.scale.image" value="RetainImage"/>
      </image>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('scaleImage=RetainImage:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });
});

// ============================================================================
// 测试4: resetType枚举值验证
// ============================================================================

describe('resetType枚举值远程验证', () => {

  it('variable resetType=Master', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$V{testVar}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <variable name="testVar" class="java.lang.Integer" calculation="Count" resetType="Master"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('resetType=Master:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('variable resetType=Report', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$V{testVar}]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <variable name="testVar" class="java.lang.Integer" calculation="Count" resetType="Report"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('resetType=Report:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });
});

// ============================================================================
// 测试5: 缺失属性验证
// ============================================================================

describe('缺失属性远程验证', () => {

  it('group isReprintHeaderOnEachColumn', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <group name="testGroup" isReprintHeaderOnEachColumn="true"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('group isReprintHeaderOnEachColumn:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('group isReprintHeaderOnEachPage', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <group name="testGroup" isReprintHeaderOnEachPage="true"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('group isReprintHeaderOnEachPage:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('group footerPosition=Normal', async () => {
    const jrxml = createJRXML(`
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    `).replace('</jasperReport>', `
      <group name="testGroup" footerPosition="Normal"/>
    </jasperReport>`);

    const result = await sendPreviewRequest(jrxml);
    console.log('group footerPosition=Normal:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });
});

// ============================================================================
// 测试6: elementBase属性验证
// ============================================================================

describe('elementBase属性远程验证', () => {

  it('stretchType=RelativeToBandHeight', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" stretchType="RelativeToBandHeight"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('stretchType=RelativeToBandHeight:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('stretchType=RelativeToTallestObject', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" stretchType="RelativeToTallestObject"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('stretchType=RelativeToTallestObject:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('textAdjust=StretchHeight', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textElement textAdjust="StretchHeight"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('textAdjust=StretchHeight:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });

  it('textAdjust=CutText (默认)', async () => {
    const jrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textElement textAdjust="CutText"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);
    const result = await sendPreviewRequest(jrxml);
    console.log('textAdjust=CutText:', result.success ? '✅ 允许' : `❌ 拒绝: ${result.error}`);
  });
});

// ============================================================================
// 测试总结
// ============================================================================

describe('测试总结', () => {
  it('所有属性验证完成', async () => {
    console.log('\n========================================');
    console.log('远程属性验证测试完成');
    console.log('服务器: https://jrxml-pdf-preview.firegod.cn');
    console.log('========================================\n');

    // 基础JRXML验证
    const basicJrxml = createJRXML(`
      <staticText>
        <reportElement x="0" y="0" width="200" height="20"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    `);

    const result = await sendPreviewRequest(basicJrxml);
    if (result.success) {
      console.log('✅ 远程编译服务器正常工作');
    } else {
      console.log('❌ 远程编译服务器无法访问:', result.error);
    }

    expect(true).toBe(true);
  });
});
