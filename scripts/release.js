#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 读取package.json文件
const packageJsonPath = path.resolve(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 读取tauri.conf.json文件
const tauriConfPath = path.resolve(projectRoot, 'src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));

// 获取当前版本号
const currentVersion = packageJson.version;
console.log(`当前版本号: ${currentVersion}`);

// 提示用户输入新版本号
import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('请输入新版本号 (格式: x.y.z, 直接回车默认递增patch版本): ', (userInput) => {
  rl.close();
  
  let newVersion;
  
  // 如果用户没有输入版本号，默认递增patch版本
  if (!userInput.trim()) {
    console.log('未输入版本号，默认递增patch版本...');
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2] += 1;
    newVersion = versionParts.join('.');
    console.log(`默认版本号: ${newVersion}`);
  } else {
    // 验证用户输入的版本号格式
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(userInput)) {
      console.error('错误: 版本号格式不正确，应为 x.y.z 格式');
      process.exit(1);
    }
    newVersion = userInput;
  }
  
  console.log(`\n开始发布新版本: ${newVersion}`);
  console.log('='.repeat(50));
  
  try {
    // 1. 修改package.json中的版本号
    console.log('1. 修改package.json中的版本号...');
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✓ package.json版本号已更新');
    
    // 2. 修改tauri.conf.json中的版本号
    console.log('2. 修改src-tauri/tauri.conf.json中的版本号...');
    tauriConf.version = newVersion;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));
    console.log('✓ src-tauri/tauri.conf.json版本号已更新');
    
    // 3. 运行测试
    console.log('3. 运行测试...');
    execSync('pnpm test', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✓ 测试通过');
    
    // 4. 提交代码
    console.log('4. 提交代码...');
    execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });
    
    // 检查是否有需要提交的文件
    let hasChanges = false;
    try {
      execSync('git diff --staged --exit-code', { cwd: projectRoot, stdio: 'ignore' });
    } catch (error) {
      // 退出码为1表示有需要提交的文件
      if (error.status === 1) {
        hasChanges = true;
      } else {
        // 其他错误，抛出异常
        throw error;
      }
    }
    
    if (hasChanges) {
      execSync(`git commit -m "chore(release): v${newVersion}"`, { cwd: projectRoot, stdio: 'inherit' });
      console.log('✓ 代码已提交');
    } else {
      console.log('✓ 没有需要提交的文件，跳过提交');
    }
    
    // 5. 打tag
    console.log('5. 打tag...');
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { cwd: projectRoot, stdio: 'inherit' });
    console.log('✓ tag已创建');
    
    // 6. push master和tags
    console.log('6. 推送代码和tags...');
    execSync('git push origin master', { cwd: projectRoot, stdio: 'inherit' });
    execSync('git push origin --tags', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✓ 代码和tags已推送');
    
    console.log('='.repeat(50));
    console.log(`🎉 新版本 v${newVersion} 发布成功!`);
    
  } catch (error) {
    console.error('❌ 发布失败:', error.message);
    process.exit(1);
  }
});
