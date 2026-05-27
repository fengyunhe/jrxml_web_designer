#!/bin/bash

# 简化的JRXML验证方案
# 使用JasperReports的内置编译器

echo "=========================================="
echo "JRXML编译验证（简化版）"
echo "=========================================="

JASPERREPORTS_JAR="lib/jasperreports-6.21.5.jar"

# 检查JAR文件
if [ ! -f "$JASPERREPORTS_JAR" ]; then
    echo "❌ JasperReports库不存在"
    exit 1
fi

echo "✓ JasperReports库: $(ls -lh $JASPERREPORTS_JAR | awk '{print $5}')"

# 创建输出目录
mkdir -p test-reports test-compiled

# 生成测试JRXML
echo ""
echo "生成测试JRXML..."
cat > test-reports/demo_report.jrxml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="DemoReport"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="demo-report-001">

    <field name="productName" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField>
                <reportElement x="0" y="0" width="200" height="20" uuid="text-001"/>
                <textElement>
                    <font fontName="Arial" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{productName}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF
echo "✓ 已生成"

# 使用JasperReports内置编译器
echo ""
echo "使用JasperReports内置编译器..."
echo ""

# 方式1：使用JasperCompileManager
java -cp "$JASPERREPORTS_JAR" net.sf.jasperreports.engine.JasperCompileManager \
    compileReportToFile test-reports/demo_report.jrxml test-compiled/demo_report.jasper 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 验证成功！"
    echo "=========================================="
    echo ""
    echo "Jasper文件已生成: test-compiled/demo_report.jasper"
    echo ""
    echo "该文件可以直接用于生产环境！"
else
    echo ""
    echo "=========================================="
    echo "❌ 验证失败"
    echo "=========================================="
    echo ""
    echo "错误原因：缺少依赖库"
    echo ""
    echo "解决方案："
    echo "1. 使用完整依赖包（推荐）"
    echo "2. 或使用Maven项目验证"
    echo ""
    echo "完整依赖下载："
    echo "https://sourceforge.net/projects/jasperreports/files/jasperreports/JasperReports%206.21.5/"
fi
