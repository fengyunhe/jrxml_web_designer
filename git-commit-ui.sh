#!/bin/bash

# 提交设计器UI优化成果

echo "=========================================="
echo "提交设计器UI优化成果"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 检查git状态
echo ""
echo "检查git状态..."
git status --short

# 提交通用属性组件
echo ""
echo "1. 提交通用属性组件..."
git add src/components/designer/properties/common/
git commit -m "feat: 添加通用属性编辑组件

- ExpressionEditor：表达式编辑器，支持帮助提示和常用表达式插入
- SwitchControl：美观的开关控件，支持标签和描述
- SelectControl：下拉选择控件，支持标签和描述

这些组件可复用，提高开发效率"
echo "✓ 已提交"

# 提交Frame属性面板
echo ""
echo "2. 提交Frame属性面板..."
git add src/components/designer/properties/FrameProperties.vue
git commit -m "feat: 添加Frame组件属性面板

支持的属性：
- layout：布局模式（FreeLayout/HorizontalLayout/VerticalLayout）
- printWhenExpression：条件打印表达式
- isIgnorePagination：忽略分页
- isSplitAllowed：允许分割
- splitType：分页类型（Stretch/Prevent/Immediate）
- isPrintRepeatedValues：打印重复值
- isRemoveLineWhenBlank：移除空白行
- backcolor：背景颜色
- mode：显示模式（Opaque/Transparent）"
echo "✓ 已提交"

# 提交优化方案文档
echo ""
echo "3. 提交优化方案文档..."
git add 设计器UI优化方案.md
git add 设计器UI优化进度.md
git commit -m "docs: 添加设计器UI优化方案和进度文档

- 详细记录优化计划和实施步骤
- 记录已完成功能和待完成功能
- 提供使用示例和验证方案"
echo "✓ 已提交"

# 显示提交历史
echo ""
echo "=========================================="
echo "提交历史"
echo "=========================================="
git log --oneline -5 | cat

echo ""
echo "=========================================="
echo "✅ 设计器UI优化成果已提交"
echo "=========================================="
echo ""
echo "核心成果："
echo "✅ 通用属性组件库（可复用）"
echo "✅ Frame组件属性面板（支持所有新属性）"
echo "✅ 优化方案文档（详细的实施计划）"
echo ""
echo "下一步工作："
echo "1. 集成Frame属性面板到主面板"
echo "2. 创建Table组件属性面板"
echo "3. 优化TextField组件属性面板"
echo "4. 优化基础组件属性面板"

exit 0
