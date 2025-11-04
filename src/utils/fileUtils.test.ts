import { describe, it, expect } from 'vitest'
import { 
  exportToJSON, 
  importFromJSON, 
  exportToJRXML, 
  importFromJRXML, 
  validateJRXML,
  formatFileSize
} from '@/utils/fileUtils'
import type { ReportData } from '@/types'

// Mock File API
const mockFile = (content: string, name: string, type = 'application/json') => {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

describe('fileUtils', () => {
  describe('exportToJSON', () => {
    it('should create a valid JSON blob', () => {
      const reportData: ReportData = {
        reportProperties: {
          name: 'test',
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
        },
        bands: [
          {
            type: 'title',
            height: 80,
            elements: []
          }
        ],
        reportFields: [],
        jrxmlContent: '<test></test>'
      }
      
      const blob = exportToJSON(reportData)
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/json')
    })

    it('should include all report data in the JSON', async () => {
      const reportData: ReportData = {
        reportProperties: {
          name: 'test',
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
        },
        bands: [
          {
            type: 'title',
            height: 80,
            elements: [
              {
                type: 'staticText',
                x: 10,
                y: 10,
                width: 100,
                height: 20,
                text: 'Test',
                fontFamily: 'Arial',
                fontSize: 12,
                isBold: false,
                isItalic: false,
                isUnderline: false
              }
            ]
          }
        ],
        reportFields: [
          { name: 'field1', class: 'java.lang.String' }
        ],
        jrxmlContent: '<test></test>'
      }
      
      const blob = exportToJSON(reportData)
      
      // 在测试环境中使用FileReader读取Blob内容
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read blob'))
        reader.readAsText(blob)
      })
      
      const parsedData = JSON.parse(text)
      
      expect(parsedData.reportProperties.pageWidth).toBe(595)
      expect(parsedData.bands).toHaveLength(1)
      expect(parsedData.bands[0].type).toBe('title')
      expect(parsedData.bands[0].elements).toHaveLength(1)
      expect(parsedData.bands[0].elements[0].text).toBe('Test')
      expect(parsedData.reportFields).toHaveLength(1)
      expect(parsedData.jrxmlContent).toBe('<test></test>')
    })
  })

  describe('importFromJSON', () => {
    it('should parse valid JSON file', async () => {
      const reportData: ReportData = {
        reportProperties: {
          name: 'test',
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
        },
        bands: [
          {
            type: 'title',
            height: 80,
            elements: []
          }
        ],
        reportFields: [],
        jrxmlContent: '<test></test>'
      }
      
      const file = mockFile(JSON.stringify(reportData), 'test.json')
      const importedData = await importFromJSON(file)
      
      expect(importedData.reportProperties.pageWidth).toBe(595)
      if (importedData.bands && importedData.bands[0]) {
        expect(importedData.bands).toHaveLength(1)
        expect(importedData.bands[0].type).toBe('title')
      }
      expect(importedData.jrxmlContent).toBe('<test></test>')
    })

    it('should reject invalid JSON file', async () => {
      const file = mockFile('invalid json', 'test.json')
      
      await expect(importFromJSON(file)).rejects.toThrow()
    })
  })

  describe('exportToJRXML', () => {
    it('should create a valid JRXML blob', () => {
      const jrxmlContent = '<jasperReport></jasperReport>'
      const blob = exportToJRXML(jrxmlContent)
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/xml')
    })

    it('should include the JRXML content', async () => {
      const jrxmlContent = '<jasperReport><title>Test</title></jasperReport>'
      const blob = exportToJRXML(jrxmlContent)
      
      // 在测试环境中使用FileReader读取Blob内容
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read blob'))
        reader.readAsText(blob)
      })
      
      expect(text).toBe(jrxmlContent)
    })
  })

  describe('importFromJRXML', () => {
    it('should read JRXML content from file', async () => {
      const jrxmlContent = '<jasperReport><title>Test</title></jasperReport>'
      const file = mockFile(jrxmlContent, 'test.jrxml', 'application/xml')
      
      const importedContent = await importFromJRXML(file)
      expect(importedContent).toBe(jrxmlContent)
    })
  })

  describe('validateJRXML', () => {
    it('should validate well-formed JRXML', () => {
      const validJRXML = `
        <?xml version="1.0" encoding="UTF-8"?>
        <jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" 
                      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                      xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports 
                                          http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
                      name="test" pageWidth="595" pageHeight="842">
          <title>
            <band height="80">
              <staticText>
                <reportElement x="20" y="20" width="200" height="30"/>
                <text><![CDATA[Test Title]]></text>
              </staticText>
            </band>
          </title>
        </jasperReport>
      `
      
      const result = validateJRXML(validJRXML)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect malformed JRXML', () => {
      const invalidJRXML = `
        <?xml version="1.0" encoding="UTF-8"?>
        <jasperReport>
          <title>
            <band height="80">
              <staticText>
                <reportElement x="20" y="20" width="200" height="30"/>
                <text><![CDATA[Test Title]]></text>
              </staticText>
            </band>
          </title>
        </jasperReport>  <!-- Extra closing tag -->
      `
      
      const result = validateJRXML(invalidJRXML)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing required JRXML elements', () => {
      const incompleteJRXML = `
        <?xml version="1.0" encoding="UTF-8"?>
        <jasperReport>
          <!-- Missing name attribute -->
        </jasperReport>
      `
      
      const result = validateJRXML(incompleteJRXML)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })

    it('should handle very large numbers', () => {
      expect(formatFileSize(5 * 1073741824)).toBe('5 GB')
    })
  })
})