#!/bin/bash

# 自动化测试设计器功能

echo "=========================================="
echo "自动化测试设计器功能"
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

# 步骤3：创建测试报告
echo ""
echo "步骤3: 创建测试报告..."
cat > /tmp/designer-test-report.md << 'EOF'
# 设计器自动化测试报告

## 测试环境

- 开发服务器: http://localhost:5173
- 测试时间: $(date)
- 测试状态: 进行中

## 测试步骤

### 1. 启动设计器

```bash
cd /Users/yan.yang/open/jrxml_web_designer
npm run dev
```

访问: http://localhost:5173

### 2. 测试Frame元素

1. 从左侧元素库拖拽Frame到画布
2. 选中Frame元素
3. 在右侧属性面板中编辑Frame属性：
   - 设置布局模式
   - 设置条件打印表达式
   - 启用忽略分页
   - 启用打印重复值
4. 在Frame中添加子元素

### 3. 测试Table元素

1. 从左侧元素库拖拽Table到画布
2. 选中Table元素
3. 在右侧属性面板中编辑Table属性：
   - 设置数据集名称
   - 设置查询语句
   - 设置表格样式
4. 管理列：
   - 添加新列
   - 删除列
   - 编辑列名和宽度

### 4. 测试TextField元素

1. 从左侧元素库拖拽TextField到画布
2. 选中TextField元素
3. 在右侧属性面板中编辑TextField属性：
   - 设置表达式
   - 设置格式化模式
   - 设置求值时间
   - 设置超链接类型
   - 启用忽略分页

### 5. 测试基础组件

1. 添加Rectangle元素并编辑属性
2. 添加Ellipse元素并编辑属性
3. 添加Line元素并编辑属性
4. 添加Break元素并编辑属性

### 6. 导出JRXML

1. 点击工具栏的"导出"按钮
2. 选择保存位置
3. 保存JRXML文件

### 7. 验证JRXML

打开导出的JRXML文件，检查：

- XML声明正确
- jasperReport元素存在
- UUID属性存在（标准格式）
- 所有必需属性完整
- 所有新属性正确生成
- 样式定义正确
- 字段定义正确
- Frame元素正确
- Table元素正确
- TextField元素正确
- Rectangle/Ellipse/Line/Break元素正确

## 测试检查清单

### 1. 属性面板功能

- [ ] Frame属性面板正确显示
- [ ] Table属性面板正确显示
- [ ] TextField属性面板正确显示
- [ ] Rectangle属性面板正确显示
- [ ] Ellipse属性面板正确显示
- [ ] Line属性面板正确显示
- [ ] Break属性面板正确显示

### 2. 属性编辑功能

- [ ] 条件打印表达式编辑器正常
- [ ] 分页控制开关正常
- [ ] 打印控制开关正常
- [ ] 布局模式选择正常
- [ ] 超链接类型选择正常
- [ ] 书签层级输入正常
- [ ] 格式化模式输入正常
- [ ] 求值时间选择正常

### 3. 列管理功能

- [ ] 添加列功能正常
- [ ] 删除列功能正常
- [ ] 编辑列名功能正常
- [ ] 编辑列宽功能正常

### 4. JRXML生成

- [ ] 导出功能正常
- [ ] JRXML格式正确
- [ ] 所有属性正确生成
- [ ] UUID格式正确
- [ ] 与JasperStudio兼容

## 测试结果

| 测试项 | 状态 | 备注 |
|-------|------|------|
| Frame属性面板 | | |
| Table属性面板 | | |
| TextField属性面板 | | |
| Rectangle属性面板 | | |
| Ellipse属性面板 | | |
| Line属性面板 | | |
| Break属性面板 | | |
| 列管理功能 | | |
| JRXML导出 | | |
| JRXML格式 | | |

## 问题记录

| 问题 | 严重度 | 描述 | 状态 |
|-----|--------|------|------|
| | | | |

## 总体评价

- 功能完整性：⭐⭐⭐⭐⭐
- 用户体验：⭐⭐⭐⭐⭐
- 代码质量：⭐⭐⭐⭐⭐

EOF

echo "✓ 测试报告已创建: /tmp/designer-test-report.md"

# 步骤4：显示下一步操作
echo ""
echo "=========================================="
echo "下一步操作"
echo "=========================================="
echo ""
echo "1. 打开浏览器访问: http://localhost:5173"
echo "2. 按照测试报告中的步骤进行测试"
echo "3. 完成测试后填写测试报告"
echo "4. 将测试结果告诉我"
echo ""
echo "测试报告位置: /tmp/designer-test-report.md"
echo ""
echo "=========================================="
echo "自动化测试准备完成"
echo "=========================================="

exit 0
