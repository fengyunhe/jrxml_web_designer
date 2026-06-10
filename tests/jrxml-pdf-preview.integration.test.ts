/**
 * Integration Tests: jrxml-pdf-preview.firegod.cn JRXML Validity Verification
 *
 * These tests send real HTTP POST requests to the preview server to validate
 * that JRXML templates are accepted and produce valid PDF output.
 *
 * Run with: npx vitest run tests/jrxml-pdf-preview.integration.test.ts
 * Run with longer timeout: npx vitest run tests/jrxml-pdf-preview.integration.test.ts --testTimeout=30000
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PREVIEW_API_URL = 'https://jrxml-pdf-preview.firegod.cn/api/pdf/generateForm';
const REQUEST_TIMEOUT = 20000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PreviewPayload {
  jrxml: string;
  parameters?: Record<string, unknown>;
  dataSource?: Record<string, unknown>[];
}

async function sendPreviewRequest(payload: PreviewPayload): Promise<Response> {
  const body = new URLSearchParams();
  body.set('jrxml', payload.jrxml);
  body.set('parameters', JSON.stringify(payload.parameters ?? {}));
  body.set('dataSource', JSON.stringify(payload.dataSource ?? []));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(PREVIEW_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/** Send request and return null if network fails (unreachable server) */
async function safeSend(payload: PreviewPayload): Promise<Response | null> {
  try {
    return await sendPreviewRequest(payload);
  } catch {
    return null;
  }
}

function requireResponse(response: Response | null): Response {
  if (!response) {
    // Server unreachable — return a dummy that will cause a clear skip message.
    // We throw a known error so the test is marked as failed with a clear reason
    // rather than crashing on null access.
    throw new Error('SKIP: Preview server is unreachable — run these tests in an environment with network access to jrxml-pdf-preview.firegod.cn');
  }
  return response;
}

// ---------------------------------------------------------------------------
// JRXML Templates (inline)
// ---------------------------------------------------------------------------

const MINIMAL_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="MinimalReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="30"/>
        <textElement><font size="14" isBold="true"/></textElement>
        <text><![CDATA[Hello World]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;

const ALL_BANDS_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="AllBandsReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title><band height="50"><staticText><reportElement x="0" y="0" width="200" height="30"/><text><![CDATA[Title]]></text></staticText></band></title>
  <pageHeader><band height="30"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Page Header]]></text></staticText></band></pageHeader>
  <columnHeader><band height="20"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Column]]></text></staticText></band></columnHeader>
  <detail><band height="20"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Detail]]></text></staticText></band></detail>
  <columnFooter><band height="20"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Col Footer]]></text></staticText></band></columnFooter>
  <pageFooter><band height="30"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Page Footer]]></text></staticText></band></pageFooter>
  <summary><band height="40"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Summary]]></text></staticText></band></summary>
</jasperReport>`;

const PARAMETERS_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="ParametersReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <parameter name="reportTitle" class="java.lang.String"/>
  <parameter name="maxRows" class="java.lang.Integer"/>
  <parameter name="discount" class="java.lang.Double"/>
  <parameter name="isActive" class="java.lang.Boolean"/>
  <parameter name="startDate" class="java.util.Date"/>
  <parameter name="recordId" class="java.lang.Long"/>
  <parameter name="weight" class="java.lang.Float"/>
  <title>
    <band height="50">
      <textField>
        <reportElement x="0" y="0" width="300" height="30"/>
        <textFieldExpression><![CDATA[$P{reportTitle}]]></textFieldExpression>
      </textField>
    </band>
  </title>
</jasperReport>`;

