#!/bin/bash

# 安装Playwright依赖

echo "=========================================="
echo "安装Playwright依赖"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 步骤1：安装playwright
echo ""
echo "步骤1: 安装playwright..."
npm install playwright

if [ $? -eq 0 ]; then
    echo "✓ playwright安装成功"
else
    echo "❌ playwright安装失败"
    exit 1
fi

# 步骤2：验证安装
echo ""
echo "步骤2: 验证安装..."
node -e "import('playwright').then(() => console.log('✓ playwright验证成功')).catch(err => console.log('❌ playwright验证失败:', err.message))"

# 步骤3：显示下一步
echo ""
echo "=========================================="
echo "✅ 安装完成"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 启动开发服务器: npm run dev"
echo "2. 运行Playwright测试: node test-designer-playwright.js"

exit 0
