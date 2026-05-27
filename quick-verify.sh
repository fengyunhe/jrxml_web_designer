#!/bin/bash

# 快速JRXML验证脚本
# 使用JasperReports官方库验证JRXML编译

set -e

echo "🎯 JRXML官方库验证"
echo "=================="

# 检查Java
if ! command -v java &> /dev/null; then
    echo "❌ Java未安装"
    echo "请运行: brew install openjdk@11 (macOS) 或 sudo apt-get install openjdk-11-jdk (Linux)"
    exit 1
fi

echo "✓ Java: $(java -version 2>&1 | head -n 1 | cut -d '"' -f 2)"

# 检查JasperReports
JASPERREPORTS_JAR="lib/jasperreports-6.20.0.jar"
if [ ! -f "$JASPERREPORTS_JAR" ]; then
    echo ""
    echo "⚠ JasperReports库不存在"
    echo "请下载: https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/"
    echo "保存到: $JASPERREPORTS_JAR"
    exit 1
fi

echo "✓ JasperReports: $(ls -lh $JASPERREPORTS_JAR | awk '{print $5}')"

# 创建输出目录
mkdir -p test-reports
mkdir -p test-compiled

# 生成测试JRXML
echo ""
echo "📝 生成测试JRXML..."
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
    <field name="amount" class="java.math.BigDecimal"/>

    <style name="TitleStyle" mode="Opaque" backcolor="#4472C4" forecolor="#FFFFFF">
        <textElement textAlignment="Center" verticalAlignment="Middle">
            <font fontName="Arial" size="18" isBold="true"/>
        </textElement>
    </style>

    <style name="AmountStyle" mode="Opaque" backcolor="#FFFFFF" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
            <font fontName="Arial" size="12"/>
        </textElement>
    </style>

    <title>
        <band height="60">
            <staticText style="TitleStyle">
                <reportElement x="0" y="0" width="555" height="60" uuid="title-001"/>
                <text><![CDATA[销售报表]]></text>
            </staticText>
        </band>
    </title>

    <columnHeader>
        <band height="30">
            <staticText>
                <reportElement x="0" y="0" width="200" height="30" uuid="col1-001" mode="Opaque" backcolor="#D9E2F3"/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="12" isBold="true"/>
                </textElement>
                <text><![CDATA[产品名称]]></text>
            </staticText>
            <staticText>
                <reportElement x="200" y="0" width="150" height="30" uuid="col2-001" mode="Opaque" backcolor="#D9E2F3"/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="12" isBold="true"/>
                </textElement>
                <text><![CDATA[金额]]></text>
            </staticText>
        </band>
    </columnHeader>

    <detail>
        <band height="30">
            <textField>
                <reportElement x="0" y="0" width="200" height="30" uuid="detail1-001"/>
                <box>
                    <pen lineWidth="0.5" lineColor="#000000"/>
                </box>
                <textElement textAlignment="Left" verticalAlignment="Middle">
                    <font fontName="Arial" size="11"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{productName}]]></textFieldExpression>
            </textField>
            <textField pattern="#,##0.00" style="AmountStyle">
                <reportElement x="200" y="0" width="150" height="30" uuid="detail2-001"/>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF
echo "✓ demo_report.jrxml 已生成"

# 运行Java编译器
echo ""
echo "🔨 运行JasperReports编译器..."
echo ""

# 编译JRXMLCompiler
javac -cp "$JASPERREPORTS_JAR" tools/JRXMLCompiler.java 2>&1

# 编译JRXML
java -cp "tools:$JASPERREPORTS_JAR" JRXMLCompiler test-reports/demo_report.jrxml test-compiled/demo_report.jasper 2>&1

echo ""
echo "=================="
echo "✅ 验证完成！"
echo "=================="
echo "输出文件: test-compiled/demo_report.jasper"
echo "该文件可以直接用于生产环境"
