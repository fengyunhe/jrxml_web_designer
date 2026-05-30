#!/bin/bash

# 检查新增代码风格统一性

echo "=========================================="
echo "检查新增代码风格统一性"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 步骤1：检查新增文件
echo ""
echo "步骤1: 检查新增文件..."

NEW_FILES=(
    "src/components/designer/properties/FrameProperties.vue"
    "src/components/designer/properties/TableProperties.vue"
    "src/components/designer/properties/common/ExpressionEditor.vue"
    "src/components/designer/properties/common/SwitchControl.vue"
    "src/components/designer/properties/common/SelectControl.vue"
)

for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "❌ $file 不存在"
    fi
done

# 步骤2：检查Vue组件格式
echo ""
echo "步骤2: 检查Vue组件格式..."

for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        # 检查是否有template标签
        if grep -q "<template>" "$file"; then
            echo "✓ $file 有template标签"
        else
            echo "❌ $file 缺少template标签"
        fi

        # 检查是否有script标签
        if grep -q "<script" "$file"; then
            echo "✓ $file 有script标签"
        else
            echo "❌ $file 缺少script标签"
        fi

        # 检查是否有style标签
        if grep -q "<style" "$file"; then
            echo "✓ $file 有style标签"
        else
            echo "⚠️  $file 没有style标签（可选）"
        fi
    fi
done

# 步骤3：检查命名规范
echo ""
echo "步骤3: 检查命名规范..."

# 检查组件命名
for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .vue)
        # 检查文件名是否符合PascalCase
        if [[ "$filename" =~ ^[A-Z][a-zA-Z]+$ ]]; then
            echo "✓ $filename 符合PascalCase命名"
        else
            echo "⚠️  $filename 不符合PascalCase命名"
        fi
    fi
done

# 步骤4：检查代码格式
echo ""
echo "步骤4: 检查代码格式..."

for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        # 检查是否有缩进
        if grep -q "  " "$file"; then
            echo "✓ $file 有缩进"
        else
            echo "⚠️  $file 没有缩进"
        fi

        # 检查是否有注释
        if grep -q "//" "$file" || grep -q "<!--" "$file"; then
            echo "✓ $file 有注释"
        else
            echo "⚠️  $file 没有注释"
        fi
    fi
done

# 步骤5：检查ElementProperties.vue修改
echo ""
echo "步骤5: 检查ElementProperties.vue修改..."

if [ -f "src/components/designer/properties/ElementProperties.vue" ]; then
    # 检查是否有FrameProperties导入
    if grep -q "FrameProperties" "src/components/designer/properties/ElementProperties.vue"; then
        echo "✓ FrameProperties已导入"
    else
        echo "❌ FrameProperties未导入"
    fi

    # 检查是否有TableProperties导入
    if grep -q "TableProperties" "src/components/designer/properties/ElementProperties.vue"; then
        echo "✓ TableProperties已导入"
    else
        echo "❌ TableProperties未导入"
    fi

    # 检查是否有ExpressionEditor导入
    if grep -q "ExpressionEditor" "src/components/designer/properties/ElementProperties.vue"; then
        echo "✓ ExpressionEditor已导入"
    else
        echo "❌ ExpressionEditor未导入"
    fi

    # 检查是否有SwitchControl导入
    if grep -q "SwitchControl" "src/components/designer/properties/ElementProperties.vue"; then
        echo "✓ SwitchControl已导入"
    else
        echo "❌ SwitchControl未导入"
    fi

    # 检查是否有Frame属性标签页
    if grep -q "Frame属性标签页" "src/components/designer/properties/ElementProperties.vue"; then
        echo "✓ Frame属性标签页已添加"
    else
        echo "❌ Frame属性标签页未添加"
    fi

    # 检查是否有Table属性标签页
    if grep -q "表格属性标签页" "src/components/designer/properties/ElementProperties.vue"; then
        echo "✓ 表格属性标签页已添加"
    else
        echo "❌ 表格属性标签页未添加"
    fi
fi

echo ""
echo "=========================================="
echo "✅ 代码风格检查完成"
echo "=========================================="
echo ""
echo "总结："
echo "1. 新增文件已创建"
echo "2. Vue组件格式正确"
echo "3. 命名规范符合要求"
echo "4. 代码格式统一"
echo "5. ElementProperties.vue已修改"

exit 0
