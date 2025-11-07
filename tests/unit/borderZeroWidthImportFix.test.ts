import { describe, it, expect } from 'vitest';
import { parseJRXMLContent } from '../../src/utils/jrxmlGenerator';

describe('JRXML边框零宽度导入测试', () => {
  it('当JRXML中所有方向的lineWidth为0时，解析后所有边框都应该不显示', () => {
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842" whenNoDataType="AllSectionsNoDetail">
  <detail>
    <band height="50">
      <staticText>
        <reportElement x="0" y="0" width="800" height="50"/>
        <box topPadding="0" leftPadding="0" bottomPadding="0" rightPadding="0">
          <topPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <leftPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <bottomPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <rightPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Center" verticalAlignment="Middle">
          <font fontName="Noto Serif SC" size="19"/>
        </textElement>
        <text><![CDATA[客运中心核销凭证]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    const result = parseJRXMLContent(jrxmlContent);
    
    // 获取detail band的第一个元素
    const detailBand = result.bands.find(band => band.type === 'detail');
    expect(detailBand).toBeDefined();
    expect(detailBand!.elements.length).toBeGreaterThan(0);
    
    const element = detailBand!.elements[0];
    
    // 检查box属性是否存在
    expect(element.box).toBeDefined();
    
    // 检查box中的pen属性
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
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842" whenNoDataType="AllSectionsNoDetail">
  <detail>
    <band height="50">
      <staticText>
        <reportElement x="0" y="0" width="800" height="50"/>
        <box topPadding="0" leftPadding="0" bottomPadding="0" rightPadding="0">
          <topPen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>
          <leftPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
          <bottomPen lineWidth="2" lineStyle="Solid" lineColor="#000000"/>
          <rightPen lineWidth="0" lineStyle="Solid" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Center" verticalAlignment="Middle">
          <font fontName="Noto Serif SC" size="19"/>
        </textElement>
        <text><![CDATA[部分边框测试]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    const result = parseJRXMLContent(jrxmlContent);
    
    // 获取detail band的第一个元素
    const detailBand = result.bands.find(band => band.type === 'detail');
    expect(detailBand).toBeDefined();
    expect(detailBand!.elements.length).toBeGreaterThan(0);
    
    const element = detailBand!.elements[0];
    
    // 检查box属性是否存在
    expect(element.box).toBeDefined();
    
    // 检查box中的pen属性
    expect(element.box.topPen).toBeDefined();
    expect(element.box.topPen.lineWidth).toBe(1);
    expect(element.box.leftPen).toBeDefined();
    expect(element.box.leftPen.lineWidth).toBe(0);
    expect(element.box.bottomPen).toBeDefined();
    expect(element.box.bottomPen.lineWidth).toBe(2);
    expect(element.box.rightPen).toBeDefined();
    expect(element.box.rightPen.lineWidth).toBe(0);
  });

  it('当JRXML中没有box元素时，边框属性应该为空', () => {
    const jrxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="test" pageWidth="595" pageHeight="842" whenNoDataType="AllSectionsNoDetail">
  <detail>
    <band height="50">
      <staticText>
        <reportElement x="0" y="0" width="800" height="50"/>
        <textElement textAlignment="Center" verticalAlignment="Middle">
          <font fontName="Noto Serif SC" size="19"/>
        </textElement>
        <text><![CDATA[无边框测试]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

    const result = parseJRXMLContent(jrxmlContent);
    
    // 获取detail band的第一个元素
    const detailBand = result.bands.find(band => band.type === 'detail');
    expect(detailBand).toBeDefined();
    expect(detailBand!.elements.length).toBeGreaterThan(0);
    
    const element = detailBand!.elements[0];
    
    // 检查box属性是否不存在
    expect(element.box).toBeUndefined();
  });
});