import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { generateJRXMLContent, parseJRXMLContent } from './jrxmlGenerator';

// Helper function to parse JRXML content into a DOM object
function parseJRXMLToDOM(jrxmlContent: string) {
  const dom = new JSDOM(jrxmlContent, { contentType: 'application/xml' });
  return dom.window.document;
}

describe('JRXML过时标签和属性转换测试', () => {
  describe('生成JRXML内容时的过时属性转换', () => {
    it('应该将过时的border属性转换为pen子元素', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'staticText',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              text: 'Test Text',
              box: {
                pen: {
                  lineWidth: 1,
                  lineColor: '#000000'
                }
              }
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否没有使用过时的border和borderColor属性
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const reportElement = staticTextElements[0].querySelector('reportElement');
      expect(reportElement).toBeDefined();
      
      // 检查reportElement是否没有过时的border属性
      expect(reportElement!.getAttribute('border')).toBeNull();
      expect(reportElement!.getAttribute('borderColor')).toBeNull();
      
      // 检查是否使用了pen子元素
      const boxElement = staticTextElements[0].querySelector('box');
      expect(boxElement).toBeDefined();
      
      const penElement = boxElement!.querySelector('pen');
      expect(penElement).toBeDefined();
      expect(penElement!.getAttribute('lineWidth')).toBe('1');
      expect(penElement!.getAttribute('lineColor')).toBe('#000000');
    });

    it('应该将过时的isStretchWithOverflow属性转换为textAdjust属性', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'textField',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              expression: '$F{field}',
              isStretchWithOverflow: true
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否没有使用过时的isStretchWithOverflow属性，而是使用了textAdjust属性
      const textFieldElements = doc.querySelectorAll('textField');
      expect(textFieldElements.length).toBeGreaterThan(0);
      
      // 检查textField是否没有过时的isStretchWithOverflow属性
      expect(textFieldElements[0].getAttribute('isStretchWithOverflow')).toBeNull();
      
      // 检查textField是否使用了textAdjust属性
      expect(textFieldElements[0].getAttribute('textAdjust')).toBe('StretchHeight');
    });

    it('应该将过时的isSplitAllowed属性转换为splitType属性', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          isSplitAllowed: false,
          elements: []
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否没有使用过时的isSplitAllowed属性，而是使用了splitType属性
      const bandElements = doc.querySelectorAll('band');
      expect(bandElements.length).toBeGreaterThan(0);
      
      // 检查band是否没有过时的isSplitAllowed属性
      expect(bandElements[0].getAttribute('isSplitAllowed')).toBeNull();
      
      // 检查band是否使用了splitType属性
      expect(bandElements[0].getAttribute('splitType')).toBe('Prevent');
    });

    it('应该将过时的isStyledText属性转换为markup属性', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'staticText',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              text: 'Test Text',
              isStyledText: true
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否没有使用过时的isStyledText属性，而是使用了markup属性
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const textElement = staticTextElements[0].querySelector('textElement');
      expect(textElement).toBeDefined();
      
      // 检查textElement是否没有过时的isStyledText属性
      expect(textElement!.getAttribute('isStyledText')).toBeNull();
      
      // 检查textElement是否使用了markup属性
      expect(textElement!.getAttribute('markup')).toBe('styled');
    });

    it('当全局边框样式为空且没有设置边框宽度时，不应该生成box标签', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'staticText',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              text: 'Test Text',
              box: {
                borderStyle: '', // 边框样式为空（无）
                borderWidth: 0   // 边框宽度为0
                // 不设置borderColor，避免触发hasOldBorderColor检查
              }
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否没有生成box标签
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const boxElement = staticTextElements[0].querySelector('box');
      expect(boxElement).toBeNull();
    });

    it('当全局边框样式不为空时，应该生成box标签', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'staticText',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              text: 'Test Text',
              box: {
                borderStyle: 'Solid', // 边框样式不为空
                borderWidth: 1,      // 边框宽度不为0
                borderColor: '#000000'
              }
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否生成了box标签
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const boxElement = staticTextElements[0].querySelector('box');
      expect(boxElement).toBeDefined();
      
      // 检查是否包含边框设置
      const penElement = boxElement!.querySelector('pen');
      expect(penElement).toBeDefined();
      expect(penElement!.getAttribute('lineWidth')).toBe('1');
      expect(penElement!.getAttribute('lineStyle')).toBe('Solid');
      expect(penElement!.getAttribute('lineColor')).toBe('#000000');
    });

    it('当没有设置边框样式但有边框宽度时，应该生成box标签', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'staticText',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              text: 'Test Text',
              box: {
                borderWidth: 1,      // 边框宽度不为0，即使没有边框样式
                borderColor: '#000000'
              }
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否生成了box标签
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const boxElement = staticTextElements[0].querySelector('box');
      expect(boxElement).toBeDefined();
      
      // 检查是否包含边框设置
      const penElement = boxElement!.querySelector('pen');
      expect(penElement).toBeDefined();
      expect(penElement!.getAttribute('lineWidth')).toBe('1');
    });

    it('当只设置边距时，应该生成box标签', () => {
      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };
      
      const bands = [
        {
          type: 'detail',
          height: 50,
          elements: [
            {
              type: 'staticText',
              x: 10,
              y: 10,
              width: 100,
              height: 20,
              text: 'Test Text',
              box: {
                padding: 5  // 只设置边距
              }
            }
          ]
        }
      ];

      const jrxmlContent = generateJRXMLContent(properties, bands, []);
      const doc = parseJRXMLToDOM(jrxmlContent);
      
      // 检查是否生成了box标签
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const boxElement = staticTextElements[0].querySelector('box');
      expect(boxElement).toBeDefined();
      
      // 检查是否包含边距设置
      expect(boxElement!.getAttribute('padding')).toBe('5');
    });
  });

  describe('解析JRXML内容时的过时属性转换', () => {
    it('应该将过时的border和borderColor属性转换为pen子元素', () => {
      const jrxmlWithDeprecatedAttrs = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <box border="1" borderColor="#000000"/>
        <textElement/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      const { bands } = parseJRXMLContent(jrxmlWithDeprecatedAttrs);
      
      // 检查解析结果中是否正确转换了过时属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.elements[0].box).toBeDefined();
      expect(detailBand!.elements[0].box.pen).toBeDefined();
      expect(detailBand!.elements[0].box.pen.lineWidth).toBe(1);
      expect(detailBand!.elements[0].box.pen.lineColor).toBe('#000000');
    });

    it('应该将过时的isStretchWithOverflow属性转换为textAdjust属性', () => {
      const jrxmlWithDeprecatedAttrs = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50">
      <textField isStretchWithOverflow="true">
        <reportElement x="10" y="10" width="100" height="20"/>
        <textElement/>
        <textFieldExpression><![CDATA[$F{field}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

      const { bands } = parseJRXMLContent(jrxmlWithDeprecatedAttrs);
      
      // 检查解析结果中是否正确转换了过时属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.elements[0].textAdjust).toBe('StretchHeight');
    });

    it('应该将过时的isSplitAllowed属性转换为splitType属性', () => {
      const jrxmlWithDeprecatedAttrs = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" isSplitAllowed="false">
    </band>
  </detail>
</jasperReport>`;

      const { bands } = parseJRXMLContent(jrxmlWithDeprecatedAttrs);
      
      // 检查解析结果中是否正确转换了过时属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.splitType).toBe('Prevent');
    });

    it('应该将过时的isStyledText属性转换为markup属性', () => {
      const jrxmlWithDeprecatedAttrs = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <textElement isStyledText="true"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      const { bands } = parseJRXMLContent(jrxmlWithDeprecatedAttrs);
      
      // 检查解析结果中是否正确转换了过时属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.elements[0].markup).toBe('styled');
    });
  });

  describe('往返转换测试', () => {
    it('应该正确处理包含过时属性的JRXML的往返转换', () => {
      const originalJrxml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" isSplitAllowed="false">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <box border="1" borderColor="#000000"/>
        <textElement isStyledText="true"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
      <textField isStretchWithOverflow="true">
        <reportElement x="10" y="40" width="100" height="20"/>
        <textElement/>
        <textFieldExpression><![CDATA[$F{field}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

      // 解析原始JRXML
      const { properties, bands } = parseJRXMLContent(originalJrxml);
      
      // 重新生成JRXML
      const regeneratedJrxml = generateJRXMLContent(properties, bands, []);
      
      // 验证重新生成的JRXML结构
      const doc = parseJRXMLToDOM(regeneratedJrxml);
      
      // 检查band是否有正确的splitType属性
      const bandElements = doc.querySelectorAll('band');
      expect(bandElements.length).toBeGreaterThan(0);
      expect(bandElements[0].getAttribute('splitType')).toBe('Prevent');
      expect(bandElements[0].getAttribute('isSplitAllowed')).toBeNull();
      
      // 检查staticText元素
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const staticText = staticTextElements[0];
      const boxElement = staticText.querySelector('box');
      expect(boxElement).toBeDefined();
      
      const penElement = boxElement!.querySelector('pen');
      expect(penElement).toBeDefined();
      expect(penElement!.getAttribute('lineWidth')).toBe('1');
      expect(penElement!.getAttribute('lineColor')).toBe('#000000');
      
      const textElement = staticText.querySelector('textElement');
      expect(textElement).toBeDefined();
      expect(textElement!.getAttribute('markup')).toBe('styled');
      expect(textElement!.getAttribute('isStyledText')).toBeNull();
      
      // 检查textField元素
      const textFieldElements = doc.querySelectorAll('textField');
      expect(textFieldElements.length).toBeGreaterThan(0);
      expect(textFieldElements[0].getAttribute('textAdjust')).toBe('StretchHeight');
      expect(textFieldElements[0].getAttribute('isStretchWithOverflow')).toBeNull();
      
      // 再次解析重新生成的JRXML
      const { bands: finalBands } = parseJRXMLContent(regeneratedJrxml);
      
      // 验证转换结果的一致性
      const finalDetailBand = finalBands.find(band => band.type === 'detail');
      expect(finalDetailBand).toBeDefined();
      expect(finalDetailBand!.splitType).toBe('Prevent');
      expect(finalDetailBand!.elements[0].box.pen.lineWidth).toBe(1);
      expect(finalDetailBand!.elements[0].box.pen.lineColor).toBe('#000000');
      expect(finalDetailBand!.elements[0].markup).toBe('styled');
      expect(finalDetailBand!.elements[1].textAdjust).toBe('StretchHeight');
    });

    it('应该正确处理包含splitType属性的band的往返转换', () => {
      const originalJrxml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" splitType="Prevent">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      // 解析原始JRXML
      const { properties, bands } = parseJRXMLContent(originalJrxml);
      
      // 验证解析结果中包含了splitType属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.splitType).toBe('Prevent');
      
      // 重新生成JRXML
      const regeneratedJrxml = generateJRXMLContent(properties, bands, []);
      
      // 验证重新生成的JRXML包含了splitType属性
      const doc = parseJRXMLToDOM(regeneratedJrxml);
      const bandElements = doc.querySelectorAll('band');
      expect(bandElements.length).toBeGreaterThan(0);
      expect(bandElements[0].getAttribute('splitType')).toBe('Prevent');
      expect(bandElements[0].getAttribute('isSplitAllowed')).toBeNull();
      
      // 再次解析重新生成的JRXML
      const { bands: finalBands } = parseJRXMLContent(regeneratedJrxml);
      
      // 验证转换结果的一致性
      const finalDetailBand = finalBands.find(band => band.type === 'detail');
      expect(finalDetailBand).toBeDefined();
      expect(finalDetailBand!.splitType).toBe('Prevent');
    });

    it('应该优先使用splitType属性而不是isSplitAllowed属性', () => {
      const originalJrxml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" splitType="Stretch" isSplitAllowed="false">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      // 解析原始JRXML
      const { properties, bands } = parseJRXMLContent(originalJrxml);
      
      // 验证解析结果中优先使用了splitType属性而不是isSplitAllowed属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      // 应该是"Stretch"而不是"Prevent"，因为splitType优先级更高
      expect(detailBand!.splitType).toBe('Stretch');
      
      // 重新生成JRXML
      const regeneratedJrxml = generateJRXMLContent(properties, bands, []);
      
      // 验证重新生成的JRXML包含了splitType="Stretch"属性，不包含过时的isSplitAllowed属性
      const doc = parseJRXMLToDOM(regeneratedJrxml);
      const bandElements = doc.querySelectorAll('band');
      expect(bandElements.length).toBeGreaterThan(0);
      expect(bandElements[0].getAttribute('splitType')).toBe('Stretch');
      expect(bandElements[0].getAttribute('isSplitAllowed')).toBeNull();
    });

    test('应该优先使用非过时属性而不是过时属性', () => {
      // 创建同时包含新属性和过时属性的元素
      const elementWithBothProperties = {
        type: 'staticText',
        x: 10,
        y: 10,
        width: 100,
        height: 20,
        text: 'Test Text',
        markup: 'html', // 新属性
        isStyledText: false, // 过时属性
        box: {
          pen: {
            lineWidth: 2,
            lineColor: '#FF0000'
          },
          border: 1, // 过时属性
          borderColor: '#000000' // 过时属性
        }
      };

      const textFieldElement = {
        type: 'textField',
        x: 10,
        y: 40,
        width: 100,
        height: 20,
        expression: '$F{field}',
        textAdjust: 'StretchHeight', // 新属性
        isStretchWithOverflow: false // 过时属性
      };

      const bandWithElement = {
        type: 'detail',
        height: 70,
        splitType: 'Prevent', // 新属性
        isSplitAllowed: true, // 过时属性
        elements: [elementWithBothProperties, textFieldElement]
      };

      const properties = {
        name: 'Test Report',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 30,
        bottomMargin: 30
      };

      // 生成JRXML
      const generatedXml = generateJRXMLContent(properties, [bandWithElement], []);
      const doc = parseJRXMLToDOM(generatedXml);

      // 验证优先使用新属性而不是过时属性
      
      // 检查band属性
      const bandElements = doc.querySelectorAll('band');
      expect(bandElements.length).toBeGreaterThan(0);
      expect(bandElements[0].getAttribute('splitType')).toBe('Prevent');
      expect(bandElements[0].getAttribute('isSplitAllowed')).toBeNull();
      
      // 检查staticText元素
      const staticTextElements = doc.querySelectorAll('staticText');
      expect(staticTextElements.length).toBeGreaterThan(0);
      
      const textElement = staticTextElements[0].querySelector('textElement');
      expect(textElement).toBeDefined();
      expect(textElement!.getAttribute('markup')).toBe('html');
      expect(textElement!.getAttribute('isStyledText')).toBeNull();
      
      const boxElement = staticTextElements[0].querySelector('box');
      expect(boxElement).toBeDefined();
      
      const penElement = boxElement!.querySelector('pen');
      expect(penElement).toBeDefined();
      expect(penElement!.getAttribute('lineWidth')).toBe('2');
      expect(penElement!.getAttribute('lineColor')).toBe('#FF0000');
      
      // 检查textField元素
      const textFieldElements = doc.querySelectorAll('textField');
      expect(textFieldElements.length).toBeGreaterThan(0);
      expect(textFieldElements[0].getAttribute('textAdjust')).toBe('StretchHeight');
      expect(textFieldElements[0].getAttribute('isStretchWithOverflow')).toBeNull();
    });
  });

  describe('band标签splitType属性解析测试', () => {
    it('应该正确解析包含splitType属性的band标签', () => {
      const jrxmlWithSplitType = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" splitType="Prevent">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      // 解析JRXML
      const { properties, bands } = parseJRXMLContent(jrxmlWithSplitType);
      
      // 验证解析结果中包含了splitType属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.splitType).toBe('Prevent');
      
      // 重新生成JRXML
      const regeneratedJrxml = generateJRXMLContent(properties, bands, []);
      
      // 验证重新生成的JRXML包含了splitType属性
      expect(regeneratedJrxml).toContain('splitType="Prevent"');
      // 验证重新生成的JRXML不包含过时的isSplitAllowed属性
      expect(regeneratedJrxml).not.toContain('isSplitAllowed');
    });

    it('应该优先使用splitType属性而不是isSplitAllowed属性', () => {
      const jrxmlWithBothAttributes = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" splitType="Stretch" isSplitAllowed="false">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      // 解析JRXML
      const { properties, bands } = parseJRXMLContent(jrxmlWithBothAttributes);
      
      // 验证解析结果中优先使用了splitType属性而不是isSplitAllowed属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      // 应该是"Stretch"而不是"Prevent"，因为splitType优先级更高
      expect(detailBand!.splitType).toBe('Stretch');
      
      // 重新生成JRXML
      const regeneratedJrxml = generateJRXMLContent(properties, bands, []);
      
      // 验证重新生成的JRXML包含了splitType="Stretch"属性
      expect(regeneratedJrxml).toContain('splitType="Stretch"');
      // 验证重新生成的JRXML不包含过时的isSplitAllowed属性
      expect(regeneratedJrxml).not.toContain('isSplitAllowed');
    });

    it('应该正确转换过时的isSplitAllowed属性为splitType属性', () => {
      const jrxmlWithDeprecatedAttribute = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" isSplitAllowed="false">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

      // 解析JRXML
      const { properties, bands } = parseJRXMLContent(jrxmlWithDeprecatedAttribute);
      
      // 验证解析结果中正确转换了isSplitAllowed属性
      const detailBand = bands.find(band => band.type === 'detail');
      expect(detailBand).toBeDefined();
      expect(detailBand!.splitType).toBe('Prevent');
      
      // 重新生成JRXML
      const regeneratedJrxml = generateJRXMLContent(properties, bands, []);
      
      // 验证重新生成的JRXML包含了splitType="Prevent"属性
      expect(regeneratedJrxml).toContain('splitType="Prevent"');
      // 验证重新生成的JRXML不包含过时的isSplitAllowed属性
      expect(regeneratedJrxml).not.toContain('isSplitAllowed');
    });
  });
});