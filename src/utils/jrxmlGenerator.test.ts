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

  it('should generate box elements with borders', () => {
    const bandsWithBox: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'staticText',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            text: 'Text with Border',
            fontFamily: 'Arial',
            fontSize: 12,
            box: {
              pen: {
                lineWidth: 1,
                lineStyle: 'Solid',
                lineColor: '#000000'
              }
            }
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithBox, [], [])
    
    // Should include box element with border
    expect(jrxml).toContain('<box>')
    expect(jrxml).toContain('<pen lineWidth="1" lineStyle="Solid" lineColor="#000000"/>')
    expect(jrxml).toContain('</box>')
  })

  it('should generate box elements with padding', () => {
    const bandsWithBoxPadding: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'staticText',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            text: 'Text with Padding',
            fontFamily: 'Arial',
            fontSize: 12,
            box: {
              padding: 5
            }
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithBoxPadding, [], [])
    
    // Should include box element with padding
    expect(jrxml).toContain('<box padding="5">')
    expect(jrxml).toContain('</box>')
  })

  it('should generate image elements', () => {
    const bandsWithImage: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'image',
            x: 20,
            y: 10,
            width: 100,
            height: 50,
            imageExpression: '"/path/to/image.png"'
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithImage, [], [])
    
    // Should include image element
    expect(jrxml).toContain('<image>')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="100" height="50"')
    expect(jrxml).toContain('<imageExpression><![CDATA["/path/to/image.png"]]></imageExpression>')
    expect(jrxml).toContain('</image>')
  })

  it('should generate line elements', () => {
    const bandsWithLine: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'line',
            x: 20,
            y: 10,
            width: 100,
            height: 0,
            lineDirection: 'TopDown'
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithLine, [], [])
    
    // Should include line element
    expect(jrxml).toContain('<line direction="TopDown">')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="100" height="20"')
    expect(jrxml).toContain('</line>')
  })

  it('should generate rectangle elements', () => {
    const bandsWithRectangle: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'rectangle',
            x: 20,
            y: 10,
            width: 100,
            height: 50,
            radius: 5
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithRectangle, [], [])
    
    // Should include rectangle element
    expect(jrxml).toContain('<rectangle radius="5">')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="100" height="50"')
    expect(jrxml).toContain('</rectangle>')
  })

  it('should generate box elements with individual side borders', () => {
    const bandsWithIndividualBorders: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'staticText',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            text: 'Text with Individual Borders',
            fontFamily: 'Arial',
            fontSize: 12,
            box: {
              topPen: {
                lineWidth: 1,
                lineStyle: 'Solid',
                lineColor: '#FF0000'
              },
              bottomPen: {
                lineWidth: 2,
                lineStyle: 'Dashed',
                lineColor: '#00FF00'
              }
            }
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithIndividualBorders, [], [])
    
    // Should include box element with individual side borders
    expect(jrxml).toContain('<box>')
    expect(jrxml).toContain('<topPen lineWidth="1" lineStyle="Solid" lineColor="#FF0000"/>')
    expect(jrxml).toContain('<bottomPen lineWidth="2" lineStyle="Dashed" lineColor="#00FF00"/>')
    expect(jrxml).toContain('</box>')
  })

  it('should generate box elements with directional padding', () => {
    const bandsWithDirectionalPadding: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'staticText',
            x: 20,
            y: 10,
            width: 100,
            height: 20,
            text: 'Text with Directional Padding',
            fontFamily: 'Arial',
            fontSize: 12,
            box: {
              leftPadding: 10,
              rightPadding: 5,
              topPadding: 3,
              bottomPadding: 3
            }
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithDirectionalPadding, [], [])
    
    // Should include box element with directional padding
    // Don't check the exact order, just check that all attributes are present
    expect(jrxml).toContain('topPadding="3"')
    expect(jrxml).toContain('leftPadding="10"')
    expect(jrxml).toContain('bottomPadding="3"')
    expect(jrxml).toContain('rightPadding="5"')
    expect(jrxml).toContain('<box')
    expect(jrxml).toContain('</box>')
  })

  it('should generate ellipse elements', () => {
    const bandsWithEllipse: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'ellipse',
            x: 20,
            y: 10,
            width: 50,
            height: 30
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithEllipse, [], [])
    
    // Should include ellipse element
    expect(jrxml).toContain('<ellipse>')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="50" height="30"')
    expect(jrxml).toContain('</ellipse>')
  })

  it('should generate break elements', () => {
    const bandsWithBreak: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'break',
            x: 20,
            y: 10,
            width: 1,
            height: 1,
            breakType: 'Page'
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithBreak, [], [])
    
    // Should include break element
    expect(jrxml).toContain('<break type="Page">')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="1" height="1"')
    expect(jrxml).toContain('</break>')
  })

  it('should generate frame elements', () => {
    const bandsWithFrame: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'frame',
            x: 20,
            y: 10,
            width: 150,
            height: 50,
            elements: [
              {
                type: 'staticText',
                x: 10,
                y: 10,
                width: 130,
                height: 30,
                text: 'Text inside Frame',
                fontFamily: 'Arial',
                fontSize: 12
              } as DesignElement
            ]
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bandsWithFrame, [], [])
    
    // Should include frame element and its content
    expect(jrxml).toContain('<frame>')
    expect(jrxml).toContain('<reportElement x="20" y="10" width="150" height="50"')
    expect(jrxml).toContain('Text inside Frame')
    expect(jrxml).toContain('</frame>')
  })

  it('should not generate duplicate columns when both children and columns properties exist', () => {
    // 创建一个包含列分组的表格元素，同时包含children和columns属性
    const tableElement: any = {
      type: 'table',
      x: 0,
      y: 0,
      width: 500,
      height: 300,
      uuid: 'test-table-uuid',
      dataset: {
        name: 'testDataset',
        uuid: 'test-dataset-uuid'
      },
      children: [
        {
          // 列分组
          name: 'Group1',
          uuid: 'group1-uuid',
          width: 200,
          hasTableHeader: true,
          tableHeader: {
            enable: true,
            element: {
              type: 'staticText',
              text: 'Group Header',
              x: 0,
              y: 0,
              width: 200,
              height: 30
            }
          },
          columnHeader: {
            enable: true,
            element: {
              type: 'staticText',
              text: 'Group1',
              x: 0,
              y: 0,
              width: 200,
              height: 30
            }
          },
          children: [
            {
              // 子列1
              name: 'Column1',
              uuid: 'column1-uuid',
              width: 100,
              hasTableHeader: false,
              columnHeader: {
                enable: true,
                element: {
                  type: 'staticText',
                  text: 'Column1',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              },
              detailCell: {
                enable: true,
                element: {
                  type: 'textField',
                  expression: '$F{field1}',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              }
            },
            {
              // 子列2
              name: 'Column2',
              uuid: 'column2-uuid',
              width: 100,
              hasTableHeader: false,
              columnHeader: {
                enable: true,
                element: {
                  type: 'staticText',
                  text: 'Column2',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              },
              detailCell: {
                enable: true,
                element: {
                  type: 'textField',
                  expression: '$F{field2}',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              }
            }
          ]
        },
        {
          // 普通列
          name: 'Column3',
          uuid: 'column3-uuid',
          width: 100,
          hasTableHeader: false,
          columnHeader: {
            enable: true,
            element: {
              type: 'staticText',
              text: 'Column3',
              x: 0,
              y: 0,
              width: 100,
              height: 30
            }
          },
          detailCell: {
            enable: true,
            element: {
              type: 'textField',
              expression: '$F{field3}',
              x: 0,
              y: 0,
              width: 100,
              height: 30
            }
          }
        }
      ],
      // 同时添加columns属性，模拟原始问题
      columns: [
        {
          name: 'Column1',
          uuid: 'column1-uuid',
          width: 100
        },
        {
          name: 'Column2',
          uuid: 'column2-uuid',
          width: 100
        },
        {
          name: 'Column3',
          uuid: 'column3-uuid',
          width: 100
        }
      ]
    }

    const bands: Band[] = [
      {
        type: 'detail',
        height: 300,
        elements: [tableElement as DesignElement]
      }
    ]

    const fields = [
      { name: 'field1', class: 'java.lang.String' },
      { name: 'field2', class: 'java.lang.String' },
      { name: 'field3', class: 'java.lang.String' }
    ]

    const generatedJRXML = generateJRXMLContent(mockReportProperties, bands, fields)

    // 验证生成的JRXML中没有重复的列
    
    // 1. 提取所有列的UUID（只匹配 <jr:column> 元素，不匹配 <jr:columnGroup> 元素）
    const columnUuids = [...generatedJRXML.matchAll(/<jr:column(?!Group)[^>]*uuid="([^"]+)"/g)]
      .map(match => match[1]);
    
    // 2. 检查UUID是否唯一
    const uniqueColumnUuids = new Set(columnUuids);
    expect(uniqueColumnUuids.size).toBe(columnUuids.length);
    
    // 3. 验证只生成了3列
    expect(columnUuids.length).toBe(3);
    
    // 4. 验证生成了1个列分组
    const columnGroupMatches = generatedJRXML.match(/<jr:columnGroup/g);
    expect(columnGroupMatches).toHaveLength(1);
    
    // 5. 验证所有预期的列UUID都存在
    expect(columnUuids).toContain('column1-uuid');
    expect(columnUuids).toContain('column2-uuid');
    expect(columnUuids).toContain('column3-uuid');
  })

  it('should set correct rowSpan for ungrouped columns', () => {
    // 创建一个表格元素，其中A和B列合并，C列未合并
    const tableElement: any = {
      type: 'table',
      x: 0,
      y: 0,
      width: 500,
      height: 300,
      uuid: 'test-table-uuid',
      dataset: {
        name: 'testDataset',
        uuid: 'test-dataset-uuid'
      },
      children: [
        {
          // A和B的组合列
          name: 'Group1',
          uuid: 'group1-uuid',
          width: 200,
          columnHeader: {
            enable: true,
            element: {
              type: 'staticText',
              text: 'Group1',
              x: 0,
              y: 0,
              width: 200,
              height: 30
            }
          },
          children: [
            {
              // A列
              name: 'A',
              uuid: 'column-a-uuid',
              width: 100,
              columnHeader: {
                enable: true,
                element: {
                  type: 'staticText',
                  text: 'A',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              },
              detailCell: {
                enable: true,
                element: {
                  type: 'textField',
                  expression: '$F{fieldA}',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              }
            },
            {
              // B列
              name: 'B',
              uuid: 'column-b-uuid',
              width: 100,
              columnHeader: {
                enable: true,
                element: {
                  type: 'staticText',
                  text: 'B',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              },
              detailCell: {
                enable: true,
                element: {
                  type: 'textField',
                  expression: '$F{fieldB}',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 30
                }
              }
            }
          ]
        },
        {
          // C列（未合并）
          name: 'C',
          uuid: 'column-c-uuid',
          width: 100,
          columnHeader: {
            enable: true,
            element: {
              type: 'staticText',
              text: 'C',
              x: 0,
              y: 0,
              width: 100,
              height: 30
            }
          },
          detailCell: {
            enable: true,
            element: {
              type: 'textField',
              expression: '$F{fieldC}',
              x: 0,
              y: 0,
              width: 100,
              height: 30
            }
          }
        }
      ]
    }

    const bands: Band[] = [
      {
        type: 'detail',
        height: 300,
        elements: [tableElement as DesignElement]
      }
    ]

    const fields = [
      { name: 'fieldA', class: 'java.lang.String' },
      { name: 'fieldB', class: 'java.lang.String' },
      { name: 'fieldC', class: 'java.lang.String' }
    ]

    const generatedJRXML = generateJRXMLContent(mockReportProperties, bands, fields)

    // 验证生成的JRXML中C列的columnHeader的rowSpan为2
    const columnCHeaderMatch = generatedJRXML.match(/<jr:columnHeader[^>]*rowSpan="([^"]+)"[^>]*>.*?Column C.*?<\/jr:columnHeader>/s);

    // 直接搜索C列的columnHeader的rowSpan
    const columnCRowSpanMatch = generatedJRXML.match(/<jr:column[^>]*uuid="column-c-uuid"[^>]*>.*?<jr:columnHeader[^>]*rowSpan="([^"]+)"/s);

    // 验证rowSpan为2
    expect(columnCRowSpanMatch).toBeDefined();
    expect(columnCRowSpanMatch?.[1]).toBe('2');
  })

  it('should inflate standalone column height to match rowSpan alongside groups', () => {
    // 表格有一个分组（含2列）和一个独立列
    // 独立列需要 rowSpan=2, height=60 (30*2)
    const mockReportProperties = {
      reportName: 'Test',
      pageWidth: 595,
      pageHeight: 842,
      marginLeft: 20,
      marginRight: 20,
      marginTop: 20,
      marginBottom: 20,
      defaultFontName: 'Noto Sans SC',
      defaultFontSize: 12
    }

    const bands = [{
      type: 'detail' as const,
      height: 200,
      elements: [{
        type: 'table' as const,
        uuid: 'table-1',
        x: 0, y: 0, width: 300, height: 200,
        children: [
          {
            uuid: 'group-a',
            name: 'Group A',
            width: 200,
            columnHeader: {
              enable: true,
              element: {
                type: 'staticText',
                text: 'Group A',
                x: 0, y: 0, width: 200, height: 30,
                textAlignment: 'Center', verticalAlignment: 'Middle'
              }
            },
            children: [
              {
                uuid: 'col-1',
                name: 'Col1',
                width: 100,
                columnHeader: {
                  enable: true,
                  element: {
                    type: 'staticText',
                    text: 'Col1',
                    x: 0, y: 0, width: 100, height: 30
                  }
                },
                detailCell: {
                  enable: true,
                  element: { type: 'textField', expression: '$F{f1}', x: 0, y: 0, width: 100, height: 30 }
                }
              },
              {
                uuid: 'col-2',
                name: 'Col2',
                width: 100,
                columnHeader: {
                  enable: true,
                  element: {
                    type: 'staticText',
                    text: 'Col2',
                    x: 0, y: 0, width: 100, height: 30
                  }
                },
                detailCell: {
                  enable: true,
                  element: { type: 'textField', expression: '$F{f2}', x: 0, y: 0, width: 100, height: 30 }
                }
              }
            ]
          },
          {
            uuid: 'col-standalone',
            name: 'Standalone',
            width: 100,
            columnHeader: {
              enable: true,
              element: {
                type: 'staticText',
                text: 'Standalone',
                x: 0, y: 0, width: 100, height: 30
              }
            },
            detailCell: {
              enable: true,
              element: { type: 'textField', expression: '$F{f3}', x: 0, y: 0, width: 100, height: 30 }
            }
          }
        ],
        columns: []
      }]
    }]

    const fields = [
      { name: 'f1', class: 'java.lang.String' },
      { name: 'f2', class: 'java.lang.String' },
      { name: 'f3', class: 'java.lang.String' }
    ]

    const generated = generateJRXMLContent(mockReportProperties, bands, fields)

    // 独立列的 columnHeader 应该有 rowSpan=2
    const standaloneMatch = generated.match(/<jr:column[^>]*uuid="col-standalone"[^>]*>[\s\S]*?<jr:columnHeader\s+height="(\d+)"\s+rowSpan="(\d+)"/)
    expect(standaloneMatch).toBeDefined()
    expect(standaloneMatch?.[2]).toBe('2')
  })
})