/**
 * 测试自动修复 JRXML 功能
 */

import { validateJRXML, autoFixJRXML } from '../src/utils/jrxml/xsdValidator';
import * as fs from 'fs';
import * as path from 'path';

async function testAutoFix() {
  console.log('=== 测试自动修复功能 ===\n');

  // 读取包含无效属性的测试文件
  const testFile = path.join(__dirname, 'test_autofix_invalid_attrs.jrxml');
  const originalContent = fs.readFileSync(testFile, 'utf-8');

  console.log('原始 JRXML 内容包含以下无效属性:');
  console.log('- jasperReport: invalidAttribute1, anotherInvalid');
  console.log('- reportElement: customBadAttr\n');

  // 1. 验证原始内容是否符合规范
  console.log('1. 验证原始内容...');
  const originalValidation = await validateJRXML(originalContent);
  console.log(`   有效性: ${originalValidation.valid ? '✓' : '✗'}`);
  if (!originalValidation.valid) {
    console.log(`   错误数量: ${originalValidation.errors.length}`);
    originalValidation.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. 行${err.line}:${err.column} - ${err.message}`);
    });
  }
  console.log('');

  // 2. 执行自动修复
  console.log('2. 执行自动修复...');
  const fixResult = await autoFixJRXML(originalContent);
  console.log(`   是否修复: ${fixResult.fixed ? '✓' : '✗'}`);
  console.log(`   修复项数量: ${fixResult.fixes.length}`);
  fixResult.fixes.forEach((fix, i) => {
    console.log(`   ${i + 1}. 行${fix.lineNumber} - 从 <${fix.elementName}> 移除属性 '${fix.attributeName}'`);
  });
  console.log('');

  // 3. 验证修复后的内容
  console.log('3. 验证修复后的内容...');
  const fixedValidation = await validateJRXML(fixResult.fixedContent);
  console.log(`   有效性: ${fixedValidation.valid ? '✓' : '✗'}`);
  if (fixedValidation.valid) {
    console.log('   所有属性符合规范 ✓');
  } else {
    console.log(`   仍存在 ${fixedValidation.errors.length} 个错误`);
  }
  console.log('');

  // 4. 输出修复后的内容（用于对比）
  console.log('4. 修复后的内容:');
  console.log('='.repeat(60));
  console.log(fixResult.fixedContent);
  console.log('='.repeat(60));
  console.log('');

  // 写入修复后的文件
  const outputFile = path.join(__dirname, 'test_autofix_fixed.jrxml');
  fs.writeFileSync(outputFile, fixResult.fixedContent, 'utf-8');
  console.log(`5. 修复后的内容已写入: ${outputFile}`);
}

// 执行测试
testAutoFix().catch(console.error);
