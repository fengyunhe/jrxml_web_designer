#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('测试git提交检查逻辑...');
console.log('='.repeat(50));

// 测试1: 当没有需要提交的文件时
console.log('\n测试1: 当没有需要提交的文件时');
try {
  execSync('git add .', { cwd: projectRoot, stdio: 'ignore' });
  
  let hasChanges = false;
  try {
    execSync('git diff --staged --exit-code', { cwd: projectRoot, stdio: 'ignore' });
  } catch (error) {
    if (error.status === 1) {
      hasChanges = true;
    } else {
      throw error;
    }
  }
  
  if (hasChanges) {
    console.log('❌ 预期: 没有需要提交的文件, 实际: 检测到需要提交的文件');
  } else {
    console.log('✅ 预期: 没有需要提交的文件, 实际: 没有检测到需要提交的文件');
  }
} catch (error) {
  console.error('❌ 测试1失败:', error.message);
}

// 测试2: 当有需要提交的文件时
console.log('\n测试2: 当有需要提交的文件时');
try {
  // 创建一个临时文件
  const tempFilePath = path.resolve(projectRoot, 'temp-test-file.txt');
  fs.writeFileSync(tempFilePath, 'test content');
  
  execSync('git add .', { cwd: projectRoot, stdio: 'ignore' });
  
  let hasChanges = false;
  try {
    execSync('git diff --staged --exit-code', { cwd: projectRoot, stdio: 'ignore' });
  } catch (error) {
    if (error.status === 1) {
      hasChanges = true;
    } else {
      throw error;
    }
  }
  
  if (hasChanges) {
    console.log('✅ 预期: 有需要提交的文件, 实际: 检测到需要提交的文件');
  } else {
    console.log('❌ 预期: 有需要提交的文件, 实际: 没有检测到需要提交的文件');
  }
  
  // 清理临时文件
  fs.unlinkSync(tempFilePath);
  execSync('git restore --staged .', { cwd: projectRoot, stdio: 'ignore' });
} catch (error) {
  console.error('❌ 测试2失败:', error.message);
  // 尝试清理临时文件
  try {
    const tempFilePath = path.resolve(projectRoot, 'temp-test-file.txt');
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      execSync('git restore --staged .', { cwd: projectRoot, stdio: 'ignore' });
    }
  } catch (cleanupError) {
    console.error('❌ 清理临时文件失败:', cleanupError.message);
  }
}

console.log('\n' + '='.repeat(50));
console.log('测试完成!');
