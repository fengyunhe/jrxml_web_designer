/**
 * Round-trip integrity tests for parse ↔ generate.
 * These verify that the parse/generate fixes are correct WITHOUT
 * needing the external preview server.
 *
 * Run: npx vitest run tests/round-trip-integrity.test.ts
 */

import { describe, it, expect } from 'vitest';
import { parseJRXMLContent } from '@/utils/jrxml/parse';
import { generateJRXMLContent } from '@/utils/jrxmlGenerator';

// ---------------------------------------------------------------------------
// Minimal JRXML fixtures for round-trip testing
// ---------------------------------------------------------------------------

const MINIMAL_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestReport"
    pageWidth="595" pageHeight="842"
    columnWidth="555" leftMargin="20" rightMargin="20"
    topMargin="20" bottomMargin="20">
  <field name="userName" class="java.lang.String"/>
  <field name="age" class="java.lang.Integer"/>
  <parameter name="reportTitle" class="java.lang.String"/>
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="30" uuid="s1"/>
        <textElement>
          <font fontName="Arial" size="14" isBold="true"/>
        </textElement>
        <text><![CDATA[Static Text]]></text>
      </staticText>
      <textField isBlankWhenNull="true">
        <reportElement x="210" y="0" width="200" height="30" uuid="t1"/>
        <textElement>
          <font size="12"/>
        </textElement>
        <textFieldExpression><![CDATA[$F{userName}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

const FORECOLOR_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="ForecolorTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="100">
      <rectangle>
        <reportElement x="0" y="0" width="100" height="50" uuid="r1" forecolor="#FF0000" backcolor="#00FF00" mode="Opaque"/>
      </rectangle>
      <ellipse>
        <reportElement x="120" y="0" width="100" height="50" uuid="e1" forecolor="#0000FF" backcolor="#FFFF00" mode="Transparent"/>
      </ellipse>
      <line>
        <reportElement x="0" y="60" width="555" height="1" uuid="l1" forecolor="#333333" mode="Transparent"/>
      </line>
    </band>
  </title>
</jasperReport>`;

const FRAME_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="FrameTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="150">
      <frame>
        <reportElement x="10" y="10" width="500" height="100" uuid="f1" forecolor="#AA00BB" backcolor="#112233"/>
        <staticText>
          <reportElement x="10" y="10" width="200" height="25" uuid="fs1"/>
          <text><![CDATA[Inside Frame]]></text>
        </staticText>
      </frame>
    </band>
  </title>
</jasperReport>`;

const STATICTEXT_ROTATION_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="RotationTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="80">
      <staticText rotation="Left" textAdjust="StretchHeight" pattern="#,##0.00">
        <reportElement x="0" y="0" width="200" height="50" uuid="rs1"/>
        <text><![CDATA[Rotated Text]]></text>
      </staticText>
    </band>
  </title>
</jasperReport>`;

const REPORT_PROPERTY_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="PropertyTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <property name="net.sf.jasperreports.print.keep.full.text" value="true"/>
  <property name="com.example.custom" value="testValue"/>
  <title><band height="30"><staticText><reportElement x="0" y="0" width="100" height="20"/><text><![CDATA[Test]]></text></staticText></band></title>
</jasperReport>`;

const SUBDATASET_PROPERTIES_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="SubDatasetTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <subDataset name="ds1">
    <field name="FIELD1" class="java.lang.String">
      <property name="com.jaspersoft.studio.field.name" value="FIELD1"/>
      <property name="com.jaspersoft.studio.field.label" value="Field 1"/>
    </field>
  </subDataset>
  <title><band height="30"/></title>
</jasperReport>`;

const EXPRESSION_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="ExpressionTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <field name="amount" class="java.lang.Double"/>
  <queryString language="sql"><![CDATA[SELECT 1]]></queryString>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="exp1"/>
        <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="20" width="200" height="20" uuid="exp2"/>
        <textFieldExpression><![CDATA["Total: " + $F{amount}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Round-trip integrity: parse ↔ generate', () => {

  it('should preserve basic report properties', () => {
    const parsed = parseJRXMLContent(MINIMAL_JRXML);

    expect(parsed.properties.name).toBe('TestReport');
    expect(parsed.properties.pageWidth).toBe(595);
    expect(parsed.properties.pageHeight).toBe(842);
    expect(parsed.properties.leftMargin).toBe(20);
    expect(parsed.properties.rightMargin).toBe(20);
    expect(parsed.properties.topMargin).toBe(20);
    expect(parsed.properties.bottomMargin).toBe(20);
  });

  it('should parse and regenerate fields', () => {
    const parsed = parseJRXMLContent(MINIMAL_JRXML);
    expect(parsed.fields).toHaveLength(2);
    expect(parsed.fields[0].name).toBe('userName');
    expect(parsed.fields[0].class).toBe('java.lang.String');
    expect(parsed.fields[1].name).toBe('age');
    expect(parsed.fields[1].class).toBe('java.lang.Integer');
  });

  it('should parse and regenerate parameters', () => {
    const parsed = parseJRXMLContent(MINIMAL_JRXML);
    expect(parsed.parameters).toHaveLength(1);
    expect(parsed.parameters[0].name).toBe('reportTitle');
    expect(parsed.parameters[0].class).toBe('java.lang.String');
  });

  it('should parse staticText with font properties', () => {
    const parsed = parseJRXMLContent(MINIMAL_JRXML);
    const staticText = parsed.bands[0]?.elements.find((e: any) => e.type === 'staticText');
    expect(staticText).toBeDefined();
    expect((staticText as any).text).toBe('Static Text');
    expect((staticText as any).fontFamily).toBe('Arial');
    expect((staticText as any).fontSize).toBe(14);
    expect((staticText as any).isBold).toBe(true);
  });

  it('should parse textField with $F{} expression and extract fieldName', () => {
    const parsed = parseJRXMLContent(MINIMAL_JRXML);
    const textField = parsed.bands[0]?.elements.find((e: any) => e.type === 'textField');
    expect(textField).toBeDefined();
    expect((textField as any).expression).toBe('$F{userName}');
    // This was the broken regex bug - should now work
    expect((textField as any).fieldName).toBe('userName');
  });

  it('should preserve forecolor/backcolor/mode on rectangle', () => {
    const parsed = parseJRXMLContent(FORECOLOR_JRXML);
    const rect = parsed.bands[0]?.elements.find((e: any) => e.type === 'rectangle');
    expect(rect).toBeDefined();
    expect((rect as any).forecolor).toBe('#FF0000');
    expect((rect as any).backcolor).toBe('#00FF00');
    expect((rect as any).mode).toBe('Opaque');
  });

  it('should preserve forecolor/backcolor/mode on ellipse', () => {
    const parsed = parseJRXMLContent(FORECOLOR_JRXML);
    const ellipse = parsed.bands[0]?.elements.find((e: any) => e.type === 'ellipse');
    expect(ellipse).toBeDefined();
    expect((ellipse as any).forecolor).toBe('#0000FF');
    expect((ellipse as any).backcolor).toBe('#FFFF00');
    expect((ellipse as any).mode).toBe('Transparent');
  });

  it('should preserve forecolor/mode on line', () => {
    const parsed = parseJRXMLContent(FORECOLOR_JRXML);
    const line = parsed.bands[0]?.elements.find((e: any) => e.type === 'line');
    expect(line).toBeDefined();
    expect((line as any).forecolor).toBe('#333333');
    expect((line as any).mode).toBe('Transparent');
  });

  it('should parse frame with forecolor/backcolor and its children', () => {
    const parsed = parseJRXMLContent(FRAME_JRXML);
    const frame = parsed.bands[0]?.elements.find((e: any) => e.type === 'frame');
    expect(frame).toBeDefined();
    expect((frame as any).forecolor).toBe('#AA00BB');
    expect((frame as any).backcolor).toBe('#112233');
    // Frame should contain children
    expect((frame as any).elements).toBeDefined();
    expect((frame as any).elements.length).toBeGreaterThan(0);
  });

  it('should parse staticText rotation, textAdjust, pattern', () => {
    const parsed = parseJRXMLContent(STATICTEXT_ROTATION_JRXML);
    const staticText = parsed.bands[0]?.elements.find((e: any) => e.type === 'staticText');
    expect(staticText).toBeDefined();
    expect((staticText as any).rotation).toBe('Left');
    expect((staticText as any).textAdjust).toBe('StretchHeight');
    expect((staticText as any).pattern).toBe('#,##0.00');
  });

  it('should parse report-level <property> elements', () => {
    const parsed = parseJRXMLContent(REPORT_PROPERTY_JRXML);
    expect(parsed.reportProperties).toHaveLength(2);
    expect(parsed.reportProperties[0].name).toBe('net.sf.jasperreports.print.keep.full.text');
    expect(parsed.reportProperties[0].value).toBe('true');
    expect(parsed.reportProperties[1].name).toBe('com.example.custom');
    expect(parsed.reportProperties[1].value).toBe('testValue');
  });

  it('should parse sub-dataset field properties correctly', () => {
    const parsed = parseJRXMLContent(SUBDATASET_PROPERTIES_JRXML);
    expect(parsed.datasets).toHaveLength(1);
    const ds = parsed.datasets[0];
    expect(ds.fields).toHaveLength(1);
    expect(ds.fields[0].name).toBe('FIELD1');
    expect(ds.fields[0].class).toBe('java.lang.String');
    expect(ds.fields[0].properties).toBeDefined();
    // Verify properties are actually the field's property values, not the field's name
    const props = ds.fields[0].properties as Record<string, string>;
    expect(props['com.jaspersoft.studio.field.name']).toBe('FIELD1');
    expect(props['com.jaspersoft.studio.field.label']).toBe('Field 1');
  });

  it('should parse textField expressions with mixed content', () => {
    const parsed = parseJRXMLContent(EXPRESSION_JRXML);
    const textFields = parsed.bands[0]?.elements.filter((e: any) => e.type === 'textField');
    expect(textFields).toHaveLength(2);
    expect((textFields[0] as any).expression).toBe('$F{amount}');
    expect((textFields[0] as any).fieldName).toBe('amount');
    // Mixed expression - fieldName should not be set for non-$F{} only expressions
    expect((textFields[1] as any).expression).toBe('"Total: " + $F{amount}');
  });

  // -----------------------------------------------------------------------
  // Generator tests: verify forecolor is generated for all element types
  // -----------------------------------------------------------------------

  it('generateRectangleXML should include forecolor', () => {
    const parsed = parseJRXMLContent(FORECOLOR_JRXML);
    const generated = generateJRXMLContent(
      parsed.properties,
      parsed.bands,
      parsed.fields,
      parsed.parameters,
      parsed.datasets,
      parsed.styles,
      [],
      parsed.reportProperties
    );
    expect(generated).toContain('forecolor="#FF0000"');
    expect(generated).toContain('backcolor="#00FF00"');
  });

  it('generateEllipseXML should include forecolor', () => {
    const parsed = parseJRXMLContent(FORECOLOR_JRXML);
    const generated = generateJRXMLContent(
      parsed.properties,
      parsed.bands,
      parsed.fields,
      parsed.parameters,
      parsed.datasets,
      parsed.styles,
      [],
      parsed.reportProperties
    );
    expect(generated).toContain('forecolor="#0000FF"');
  });

  it('generateLineXML should include forecolor and mode', () => {
    const parsed = parseJRXMLContent(FORECOLOR_JRXML);
    const generated = generateJRXMLContent(
      parsed.properties,
      parsed.bands,
      parsed.fields,
      parsed.parameters,
      parsed.datasets,
      parsed.styles,
      [],
      parsed.reportProperties
    );
    // Line should have forecolor in the reportElement
    expect(generated).toContain('forecolor="#333333"');
    expect(generated).toContain('mode="Transparent"');
  });

  it('generateFrameXML should include forecolor', () => {
    const parsed = parseJRXMLContent(FRAME_JRXML);
    const generated = generateJRXMLContent(
      parsed.properties,
      parsed.bands,
      parsed.fields,
      parsed.parameters,
      parsed.datasets,
      parsed.styles,
      [],
      parsed.reportProperties
    );
    expect(generated).toContain('forecolor="#AA00BB"');
  });

  it('should regenerate staticText rotation, textAdjust, pattern', () => {
    const parsed = parseJRXMLContent(STATICTEXT_ROTATION_JRXML);
    const generated = generateJRXMLContent(
      parsed.properties,
      parsed.bands,
      parsed.fields,
      parsed.parameters,
      parsed.datasets,
      parsed.styles,
      [],
      parsed.reportProperties
    );
    expect(generated).toContain('rotation="Left"');
    expect(generated).toContain('textAdjust="StretchHeight"');
    expect(generated).toContain('pattern="#,##0.00"');
  });

  it('should regenerate report-level properties', () => {
    const parsed = parseJRXMLContent(REPORT_PROPERTY_JRXML);
    const generated = generateJRXMLContent(
      parsed.properties,
      parsed.bands,
      parsed.fields,
      parsed.parameters,
      parsed.datasets,
      parsed.styles,
      [],
      parsed.reportProperties
    );
    expect(generated).toContain('net.sf.jasperreports.print.keep.full.text');
    expect(generated).toContain('com.example.custom');
    expect(generated).toContain('value="testValue"');
  });

  // -----------------------------------------------------------------------
  // Phase 1: New round-trip tests for previously-missing properties
  // -----------------------------------------------------------------------

  const IMAGE_ELEMENT_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="ImageTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="150">
      <image scaleImage="FillFrame" isUsingCache="true" isLazy="true" onErrorType="Blank" evaluationTime="Page" hyperlinkType="Reference">
        <reportElement x="0" y="0" width="200" height="100" uuid="img1" forecolor="#112233"/>
        <imageExpression><![CDATA["test.png"]]></imageExpression>
        <hyperlinkReferenceExpression><![CDATA["http://example.com"]]></hyperlinkReferenceExpression>
      </image>
    </band>
  </title>
</jasperReport>`;

  it('should parse and regenerate image properties (isUsingCache, isLazy, onErrorType, evaluationTime, hyperlinkType)', () => {
    const parsed = parseJRXMLContent(IMAGE_ELEMENT_JRXML);
    const img = parsed.bands[0]?.elements.find((e: any) => e.type === 'image') as any;
    expect(img).toBeDefined();
    expect(img.isUsingCache).toBe(true);
    expect(img.isLazy).toBe(true);
    expect(img.onErrorType).toBe('Blank');
    expect(img.evaluationTime).toBe('Page');
    expect(img.hyperlinkType).toBe('Reference');
    expect(img.imageExpression).toBe('"test.png"');
    expect(img.hyperlinkReferenceExpression).toBe('"http://example.com"');
    expect(img.forecolor).toBe('#112233');

    // Generate and verify round-trip
    const generated = generateJRXMLContent(
      parsed.properties, parsed.bands, parsed.fields, parsed.parameters,
      parsed.datasets, parsed.styles, [], parsed.reportProperties
    );
    expect(generated).toContain('isUsingCache="true"');
    expect(generated).toContain('isLazy="true"');
    expect(generated).toContain('onErrorType="Blank"');
    expect(generated).toContain('evaluationTime="Page"');
    expect(generated).toContain('hyperlinkType="Reference"');
    expect(generated).toContain('hyperlinkReferenceExpression');
  });

  const LINE_ELEMENT_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="LineTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="50">
      <line direction="BottomUp">
        <reportElement x="0" y="0" width="555" height="1" uuid="line1" forecolor="#FF0000" mode="Opaque"/>
        <graphicElement fill="Solid">
          <pen lineWidth="2.0" lineStyle="Dashed" lineColor="#0066CC"/>
        </graphicElement>
      </line>
    </band>
  </title>
</jasperReport>`;

  it('should parse and regenerate line graphicElement (pen with lineWidth, lineColor, lineStyle)', () => {
    const parsed = parseJRXMLContent(LINE_ELEMENT_JRXML);
    const line = parsed.bands[0]?.elements.find((e: any) => e.type === 'line') as any;
    expect(line).toBeDefined();
    expect(line.lineDirection).toBe('BottomUp');
    expect(line.forecolor).toBe('#FF0000');
    expect(line.mode).toBe('Opaque');
    // graphicElement should be parsed as pen property
    expect(line.pen).toBeDefined();
    expect(line.pen.lineWidth).toBe(2);
    expect(line.pen.lineStyle).toBe('Dashed');
    expect(line.pen.lineColor).toBe('#0066CC');
    expect(line.fill).toBe('Solid');

    // Generate and verify round-trip
    const generated = generateJRXMLContent(
      parsed.properties, parsed.bands, parsed.fields, parsed.parameters,
      parsed.datasets, parsed.styles, [], parsed.reportProperties
    );
    expect(generated).toContain('<graphicElement');
    expect(generated).toContain('lineWidth="2"');
    expect(generated).toContain('lineColor="#0066CC"');
    expect(generated).toContain('lineStyle="Dashed"');
    expect(generated).toContain('fill="Solid"');
  });

  const TEXTFIELD_HYPERLINK_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TextFieldHyperlinkTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <field name="link" class="java.lang.String"/>
  <detail>
    <band height="30">
      <textField hyperlinkType="Reference" bookmarkLevel="1">
        <reportElement x="0" y="0" width="200" height="20" uuid="tf1"/>
        <textFieldExpression><![CDATA[$F{link}]]></textFieldExpression>
        <hyperlinkReferenceExpression><![CDATA["http://example.com"]]></hyperlinkReferenceExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

  it('should parse and regenerate textField hyperlink properties', () => {
    const parsed = parseJRXMLContent(TEXTFIELD_HYPERLINK_JRXML);
    const tf = parsed.bands[0]?.elements.find((e: any) => e.type === 'textField') as any;
    expect(tf).toBeDefined();
    expect(tf.hyperlinkType).toBe('Reference');
    expect(tf.bookmarkLevel).toBe(1);
    expect(tf.hyperlinkReferenceExpression).toBe('"http://example.com"');
    expect(tf.expression).toBe('$F{link}');
    expect(tf.fieldName).toBe('link');

    // Generate and verify round-trip
    const generated = generateJRXMLContent(
      parsed.properties, parsed.bands, parsed.fields, parsed.parameters,
      parsed.datasets, parsed.styles, [], parsed.reportProperties
    );
    expect(generated).toContain('hyperlinkType="Reference"');
    expect(generated).toContain('bookmarkLevel="1"');
    expect(generated).toContain('hyperlinkReferenceExpression');
  });

  const FRAME_LAYOUT_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="FrameLayoutTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="100">
      <frame isIgnorePagination="true" splitType="Stretch">
        <reportElement x="10" y="10" width="500" height="80" uuid="frame1"/>
        <property name="com.jaspersoft.studio.layout" value="com.jaspersoft.studio.editor.layout.HorizontalLayout"/>
        <staticText>
          <reportElement x="0" y="0" width="100" height="20" uuid="fst1"/>
          <text><![CDATA[In Frame]]></text>
        </staticText>
      </frame>
    </band>
  </title>
</jasperReport>`;

  it('should parse and regenerate frame isIgnorePagination, splitType, and layout', () => {
    const parsed = parseJRXMLContent(FRAME_LAYOUT_JRXML);
    const frame = parsed.bands[0]?.elements.find((e: any) => e.type === 'frame') as any;
    expect(frame).toBeDefined();
    expect(frame.isIgnorePagination).toBe(true);
    expect(frame.splitType).toBe('Stretch');
    expect(frame.layout).toBe('HorizontalLayout');
    expect(frame.elements).toHaveLength(1);

    // Generate and verify round-trip
    const generated = generateJRXMLContent(
      parsed.properties, parsed.bands, parsed.fields, parsed.parameters,
      parsed.datasets, parsed.styles, [], parsed.reportProperties
    );
    expect(generated).toContain('isIgnorePagination="true"');
    expect(generated).toContain('splitType="Stretch"');
    expect(generated).toContain('com.jaspersoft.studio.layout');
    expect(generated).toContain('HorizontalLayout');
  });

  const BREAK_JRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="BreakTest"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <title>
    <band height="30">
      <break type="Page">
        <reportElement x="0" y="0" width="555" height="1" uuid="brk1" isResetPageNumber="true" isResetPageOverflow="true"/>
      </break>
    </band>
  </title>
</jasperReport>`;

  it('should parse and regenerate break isResetPageNumber and isResetPageOverflow', () => {
    const parsed = parseJRXMLContent(BREAK_JRXML);
    const brk = parsed.bands[0]?.elements.find((e: any) => e.type === 'break') as any;
    expect(brk).toBeDefined();
    expect(brk.breakType).toBe('Page');
    expect(brk.isResetPageNumber).toBe(true);
    expect(brk.isResetPageOverflow).toBe(true);

    // Generate and verify round-trip
    const generated = generateJRXMLContent(
      parsed.properties, parsed.bands, parsed.fields, parsed.parameters,
      parsed.datasets, parsed.styles, [], parsed.reportProperties
    );
    expect(generated).toContain('isResetPageNumber="true"');
    expect(generated).toContain('isResetPageOverflow="true"');
  });
});
