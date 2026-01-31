import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseJRXMLContent } from './src/utils/jrxml/parse.ts';
import { generateJRXMLContent } from './src/utils/jrxmlGenerator.ts';

describe('Column Group Test', () => {
  it('should add column group and set rowSpan to 2 for third column', () => {
    // 读取测试JRXML文件
    const testJrxmlPath = path.join(process.cwd(), 'tests', 'build_by_this_designer_jrxml', 'grouped_header_column_table_example.jrxml');
    const testJrxmlContent = fs.readFileSync(testJrxmlPath, 'utf8');

    // 解析JRXML
    const parsedData = parseJRXMLContent(testJrxmlContent);

    // 查找表格元素并添加组合列
    let tableFound = false;
    parsedData.bands.forEach(band => {
      band.elements.forEach(element => {
        if (element.type === 'table') {
          tableFound = true;
          
          // 检查当前表格结构
          if (element.columns && element.columns.length >= 3) {
            // 创建新的子结构，将前两列组合
            const firstTwoColumns = element.columns.slice(0, 2);
            const thirdColumn = element.columns[2];
            
            // 创建组合列
            const columnGroup = {
              type: 'columnGroup',
              uuid: crypto.randomUUID(),
              name: 'Group1',
              width: firstTwoColumns.reduce((sum, col) => sum + (col.width || 0), 0),
              children: firstTwoColumns,
              columnHeader: {
                enable: true,
                element: {
                  type: 'staticText',
                  text: 'Group Header',
                  x: 0,
                  y: 0,
                  width: firstTwoColumns.reduce((sum, col) => sum + (col.width || 0), 0),
                  height: 30,
                  textAlignment: 'Center',
                  verticalAlignment: 'Middle'
                }
              }
            };
            
            // 更新表格的children属性
            element.children = [columnGroup, thirdColumn];
            
            // 更新第三列的rowSpan为2
            if (thirdColumn.columnHeader) {
              if (thirdColumn.columnHeader.element) {
                thirdColumn.columnHeader.element.rowSpan = 2;
              } else {
                thirdColumn.columnHeader.rowSpan = 2;
              }
            } else {
              // 如果没有columnHeader，创建一个
              thirdColumn.columnHeader = {
                enable: true,
                rowSpan: 2,
                element: {
                  type: 'staticText',
                  text: thirdColumn.name || 'Column3',
                  x: 0,
                  y: 0,
                  width: thirdColumn.width || 0,
                  height: 60, // 30 * 2
                  textAlignment: 'Center',
                  verticalAlignment: 'Middle'
                }
              };
            }
          }
        }
      });
    });

    expect(tableFound).toBe(true);

    // 生成新的JRXML
    const generatedJrxml = generateJRXMLContent(
      parsedData.properties,
      parsedData.bands,
      parsedData.fields,
      parsedData.parameters,
      parsedData.datasets
    );

    // 写入新文件
    const outputPath = path.join(process.cwd(), 'tests', 'build_by_this_designer_jrxml', 'grouped_header_column_table_example_with_group.jrxml');
    fs.writeFileSync(outputPath, generatedJrxml);

    // 验证生成的JRXML
    // 查找第三列的columnHeader并检查rowSpan
    let columnCount = 0;
    let inColumn = false;
    let thirdColumnHeaderFound = false;
    let rowSpanValue = null;

    for (const line of generatedJrxml.split('\n')) {
      if (line.includes('<jr:column ')) {
        columnCount++;
        inColumn = true;
      }
      
      if (inColumn && line.includes('<jr:columnHeader')) {
        if (columnCount === 3) {
          thirdColumnHeaderFound = true;
          const rowSpanMatch = line.match(/rowSpan="([^"]*)"/);
          if (rowSpanMatch) {
            rowSpanValue = rowSpanMatch[1];
          }
          break;
        }
      }
      
      if (inColumn && line.includes('</jr:column>')) {
        inColumn = false;
      }
    }

    expect(thirdColumnHeaderFound).toBe(true);
    expect(rowSpanValue).toBe('2');
  });
});
