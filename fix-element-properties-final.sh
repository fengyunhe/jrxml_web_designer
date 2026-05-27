#!/bin/bash

# 修复ElementProperties.vue文件
# 删除多余的表格属性代码

echo "=========================================="
echo "修复ElementProperties.vue文件"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 备份当前文件
echo ""
echo "1. 备份当前文件..."
cp src/components/designer/properties/ElementProperties.vue src/components/designer/properties/ElementProperties.vue.fix-backup
echo "✓ 已备份"

# 使用sed删除多余的代码
# 删除从第222行到第687行的代码
echo ""
echo "2. 删除多余的代码..."
sed -i '' '222,687d' src/components/designer/properties/ElementProperties.vue
echo "✓ 已删除多余代码"

# 检查文件状态
echo ""
echo "3. 检查文件状态..."
LINE_COUNT=$(wc -l < src/components/designer/properties/ElementProperties.vue)
echo "文件行数: $LINE_COUNT"

# 检查关键标签
echo ""
echo "4. 检查关键标签..."
if grep -q "<n-tabs" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ n-tabs标签存在"
else
    echo "❌ n-tabs标签不存在"
fi

if grep -q "</n-tabs>" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ n-tabs闭合标签存在"
else
    echo "❌ n-tabs闭合标签不存在"
fi

if grep -q "FrameProperties" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ FrameProperties组件存在"
else
    echo "❌ FrameProperties组件不存在"
fi

if grep -q "TableProperties" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ TableProperties组件存在"
else
    echo "❌ TableProperties组件不存在"
fi

echo ""
echo "=========================================="
echo "✅ 修复完成"
echo "=========================================="
echo ""
echo "请刷新页面查看是否还有错误"

exit 0
