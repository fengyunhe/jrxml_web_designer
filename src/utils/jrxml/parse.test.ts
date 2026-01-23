import { describe, it, expect } from 'vitest'
import { parseJRXMLContent } from './parse'

describe('parseJRXMLContent', () => {
  it('should parse JRXML with componentElement containing table', () => {
    // 使用简单的JRXML内容，不包含命名空间，便于测试
    const jrxmlContent = `
      <jasperReport name="test" pageWidth="595" pageHeight="842">
        <detail>
          <band height="200">
            <componentElement>
              <reportElement x="20" y="20" width="555" height="150" uuid="1234-5678-90ab-cdef"/>
              <table>
                <datasetRun subDataset="tableDataset">
                  <datasetParameter name="REPORT_DATA_SOURCE">
                    <datasetParameterExpression>$P{REPORT_DATA_SOURCE}</datasetParameterExpression>
                  </datasetParameter>
                </datasetRun>
                <column width="100">
                  <columnHeader height="30">
                    <staticText>
                      <reportElement x="0" y="0" width="100" height="30"/>
                      <text>Column 1</text>
                    </staticText>
                  </columnHeader>
                  <detailCell height="30">
                    <textField>
                      <reportElement x="0" y="0" width="100" height="30"/>
                      <textFieldExpression>$F{field1}</textFieldExpression>
                    </textField>
                  </detailCell>
                </column>
                <column width="100">
                  <columnHeader height="30">
                    <staticText>
                      <reportElement x="0" y="0" width="100" height="30"/>
                      <text>Column 2</text>
                    </staticText>
                  </columnHeader>
                  <detailCell height="30">
                    <textField>
                      <reportElement x="0" y="0" width="100" height="30"/>
                      <textFieldExpression>$F{field2}</textFieldExpression>
                    </textField>
                  </detailCell>
                </column>
              </table>
            </componentElement>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    // 验证解析结果
    expect(result).toBeDefined()
    expect(result.bands).toHaveLength(1)
    expect(result.bands[0].type).toBe('detail')
    expect(result.bands[0].elements).toHaveLength(1)
    
    // 验证表格元素
    const tableElement = result.bands[0].elements[0]
    expect(tableElement.type).toBe('table')
    expect(tableElement.x).toBe(20)
    expect(tableElement.y).toBe(20)
    expect(tableElement.width).toBe(555)
    expect(tableElement.height).toBe(150)
    expect(tableElement.uuid).toBe('1234-5678-90ab-cdef')
    
    // 验证表格列
    expect(tableElement.columns).toHaveLength(2)
    expect(tableElement.columns[0].width).toBe(100)
    expect(tableElement.columns[1].width).toBe(100)
    expect(tableElement.columns[0].columnHeader.text).toBe('Column 1')
    expect(tableElement.columns[1].columnHeader.text).toBe('Column 2')
  })

  it('should parse basic JRXML properties', () => {
    const jrxmlContent = `
      <jasperReport 
        name="TestReport" 
        pageWidth="800" 
        pageHeight="600"
        leftMargin="10"
        rightMargin="10"
        topMargin="15"
        bottomMargin="15"
      >
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.properties).toBeDefined()
    expect(result.properties.name).toBe('TestReport')
    expect(result.properties.pageWidth).toBe(800)
    expect(result.properties.pageHeight).toBe(600)
    expect(result.properties.leftMargin).toBe(10)
    expect(result.properties.rightMargin).toBe(10)
    expect(result.properties.topMargin).toBe(15)
    expect(result.properties.bottomMargin).toBe(15)
  })

  it('should parse JRXML with fields and parameters', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <field name="field1" class="java.lang.String"/>
        <field name="field2" class="java.lang.Integer"/>
        <parameter name="param1" class="java.lang.String">
          <defaultValueExpression>default_value</defaultValueExpression>
        </parameter>
        <parameter name="param2" class="java.util.Date"/>
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    // 验证字段解析
    expect(result.fields).toHaveLength(2)
    expect(result.fields[0].name).toBe('field1')
    expect(result.fields[0].class).toBe('java.lang.String')
    expect(result.fields[1].name).toBe('field2')
    expect(result.fields[1].class).toBe('java.lang.Integer')
    
    // 验证参数解析
    expect(result.parameters).toHaveLength(2)
    expect(result.parameters[0].name).toBe('param1')
    expect(result.parameters[0].class).toBe('java.lang.String')
    expect(result.parameters[0].defaultValue).toBe('default_value')
    expect(result.parameters[1].name).toBe('param2')
    expect(result.parameters[1].class).toBe('java.util.Date')
    expect(result.parameters[1].defaultValue).toBeUndefined()
  })

  it('should parse different band types', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <title>
          <band height="50">
          </band>
        </title>
        <pageHeader>
          <band height="40">
          </band>
        </pageHeader>
        <detail>
          <band height="100">
          </band>
        </detail>
        <pageFooter>
          <band height="30">
          </band>
        </pageFooter>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands).toHaveLength(4)
    
    // 验证不同类型的band都被解析
    const bandTypes = result.bands.map(band => band.type)
    expect(bandTypes).toContain('title')
    expect(bandTypes).toContain('pageHeader')
    expect(bandTypes).toContain('detail')
    expect(bandTypes).toContain('pageFooter')
    
    // 验证band高度
    const titleBand = result.bands.find(band => band.type === 'title')
    expect(titleBand?.height).toBe(50)
    
    const pageHeaderBand = result.bands.find(band => band.type === 'pageHeader')
    expect(pageHeaderBand?.height).toBe(40)
  })

  it('should parse staticText and textField elements', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <staticText>
              <reportElement x="20" y="10" width="100" height="20"/>
              <text>Static Text</text>
            </staticText>
            <textField>
              <reportElement x="20" y="40" width="100" height="20"/>
              <textFieldExpression>$F{field1}</textFieldExpression>
            </textField>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands).toHaveLength(1)
    expect(result.bands[0].elements).toHaveLength(2)
    
    // 验证staticText元素
    const staticTextElement = result.bands[0].elements[0]
    expect(staticTextElement.type).toBe('staticText')
    expect(staticTextElement.x).toBe(20)
    expect(staticTextElement.y).toBe(10)
    expect(staticTextElement.width).toBe(100)
    expect(staticTextElement.height).toBe(20)
    expect(staticTextElement.text).toBe('Static Text')
    
    // 验证textField元素
    const textFieldElement = result.bands[0].elements[1]
    expect(textFieldElement.type).toBe('textField')
    expect(textFieldElement.x).toBe(20)
    expect(textFieldElement.y).toBe(40)
    expect(textFieldElement.width).toBe(100)
    expect(textFieldElement.height).toBe(20)
    expect(textFieldElement.expression).toBe('$F{field1}')
  })

  it('should handle JRXML with missing attributes', () => {
    const jrxmlContent = `
      <jasperReport>
        <detail>
          <band>
          </band>
        </detail>
      </jasperReport>
    `
    
    // 不应该抛出错误，而应该使用默认值
    const result = parseJRXMLContent(jrxmlContent)
    
    // 验证使用默认值
    expect(result.properties.name).toBe('Unnamed Report')
    expect(result.properties.pageWidth).toBe(595) // 默认值
    expect(result.properties.pageHeight).toBe(842) // 默认值
    
    const detailBand = result.bands[0]
    expect(detailBand?.height).toBe(0) // 默认高度
  })

  it('should parse JRXML with namespace prefixes', () => {
    const jrxmlContent = `
      <jr:jasperReport 
        xmlns:jr="http://jasperreports.sourceforge.net/jasperreports"
        name="TestReport" 
        pageWidth="595" 
        pageHeight="842"
      >
        <jr:detail>
          <jr:band height="100">
            <jr:staticText>
              <jr:reportElement x="20" y="10" width="100" height="20"/>
              <jr:text>Static Text with Namespace</jr:text>
            </jr:staticText>
          </jr:band>
        </jr:detail>
      </jr:jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.properties.name).toBe('TestReport')
    expect(result.bands).toHaveLength(1)
    expect(result.bands[0].elements).toHaveLength(1)
    
    const staticTextElement = result.bands[0].elements[0]
    expect(staticTextElement.type).toBe('staticText')
    expect(staticTextElement.text).toBe('Static Text with Namespace')
  })

  it('should handle empty JRXML elements', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <!-- Empty element -->
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result).toBeDefined()
    expect(result.bands).toHaveLength(1)
    expect(result.bands[0].elements).toHaveLength(0) // 没有元素
  })

  it('should parse band with splitType attribute', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100" splitType="Stretch">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands).toHaveLength(1)
    expect(result.bands[0].splitType).toBe('Stretch')
  })

  it('should parse subDataset with queryString', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <subDataset name="tableDataset">
          <queryString language="sql">
            SELECT * FROM test_table
          </queryString>
          <field name="field1" class="java.lang.String"/>
          <field name="field2" class="java.lang.Integer"/>
        </subDataset>
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0].name).toBe('tableDataset')
    expect(result.datasets[0].query).toBeDefined()
    expect(result.datasets[0].query?.language).toBe('sql')
    expect(result.datasets[0].query?.text).toBe('SELECT * FROM test_table')
    expect(result.datasets[0].fields).toHaveLength(2)
  })

  it('should parse subDataset with namespace-prefixed queryString', () => {
    const jrxmlContent = `
      <jr:jasperReport 
        xmlns:jr="http://jasperreports.sourceforge.net/jasperreports"
        name="TestReport" 
        pageWidth="595" 
        pageHeight="842"
      >
        <jr:subDataset name="tableDataset">
          <jr:queryString language="sql">
            SELECT * FROM test_table
          </jr:queryString>
          <jr:field name="field1" class="java.lang.String"/>
        </jr:subDataset>
        <jr:detail>
          <jr:band height="100">
          </jr:band>
        </jr:detail>
      </jr:jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0].name).toBe('tableDataset')
    expect(result.datasets[0].query).toBeDefined()
    expect(result.datasets[0].query?.language).toBe('sql')
    expect(result.datasets[0].query?.text).toBe('SELECT * FROM test_table')
  })

  it('should parse main report queryString', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <queryString language="sql">
          SELECT * FROM main_table
        </queryString>
        <field name="field1" class="java.lang.String"/>
        <field name="field2" class="java.lang.Integer"/>
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.properties.query).toBeDefined()
    expect(result.properties.query?.language).toBe('sql')
    expect(result.properties.query?.text).toBe('SELECT * FROM main_table')
    expect(result.fields).toHaveLength(2)
  })

  it('should parse main report with namespace-prefixed queryString', () => {
    const jrxmlContent = `
      <jr:jasperReport 
        xmlns:jr="http://jasperreports.sourceforge.net/jasperreports"
        name="TestReport" 
        pageWidth="595" 
        pageHeight="842"
      >
        <jr:queryString language="sql">
          SELECT * FROM main_table
        </jr:queryString>
        <jr:field name="field1" class="java.lang.String"/>
        <jr:detail>
          <jr:band height="100">
          </jr:band>
        </jr:detail>
      </jr:jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.properties.query).toBeDefined()
    expect(result.properties.query?.language).toBe('sql')
    expect(result.properties.query?.text).toBe('SELECT * FROM main_table')
  })

  it('should parse ellipse elements', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <ellipse>
              <reportElement x="20" y="20" width="50" height="50"/>
              <graphicElement>
                <pen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>
              </graphicElement>
            </ellipse>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements).toHaveLength(1)
    expect(result.bands[0].elements[0].type).toBe('ellipse')
    expect(result.bands[0].elements[0].x).toBe(20)
    expect(result.bands[0].elements[0].y).toBe(20)
    expect(result.bands[0].elements[0].width).toBe(50)
    expect(result.bands[0].elements[0].height).toBe(50)
  })

  it('should parse break elements', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <break type="Page">
              <reportElement x="20" y="20" width="1" height="1"/>
            </break>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements).toHaveLength(1)
    expect(result.bands[0].elements[0].type).toBe('break')
    expect(result.bands[0].elements[0].breakType).toBe('Page')
  })

  it('should parse frame elements', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <frame>
              <reportElement x="20" y="20" width="200" height="50"/>
              <staticText>
                <reportElement x="10" y="10" width="180" height="30"/>
                <text>Text inside Frame</text>
              </staticText>
            </frame>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements).toHaveLength(1)
    expect(result.bands[0].elements[0].type).toBe('frame')
    expect(result.bands[0].elements[0].x).toBe(20)
    expect(result.bands[0].elements[0].y).toBe(20)
    expect(result.bands[0].elements[0].width).toBe(200)
    expect(result.bands[0].elements[0].height).toBe(50)
  })

  it('should parse text elements with textAlignment and verticalAlignment', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <staticText>
              <reportElement x="20" y="20" width="100" height="30"/>
              <textElement textAlignment="Center" verticalAlignment="Middle">
                <font size="12"/>
              </textElement>
              <text>Centered Text</text>
            </staticText>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].textAlignment).toBe('Center')
    expect(result.bands[0].elements[0].verticalAlignment).toBe('Middle')
  })

  it('should parse text elements with markup', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <staticText>
              <reportElement x="20" y="20" width="100" height="30"/>
              <textElement markup="styled">
                <font size="12"/>
              </textElement>
              <text><![CDATA[<b>Bold Text</b>]]></text>
            </staticText>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].markup).toBe('styled')
  })

  it('should parse textField with evaluationTime', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <textField evaluationTime="Report">
              <reportElement x="20" y="20" width="100" height="30"/>
              <textFieldExpression>$V{REPORT_COUNT}</textFieldExpression>
            </textField>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('textField')
    expect(result.bands[0].elements[0].evaluationTime).toBe('Report')
    expect(result.bands[0].elements[0].expression).toBe('$V{REPORT_COUNT}')
  })

  it('should parse textField with pattern', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <textField pattern="$ #,##0.00">
              <reportElement x="20" y="20" width="100" height="30"/>
              <textFieldExpression>$F{amount}</textFieldExpression>
            </textField>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('textField')
    expect(result.bands[0].elements[0].pattern).toBe('$ #,##0.00')
    expect(result.bands[0].elements[0].expression).toBe('$F{amount}')
  })

  it('should parse subDataset with fields having properties', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <subDataset name="tableDataset">
          <field name="field1" class="java.lang.String">
            <property name="com.jaspersoft.studio.field.label" value="Field 1 Label"/>
            <property name="com.jaspersoft.studio.field.description" value="Field 1 Description"/>
          </field>
        </subDataset>
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0].fields).toHaveLength(1)
    expect(result.datasets[0].fields[0].properties).toBeDefined()
    expect(result.datasets[0].fields[0].properties?.['com.jaspersoft.studio.field.label']).toBe('Field 1 Label')
    expect(result.datasets[0].fields[0].properties?.['com.jaspersoft.studio.field.description']).toBe('Field 1 Description')
  })

  it('should parse subDataset with parameters', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <subDataset name="tableDataset">
          <parameter name="datasetParam" class="java.lang.String">
            <defaultValueExpression>"default"</defaultValueExpression>
          </parameter>
          <queryString language="sql">
            SELECT * FROM test_table WHERE status = $P{datasetParam}
          </queryString>
        </subDataset>
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0].parameters).toHaveLength(1)
    expect(result.datasets[0].parameters[0].name).toBe('datasetParam')
    expect(result.datasets[0].parameters[0].class).toBe('java.lang.String')
    expect(result.datasets[0].parameters[0].defaultValue).toBe('"default"')
  })

  it('should parse textField with textAdjust property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <textField textAdjust="StretchHeight">
              <reportElement x="20" y="20" width="100" height="30"/>
              <textFieldExpression>$F{longText}</textFieldExpression>
            </textField>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('textField')
    expect(result.bands[0].elements[0].textAdjust).toBe('StretchHeight')
  })

  it('should parse textField with isStretchWithOverflow property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <textField isStretchWithOverflow="true">
              <reportElement x="20" y="20" width="100" height="30"/>
              <textFieldExpression>$F{longText}</textFieldExpression>
            </textField>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('textField')
    expect(result.bands[0].elements[0].textAdjust).toBe('StretchHeight')
  })

  it('should parse textField with isBlankWhenNull property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <textField isBlankWhenNull="true">
              <reportElement x="20" y="20" width="100" height="30"/>
              <textFieldExpression>$F{nullableField}</textFieldExpression>
            </textField>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('textField')
    expect(result.bands[0].elements[0].isBlankWhenNull).toBe(true)
  })

  it('should parse image with scaleImage property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <image scaleImage="RetainShape">
              <reportElement x="20" y="20" width="100" height="100"/>
              <imageExpression>"/path/to/image.png"</imageExpression>
            </image>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('image')
    expect(result.bands[0].elements[0].scaleImage).toBe('RetainShape')
  })

  it('should parse line with lineDirection property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <line direction="TopDown">
              <reportElement x="20" y="20" width="1" height="60"/>
            </line>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('line')
    expect(result.bands[0].elements[0].lineDirection).toBe('TopDown')
  })

  it('should parse rectangle with fill property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <rectangle>
              <reportElement x="20" y="20" width="100" height="50"/>
              <graphicElement fill="Solid">
                <pen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>
              </graphicElement>
            </rectangle>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('rectangle')
    expect(result.bands[0].elements[0].fill).toBe('Solid')
  })

  it('should parse band with isSplitAllowed property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100" isSplitAllowed="false">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].splitType).toBe('Prevent')
  })

  it('should parse frame with backcolor and mode properties', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <frame>
              <reportElement x="20" y="20" width="200" height="50" backcolor="#FFFF00" mode="Opaque"/>
            </frame>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].type).toBe('frame')
    expect(result.bands[0].elements[0].backcolor).toBe('#FFFF00')
    expect(result.bands[0].elements[0].mode).toBe('Opaque')
  })

  it('should parse textElement with isStyledText property', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <detail>
          <band height="100">
            <staticText>
              <reportElement x="20" y="20" width="100" height="30"/>
              <textElement isStyledText="true">
                <font size="12"/>
              </textElement>
              <text><![CDATA[<b>Bold Text</b>]]></text>
            </staticText>
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.bands[0].elements[0].markup).toBe('styled')
  })

  it('should parse subDataset with properties', () => {
    const jrxmlContent = `
      <jasperReport name="TestReport" pageWidth="595" pageHeight="842">
        <subDataset name="tableDataset">
          <property name="com.jaspersoft.studio.data.defaultdataadapter" value="Sample DB"/>
          <property name="net.sf.jasperreports.query.executer.factory.sql" value="com.jaspersoft.hiberynate.jdbc.HibQueryExecuterFactory"/>
          <queryString language="sql">
            SELECT * FROM test_table
          </queryString>
        </subDataset>
        <detail>
          <band height="100">
          </band>
        </detail>
      </jasperReport>
    `
    
    const result = parseJRXMLContent(jrxmlContent)
    
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0].properties).toBeDefined()
    expect(result.datasets[0].properties?.['com.jaspersoft.studio.data.defaultdataadapter']).toBe('Sample DB')
    expect(result.datasets[0].properties?.['net.sf.jasperreports.query.executer.factory.sql']).toBe('com.jaspersoft.hiberynate.jdbc.HibQueryExecuterFactory')
  })
})

