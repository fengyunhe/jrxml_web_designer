import { describe, it, expect } from 'vitest'
import { generateJRXMLContent } from '@/utils/jrxmlGenerator'
import { parseJRXMLContent } from '@/utils/jrxml/parse'
import type { Band, ReportProperties, DesignElement } from '@/types'

describe('jrxmlGenerator', () => {
  const mockReportProperties: ReportProperties = {
    name: 'Test Report',
    pageWidth: 595,
    pageHeight: 842,
    leftMargin: 20,
    rightMargin: 20,
    topMargin: 20,
    bottomMargin: 20,
    defaultFont: {
      name: 'Arial',
      size: 12,
      isBold: false,
      isItalic: false,
      isUnderline: false
    },
    orientation: 'portrait'
  }

  const mockBands: Band[] = [
    {
      type: 'title',
      height: 80,
      elements: [
        {
          type: 'staticText',
          x: 20,
          y: 10,
          width: 200,
          height: 30,
          text: 'Report Title',
          fontFamily: 'Arial',
          fontSize: 16,
          isBold: true,
          isItalic: false,
          isUnderline: false
        }
      ]
    },
    {
      type: 'pageHeader',
      height: 50,
      elements: [
        {
          type: 'staticText',
          x: 20,
          y: 10,
          width: 100,
          height: 20,
          text: 'Page Header',
          fontFamily: 'Arial',
          fontSize: 12,
          isBold: false,
          isItalic: true,
          isUnderline: false
        }
      ]
    },
    {
      type: 'detail',
      height: 100,
      elements: [
        {
          type: 'textField',
          x: 20,
          y: 10,
          width: 100,
          height: 20,
          expression: '$F{field_name}',
          fontFamily: 'Arial',
          fontSize: 12,
          isBold: false,
          isItalic: false,
          isUnderline: false
        }
      ]
    }
  ]

  it('should generate valid JRXML structure', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [])
    
    // Check that it contains the root element with proper namespace
    expect(jrxml).toContain('<jasperReport')
    expect(jrxml).toContain('xmlns="http://jasperreports.sourceforge.net/jasperreports"')
    expect(jrxml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"')
    
    // Check that it contains the page properties
    expect(jrxml).toContain(`pageWidth="${mockReportProperties.pageWidth}"`)
    expect(jrxml).toContain(`pageHeight="${mockReportProperties.pageHeight}"`)
    expect(jrxml).toContain(`leftMargin="${mockReportProperties.leftMargin}"`)
    expect(jrxml).toContain(`rightMargin="${mockReportProperties.rightMargin}"`)
    expect(jrxml).toContain(`topMargin="${mockReportProperties.topMargin}"`)
    expect(jrxml).toContain(`bottomMargin="${mockReportProperties.bottomMargin}"`)
  })

  it('should include all band types present in the bands array', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [])
    
    // Check that all band types are included
    expect(jrxml).toContain('<band height="80">')
    expect(jrxml).toContain('<band height="50">')
    expect(jrxml).toContain('<band height="100">')
    
    // Check that band sections are properly closed
    expect(jrxml).toContain('</band>')
  })

  it('should generate static text elements correctly', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [])
    
    // Check that static text elements are generated correctly
    expect(jrxml).toContain('<staticText>')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="200" height="30"')
    expect(jrxml).toContain('<text><![CDATA[Report Title]]></text>')
    expect(jrxml).toContain('</staticText>')
  })

  it('should generate text field elements correctly', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [])
    
    // Check that text field elements are generated correctly
    expect(jrxml).toContain('<textField>')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="100" height="20"')
    expect(jrxml).toContain('<textFieldExpression><![CDATA[$F{field_name}]]></textFieldExpression>')
    expect(jrxml).toContain('</textField>')
  })

  it('should include style information for elements', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [])
    
    // Check that style information is included
    expect(jrxml).toContain('size="16"')
    expect(jrxml).toContain('size="12"')
    expect(jrxml).toContain('isBold="true"')
    expect(jrxml).toContain('isItalic="true"')
  })

  it('should handle empty bands array', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, [], [], [])
    
    // Check that it still generates valid JRXML structure
    expect(jrxml).toContain('<jasperReport')
    expect(jrxml).toContain('</jasperReport>')
    
    // Should not contain any band elements
    expect(jrxml).not.toContain('<band')
  })

  it('should handle bands with no elements', () => {
    const bandsWithNoElements: Band[] = [
      {
        type: 'title',
        height: 80,
        elements: []
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithNoElements, [], [])
    
    // Should still include the band but no elements inside
    expect(jrxml).toContain('<band height="80">')
    expect(jrxml).toContain('</band>')
  })

  it('should include fields and parameters when provided', () => {
    const fields = [
      { name: 'field1', class: 'java.lang.String' },
      { name: 'field2', class: 'java.lang.Integer' }
    ]
    
    const parameters = [
      { name: 'param1', class: 'java.lang.String' },
      { name: 'param2', class: 'java.util.Date' }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, fields, parameters)
    
    // Check that fields are included
    expect(jrxml).toContain('<field name="field1" class="java.lang.String"/>')
    expect(jrxml).toContain('<field name="field2" class="java.lang.Integer"/>')
    
    // Check that parameters are included (non-self-closing format)
    expect(jrxml).toContain('<parameter name="param1" class="java.lang.String">')
    expect(jrxml).toContain('<parameter name="param2" class="java.util.Date">')
  })

  it('should generate valid XML that can be parsed', () => {
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [])
    
    // Simple check for well-formed XML
    const openTags = (jrxml.match(/</g) || []).length
    const closeTags = (jrxml.match(/>/g) || []).length
    
    // There should be at least as many close tags as open tags
    expect(closeTags).toBeGreaterThanOrEqual(openTags)
    
    // Check that the document is properly closed
    expect(jrxml).toContain('</jasperReport>')
  })

  it('should automatically add missing fields from expressions', () => {
    // Create a textField with an expression that uses a field not in the fields array
    const bandsWithMissingField: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'textField',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            expression: '$F{missing_field}',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false
          }
        ]
      }
    ]
    
    const fields = [
      { name: 'existing_field', class: 'java.lang.String' }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithMissingField, fields, [])
    
    // Should include both the existing field and the missing field (with default class)
    expect(jrxml).toContain('<field name="existing_field" class="java.lang.String"/>')
    expect(jrxml).toContain('<field name="missing_field" class="java.lang.String"/>')
  })

  it('should add default margins when not provided', () => {
    // Create report properties with missing margins
    const propertiesWithoutMargins: ReportProperties = {
      ...mockReportProperties,
      leftMargin: undefined,
      rightMargin: undefined,
      topMargin: undefined,
      bottomMargin: undefined
    }
    
    const jrxml = generateJRXMLContent(propertiesWithoutMargins, mockBands, [], [])
    
    // Should include default margins (0)
    expect(jrxml).toContain('leftMargin="0"')
    expect(jrxml).toContain('rightMargin="0"')
    expect(jrxml).toContain('topMargin="0"')
    expect(jrxml).toContain('bottomMargin="0"')
  })

  it('should handle parameters with default values', () => {
    const parameters = [
      {
        name: 'paramWithDefault',
        class: 'java.lang.String',
        defaultValue: 'default_value'
      },
      {
        name: 'paramWithoutDefault',
        class: 'java.lang.Integer'
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], parameters)
    
    // Both parameters should be included
    expect(jrxml).toContain('<parameter name="paramWithDefault" class="java.lang.String">')
    expect(jrxml).toContain('<parameter name="paramWithoutDefault" class="java.lang.Integer">')
    
    // Param with default should have defaultValueExpression
    expect(jrxml).toContain('<defaultValueExpression><![CDATA[default_value]]></defaultValueExpression>')
    
    // Param without default should not have defaultValueExpression
    const paramWithoutDefaultMatch = jrxml.match(/<parameter name="paramWithoutDefault" class="java.lang.Integer">(.*?)<\/parameter>/s)
    expect(paramWithoutDefaultMatch?.[1]).not.toContain('defaultValueExpression')
  })

  it('should generate subDatasets when provided', () => {
    const subDatasets = [
      {
        name: 'testDataset',
        uuid: 'test-uuid',
        query: {
          text: 'SELECT * FROM test_table',
          language: 'sql'
        }
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, mockBands, [], [], subDatasets)
    
    // Should include subDataset definition
    expect(jrxml).toContain('<subDataset name="testDataset" uuid="test-uuid">')
    expect(jrxml).toContain('<queryString language="sql"><![CDATA[SELECT * FROM test_table]]></queryString>')
    expect(jrxml).toContain('</subDataset>')
  })

  it('should generate main report queryString when provided', () => {
    const propertiesWithQuery = {
      ...mockReportProperties,
      query: {
        language: 'sql',
        text: 'SELECT * FROM main_table'
      }
    }
    
    const jrxml = generateJRXMLContent(propertiesWithQuery, mockBands, [], [])
    
    // Should include main report queryString
    expect(jrxml).toContain('<queryString language="sql"><![CDATA[SELECT * FROM main_table]]></queryString>')
  })

  it('should preserve subDataset queryString through parse-generate cycle', () => {
    // 1. Create test JRXML with subDataset containing queryString
    const testJRXML = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport name="TestReport" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <subDataset name="testDataset">
    <queryString language="sql">
      SELECT * FROM test_table WHERE status = 'active'
    </queryString>
    <field name="field1" class="java.lang.String"/>
    <field name="field2" class="java.lang.Integer"/>
  </subDataset>
  <detail>
    <band height="100">
    </band>
  </detail>
</jasperReport>`
    
    // 2. Parse the JRXML
    const parsedData = parseJRXMLContent(testJRXML)
    
    // 3. Verify subDataset query was parsed correctly
    expect(parsedData.datasets).toHaveLength(1)
    expect(parsedData.datasets[0].query).toBeDefined()
    expect(parsedData.datasets[0].query?.language).toBe('sql')
    expect(parsedData.datasets[0].query?.text).toBe('SELECT * FROM test_table WHERE status = \'active\'')
    
    // 4. Generate JRXML from parsed data
    const generatedJRXML = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields,
      parsedData.parameters,
      parsedData.datasets
    )
    
    // 5. Verify queryString is preserved in generated JRXML
    expect(generatedJRXML).toContain('<subDataset name="testDataset"')
    expect(generatedJRXML).toContain('<queryString language="sql"><![CDATA[SELECT * FROM test_table WHERE status = \'active\']]></queryString>')
    
    // 6. Parse generated JRXML again to verify round-trip preservation
    const reparsedData = parseJRXMLContent(generatedJRXML)
    expect(reparsedData.datasets).toHaveLength(1)
    expect(reparsedData.datasets[0].query).toBeDefined()
    expect(reparsedData.datasets[0].query?.text).toBe('SELECT * FROM test_table WHERE status = \'active\'')
  })

  it('should handle multiple textField expressions with different fields', () => {
    const complexBands: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'textField',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            expression: '$F{field1}',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false
          },
          {
            type: 'textField',
            x: 140,
            y: 10,
            width: 100,
            height: 20,
            expression: '$F{field2}',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false
          },
          {
            type: 'textField',
            x: 20,
            y: 40,
            width: 220,
            height: 20,
            expression: '$F{field1} + " - " + $F{field2}',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false
          }
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, complexBands, [], [])
    
    // Should include all field references in expressions
    expect(jrxml).toContain('<textFieldExpression><![CDATA[$F{field1}]]></textFieldExpression>')
    expect(jrxml).toContain('<textFieldExpression><![CDATA[$F{field2}]]></textFieldExpression>')
    expect(jrxml).toContain('<textFieldExpression><![CDATA[$F{field1} + " - " + $F{field2}]]></textFieldExpression>')
    
    // Should automatically add both fields with default class
    expect(jrxml).toContain('<field name="field1" class="java.lang.String"/>')
    expect(jrxml).toContain('<field name="field2" class="java.lang.String"/>')
  })

  it('should handle various element types', () => {
    // Create different types of elements (if supported)
    const mixedElementsBands: Band[] = [
      {
        type: 'detail',
        height: 150,
        elements: [
          {
            type: 'staticText',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            text: 'Static Text',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false
          } as DesignElement,
          {
            type: 'textField',
            x: 20,
            y: 40,
            width: 100,
            height: 20,
            expression: '$F{data_field}',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, mixedElementsBands, [], [])
    
    // Should include both element types
    expect(jrxml).toContain('<staticText>')
    expect(jrxml).toContain('<textField>')
  })
})