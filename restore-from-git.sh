#!/bin/bash

# 从git恢复ElementProperties.vue文件

echo "=========================================="
echo "从git恢复ElementProperties.vue文件"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 1. 从git恢复文件
echo ""
echo "1. 从git恢复文件..."
git checkout src/components/designer/properties/ElementProperties.vue

if [ $? -eq 0 ]; then
    echo "✓ 已从git恢复"
else
    echo "❌ 恢复失败"
    exit 1
fi

# 2. 检查文件状态
echo ""
echo "2. 检查文件状态..."
if [ -f "src/components/designer/properties/ElementProperties.vue" ]; then
    echo "✓ 文件存在"
    wc -l src/components/designer/properties/ElementProperties.vue
else
    echo "❌ 文件不存在"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ 恢复完成"
echo "=========================================="
echo ""
echo "文件已恢复到git提交时的状态"
echo "现在可以重新应用修改"

exit 0
