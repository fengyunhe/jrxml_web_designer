import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { generateJRXMLContent, parseJRXMLContent } from '../../src/utils/jrxmlGenerator';

// Helper function to parse JRXML content into a DOM object
function parseJRXMLToDOM(jrxmlContent: string) {
  const dom = new JSDOM(jrxmlContent, { contentType: 'application/xml' });
  return dom.window.document;
}

describe('测试边框宽度为0时不生成box标签', () => {
  test('全局边框宽度为0时不生成box标签', () => {
    const jrxmlWithZeroBorder = `
    <jasperReport>
      <detail>
        <band height="100">
          <staticText>
            <reportElement x="10" y="10" width="100" height="20">
              <box>
                <pen lineWidth="0"/>
              </box>
            </reportElement>
            <text><![CDATA[测试文本]]></text>
          </staticText>
        </band>
      </detail>
    </jasperReport>
    `;

    const parsedData = parseJRXMLContent(jrxmlWithZeroBorder);
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields || [],
      parsedData.parameters || []
    );

    // 验证生成的JRXML中不包含box标签
    const doc = parseJRXMLToDOM(generatedJRXML);
    const staticTextElements = doc.querySelectorAll('staticText');
    expect(staticTextElements.length).toBeGreaterThan(0);
    
    // 检查是否没有生成box标签
    const boxElement = staticTextElements[0].querySelector('box');
    expect(boxElement).toBeNull();
  });

  test('各边边框宽度为0时不生成对应的pen标签', () => {
    const jrxmlWithZeroBorders = `
    <jasperReport>
      <detail>
        <band height="100">
          <staticText>
            <reportElement x="10" y="10" width="100" height="20">
              <box>
                <topPen lineWidth="0"/>
                <leftPen lineWidth="0"/>
                <bottomPen lineWidth="0"/>
                <rightPen lineWidth="0"/>
              </box>
            </reportElement>
            <text><![CDATA[测试文本]]></text>
          </staticText>
        </band>
      </detail>
    </jasperReport>
    `;

    const parsedData = parseJRXMLContent(jrxmlWithZeroBorders);
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields || [],
      parsedData.parameters || []
    );

    // 验证生成的JRXML中不包含任何pen标签
    const doc = parseJRXMLToDOM(generatedJRXML);
    const staticTextElements = doc.querySelectorAll('staticText');
    expect(staticTextElements.length).toBeGreaterThan(0);
    
    // 检查是否没有生成box标签
    const boxElement = staticTextElements[0].querySelector('box');
    expect(boxElement).toBeNull();
  });
});