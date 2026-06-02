import { describe, it, expect } from 'vitest'
import { parseJRXMLContent } from './parse'
import fs from 'fs'
import path from 'path'

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
    expect(tableElement.columns[0].columnHeader.element.text).toBe('Column 1')
    expect(tableElement.columns[1].columnHeader.element.text).toBe('Column 2')
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

  it('should parse table with 2 head rows correctly', () => {
    // 读取外部JRXML文件
    const jrxmlFilePath = path.join(__dirname, '../../../tests/table_with_2_head_rows.jrxml')
    const jrxmlContent = fs.readFileSync(jrxmlFilePath, 'utf-8')
    
    const result = parseJRXMLContent(jrxmlContent)
    
    // 验证基本属性
    expect(result.properties.name).toBe('Cherry_Table_Based')
    expect(result.properties.pageWidth).toBe(595)
    expect(result.properties.pageHeight).toBe(842)
    expect(result.properties.whenNoDataType).toBe('AllSectionsNoDetail')
    
    // 验证subDataset
    expect(result.datasets).toHaveLength(1)
    expect(result.datasets[0].name).toBe('Dataset1')
    
    // 验证bands
    expect(result.bands).toHaveLength(1)
    expect(result.bands[0].type).toBe('summary')
    expect(result.bands[0].height).toBe(471)
    expect(result.bands[0].splitType).toBe('Stretch')
    
    // 验证表格元素
    expect(result.bands[0].elements).toHaveLength(1)
    const tableElement = result.bands[0].elements[0]
    expect(tableElement.type).toBe('table')
    expect(tableElement.x).toBe(0)
    expect(tableElement.y).toBe(20)
    expect(tableElement.width).toBe(545)
    expect(tableElement.height).toBe(120)
    
    // 验证表格结构
    expect(tableElement.columns).toBeDefined()
    expect(tableElement.columns).toHaveLength(3) // 2个子列 + 1个普通column
    
    // 验证children数组包含columnGroup和普通column
    expect(tableElement.children).toBeDefined()
    expect(tableElement.children).toHaveLength(2) // 1个columnGroup + 1个普通column
    
    // 验证columnGroup
    const columnGroup = tableElement.children[0]
    expect(columnGroup.type).toBe('columnGroup')
    expect(columnGroup.width).toBe(94)
    expect(columnGroup.children).toHaveLength(2) // 2个子列
    
    // 验证columnGroup的表格头
    expect(columnGroup.tableHeader).toBeDefined()
    expect(columnGroup.tableHeader.element.height).toBe(30)
    expect(columnGroup.tableHeader.rowSpan).toBe(1)

    // 验证columnGroup的子列
    expect(columnGroup.children[0].width).toBe(49)
    expect(columnGroup.children[1].width).toBe(45)

    // 验证普通column
    const normalColumn = tableElement.children[1]
    expect(normalColumn.type).toBe('column')
    expect(normalColumn.width).toBe(451)

    // 验证普通column的表格头
    expect(normalColumn.tableHeader).toBeDefined()
    expect(normalColumn.tableHeader.element.height).toBe(60)
    expect(normalColumn.tableHeader.rowSpan).toBe(2)
  })

  it('should generate expected TableElement structure from table_with_2_head_rows.jrxml', () => {
    // 读取外部JRXML文件
    const jrxmlFilePath = path.join(__dirname, '../../../tests/table_with_2_head_rows.jrxml')
    const jrxmlContent = fs.readFileSync(jrxmlFilePath, 'utf-8')
    
    const result = parseJRXMLContent(jrxmlContent)
    
    // 验证表格元素
    expect(result.bands[0].elements).toHaveLength(1)
    const tableElement = result.bands[0].elements[0] as any
    expect(tableElement.type).toBe('table')
    expect(tableElement.x).toBe(0)
    expect(tableElement.y).toBe(20)
    expect(tableElement.width).toBe(545)
    expect(tableElement.height).toBe(120)
    
    // 验证表格数据集
    expect(tableElement.dataset).toBeDefined()
    expect(tableElement.dataset.name).toBe('Dataset1')
    expect(tableElement.dataset.uuid).toBe('4192004d-c999-41ee-abb5-a49cba17a2f3')
    
    // 验证children数组（包含列分组和普通列）
    expect(tableElement.children).toHaveLength(2)
    expect(tableElement.children[0].type).toBe('columnGroup')
    expect(tableElement.children[0].width).toBe(94)
    expect(tableElement.children[0].name).toBe('Columns [2]')
    expect(tableElement.children[0].children).toHaveLength(2)
    expect(tableElement.children[1].type).toBe('column')
    expect(tableElement.children[1].width).toBe(451)
    
    // 验证列分组的表格头
    expect(tableElement.children[0].tableHeader).toBeDefined()
    expect(tableElement.children[0].tableHeader.element.text).toBe('ROW 1+CELL 1')
    expect(tableElement.children[0].tableHeader.element.height).toBe(30)
    expect(tableElement.children[0].tableHeader.rowSpan).toBe(1)

    // 验证列分组的子列
    expect(tableElement.children[0].children[0].tableHeader).toBeDefined()
    expect(tableElement.children[0].children[0].tableHeader.element.text).toBe('ROW 2 CELL 1')
    expect(tableElement.children[0].children[0].tableHeader.element.height).toBe(30)
    expect(tableElement.children[0].children[0].tableHeader.rowSpan).toBe(1)
    expect(tableElement.children[0].children[0].tableHeader.element.textAlignment).toBe('Center')
    expect(tableElement.children[0].children[0].tableHeader.element.verticalAlignment).toBe('Middle')
    expect(tableElement.children[0].children[0].tableHeader.element.box).toBeDefined()

    expect(tableElement.children[0].children[1].tableHeader).toBeDefined()
    expect(tableElement.children[0].children[1].tableHeader.element.text).toBe('ROW 2 CELL 2')
    expect(tableElement.children[0].children[1].tableHeader.element.height).toBe(30)
    expect(tableElement.children[0].children[1].tableHeader.rowSpan).toBe(1)
    expect(tableElement.children[0].children[1].tableHeader.element.textAlignment).toBe('Center')
    expect(tableElement.children[0].children[1].tableHeader.element.verticalAlignment).toBe('Middle')
    expect(tableElement.children[0].children[1].tableHeader.element.box).toBeDefined()

    // 验证普通列的表格头
    expect(tableElement.children[1].tableHeader).toBeDefined()
    expect(tableElement.children[1].tableHeader.element.text).toBe('ROW 1+CELL 2+ROWSPAN2')
    expect(tableElement.children[1].tableHeader.element.height).toBe(60)
    expect(tableElement.children[1].tableHeader.rowSpan).toBe(2)
    expect(tableElement.children[1].tableHeader.element.textAlignment).toBe('Center')
    expect(tableElement.children[1].tableHeader.element.verticalAlignment).toBe('Middle')
    expect(tableElement.children[1].tableHeader.element.box).toBeDefined()

    // 验证列头的box元素和文本对齐设置
    expect(tableElement.children[0].children[0].columnHeader).toBeDefined()
    expect(tableElement.children[0].children[0].columnHeader.element.textAlignment).toBe('Center')
    expect(tableElement.children[0].children[0].columnHeader.element.verticalAlignment).toBe('Middle')
    expect(tableElement.children[0].children[0].columnHeader.element.box).toBeDefined()

    expect(tableElement.children[0].children[1].columnHeader).toBeDefined()
    expect(tableElement.children[0].children[1].columnHeader.element.textAlignment).toBe('Center')
    expect(tableElement.children[0].children[1].columnHeader.element.verticalAlignment).toBe('Middle')
    expect(tableElement.children[0].children[1].columnHeader.element.box).toBeDefined()

    expect(tableElement.children[1].columnHeader).toBeDefined()
    expect(tableElement.children[1].columnHeader.element.textAlignment).toBe('Center')
    expect(tableElement.children[1].columnHeader.element.verticalAlignment).toBe('Middle')
    expect(tableElement.children[1].columnHeader.element.box).toBeDefined()
    
    // 推导组合列后的表头行结构
    // 辅助函数：递归计算列或列分组的实际列数
    const calculateColumnsCount = (item: any): number => {
      if (item.type === 'column') {
        return 1;
      } else if (item.type === 'columnGroup') {
        return item.children.reduce((sum: number, child: any) => sum + calculateColumnsCount(child), 0);
      }
      return 0;
    };
    
    // 辅助函数：递归构建表头结构
    const buildHeaderStructure = (items: any[], headerLevel: 'tableHeader' | 'columnHeader'): any[] => {
      const result: any[] = [];
      
      items.forEach(item => {
        if (item.type === 'column') {
          // 普通列，直接添加单元格
          if (item[headerLevel]) {
            result.push({
              content: item[headerLevel].element?.text || item[headerLevel].element?.expression,
              rowSpan: item[headerLevel].rowSpan,
              colSpan: 1,
              width: item.width,
              height: item[headerLevel].element?.height
            });
          }
        } else if (item.type === 'columnGroup') {
          // 列分组，计算其 colspan
          const colSpan = calculateColumnsCount(item);
          if (item[headerLevel]) {
            result.push({
              content: item[headerLevel].element?.text || item[headerLevel].element?.expression,
              rowSpan: item[headerLevel].rowSpan,
              colSpan: colSpan,
              width: item.width,
              height: item[headerLevel].element?.height
            });
          } else {
            // 如果列分组没有该级别的表头，则递归处理其子项
            const childHeaders = buildHeaderStructure(item.children, headerLevel);
            result.push(...childHeaders);
          }
        }
      });
      
      return result;
    };
    
    // 构建表格头（第一级表头）
    const tableHeaders = buildHeaderStructure(tableElement.children, 'tableHeader');
    expect(tableHeaders).toHaveLength(2);
    expect(tableHeaders[0].content).toBe('ROW 1+CELL 1');
    expect(tableHeaders[0].rowSpan).toBe(1);
    expect(tableHeaders[0].colSpan).toBe(2); // 跨2列
    expect(tableHeaders[0].width).toBe(94);
    
    expect(tableHeaders[1].content).toBe('ROW 1+CELL 2+ROWSPAN2');
    expect(tableHeaders[1].rowSpan).toBe(2); // 跨2行
    expect(tableHeaders[1].colSpan).toBe(1);
    expect(tableHeaders[1].width).toBe(451);
    
    // 构建列头（第二级表头）
    const columnHeaders = buildHeaderStructure(tableElement.children, 'columnHeader');
    expect(columnHeaders).toHaveLength(3);
    // 列头由列分组的子列和普通列组成
    expect(columnHeaders[0].content).toBe('"Text Field"');
    expect(columnHeaders[0].rowSpan).toBe(1);
    expect(columnHeaders[0].colSpan).toBe(1);
    
    expect(columnHeaders[1].content).toBe('"Text Field"');
    expect(columnHeaders[1].rowSpan).toBe(1);
    expect(columnHeaders[1].colSpan).toBe(1);
    
    expect(columnHeaders[2].content).toBe('"Text Field"');
    expect(columnHeaders[2].rowSpan).toBe(1);
    expect(columnHeaders[2].colSpan).toBe(1);
    
    // 计算表头的总行数（根据rowSpan最大的值）
    const calculateTotalHeaderRows = () => {
      let maxRowSpan = 0;
      
      // 递归检查所有表头的rowSpan
      const checkRowSpan = (items: any[]) => {
        items.forEach(item => {
          if (item.type === 'column') {
            if (item.tableHeader) {
              maxRowSpan = Math.max(maxRowSpan, item.tableHeader.rowSpan);
            }
          } else if (item.type === 'columnGroup') {
            if (item.tableHeader) {
              maxRowSpan = Math.max(maxRowSpan, item.tableHeader.rowSpan);
            }
            checkRowSpan(item.children);
          }
        });
      };
      
      checkRowSpan(tableElement.children);
      return maxRowSpan;
    };
    
    const totalHeaderRows = calculateTotalHeaderRows();
    expect(totalHeaderRows).toBe(2); // 最大rowSpan为2，所以表头总共有2行
    
    // 构建最终的表头行结构（按行组织）
    const buildHeaderRows = () => {
      const rows: any[][] = [];
      const totalRows = calculateTotalHeaderRows();
      
      // 初始化行数组
      for (let i = 0; i < totalRows; i++) {
        rows[i] = [];
      }
      
      // 递归填充行结构
      const fillRows = (items: any[], startRow: number) => {
        items.forEach(item => {
          if (item.type === 'column') {
            // 普通列，填充其tableHeader（如果有）
            if (item.tableHeader) {
              const { rowSpan, element } = item.tableHeader;
              const cell = {
                content: element?.text || element?.expression,
                rowSpan: rowSpan,
                colSpan: 1,
                width: item.width,
                height: element?.height
              };

              // 将单元格添加到起始行
              rows[startRow].push(cell);
            }
          } else if (item.type === 'columnGroup') {
            // 列分组
            if (item.tableHeader) {
              const { rowSpan, element } = item.tableHeader;
              const colSpan = calculateColumnsCount(item);
              const cell = {
                content: element?.text || element?.expression,
                rowSpan: rowSpan,
                colSpan: colSpan,
                width: item.width,
                height: element?.height
              };
              
              // 将单元格添加到起始行
              rows[startRow].push(cell);
            }
            
            // 无论列分组是否有tableHeader，都需要处理其子项的表头
            // 对于第二行，我们需要直接处理子项
            if (startRow < totalRows - 1) {
              fillRows(item.children, startRow + 1);
            }
          }
        });
      };
      
      // 填充第一级表头（tableHeader）
      fillRows(tableElement.children, 0);
      
      return rows;
    };
    
    // 构建列头行结构
    const buildColumnHeaderRow = () => {
      return buildHeaderStructure(tableElement.children, 'columnHeader');
    };
    
    const headerRows = buildHeaderRows();
    const columnHeaderRow = buildColumnHeaderRow();
    
    // 验证表头行结构（与Jasperreport Studio预览对比）
    expect(headerRows).toHaveLength(2);
    
    // 第一行表头（对应预览第一行）
    expect(headerRows[0]).toHaveLength(2);
    expect(headerRows[0][0].content).toBe('ROW 1+CELL 1');
    expect(headerRows[0][0].rowSpan).toBe(1);
    expect(headerRows[0][0].colSpan).toBe(2); // 跨2列
    expect(headerRows[0][1].content).toBe('ROW 1+CELL 2+ROWSPAN2');
    expect(headerRows[0][1].rowSpan).toBe(2); // 跨2行
    expect(headerRows[0][1].colSpan).toBe(1);
    
    // 第二行表头（对应预览第二行）
    expect(headerRows[1]).toHaveLength(2);
    expect(headerRows[1][0].content).toBe('ROW 2 CELL 1');
    expect(headerRows[1][0].rowSpan).toBe(1);
    expect(headerRows[1][0].colSpan).toBe(1);
    expect(headerRows[1][1].content).toBe('ROW 2 CELL 2');
    expect(headerRows[1][1].rowSpan).toBe(1);
    expect(headerRows[1][1].colSpan).toBe(1);
    
    // 列头行（对应预览第三行）
    expect(columnHeaderRow).toHaveLength(3);
    expect(columnHeaderRow[0].content).toBe('"Text Field"');
    expect(columnHeaderRow[0].rowSpan).toBe(1);
    expect(columnHeaderRow[0].colSpan).toBe(1);
    expect(columnHeaderRow[1].content).toBe('"Text Field"');
    expect(columnHeaderRow[1].rowSpan).toBe(1);
    expect(columnHeaderRow[1].colSpan).toBe(1);
    expect(columnHeaderRow[2].content).toBe('"Text Field"');
    expect(columnHeaderRow[2].rowSpan).toBe(1);
    expect(columnHeaderRow[2].colSpan).toBe(1);
    
    // 验证整体表格结构与预览一致
    // 第一行：ROW 1+CELL 1 (colSpan=2) | ROW 1+CELL 2+ROWSPAN2 (rowSpan=2)
    // 第二行：ROW 2 CELL 1 | ROW 2 CELL 2 | (空白，被上方单元格跨行覆盖)
    // 第三行：Text Field | Text Field | Text Field
  })

  
})

