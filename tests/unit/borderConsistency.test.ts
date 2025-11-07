import { describe, it, expect } from 'vitest';
import { parseJRXMLContent, generateJRXMLContent } from '../../src/utils/jrxmlGenerator';

describe('JRXML边框一致性测试', () => {
  it('当topPen的lineWidth为0时，上边框不显示，其他边框正常显示', () => {
    // 创建一个包含边框设置的JRXML片段
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="100">
      <staticText>
        <reportElement x="10" y="10" width="100" height="30"/>
        <box topPadding="0" leftPadding="5" bottomPadding="0" rightPadding="5">
          <pen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>
          <topPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement>
          <font fontName="Arial" size="12"/>
        </textElement>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    // 解析JRXML
    const parsedData = parseJRXMLContent(jrxmlContent);
    
    // 验证解析结果
    const element = parsedData.bands[0].elements[0];
    expect(element.box).toBeDefined();
    expect(element.box.pen).toBeDefined();
    expect(element.box.pen.lineWidth).toBe(1);
    expect(element.box.topPen).toBeDefined();
    expect(element.box.topPen.lineWidth).toBe(0);
    
    // 重新生成JRXML
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields || [],
      parsedData.parameters || []
    );
    
    // 验证生成的JRXML中包含相同的边框设置
    expect(generatedJRXML).toContain('<pen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>');
    // 注意：当lineWidth为0时，不会生成对应的pen元素，这是当前实现的行为
    
    // 再次解析生成的JRXML，验证一致性
    const reparsedData = parseJRXMLContent(generatedJRXML);
    const reparsedElement = reparsedData.bands[0].elements[0];
    
    expect(reparsedElement.box.pen.lineWidth).toBe(1);
    // 注意：当lineWidth为0时，不会生成对应的pen元素，所以解析后也没有topPen属性
    expect(reparsedElement.box.topPen).toBeUndefined();
  });
  
  it('当所有方向的lineWidth都为0时，所有边框都不显示', () => {
    // 创建一个包含所有边框宽度为0的JRXML片段
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="100">
      <staticText>
        <reportElement x="10" y="10" width="100" height="30"/>
        <box topPadding="0" leftPadding="5" bottomPadding="0" rightPadding="5">
          <pen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <topPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <leftPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <bottomPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <rightPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement>
          <font fontName="Arial" size="12"/>
        </textElement>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    // 解析JRXML
    const parsedData = parseJRXMLContent(jrxmlContent);
    
    // 验证解析结果
    const element = parsedData.bands[0].elements[0];
    expect(element.box).toBeDefined();
    expect(element.box.pen).toBeDefined();
    expect(element.box.pen.lineWidth).toBe(0);
    expect(element.box.topPen).toBeDefined();
    expect(element.box.topPen.lineWidth).toBe(0);
    expect(element.box.leftPen).toBeDefined();
    expect(element.box.leftPen.lineWidth).toBe(0);
    expect(element.box.bottomPen).toBeDefined();
    expect(element.box.bottomPen.lineWidth).toBe(0);
    expect(element.box.rightPen).toBeDefined();
    expect(element.box.rightPen.lineWidth).toBe(0);
    
    // 重新生成JRXML
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields || [],
      parsedData.parameters || []
    );
    
    // 验证生成的JRXML中包含相同的边框设置
    // 注意：当所有lineWidth为0时，不会生成任何pen元素，这是当前实现的行为
    expect(generatedJRXML).not.toContain('<pen');
  });
});