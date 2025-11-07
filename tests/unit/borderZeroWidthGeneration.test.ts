import { generateJRXMLContent, parseJRXMLContent } from '../../src/utils/jrxmlGenerator';

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
    expect(generatedJRXML).not.toContain('<box>');
    expect(generatedJRXML).not.toContain('</box>');
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
    expect(generatedJRXML).not.toContain('<pen');
    expect(generatedJRXML).not.toContain('<topPen');
    expect(generatedJRXML).not.toContain('<leftPen');
    expect(generatedJRXML).not.toContain('<bottomPen');
    expect(generatedJRXML).not.toContain('<rightPen');
  });

  test('部分边框宽度为0时只生成非零边框的pen标签', () => {
    const jrxmlWithMixedBorders = `
    <jasperReport>
      <detail>
        <band height="100">
          <staticText>
            <reportElement x="10" y="10" width="100" height="20">
              <box>
                <topPen lineWidth="0"/>
                <leftPen lineWidth="1"/>
                <bottomPen lineWidth="2"/>
                <rightPen lineWidth="0"/>
              </box>
            </reportElement>
            <text><![CDATA[测试文本]]></text>
          </staticText>
        </band>
      </detail>
    </jasperReport>
    `;

    const parsedData = parseJRXMLContent(jrxmlWithMixedBorders);
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields || [],
      parsedData.parameters || []
    );

    // 验证生成的JRXML中只包含非零边框的pen标签
    expect(generatedJRXML).not.toContain('<topPen');
    expect(generatedJRXML).toContain('<leftPen lineWidth="1"');
    expect(generatedJRXML).toContain('<bottomPen lineWidth="2"');
    expect(generatedJRXML).not.toContain('<rightPen');
  });

  test('全局边框宽度为0且有边距时仍然生成box标签', () => {
    const jrxmlWithZeroBorderAndPadding = `
    <jasperReport>
      <detail>
        <band height="100">
          <staticText>
            <reportElement x="10" y="10" width="100" height="20">
              <box padding="5">
                <pen lineWidth="0"/>
              </box>
            </reportElement>
            <text><![CDATA[测试文本]]></text>
          </staticText>
        </band>
      </detail>
    </jasperReport>
    `;

    const parsedData = parseJRXMLContent(jrxmlWithZeroBorderAndPadding);
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields || [],
      parsedData.parameters || []
    );

    // 验证生成的JRXML中包含box标签但不包含pen标签
    expect(generatedJRXML).toContain('<box');
    expect(generatedJRXML).toContain('padding="5"');
    expect(generatedJRXML).not.toContain('<pen lineWidth="0"');
  });
});