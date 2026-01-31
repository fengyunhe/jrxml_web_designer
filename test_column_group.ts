import fs from 'fs';
import path from 'path';
import { parseJRXMLContent } from './src/utils/jrxml/parse.ts';
import { generateJRXMLContent } from './src/utils/jrxmlGenerator.ts';

// 读取测试JRXML文件
const testJrxmlPath = path.join(process.cwd(), 'tests', 'build_by_this_designer_jrxml', 'grouped_header_column_table_example.jrxml');
const testJrxmlContent = fs.readFileSync(testJrxmlPath, 'utf8');

console.log('Reading test JRXML file...');

// 解析JRXML
const parsedData = parseJRXMLContent(testJrxmlContent);
console.log('Parsed JRXML successfully');

// 查找表格元素并添加组合列
let tableFound = false;
parsedData.bands.forEach(band => {
  band.elements.forEach(element => {
    if (element.type === 'table') {
      console.log('Found table element');
      tableFound = true;
      
      // 检查当前表格结构
      if (element.columns && element.columns.length >= 3) {
        console.log(`Table has ${element.columns.length} columns`);
        
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
        
        console.log('Added column group for first two columns');
        console.log('Set rowSpan of third column to 2');
      } else {
        console.error('Table does not have enough columns');
      }
    }
  });
});

if (!tableFound) {
  console.error('No table element found in JRXML');
  process.exit(1);
}

// 生成新的JRXML
const generatedJrxml = generateJRXMLContent(
  parsedData.properties,
  parsedData.bands,
  parsedData.fields,
  parsedData.parameters,
  parsedData.datasets
);

console.log('Generated new JRXML successfully');

// 写入新文件
const outputPath = path.join(process.cwd(), 'tests', 'build_by_this_designer_jrxml', 'grouped_header_column_table_example_with_group.jrxml');
fs.writeFileSync(outputPath, generatedJrxml);

console.log(`New JRXML file written to: ${outputPath}`);

// 验证生成的JRXML
console.log('\nVerifying generated JRXML...');

// 使用字符串搜索检查第三列的rowSpan
const columnHeaderRegex = /<jr:columnHeader[^>]*rowSpan="([^"]*)"[^>]*>/g;
const matches = [...generatedJrxml.matchAll(columnHeaderRegex)];

console.log(`Found ${matches.length} columnHeader elements with rowSpan attribute`);

// 查找第三列的columnHeader
let thirdColumnHeaderFound = false;
let rowSpanValue = null;

// 简单的方法：计算列数并找到第三个columnHeader
let columnCount = 0;
let inColumn = false;
let columnHeaderCount = 0;

for (const line of generatedJrxml.split('\n')) {
  if (line.includes('<jr:column ')) {
    columnCount++;
    inColumn = true;
  }
  
  if (inColumn && line.includes('<jr:columnHeader')) {
    columnHeaderCount++;
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

if (thirdColumnHeaderFound) {
  console.log(`Third column rowSpan: ${rowSpanValue}`);
  if (rowSpanValue === '2') {
    console.log('✅ SUCCESS: Third column rowSpan is correctly set to 2');
  } else {
    console.error(`❌ FAILURE: Third column rowSpan is ${rowSpanValue}, expected 2`);
  }
} else {
  console.error('❌ FAILURE: No columnHeader found for third column');
}

// 打印生成的JRXML的关键部分，以便手动验证
console.log('\nKey part of generated JRXML:');
const lines = generatedJrxml.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<jr:column ') || lines[i].includes('<jr:columnHeader') || lines[i].includes('</jr:column>')) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

console.log('\nTest completed!');
