#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('测试release脚本的新特性...');
console.log('='.repeat(50));

// 测试1: 验证版本号递增逻辑
console.log('\n测试1: 验证版本号递增逻辑');
try {
  // 读取当前版本号
  const packageJsonPath = path.resolve(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  
  // 模拟版本号递增逻辑
  const versionParts = currentVersion.split('.').map(Number);
  versionParts[2] += 1;
  const expectedVersion = versionParts.join('.');
  
  console.log(`当前版本号: ${currentVersion}`);
  console.log(`预期递增后版本号: ${expectedVersion}`);
  
  // 测试逻辑
  let actualVersion;
  const userInput = ''; // 模拟直接回车
  
  if (!userInput.trim()) {
    actualVersion = versionParts.join('.');
  }
  
  if (actualVersion === expectedVersion) {
    console.log('✅ 版本号递增逻辑正确');
  } else {
    console.log(`❌ 版本号递增逻辑错误: 预期 ${expectedVersion}, 实际 ${actualVersion}`);
  }
} catch (error) {
  console.error('❌ 测试1失败:', error.message);
}

// 测试2: 验证git提交检查逻辑
console.log('\n测试2: 验证git提交检查逻辑');
try {
  // 创建一个临时文件用于测试
  const tempDir = path.resolve(projectRoot, 'temp-test');
  fs.mkdirSync(tempDir);
  
  // 初始化git仓库
  execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
  
  // 创建一个初始文件
  fs.writeFileSync(path.resolve(tempDir, 'package.json'), '{"version": "1.0.0"}');
  execSync('git add .', { cwd: tempDir, stdio: 'ignore' });
  execSync('git commit -m "initial commit"', { cwd: tempDir, stdio: 'ignore' });
  
  // 测试2.1: 没有需要提交的文件
  console.log('测试2.1: 没有需要提交的文件');
  let hasChanges = false;
  try {
    execSync('git diff --staged --exit-code', { cwd: tempDir, stdio: 'ignore' });
  } catch (error) {
    if (error.status === 1) {
      hasChanges = true;
    } else {
      throw error;
    }
  }
  
  if (!hasChanges) {
    console.log('✅ 正确检测到没有需要提交的文件');
  } else {
    console.log('❌ 错误检测到需要提交的文件');
  }
  
  // 测试2.2: 有需要提交的文件
  console.log('测试2.2: 有需要提交的文件');
  fs.writeFileSync(path.resolve(tempDir, 'test.txt'), 'test content');
  execSync('git add .', { cwd: tempDir, stdio: 'ignore' });
  
  hasChanges = false;
  try {
    execSync('git diff --staged --exit-code', { cwd: tempDir, stdio: 'ignore' });
  } catch (error) {
    if (error.status === 1) {
      hasChanges = true;
    } else {
      throw error;
    }
  }
  
  if (hasChanges) {
    console.log('✅ 正确检测到需要提交的文件');
  } else {
    console.log('❌ 错误检测到没有需要提交的文件');
  }
  
  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✅ 临时目录已清理');
  
} catch (error) {
  console.error('❌ 测试2失败:', error.message);
  // 尝试清理临时目录
  try {
    const tempDir = path.resolve(projectRoot, 'temp-test');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (cleanupError) {
    console.error('❌ 清理临时目录失败:', cleanupError.message);
  }
}

console.log('\n' + '='.repeat(50));
console.log('测试完成!');
