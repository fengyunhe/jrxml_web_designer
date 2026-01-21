import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正则表达式匹配Vue文件中的模板内容
const templateRegex = /<template>([\s\S]*?)<\/template>/;
// 正则表达式匹配Vue文件中的scoped样式内容
const scopedStyleRegex = /<style\s+scoped\s*>([\s\S]*?)<\/style>/;
// 正则表达式匹配CSS选择器（简化版，只处理常见情况）
const selectorRegex = /\.([a-zA-Z0-9_-]+)\s*[{]/g;

// 读取文件内容
async function readFile(filePath) {
  return await fs.readFile(filePath, 'utf8');
}

// 获取文件中的模板内容
function getTemplateContent(content) {
  const match = content.match(templateRegex);
  return match ? match[1] : '';
}

// 获取文件中的scoped样式内容
function getScopedStyleContent(content) {
  const match = content.match(scopedStyleRegex);
  return match ? match[1] : '';
}

// 提取CSS类选择器
function extractSelectors(styleContent) {
  const selectors = new Set();
  let match;
  while ((match = selectorRegex.exec(styleContent)) !== null) {
    selectors.add(match[1]);
  }
  return selectors;
}

// 检查选择器是否在模板中被使用
function isSelectorUsed(selector, templateContent) {
  return templateContent.includes(`class="${selector}"`) || 
         templateContent.includes(`:class="{${selector}`) ||
         templateContent.includes(`:class="[${selector}`) ||
         templateContent.includes(`class="${selector} `) ||
         templateContent.includes(` ${selector}"`) ||
         templateContent.includes(` ${selector} `);
}

// 检查单个Vue文件的未使用样式
async function checkUnusedStyles(filePath) {
  console.log(`检查文件: ${filePath}`);
  const content = await readFile(filePath);
  const template = getTemplateContent(content);
  const scopedStyle = getScopedStyleContent(content);
  
  if (!scopedStyle) {
    console.log('  没有scoped样式');
    return null;
  }
  
  const selectors = extractSelectors(scopedStyle);
  const unusedSelectors = [];
  
  for (const selector of selectors) {
    if (!isSelectorUsed(selector, template)) {
      unusedSelectors.push(selector);
    }
  }
  
  if (unusedSelectors.length > 0) {
    console.log(`  未使用的样式类: ${unusedSelectors.join(', ')}`);
    return {
      filePath,
      unusedSelectors
    };
  } else {
    console.log('  所有样式都被使用');
    return null;
  }
}

// 遍历所有Vue文件
async function checkAllVueFiles(directory) {
  const vueFiles = [];
  
  async function traverse(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await traverse(filePath);
      } else if (file.endsWith('.vue')) {
        vueFiles.push(filePath);
      }
    }
  }
  
  await traverse(directory);
  
  const results = [];
  for (const filePath of vueFiles) {
    const result = await checkUnusedStyles(filePath);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

// 执行检查
async function main() {
  const srcDir = path.join(__dirname, 'src');
  const results = await checkAllVueFiles(srcDir);
  
  console.log('\n=== 检查结果汇总 ===');
  if (results.length === 0) {
    console.log('所有文件的scoped样式都被正确引用');
  } else {
    console.log(`发现${results.length}个文件存在未使用的scoped样式：`);
    for (const result of results) {
      console.log(`${result.filePath}:`);
      for (const selector of result.unusedSelectors) {
        console.log(`  .${selector}`);
      }
    }
  }
}

main();
