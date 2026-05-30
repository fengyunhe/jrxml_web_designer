#!/bin/bash

# 运行Playwright自动化测试

echo "=========================================="
echo "运行Playwright自动化测试"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 步骤1：启动开发服务器
echo ""
echo "步骤1: 启动开发服务器..."
npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!
echo "开发服务器PID: $DEV_PID"

# 等待服务器启动
echo "等待服务器启动..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✓ 开发服务器已启动"
        break
    fi
    sleep 1
done

# 步骤2：检查服务器状态
echo ""
echo "步骤2: 检查服务器状态..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✓ 服务器运行正常"
    echo "访问地址: http://localhost:5173"
else
    echo "❌ 服务器启动失败"
    exit 1
fi

# 步骤3：运行Playwright测试
echo ""
echo "步骤3: 运行Playwright测试..."
node test-designer-playwright.js

# 步骤4：停止开发服务器
echo ""
echo "步骤4: 停止开发服务器..."
kill $DEV_PID 2>/dev/null
echo "✓ 开发服务器已停止"

# 步骤5：显示测试结果
echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "测试结果:"
echo "  截图: /tmp/designer-test-screenshot.png"
echo "  报告: /tmp/designer-test-report.md"
echo ""
echo "请查看截图和报告确认测试结果"

exit 0
