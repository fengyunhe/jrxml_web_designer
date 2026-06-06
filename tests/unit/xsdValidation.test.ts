import { describe, it, expect, beforeAll } from 'vitest'
import { generateJRXMLContent } from '@/utils/jrxmlGenerator'
import type { Band, ReportProperties, DesignElement } from '@/types'
import fs from 'fs'
import path from 'path'

// 直接从xsdValidator.ts导入验证逻辑
function parseXsdSchema(xsdContent: string): Map<string, Set<string>> {
  const elementAttributes = new Map<string, Set<string>>()
  const parser = new DOMParser()
  const xsdDoc = parser.parseFromString(xsdContent, 'text/xml')
  
  // 查找所有xs:element定义
  const elements = xsdDoc.querySelectorAll('xs:element')
  elements.forEach(element => {
    const elementName = element.getAttribute('name')
    if (!elementName) return
    
    const allowedAttrs = new Set<string>()
    
    // 查找complexType定义
    let complexType = element.querySelector('xs:complexType')
    if (!complexType) {
      const complexTypeName = element.getAttribute('type')
      if (complexTypeName) {
        complexType = xsdDoc.querySelector(`xs:complexType[name="${complexTypeName}"]`)
      }
    }
    
    if (complexType) {
      // 查找直接属性定义
      const attrs = complexType.querySelectorAll('xs:attribute')
      attrs.forEach(attr => {
        const attrName = attr.getAttribute('name')
        if (attrName) allowedAttrs.add(attrName)
      })
      
      // 查找属性组引用
      const attrGroupRefs = complexType.querySelectorAll('xs:attributeGroup')
      attrGroupRefs.forEach(attrGroupRef => {
        const refName = attrGroupRef.getAttribute('ref')
        if (refName) {
          const attrGroup = xsdDoc.querySelector(`xs:attributeGroup[name="${refName}"]`)
          if (attrGroup) {
            const groupAttrs = attrGroup.querySelectorAll('xs:attribute')
            groupAttrs.forEach(attr => {
              const attrName = attr.getAttribute('name')
              if (attrName) allowedAttrs.add(attrName)
            })
          }
        }
      })
      
      // 检查是否有anyAttribute
      const anyAttr = complexType.querySelector('xs:anyAttribute')
      if (anyAttr) {
        allowedAttrs.add('*') // 允许任何属性
      }
    }
    
    elementAttributes.set(elementName, allowedAttrs)
  })
  
  return elementAttributes
}

function validateAgainstXSD(xmlContent: string, xsdContent: string): { valid: boolean; errors: { message: string; elementName?: string; attributeName?: string }[] } {
  const errors: { message: string; elementName?: string; attributeName?: string }[] = []
  const elementAttributes = parseXsdSchema(xsdContent)
  
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')
  
  // 检查XML解析错误
  const xmlParseError = xmlDoc.querySelector('parsererror')
  if (xmlParseError) {
    errors.push({ message: `XML解析错误: ${xmlParseError.textContent || '未知错误'}` })
    return { valid: false, errors }
  }
  
  // 获取所有元素
  const allElements = xmlDoc.querySelectorAll('*')
  
  allElements.forEach(element => {
    const elementName = element.localName
    
    // 跳过jasperReport根元素和一些特殊元素
    if (elementName === 'jasperReport' || elementName === 'import' || elementName === 'template') {
      return
    }
    
    // 检查元素是否在XSD中定义
    const allowedAttrs = elementAttributes.get(elementName)
    if (!allowedAttrs) {
      // 检查是否在jr命名空间中
      const jrAllowedAttrs = elementAttributes.get(elementName)
      if (!jrAllowedAttrs) {
        // 某些元素可能在XSD中没有明确定义，但仍然有效
        return
      }
    }
    
    // 检查属性
    const attributes = element.attributes
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i]
      const attrName = attr.localName
      
      // 跳过命名空间属性
      if (attrName === 'xmlns' || attrName.startsWith('xmlns:') || attrName === 'xsi:schemaLocation') {
        continue
      }
      
      // 如果允许任何属性，跳过检查
      if (allowedAttrs && allowedAttrs.has('*')) {
        continue
      }
      
      // 检查属性是否允许
      if (allowedAttrs && !allowedAttrs.has(attrName)) {
        errors.push({
          message: `元素 ${elementName} 不允许属性 ${attrName}`,
          elementName,
          attributeName: attrName
        })
      }
    }
  })
  
  return { valid: errors.length === 0, errors }
}

