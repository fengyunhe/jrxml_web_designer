import { describe, it, expect } from 'vitest'
import { generateJRXMLContent } from '@/utils/jrxmlGenerator'
import type { Band, ReportProperties } from '@/types'

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
})