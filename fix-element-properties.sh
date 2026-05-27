#!/bin/bash

# 修复ElementProperties.vue文件

echo "=========================================="
echo "修复ElementProperties.vue文件"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 1. 恢复备份
echo ""
echo "1. 恢复备份..."
if [ -f "src/components/designer/properties/ElementProperties.vue.backup" ]; then
    cp src/components/designer/properties/ElementProperties.vue.backup src/components/designer/properties/ElementProperties.vue
    echo "✓ 已恢复备份"
else
    echo "❌ 备份文件不存在"
    exit 1
fi

# 2. 重新应用修改
echo ""
echo "2. 重新应用修改..."

# 添加FrameProperties导入
sed -i '' 's/import ElementTypeBasedSettings from '\''\.\/ElementTypeBasedSettings\.vue'\'';/import ElementTypeBasedSettings from '\''\.\/ElementTypeBasedSettings\.vue'\'';\nimport FrameProperties from '\''\.\/FrameProperties\.vue'\'';\nimport TableProperties from '\''\.\/TableProperties\.vue'\'';/' src/components/designer/properties/ElementProperties.vue

# 添加handleFramePropertyUpdate函数
sed -i '' 's/const showStyleManagerModal = ref(false);/const showStyleManagerModal = ref(false);\n\n\/\/ Frame属性更新处理\nconst handleFramePropertyUpdate = (updatedElement: any) => {\n  if (currentElement.value \&\& props.selectedElement) {\n    const band = props.bands[props.selectedElement.bandIndex];\n    if (band \&\& band.elements) {\n      if (props.selectedElement.parentFrameIndex !== undefined) {\n        const frame = band.elements[props.selectedElement.parentFrameIndex];\n        if (frame \&\& frame.type === '\''frame'\'' \&\& frame.elements) {\n          frame.elements[props.selectedElement.elementIndex] = updatedElement;\n        }\n      } else {\n        band.elements[props.selectedElement.elementIndex] = updatedElement;\n      }\n      emit('\''update:bands'\'', props.bands);\n      emit('\''update-jrxml'\'');\n    }\n  }\n};\n\n\/\/ Table属性更新处理\nconst handleTablePropertyUpdate = (updatedElement: any) => {\n  if (currentElement.value \&\& props.selectedElement) {\n    const band = props.bands[props.selectedElement.bandIndex];\n    if (band \&\& band.elements) {\n      if (props.selectedElement.parentFrameIndex !== undefined) {\n        const frame = band.elements[props.selectedElement.parentFrameIndex];\n        if (frame \&\& frame.type === '\''frame'\'' \&\& frame.elements) {\n          frame.elements[props.selectedElement.elementIndex] = updatedElement;\n        }\n      } else {\n        band.elements[props.selectedElement.elementIndex] = updatedElement;\n      }\n      emit('\''update:bands'\'', props.bands);\n      emit('\''update-jrxml'\'');\n    }\n  }\n};/' src/components/designer/properties/ElementProperties.vue

# 添加Frame属性标签页
sed -i '' 's/<\/n-tab-pane>\n        \n        <!-- 样式设置标签页 -->/<\/n-tab-pane>\n\n        <!-- Frame属性标签页 -->\n        <n-tab-pane v-if="currentElement \&\& currentElement.type === '\''frame'\''" name="frame" :tab="'\''Frame属性'\''">\n          <FrameProperties\n            :element="currentElement"\n            @update:element="handleFramePropertyUpdate"\n          />\n        <\/n-tab-pane>\n\n        <!-- 样式设置标签页 -->/' src/components/designer/properties/ElementProperties.vue

# 替换表格属性标签页
sed -i '' 's/<n-tab-pane v-if="currentElement \&\& currentElement.type === '\''table'\''" name="table" :tab="t('\''properties.tableProperties'\'')">/<n-tab-pane v-if="currentElement \&\& currentElement.type === '\''table'\''" name="table" :tab="t('\''properties.tableProperties'\'')">\n          <TableProperties\n            :element="currentElement"\n            :available-styles="reportStyles.map(s => s.name)"\n            @update:element="handleTablePropertyUpdate"\n          />/' src/components/designer/properties/ElementProperties.vue

echo "✓ 已应用修改"

# 3. 检查修改结果
echo ""
echo "3. 检查修改结果..."
if grep -q "FrameProperties" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ FrameProperties组件已导入"
else
    echo "❌ FrameProperties组件未导入"
fi

if grep -q "handleFramePropertyUpdate" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ handleFramePropertyUpdate函数已添加"
else
    echo "❌ handleFramePropertyUpdate函数未添加"
fi

if grep -q "Frame属性标签页" src/components/designer/properties/ElementProperties.vue; then
    echo "✓ Frame属性标签页已添加"
else
    echo "❌ Frame属性标签页未添加"
fi

echo ""
echo "=========================================="
echo "✅ 修复完成"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 测试Frame属性面板"
echo "2. 创建Table组件属性面板"
echo "3. 优化TextField组件属性面板"
echo "4. 优化基础组件属性面板"

exit 0
