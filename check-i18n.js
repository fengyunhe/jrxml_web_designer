import fs from 'fs';
import path from 'path';

// 读取语言文件
const zhLocale = JSON.parse(fs.readFileSync('./src/locales/zh.json', 'utf8'));
const enLocale = JSON.parse(fs.readFileSync('./src/locales/en.json', 'utf8'));

// 递归获取所有的国际化键
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = [...keys, ...getAllKeys(value, fullKey)];
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// 检查键是否存在于语言对象中
function hasKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  return true;
}

// 搜索项目中使用的国际化键
function searchI18nKeys(directory) {
  const keys = new Set();
  // 匹配真正的国际化翻译键：t('xxx') 或 $t('xxx')，但排除 emit('xxx') 或 on('xxx') 等事件名称
  const regex = /\b(?:t|\$t)\(['"]([^'"]+)['"]\)/g;
  
  function searchFile(filePath) {
    if (filePath.endsWith('.vue') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
          keys.add(match[1]);
        }
      } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
      }
    }
  }
  
  function searchDirectory(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        searchDirectory(fullPath);
      } else {
        searchFile(fullPath);
      }
    }
  }
  
  searchDirectory(directory);
  return Array.from(keys);
}

// 检查国际化键
function checkI18nKeys() {
  const usedKeys = searchI18nKeys('./src');
  const zhKeys = getAllKeys(zhLocale);
  const enKeys = getAllKeys(enLocale);
  
  const missingInZh = [];
  const missingInEn = [];
  
  for (const key of usedKeys) {
    if (!hasKey(zhLocale, key)) {
      missingInZh.push(key);
    }
    if (!hasKey(enLocale, key)) {
      missingInEn.push(key);
    }
  }
  
  // 检查语言文件中是否有未使用的键
  const unusedInZh = zhKeys.filter(key => !usedKeys.includes(key));
  const unusedInEn = enKeys.filter(key => !usedKeys.includes(key));
  
  console.log('=== 国际化键检查结果 ===');
  console.log('\n1. 使用的国际化键数量:', usedKeys.length);
  console.log('2. 中文语言文件键数量:', zhKeys.length);
  console.log('3. 英文语言文件键数量:', enKeys.length);
  
  if (missingInZh.length > 0) {
    console.log('\n❌ 中文语言文件中缺失的键:');
    missingInZh.forEach(key => console.log(`   - ${key}`));
  } else {
    console.log('\n✅ 中文语言文件包含所有使用的键');
  }
  
  if (missingInEn.length > 0) {
    console.log('\n❌ 英文语言文件中缺失的键:');
    missingInEn.forEach(key => console.log(`   - ${key}`));
  } else {
    console.log('\n✅ 英文语言文件包含所有使用的键');
  }
  
  if (unusedInZh.length > 0) {
    console.log('\nℹ️  中文语言文件中未使用的键数量:', unusedInZh.length);
    // 可以选择打印未使用的键
    // unusedInZh.forEach(key => console.log(`   - ${key}`));
  }
  
  if (unusedInEn.length > 0) {
    console.log('\nℹ️  英文语言文件中未使用的键数量:', unusedInEn.length);
    // 可以选择打印未使用的键
    // unusedInEn.forEach(key => console.log(`   - ${key}`));
  }
  
  return {
    missingInZh,
    missingInEn,
    unusedInZh,
    unusedInEn
  };
}

// 运行检查
checkI18nKeys();
