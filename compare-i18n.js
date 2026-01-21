import { readFileSync } from 'fs';

// 读取两个JSON文件
const zhContent = readFileSync('./src/locales/zh.json', 'utf8');
const enContent = readFileSync('./src/locales/en.json', 'utf8');

// 解析JSON
const zh = JSON.parse(zhContent);
const en = JSON.parse(enContent);

// 递归获取所有键路径
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

// 获取所有键
const zhKeys = getAllKeys(zh);
const enKeys = getAllKeys(en);

// 找出中文有但英文没有的键
const missingInEn = zhKeys.filter(key => !enKeys.includes(key));

// 找出英文有但中文没有的键
const missingInZh = enKeys.filter(key => !zhKeys.includes(key));

// 输出结果
console.log('=== 国际化文件比较结果 ===');
console.log('\n1. 中文文件有但英文文件没有的键:');
if (missingInEn.length === 0) {
  console.log('   无缺失');
} else {
  missingInEn.forEach(key => console.log(`   - ${key}`));
}

console.log('\n2. 英文文件有但中文文件没有的键:');
if (missingInZh.length === 0) {
  console.log('   无缺失');
} else {
  missingInZh.forEach(key => console.log(`   - ${key}`));
}

console.log('\n3. 总键数比较:');
console.log(`   中文文件: ${zhKeys.length} 个键`);
console.log(`   英文文件: ${enKeys.length} 个键`);

// 检查是否完全一致
if (missingInEn.length === 0 && missingInZh.length === 0) {
  console.log('\n✅ 中英文国际化文件键完全一致，没有缺失！');
} else {
  console.log('\n❌ 中英文国际化文件键不一致，请检查缺失项！');
}
