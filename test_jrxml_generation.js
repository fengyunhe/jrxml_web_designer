import fs from 'fs';
import path from 'path';

// 导入生成函数
import { generateJRXMLContent } from './src/utils/jrxmlGenerator.ts';

// 读取测试JRXML文件
const testJrxmlPath = path.join(process.cwd(), 'tests', 'table_with_2_head_rows.jrxml');
const testJrxmlContent = fs.readFileSync(testJrxmlPath, 'utf8');

// 解析JRXML
import { parseJRXMLContent } from './src/utils/jrxml/parse.ts';
const parsedData = parseJRXMLContent(testJrxmlContent);

// 生成JRXML
const generatedJrxml = generateJRXMLContent(
  parsedData.properties,
  parsedData.bands,
  parsedData.fields,
  parsedData.parameters,
  parsedData.datasets
);

// 输出生成的JRXML到文件
const outputPath = path.join(__dirname, 'generated_test.jrxml');
fs.writeFileSync(outputPath, generatedJrxml, 'utf8');

console.log('Generated JRXML written to:', outputPath);

// 检查第43行附近的内容
const lines = generatedJrxml.split('\n');
console.log('\nLines around 43:');
for (let i = Math.max(0, 40); i < Math.min(lines.length, 46); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