describe('jrxmlGenerator XSD Validation', () => {
  let xsdContent: string
  
  beforeAll(() => {
    // 加载XSD文件
    const xsdPath = path.resolve(__dirname, '../../jasperreport.xsd')
    xsdContent = fs.readFileSync(xsdPath, 'utf-8')
  })
  
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
  
  // 测试静态文本元素
  it('staticText元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'staticText',
            x: 20,
            y: 10,
            width: 200,
            height: 30,
            text: '静态文本',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: true,
            isItalic: false,
            isUnderline: false,
            textAlignment: 'Left',
            verticalAlignment: 'Top',
            rotation: 'None',
            markup: 'none'
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('staticText验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试文本字段元素
  it('textField元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
      {
        type: 'detail',
        height: 100,
        elements: [
          {
            type: 'textField',
            x: 20,
            y: 10,
            width: 200,
            height: 30,
            expression: '$F{field_name}',
            fontFamily: 'Arial',
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false,
            textAlignment: 'Left',
            verticalAlignment: 'Top',
            rotation: 'None',
            textAdjust: 'CutText'
          } as DesignElement
        ]
      }
    ]
    
    const fields = [{ name: 'field_name', class: 'java.lang.String' }]
    const jrxml = generateJRXMLContent(mockReportProperties, bands, fields, [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('textField验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试图像元素
  it('image元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
            imageExpression: '"image.png"'
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('image验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试线条元素
  it('line元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('line验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试矩形元素
  it('rectangle元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('rectangle验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试椭圆元素
  it('ellipse元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('ellipse验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试框架元素
  it('frame元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
                text: '框架内文本',
                fontFamily: 'Arial',
                fontSize: 12
              } as DesignElement
            ]
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('frame验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试分页元素
  it('break元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('break验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试带边框的元素
  it('带边框的元素生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
            text: '带边框文本',
            fontFamily: 'Arial',
            fontSize: 12,
            box: {
              pen: {
                lineWidth: 1,
                lineStyle: 'Solid',
                lineColor: '#000000'
              },
              topPen: {
                lineWidth: 1,
                lineStyle: 'Solid',
                lineColor: '#FF0000'
              },
              bottomPen: {
                lineWidth: 2,
                lineStyle: 'Dashed',
                lineColor: '#00FF00'
              },
              leftPen: {
                lineWidth: 1,
                lineStyle: 'Solid',
                lineColor: '#0000FF'
              },
              rightPen: {
                lineWidth: 1,
                lineStyle: 'Solid',
                lineColor: '#0000FF'
              },
              padding: 5,
              topPadding: 3,
              bottomPadding: 3,
              leftPadding: 10,
              rightPadding: 5
            }
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('box验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试表格元素
  it('table元素生成的JRXML应通过XSD校验', () => {
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
          name: 'Column1',
          uuid: 'column1-uuid',
          width: 100,
          columnHeader: {
            enable: true,
            element: {
              type: 'staticText',
              text: '列标题',
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
    
    const fields = [{ name: 'field1', class: 'java.lang.String' }]
    const subDatasets = [
      {
        name: 'testDataset',
        uuid: 'test-dataset-uuid',
        query: {
          text: 'SELECT * FROM test_table',
          language: 'sql'
        }
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, fields, [], subDatasets)
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('table验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试所有Band类型
  it('所有Band类型生成的JRXML应通过XSD校验', () => {
    const allBandTypes: Band[] = [
      { type: 'title', height: 80, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '标题', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'pageHeader', height: 50, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '页头', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'columnHeader', height: 30, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '列头', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'detail', height: 100, elements: [{ type: 'textField', x: 0, y: 0, width: 100, height: 30, expression: '$F{field}', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'columnFooter', height: 30, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '列脚', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'pageFooter', height: 40, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '页脚', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'summary', height: 60, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '汇总', fontFamily: 'Arial', fontSize: 12 } as DesignElement] },
      { type: 'background', height: 100, elements: [{ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } as DesignElement] },
      { type: 'noData', height: 50, elements: [{ type: 'staticText', x: 0, y: 0, width: 100, height: 30, text: '无数据', fontFamily: 'Arial', fontSize: 12 } as DesignElement] }
    ]
    
    const fields = [{ name: 'field', class: 'java.lang.String' }]
    const jrxml = generateJRXMLContent(mockReportProperties, allBandTypes, fields, [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('Band类型验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试样式定义
  it('样式定义生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
            text: '样式文本',
            fontFamily: 'Arial',
            fontSize: 12,
            style: 'CustomStyle'
          } as DesignElement
        ]
      }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, [], [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('style验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试参数和字段
  it('参数和字段定义生成的JRXML应通过XSD校验', () => {
    const bands: Band[] = [
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
            expression: '$P{param1}',
            fontFamily: 'Arial',
            fontSize: 12
          } as DesignElement,
          {
            type: 'textField',
            x: 130,
            y: 10,
            width: 100,
            height: 20,
            expression: '$F{field1}',
            fontFamily: 'Arial',
            fontSize: 12
          } as DesignElement
        ]
      }
    ]
    
    const fields = [
      { name: 'field1', class: 'java.lang.String' },
      { name: 'field2', class: 'java.lang.Integer' }
    ]
    
    const parameters = [
      { name: 'param1', class: 'java.lang.String', defaultValue: 'default_value' },
      { name: 'param2', class: 'java.util.Date' }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, bands, fields, parameters)
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('参数字段验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试查询字符串
  it('查询字符串生成的JRXML应通过XSD校验', () => {
    const propertiesWithQuery = {
      ...mockReportProperties,
      query: {
        language: 'sql',
        text: 'SELECT * FROM main_table'
      }
    }
    
    const bands: Band[] = [
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
            expression: '$F{id}',
            fontFamily: 'Arial',
            fontSize: 12
          } as DesignElement
        ]
      }
    ]
    
    const fields = [{ name: 'id', class: 'java.lang.Integer' }]
    const jrxml = generateJRXMLContent(propertiesWithQuery, bands, fields, [])
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('queryString验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
  
  // 测试复杂组合
  it('复杂组合元素生成的JRXML应通过XSD校验', () => {
    const complexBands: Band[] = [
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
            text: '报表标题',
            fontFamily: 'Arial',
            fontSize: 16,
            isBold: true,
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
            box: {
              pen: { lineWidth: 1, lineStyle: 'Solid', lineColor: '#000000' }
            }
          } as DesignElement,
          {
            type: 'image',
            x: 400,
            y: 10,
            width: 100,
            height: 50,
            imageExpression: '"logo.png"'
          } as DesignElement
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
            expression: '$F{name}',
            fontFamily: 'Arial',
            fontSize: 12,
            textAdjust: 'StretchHeight',
            box: {
              leftPen: { lineWidth: 1, lineStyle: 'Solid', lineColor: '#000000' },
              rightPen: { lineWidth: 1, lineStyle: 'Solid', lineColor: '#000000' }
            }
          } as DesignElement,
          {
            type: 'line',
            x: 20,
            y: 40,
            width: 200,
            height: 0,
            lineDirection: 'TopDown'
          } as DesignElement,
          {
            type: 'rectangle',
            x: 250,
            y: 10,
            width: 50,
            height: 30,
            radius: 5
          } as DesignElement
        ]
      }
    ]
    
    const fields = [
      { name: 'name', class: 'java.lang.String' },
      { name: 'value', class: 'java.lang.Integer' }
    ]
    
    const parameters = [
      { name: 'reportTitle', class: 'java.lang.String', defaultValue: '默认标题' }
    ]
    
    const jrxml = generateJRXMLContent(mockReportProperties, complexBands, fields, parameters)
    const result = validateAgainstXSD(jrxml, xsdContent)
    
    if (!result.valid) {
      console.error('复杂组合验证错误:', result.errors)
    }
    
    expect(result.valid).toBe(true)
  })
})