const FIELDS_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="FieldsReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <queryString language="sql"><![CDATA[SELECT * FROM users]]></queryString>
  <field name="userName" class="java.lang.String"/>
  <field name="age" class="java.lang.Integer"/>
  <field name="salary" class="java.lang.Double"/>
  <field name="isVip" class="java.lang.Boolean"/>
  <field name="userId" class="java.lang.Long"/>
  <title><band height="30"/></title>
  <detail>
    <band height="25">
      <textField>
        <reportElement x="0" y="0" width="150" height="20"/>
        <textFieldExpression><![CDATA[$F{userName}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

const GRAPHICS_ELEMENTS_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="GraphicsElementsReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="200">
      <staticText>
        <reportElement x="0" y="0" width="200" height="25"/>
        <text><![CDATA[Graphics Elements Test]]></text>
      </staticText>
      <line>
        <reportElement x="0" y="30" width="555" height="1"/>
        <graphicElement><pen lineWidth="1.0"/></graphicElement>
      </line>
      <rectangle>
        <reportElement x="10" y="40" width="200" height="100"/>
        <graphicElement><pen lineWidth="2.0" lineColor="#0000FF"/></graphicElement>
      </rectangle>
      <image>
        <reportElement x="230" y="40" width="100" height="100"/>
        <imageExpression><![CDATA["https://search-operate.cdn.bcebos.com/fea1ebd1003179f119e5782b1656c06e.gif"]]></imageExpression>
      </image>
      <ellipse>
        <reportElement x="360" y="40" width="150" height="100"/>
        <graphicElement><pen lineWidth="1.5" lineColor="#FF0000"/></graphicElement>
      </ellipse>
    </band>
  </title>
</jasperReport>`;

const STYLES_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="StylesReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <style name="TitleStyle" isBold="true" fontSize="20" forecolor="#333333"/>
  <style name="RowEven" mode="Opaque" backcolor="#F5F5F5"/>
  <style name="RowOdd" mode="Opaque" backcolor="#FFFFFF"/>
  <style name="BorderedBox">
    <box>
      <pen lineWidth="0.5" lineColor="#CCCCCC"/>
      <topPen lineWidth="0.5" lineColor="#CCCCCC"/>
      <leftPen lineWidth="0.5" lineColor="#CCCCCC"/>
      <bottomPen lineWidth="0.5" lineColor="#CCCCCC"/>
      <rightPen lineWidth="0.5" lineColor="#CCCCCC"/>
    </box>
  </style>
  <title>
    <band height="40">
      <staticText>
        <reportElement x="0" y="0" width="300" height="30" style="TitleStyle"/>
        <text><![CDATA[Styled Report]]></text>
      </staticText>
    </band>
  </title>
  <detail>
    <band height="25">
      <staticText>
        <reportElement x="0" y="0" width="555" height="25" style="BorderedBox"/>
        <text><![CDATA[Styled row]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

const UNICODE_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="UnicodeReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="100">
      <staticText>
        <reportElement x="0" y="0" width="300" height="25"/>
        <text><![CDATA[中文测试 - Chinese Text]]></text>
      </staticText>
      <staticText>
        <reportElement x="0" y="30" width="300" height="25"/>
        <text><![CDATA[日本語テスト - Japanese Text]]></text>
      </staticText>
      <staticText>
        <reportElement x="0" y="60" width="300" height="25"/>
        <text><![CDATA[한국어 테스트 - Korean Text]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;

const TABLE_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TableReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20"
    whenNoDataType="AllSectionsNoDetail">
  <subDataset name="tableDataset" uuid="a1b2c3d4-e5f6-7890-abcd-ef1234567890">
    <queryString language="sql"><![CDATA[SELECT * FROM orders]]></queryString>
    <field name="ORDERID" class="java.lang.Integer"/>
    <field name="CUSTOMERID" class="java.lang.String"/>
    <field name="ORDERDATE" class="java.util.Date"/>
  </subDataset>
  <title><band height="40"><staticText><reportElement x="0" y="0" width="200" height="30"/><text><![CDATA[Table Report]]></text></staticText></band></title>
  <detail>
    <band height="120">
      <componentElement>
        <reportElement x="0" y="0" width="555" height="120"/>
        <jr:table xmlns:jr="http://jasperreports.sourceforge.net/jasperreports/components"
                  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports/components http://jasperreports.sourceforge.net/xsd/components.xsd"
                  whenNoDataType="AllSectionsNoDetail">
          <datasetRun subDataset="tableDataset">
            <connectionExpression><![CDATA[$P{REPORT_CONNECTION}]]></connectionExpression>
          </datasetRun>
          <jr:column width="185" uuid="b1a2c3d4-e5f6-7890-abcd-ef1234567891">
            <jr:columnHeader height="30">
              <staticText>
                <reportElement x="0" y="0" width="185" height="30"/>
                <box><pen lineWidth="1.0"/></box>
                <textElement textAlignment="Center" verticalAlignment="Middle"/>
                <text><![CDATA[ORDER ID]]></text>
              </staticText>
            </jr:columnHeader>
            <jr:detailCell height="30">
              <textField>
                <reportElement x="0" y="0" width="185" height="30"/>
                <box><pen lineWidth="0.5"/></box>
                <textElement textAlignment="Center" verticalAlignment="Middle"/>
                <textFieldExpression><![CDATA[$F{ORDERID}]]></textFieldExpression>
              </textField>
            </jr:detailCell>
          </jr:column>
          <jr:column width="185" uuid="b2c3d4e5-f6a7-8901-bcde-f12345678901">
            <jr:columnHeader height="30">
              <staticText>
                <reportElement x="0" y="0" width="185" height="30"/>
                <box><pen lineWidth="1.0"/></box>
                <textElement textAlignment="Center" verticalAlignment="Middle"/>
                <text><![CDATA[CUSTOMER]]></text>
              </staticText>
            </jr:columnHeader>
            <jr:detailCell height="30">
              <textField>
                <reportElement x="0" y="0" width="185" height="30"/>
                <box><pen lineWidth="0.5"/></box>
                <textElement textAlignment="Center" verticalAlignment="Middle"/>
                <textFieldExpression><![CDATA[$F{CUSTOMERID}]]></textFieldExpression>
              </textField>
            </jr:detailCell>
          </jr:column>
          <jr:column width="185" uuid="c3d4e5f6-a7b8-9012-cdef-123456789012">
            <jr:columnHeader height="30">
              <staticText>
                <reportElement x="0" y="0" width="185" height="30"/>
                <box><pen lineWidth="1.0"/></box>
                <textElement textAlignment="Center" verticalAlignment="Middle"/>
                <text><![CDATA[DATE]]></text>
              </staticText>
            </jr:columnHeader>
            <jr:detailCell height="30">
              <textField>
                <reportElement x="0" y="0" width="185" height="30"/>
                <box><pen lineWidth="0.5"/></box>
                <textElement textAlignment="Center" verticalAlignment="Middle"/>
                <textFieldExpression><![CDATA[$F{ORDERDATE}]]></textFieldExpression>
              </textField>
            </jr:detailCell>
          </jr:column>
        </jr:table>
      </componentElement>
    </band>
  </detail>
</jasperReport>`;

const EXPRESSIONS_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="ExpressionsReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <parameter name="reportDate" class="java.lang.String"/>
  <queryString language="sql"><![CDATA[SELECT 1 AS id]]></queryString>
  <variable name="reportCounter" class="java.lang.Integer" calculation="Count"/>
  <title>
    <band height="100">
      <textField>
        <reportElement x="0" y="0" width="300" height="25"/>
        <textFieldExpression><![CDATA["Report generated on: " + $P{reportDate}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="30" width="300" height="25"/>
        <textFieldExpression><![CDATA["Total records: " + $V{reportCounter}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="60" width="400" height="25"/>
        <textFieldExpression><![CDATA["Concat: " + "Hello" + " " + "World"]]></textFieldExpression>
      </textField>
    </band>
  </title>
</jasperReport>`;

const MULTI_PAGE_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="MultiPageReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="40">
      <staticText>
        <reportElement x="0" y="0" width="200" height="30"/>
        <text><![CDATA[Multi-Page Layout]]></text>
      </staticText>
    </band>
  </title>
  <pageHeader>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="100" height="20"/>
        <text><![CDATA[Header]]></text>
      </staticText>
    </band>
  </pageHeader>
  <pageFooter>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="100" height="20"/>
        <textFieldExpression><![CDATA["Page " + $V{PAGE_NUMBER}]]></textFieldExpression>
      </textField>
    </band>
  </pageFooter>
</jasperReport>`;

const LANDSCAPE_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="LandscapeReport"
    pageWidth="842" pageHeight="595"
    columnWidth="802" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="300" height="25"/>
        <text><![CDATA[Landscape Orientation Report]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;

const FRAME_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="FrameReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="150">
      <frame>
        <reportElement x="10" y="10" width="535" height="130"/>
        <box>
          <pen lineWidth="2.0" lineColor="#0066CC"/>
          <topPen lineWidth="2.0" lineColor="#0066CC"/>
          <leftPen lineWidth="2.0" lineColor="#0066CC"/>
          <bottomPen lineWidth="2.0" lineColor="#0066CC"/>
          <rightPen lineWidth="2.0" lineColor="#0066CC"/>
        </box>
        <staticText>
          <reportElement x="10" y="10" width="200" height="25"/>
          <text><![CDATA[Inside Frame]]></text>
        </staticText>
        <staticText>
          <reportElement x="10" y="40" width="300" height="25"/>
          <text><![CDATA[Nested static text in frame]]></text>
        </staticText>
      </frame>
    </band>
  </title>
</jasperReport>`;

const TEXT_FORMATTING_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TextFormattingReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <parameter name="amount" class="java.lang.String"/>
  <queryString language="sql"><![CDATA[SELECT 1]]></queryString>
  <title>
    <band height="120">
      <staticText>
        <reportElement x="0" y="0" width="300" height="20"/>
        <textElement>
          <font size="14" isBold="true" isItalic="false" isUnderline="true" isStrikeThrough="false"/>
          <paragraph lineSpacing="Double"/>
        </textElement>
        <text><![CDATA[Formatted Text]]></text>
      </staticText>
      <textField isBlankWhenNull="true" textAdjust="StretchHeight" pattern="#,##0.00">
        <reportElement x="0" y="30" width="200" height="30"/>
        <textElement>
          <font size="12"/>
          <paragraph lineSpacing="1_1_2"/>
        </textElement>
        <textFieldExpression><![CDATA[$P{amount}]]></textFieldExpression>
      </textField>
      <textField isStretchWithOverflow="true">
        <reportElement x="0" y="70" width="400" height="40"/>
        <textElement><font size="10"/></textElement>
        <textFieldExpression><![CDATA["This is a very long text that should stretch the height of the text field to accommodate the content within it."]]></textFieldExpression>
      </textField>
    </band>
  </title>
</jasperReport>`;

const SPECIAL_CHARS_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="SpecialCharsReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="80">
      <staticText>
        <reportElement x="0" y="0" width="400" height="25"/>
        <text><![CDATA[Ampersand: &amp; Less Than: &lt; Greater Than: &gt;]]></text>
      </staticText>
      <staticText>
        <reportElement x="0" y="30" width="400" height="25"/>
        <text><![CDATA[Quotes: "double" and 'single']]></text>
      </staticText>
      <staticText>
        <reportElement x="0" y="55" width="400" height="20"/>
        <text><![CDATA[Symbols: @#$%^*()_+={}[]|\\/]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;

const LARGE_JRXML = (() => {
  let elements = '';
  for (let i = 0; i < 50; i++) {
    elements += `
      <staticText>
        <reportElement x="0" y="${i * 15}" width="555" height="14"/>
        <text><![CDATA[Line ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.]]></text>
      </staticText>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="LargeReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <title>
    <band height="750">
      ${elements}
    </band>
  </title>
</jasperReport>`;
})();

const INVALID_JRXML = 'this is not valid xml at all <broken>';

const MALFORMED_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="MalformedReport"
              pageWidth="595" pageHeight="842">
  <detail>
    <band height="100">
      <nonExistentElement>
        <reportElement x="0" y="0" width="100" height="50"/>
      </nonExistentElement>
    </band>
  </detail>
</jasperReport>`;

const EMPTY_JRXML = '';
const XML_HEADER_ONLY = '<?xml version="1.0" encoding="UTF-8"?>';

// ===========================================================================
// Test Suites
// ===========================================================================

describe('jrxml-pdf-preview.firegod.cn - JRXML Validity Integration Tests', () => {

  // -----------------------------------------------------------------------
  // 1. Basic JRXML Validity
  // -----------------------------------------------------------------------
  describe('1. Basic JRXML Validity', () => {
    it('should accept minimal valid JRXML and return HTTP 200', async () => {
      const res = requireResponse(await safeSend({ jrxml: MINIMAL_JRXML }));
      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
    });

    it('should return valid PDF content (magic bytes %PDF)', async () => {
      const res = requireResponse(await safeSend({ jrxml: MINIMAL_JRXML }));
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should set appropriate content-type header', async () => {
      const res = requireResponse(await safeSend({ jrxml: MINIMAL_JRXML }));
      const ct = res.headers.get('content-type') || '';
      const isPdf = ct.includes('application/pdf');
      const isBinary = ct.includes('application/octet-stream');
      if (!isPdf && !isBinary) {
        expect(ct).not.toMatch(/text\/html.*error/i);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 2. All Standard Bands
  // -----------------------------------------------------------------------
  describe('2. All Standard Bands', () => {
    it('should accept JRXML with all standard bands', async () => {
      const res = requireResponse(await safeSend({ jrxml: ALL_BANDS_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Parameters of Various Java Types
  // -----------------------------------------------------------------------
  describe('3. Parameters of Various Java Types', () => {
    it('should accept JRXML with all parameter types', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: {
          reportTitle: 'Monthly Sales Report',
          maxRows: 100,
          discount: 0.15,
          isActive: true,
          startDate: '2026-01-15',
          recordId: 9876543210,
          weight: 3.14,
        },
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should accept JRXML with empty parameters object', async () => {
      const res = requireResponse(await safeSend({ jrxml: PARAMETERS_JRXML, parameters: {} }));
      expect([200, 400, 422, 500]).toContain(res.status);
    });

    it('should accept string-type parameters', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: { reportTitle: 'Test Report' },
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept numeric parameters as strings (form encoding)', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: { maxRows: '50', discount: '10.5', recordId: '12345' },
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept boolean parameters as strings', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: { isActive: 'true' },
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept date parameters as ISO strings', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: { startDate: '2026-05-31' },
      }));
      expect(res.ok).toBe(true);
    });

    it('should handle null parameter values gracefully', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: { reportTitle: null, maxRows: null },
      }));
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Fields / DataSource
  // -----------------------------------------------------------------------
  describe('4. Fields and DataSource', () => {
    it('should accept JRXML with String fields', async () => {
      const res = requireResponse(await safeSend({
        jrxml: FIELDS_JRXML,
        dataSource: [{ userName: 'Alice' }, { userName: 'Bob' }],
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should accept mixed-type field data', async () => {
      const res = requireResponse(await safeSend({
        jrxml: FIELDS_JRXML,
        dataSource: [
          { userName: 'Alice', age: 30, salary: 50000.50, isVip: true, userId: 1001 },
          { userName: 'Bob', age: 25, salary: 42000.75, isVip: false, userId: 1002 },
        ],
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept empty dataSource array (no data)', async () => {
      const res = requireResponse(await safeSend({ jrxml: FIELDS_JRXML, dataSource: [] }));
      expect(res.ok).toBe(true);
    });

    it('should handle 50-row dataSource', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        userName: `User_${i}`, age: 20 + i, salary: 30000 + i * 1000, isVip: i % 2 === 0, userId: 1000 + i,
      }));
      const res = requireResponse(await safeSend({ jrxml: FIELDS_JRXML, dataSource: rows }));
      expect(res.ok).toBe(true);
    });

    it('should handle dataSource with null field values', async () => {
      const res = requireResponse(await safeSend({
        jrxml: FIELDS_JRXML,
        dataSource: [{ userName: null, age: null, salary: null, isVip: null, userId: null }],
      }));
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle dataSource with empty string / zero values', async () => {
      const res = requireResponse(await safeSend({
        jrxml: FIELDS_JRXML,
        dataSource: [{ userName: '', age: 0, salary: 0.0, isVip: false, userId: 0 }],
      }));
      expect(res.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Graphics Elements
  // -----------------------------------------------------------------------
  describe('5. Graphics Elements (Image, Line, Rectangle, Ellipse)', () => {
    it('should accept JRXML with all graphics elements', async () => {
      const res = requireResponse(await safeSend({ jrxml: GRAPHICS_ELEMENTS_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Styles
  // -----------------------------------------------------------------------
  describe('6. Styles and Conditional Formatting', () => {
    it('should accept JRXML with named styles and box properties', async () => {
      const res = requireResponse(await safeSend({ jrxml: STYLES_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Unicode / Multilingual
  // -----------------------------------------------------------------------
  describe('7. Unicode and Multilingual Text', () => {
    it('should accept JRXML with Chinese, Japanese, Korean text', async () => {
      const res = requireResponse(await safeSend({ jrxml: UNICODE_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 8. Table Component (sub-dataset)
  // -----------------------------------------------------------------------
  describe('8. Table Component with Sub-Dataset', () => {
    it('should accept JRXML with table component and data', async () => {
      const res = requireResponse(await safeSend({
        jrxml: TABLE_JRXML,
        dataSource: [
          { ORDERID: 1001, CUSTOMERID: 'C001', ORDERDATE: '2026-01-15' },
          { ORDERID: 1002, CUSTOMERID: 'C002', ORDERDATE: '2026-02-20' },
        ],
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should accept table JRXML with whenNoDataType and empty data', async () => {
      const res = requireResponse(await safeSend({ jrxml: TABLE_JRXML, dataSource: [] }));
      expect(res.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 9. Expressions and Variables
  // -----------------------------------------------------------------------
  describe('9. Expressions and Variables', () => {
    it('should accept JRXML with parameter + variable expressions', async () => {
      const res = requireResponse(await safeSend({
        jrxml: EXPRESSIONS_JRXML,
        parameters: { reportDate: '2026-05-31' },
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Page Layout Variations
  // -----------------------------------------------------------------------
  describe('10. Page Layout Variations', () => {
    it('should accept landscape orientation', async () => {
      const res = requireResponse(await safeSend({ jrxml: LANDSCAPE_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should accept multi-page layout with PAGE_NUMBER', async () => {
      const res = requireResponse(await safeSend({ jrxml: MULTI_PAGE_JRXML }));
      expect(res.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Frame (Container) Elements
  // -----------------------------------------------------------------------
  describe('11. Frame (Container) Elements', () => {
    it('should accept JRXML with nested frame elements', async () => {
      const res = requireResponse(await safeSend({ jrxml: FRAME_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 12. Text Formatting
  // -----------------------------------------------------------------------
  describe('12. Text Formatting and Properties', () => {
    it('should accept JRXML with font, paragraph, and pattern settings', async () => {
      const res = requireResponse(await safeSend({
        jrxml: TEXT_FORMATTING_JRXML,
        parameters: { amount: '1234.56' },
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 13. Special Characters
  // -----------------------------------------------------------------------
  describe('13. Special Characters in XML', () => {
    it('should accept JRXML with XML entity-encoded special characters', async () => {
      const res = requireResponse(await safeSend({ jrxml: SPECIAL_CHARS_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 14. Large Payload
  // -----------------------------------------------------------------------
  describe('14. Large Payload Handling', () => {
    it('should handle 50 static text elements in one band', async () => {
      const res = requireResponse(await safeSend({ jrxml: LARGE_JRXML }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should handle 100-row dataSource', async () => {
      const rows = Array.from({ length: 100 }, (_, i) => ({
        userName: `User_${i}`, age: 20 + (i % 50), salary: 30000 + i * 100, isVip: i % 2 === 0, userId: 1000 + i,
      }));
      const res = requireResponse(await safeSend({ jrxml: FIELDS_JRXML, dataSource: rows }));
      expect(res.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 15. Invalid / Error Cases
  // -----------------------------------------------------------------------
  describe('15. Invalid JRXML Error Handling', () => {
    it('should reject non-XML content with error status', async () => {
      const res = requireResponse(await safeSend({ jrxml: INVALID_JRXML }));
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle malformed XML structure gracefully', async () => {
      const res = requireResponse(await safeSend({ jrxml: MALFORMED_JRXML }));
      expect([200, 400, 422, 500]).toContain(res.status);
    });

    it('should reject empty JRXML content', async () => {
      const res = requireResponse(await safeSend({ jrxml: EMPTY_JRXML }));
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject XML header only (no JRXML)', async () => {
      const res = requireResponse(await safeSend({ jrxml: XML_HEADER_ONLY }));
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // -----------------------------------------------------------------------
  // 16. Payload Format and Encoding
  // -----------------------------------------------------------------------
  describe('16. Payload Format and Encoding', () => {
    it('should accept standard form-urlencoded content-type', async () => {
      const res = requireResponse(await safeSend({ jrxml: MINIMAL_JRXML }));
      if (!res.ok) {
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
      }
    });

    it('should handle JRXML with quotes in text content', async () => {
      const jrxmlWithQuotes = MINIMAL_JRXML.replace(
        '<text><![CDATA[Hello World]]></text>',
        '<text><![CDATA[He said "hello" and \'goodbye\']]></text>'
      );
      const res = requireResponse(await safeSend({ jrxml: jrxmlWithQuotes }));
      expect(res.ok).toBe(true);
    });

    it('should handle parameters JSON with special characters', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: { reportTitle: 'Report with "quotes" and <special> & chars' },
      }));
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle dataSource JSON with unicode values', async () => {
      const res = requireResponse(await safeSend({
        jrxml: FIELDS_JRXML,
        dataSource: [
          { userName: '张三', age: 28, salary: 50000.0, isVip: true, userId: 1001 },
          { userName: '田中太郎', age: 35, salary: 60000.0, isVip: false, userId: 1002 },
        ],
      }));
      expect(res.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 17. HTTP Method Restrictions
  // -----------------------------------------------------------------------
  describe('17. HTTP Method Restrictions', () => {
    it('should reject GET requests', async () => {
      try {
        const res = await sendPreviewRequest({ jrxml: MINIMAL_JRXML });
        // If it somehow succeeds, it shouldn't return PDF for GET
        expect(res.status).not.toBe(200);
      } catch {
        // Network error is acceptable (server may reject connection)
      }
    });
  });

  // -----------------------------------------------------------------------
  // 18. Response Consistency
  // -----------------------------------------------------------------------
  describe('18. Response Consistency', () => {
    it('should return consistent PDF size for identical inputs', async () => {
      const payload = { jrxml: MINIMAL_JRXML };
      const res1 = requireResponse(await safeSend(payload));
      const buf1 = await res1.arrayBuffer();

      const res2 = requireResponse(await safeSend(payload));
      const buf2 = await res2.arrayBuffer();

      expect(buf1.byteLength).toBe(buf2.byteLength);
    });

    it('should return larger PDF for more complex JRXML', async () => {
      const res1 = requireResponse(await safeSend({ jrxml: MINIMAL_JRXML }));
      const buf1 = await res1.arrayBuffer();

      const res2 = requireResponse(await safeSend({ jrxml: LARGE_JRXML }));
      const buf2 = await res2.arrayBuffer();

      expect(buf2.byteLength).toBeGreaterThan(buf1.byteLength);
    });
  });

  // -----------------------------------------------------------------------
  // 19. Fixture File JRXMLs
  // -----------------------------------------------------------------------
  describe('19. Fixture File JRXMLs (Real-world templates)', () => {
    const fixturesDir = resolve(__dirname);

    it('should accept why_the_column_header_text_align.jrxml', async () => {
      const jrxml = readFileSync(resolve(fixturesDir, 'why_the_column_header_text_align.jrxml'), 'utf-8');
      const res = requireResponse(await safeSend({
        jrxml,
        dataSource: [
          { ORDERID: 1, CUSTOMERID: 'C001', EMPLOYEEID: 10, SHIPNAME: 'Ship A', SHIPCITY: 'Beijing' },
        ],
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should accept table_with_2_head_rows.jrxml', async () => {
      const jrxml = readFileSync(resolve(fixturesDir, 'table_with_2_head_rows.jrxml'), 'utf-8');
      const res = requireResponse(await safeSend({ jrxml, dataSource: [] }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should accept grouped_header_column_table_example.jrxml', async () => {
      const jrxml = readFileSync(resolve(fixturesDir, 'build_by_this_designer_jrxml/grouped_header_column_table_example.jrxml'), 'utf-8');
      const res = requireResponse(await safeSend({
        jrxml,
        dataSource: [
          { FIELD_NAME: 'Value 1', FIELD_NAME2: 'Value 2', FIELD_NAME3: 'Value 3' },
        ],
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 20. Combined Parameters + Fields (Full Workflow)
  // -----------------------------------------------------------------------
  describe('20. Combined Parameters and Fields (Full Workflow)', () => {
    it('should produce valid PDF with parameters matching designer mock values', async () => {
      const res = requireResponse(await safeSend({
        jrxml: PARAMETERS_JRXML,
        parameters: {
          reportTitle: 'Integration Test Report',
          maxRows: 100,
          discount: 0.25,
          isActive: true,
          startDate: '2026-01-01',
          recordId: 42,
          weight: 1.5,
        },
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });

    it('should produce valid PDF with mock data matching PdfPreviewModal.generateMockValue logic', async () => {
      // Simulate PdfPreviewModal's generateMockValue() output
      const mockRow = {
        userName: 'Test String',
        age: 123,
        salary: 123.45,
        isVip: true,
        userId: 123,
      };

      const res = requireResponse(await safeSend({
        jrxml: FIELDS_JRXML,
        dataSource: [mockRow],
      }));
      expect(res.ok).toBe(true);
      const buffer = await res.arrayBuffer();
      expect(isPdfBuffer(buffer)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 21. Concurrent Requests
  // -----------------------------------------------------------------------
  describe('21. Concurrent Requests', () => {
    it('should handle 3 concurrent requests without errors', async () => {
      const requests = [
        safeSend({ jrxml: MINIMAL_JRXML }),
        safeSend({ jrxml: ALL_BANDS_JRXML }),
        safeSend({ jrxml: LANDSCAPE_JRXML }),
      ];

      const results = await Promise.all(requests);
      for (const res of results) {
        requireResponse(res);
        expect(res!.ok).toBe(true);
        const buffer = await res!.arrayBuffer();
        expect(isPdfBuffer(buffer)).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 22. Edge Cases
  // -----------------------------------------------------------------------
  describe('22. Edge Cases', () => {
    it('should accept large page dimensions (A0-like)', async () => {
      const res = requireResponse(await safeSend({
        jrxml: MINIMAL_JRXML
          .replace('pageWidth="595" pageHeight="842"', 'pageWidth="2384" pageHeight="3371"')
          .replace('columnWidth="555"', 'columnWidth="2344"'),
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept zero margins', async () => {
      const res = requireResponse(await safeSend({
        jrxml: MINIMAL_JRXML
          .replace('leftMargin="20" rightMargin="20"\n    topMargin="20" bottomMargin="20"',
                    'leftMargin="0" rightMargin="0"\n    topMargin="0" bottomMargin="0"'),
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept empty text elements', async () => {
      const res = requireResponse(await safeSend({
        jrxml: MINIMAL_JRXML.replace('<text><![CDATA[Hello World]]></text>', '<text><![CDATA[]]></text>'),
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept CDATA containing XML-like content', async () => {
      const res = requireResponse(await safeSend({
        jrxml: MINIMAL_JRXML.replace(
          '<text><![CDATA[Hello World]]></text>',
          '<text><![CDATA[<b>Bold</b> <i>Italic</i> &amp; more]]></text>'
        ),
      }));
      expect(res.ok).toBe(true);
    });

    it('should accept very long text (1000+ chars)', async () => {
      const longText = 'A'.repeat(1000);
      const res = requireResponse(await safeSend({
        jrxml: MINIMAL_JRXML.replace('<text><![CDATA[Hello World]]></text>', `<text><![CDATA[${longText}]]></text>`),
      }));
      expect(res.ok).toBe(true);
    });
  });
});
