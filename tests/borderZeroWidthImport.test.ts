// 测试从JRXML导入时，lineWidth为0的边框是否正确处理
import { describe, it, expect } from 'vitest';
import { parseJRXMLContent } from '../src/utils/jrxmlGenerator';

describe('从JRXML导入时边框线宽为0的处理测试', () => {
  it('当JRXML中topPen的lineWidth为0时，解析后顶部边框应该不显示', () => {
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842">
  <title>
    <band height="79">
      <staticText>
        <reportElement x="20" y="20" width="200" height="40"/>
        <box>
          <topPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement>
          <font fontName="Arial" size="12"/>
        </textElement>
        <text><![CDATA[测试文本]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;
    
    const result = parseJRXMLContent(jrxmlContent);
    const element = result.bands[0].elements[0];
    
    // 验证解析后的topPen对象
    expect(element.box.topPen).toBeDefined();
    expect(element.box.topPen.lineWidth).toBe(0);
    expect(element.box.topPen.lineStyle).toBe('Solid');
    expect(element.box.topPen.lineColor).toBe('#000000');
  });
  
  it('当JRXML中所有方向的lineWidth为0时，解析后所有边框都应该不显示', () => {
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842">
  <title>
    <band height="79">
      <staticText>
        <reportElement x="20" y="20" width="200" height="40"/>
        <box>
          <topPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <leftPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <bottomPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <rightPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement>
          <font fontName="Arial" size="12"/>
        </textElement>
        <text><![CDATA[测试文本]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;
    
    const result = parseJRXMLContent(jrxmlContent);
    const element = result.bands[0].elements[0];
    
    // 验证解析后的所有方向的Pen对象
    expect(element.box.topPen).toBeDefined();
    expect(element.box.topPen.lineWidth).toBe(0);
    
    expect(element.box.leftPen).toBeDefined();
    expect(element.box.leftPen.lineWidth).toBe(0);
    
    expect(element.box.bottomPen).toBeDefined();
    expect(element.box.bottomPen.lineWidth).toBe(0);
    
    expect(element.box.rightPen).toBeDefined();
    expect(element.box.rightPen.lineWidth).toBe(0);
  });
  
  it('当JRXML中部分方向的lineWidth为0时，解析后只有lineWidth大于0的边框显示', () => {
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842">
  <title>
    <band height="79">
      <staticText>
        <reportElement x="20" y="20" width="200" height="40"/>
        <box>
          <topPen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>
          <leftPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <bottomPen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>
          <rightPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement>
          <font fontName="Arial" size="12"/>
        </textElement>
        <text><![CDATA[测试文本]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;
    
    const result = parseJRXMLContent(jrxmlContent);
    const element = result.bands[0].elements[0];
    
    // 验证解析后的Pen对象
    expect(element.box.topPen).toBeDefined();
    expect(element.box.topPen.lineWidth).toBe(1);
    
    expect(element.box.leftPen).toBeDefined();
    expect(element.box.leftPen.lineWidth).toBe(0);
    
    expect(element.box.bottomPen).toBeDefined();
    expect(element.box.bottomPen.lineWidth).toBe(1);
    
    expect(element.box.rightPen).toBeDefined();
    expect(element.box.rightPen.lineWidth).toBe(0);
  });
});