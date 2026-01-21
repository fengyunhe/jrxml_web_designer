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
})
