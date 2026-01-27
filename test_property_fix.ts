import fs from 'fs';
import path from 'path';
import { parseJRXMLContent } from './src/utils/jrxml/parse.ts';
import { generateJRXMLContent } from './src/utils/jrxmlGenerator.ts';

// 读取测试JRXML文件
const testJrxmlPath = path.join(process.cwd(), 'tests', 'table_with_2_head_rows.jrxml');
const testJrxmlContent = fs.readFileSync(testJrxmlPath, 'utf8');

console.log('Reading test JRXML file...');

// 解析JRXML
const parsedData = parseJRXMLContent(testJrxmlContent);
console.log('Parsed JRXML successfully');

// 检查解析后的列名
console.log('\nChecking parsed column names:');
parsedData.bands.forEach(band => {
  band.elements.forEach(element => {
    if (element.type === 'table') {
      console.log('Found table element');
      if (element.children) {
        element.children.forEach(child => {
          if (child.type === 'columnGroup') {
            console.log(`ColumnGroup name: "${child.name}"`);
            if (child.children) {
              child.children.forEach(column => {
                console.log(`  Column name: "${column.name}"`);
              });
            }
          } else if (child.type === 'column') {
            console.log(`Column name: "${child.name}"`);
          }
        });
      }
    }
  });
});

// 生成JRXML
const generatedJrxml = generateJRXMLContent(
  parsedData.properties,
  parsedData.bands,
  parsedData.fields,
  parsedData.parameters,
  parsedData.datasets
);

console.log('\nGenerated JRXML successfully');

// 检查生成的property元素
console.log('\nChecking generated property elements:');
const propertyRegex = /<property name="com\.jaspersoft\.studio\.components\.table\.model\.column\.name" value="([^"]+)"\/>/g;
let match;
while ((match = propertyRegex.exec(generatedJrxml)) !== null) {
  console.log(`Property value: "${match[1]}"`);
}

// 检查是否有双重引用
const doubleQuoteRegex = /value=""[^"]+""/g;
const doubleQuotes = generatedJrxml.match(doubleQuoteRegex);
if (doubleQuotes) {
  console.log('\nERROR: Found double quotes in property values:');
  doubleQuotes.forEach(match => {
    console.log(`  ${match}`);
  });
} else {
  console.log('\nSUCCESS: No double quotes found in property values!');
}

// 输出到文件
const outputPath = path.join(process.cwd(), 'test_property_fix_output.jrxml');
fs.writeFileSync(outputPath, generatedJrxml, 'utf8');
console.log(`\nGenerated JRXML written to: ${outputPath}`);
