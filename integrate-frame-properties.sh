#!/bin/bash

# 集成Frame属性面板到主面板

echo "=========================================="
echo "集成Frame属性面板到主面板"
echo "=========================================="

cd /Users/yan.yang/open/jrxml_web_designer

# 备份原文件
echo ""
echo "1. 备份原文件..."
cp src/components/designer/properties/ElementProperties.vue src/components/designer/properties/ElementProperties.vue.backup
echo "✓ 已备份"

# 创建修改后的文件
echo ""
echo "2. 创建修改后的文件..."

# 在template部分添加Frame属性标签页
# 在表格属性标签页之后添加

# 创建修改脚本
cat > /tmp/modify-element-properties.py << 'EOF'
import re

# 读取原文件
with open('src/components/designer/properties/ElementProperties.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 在表格属性标签页之后添加Frame属性标签页
# 找到表格属性标签页的结束位置
table_tab_pattern = r'(<!-- 表格属性标签页 -->.*?</n-tab-pane>)'
table_tab_match = re.search(table_tab_pattern, content, re.DOTALL)

if table_tab_match:
    table_tab_end = table_tab_match.end()

    # Frame属性标签页内容
    frame_tab = '''
        <!-- Frame属性标签页 -->
        <n-tab-pane v-if="currentElement && currentElement.type === 'frame'" name="frame" :tab="'Frame属性'">
          <FrameProperties
            :element="currentElement"
            @update:element="handleFramePropertyUpdate"
          />
        </n-tab-pane>'''

    # 在表格属性标签页之后插入Frame属性标签页
    content = content[:table_tab_end] + frame_tab + content[table_tab_end:]

# 在script部分添加FrameProperties导入
import_pattern = r'(import ElementTypeBasedSettings from \'./ElementTypeBasedSettings.vue\';)'
import_replacement = r'''import ElementTypeBasedSettings from './ElementTypeBasedSettings.vue';
import FrameProperties from './FrameProperties.vue';'''

content = re.sub(import_pattern, import_replacement, content)

# 在script部分添加handleFramePropertyUpdate函数
# 找到合适的位置添加函数
function_pattern = r'(const showStyleManagerModal = ref\(false\);)'
function_replacement = r'''const showStyleManagerModal = ref(false);

// Frame属性更新处理
const handleFramePropertyUpdate = (updatedElement: any) => {
  if (currentElement.value && props.selectedElement) {
    const band = props.bands[props.selectedElement.bandIndex];
    if (band && band.elements) {
      if (props.selectedElement.parentFrameIndex !== undefined) {
        const frame = band.elements[props.selectedElement.parentFrameIndex];
        if (frame && frame.type === 'frame' && frame.elements) {
          frame.elements[props.selectedElement.elementIndex] = updatedElement;
        }
      } else {
        band.elements[props.selectedElement.elementIndex] = updatedElement;
      }
      emit('update:bands', props.bands);
      emit('update-jrxml');
    }
  }
};'''

content = re.sub(function_pattern, function_replacement, content)

# 写入修改后的文件
with open('src/components/designer/properties/ElementProperties.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ 文件已修改")
EOF

# 运行修改脚本
python3 /tmp/modify-element-properties.py

if [ $? -eq 0 ]; then
    echo "✓ Frame属性标签页已添加"
else
    echo "❌ 修改失败，恢复备份"
    cp src/components/designer/properties/ElementProperties.vue.backup src/components/designer/properties/ElementProperties.vue
    exit 1
fi

# 检查修改结果
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
echo "✅ Frame属性面板集成完成"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 测试Frame属性面板"
echo "2. 创建Table组件属性面板"
echo "3. 优化TextField组件属性面板"
echo "4. 优化基础组件属性面板"

exit 0
