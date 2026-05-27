#!/bin/bash

# 使用JasperReports 6.21.5进行编译验证

echo "=========================================="
echo "🎯 JRXML编译验证（JasperReports 6.21.5）"
echo "=========================================="

# 配置
JASPERREPORTS_VERSION="6.21.5"
JASPERREPORTS_JAR="jasperreports-${JASPERREPORTS_VERSION}.jar"
DOWNLOAD_URL="https://sourceforge.net/projects/jasperreports/files/jasperreports/JasperReports%206.21.5/jasperreports-${JASPERREPORTS_VERSION}.jar/download"

# 删除旧版本
echo "1. 清理旧版本..."
rm -f lib/jasperreports-6.20.0.jar
echo "✓ 已清理"

# 检查Java
echo ""
echo "2. 检查Java环境..."
if ! command -v java &> /dev/null; then
    echo "❌ Java未安装"
    echo "请运行: brew install openjdk@11 (macOS) 或 sudo apt-get install openjdk-11-jdk (Linux)"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d '"' -f 2)
echo "✓ Java: ${JAVA_VERSION}"

# 下载JasperReports 6.21.5
echo ""
echo "3. 下载JasperReports ${JASPERREPORTS_VERSION}..."
if [ ! -f "lib/${JASPERREPORTS_JAR}" ]; then
    mkdir -p lib

    echo "下载地址: ${DOWNLOAD_URL}"
    echo ""

    if command -v curl &> /dev/null; then
        echo "使用curl下载..."
        curl -L -o "lib/${JASPERREPORTS_JAR}" "${DOWNLOAD_URL}" \
            --retry 3 \
            --retry-delay 5 \
            --progress-bar
    elif command -v wget &> /dev/null; then
        echo "使用wget下载..."
        wget -O "lib/${JASPERREPORTS_JAR}" "${DOWNLOAD_URL}" \
            --tries=3 \
            --show-progress
    else
        echo "❌ 请安装curl或wget"
        exit 1
    fi
else
    echo "✓ 文件已存在"
fi

# 验证文件
echo ""
echo "4. 验证JAR文件..."
if [ -f "lib/${JASPERREPORTS_JAR}" ]; then
    FILE_SIZE=$(ls -lh "lib/${JASPERREPORTS_JAR}" | awk '{print $5}')
    echo "✓ 文件大小: ${FILE_SIZE}"

    # 验证JAR完整性
    jar tf "lib/${JASPERREPORTS_JAR}" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ JAR文件完整"
    else
        echo "❌ JAR文件损坏，请重新下载"
        rm -f "lib/${JASPERREPORTS_JAR}"
        exit 1
    fi
else
    echo "❌ 文件不存在"
    exit 1
fi

# 编译验证器
echo ""
echo "5. 编译验证器..."
javac -cp "lib/${JASPERREPORTS_JAR}" tools/JRXMLCompiler.java 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 编译成功"
else
    echo "❌ 编译失败"
    exit 1
fi

# 生成测试JRXML
echo ""
echo "6. 生成测试JRXML..."
mkdir -p test-reports test-compiled

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
    <field name="quantity" class="java.lang.Integer"/>

    <style name="TitleStyle" mode="Opaque" backcolor="#4472C4" forecolor="#FFFFFF">
        <textElement textAlignment="Center" verticalAlignment="Middle">
            <font fontName="Arial" size="18" isBold="true"/>
        </textElement>
    </style>

    <style name="HeaderStyle" mode="Opaque" backcolor="#D9E2F3" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Center" verticalAlignment="Middle">
            <font fontName="Arial" size="12" isBold="true"/>
        </textElement>
    </style>

    <style name="DataStyle" mode="Opaque" backcolor="#FFFFFF" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Left" verticalAlignment="Middle">
            <font fontName="Arial" size="11"/>
        </textElement>
    </style>

    <style name="AmountStyle" mode="Opaque" backcolor="#FFFFFF" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
            <font fontName="Arial" size="11"/>
        </textElement>
    </style>

    <title>
        <band height="60">
            <staticText style="TitleStyle">
                <reportElement x="0" y="0" width="555" height="60" uuid="title-001"/>
                <text><![CDATA[销售报表演示]]></text>
            </staticText>
        </band>
    </title>

    <columnHeader>
        <band height="35">
            <staticText style="HeaderStyle">
                <reportElement x="0" y="0" width="200" height="35" uuid="col1-001"/>
                <text><![CDATA[产品名称]]></text>
            </staticText>
            <staticText style="HeaderStyle">
                <reportElement x="200" y="0" width="100" height="35" uuid="col2-001"/>
                <text><![CDATA[数量]]></text>
            </staticText>
            <staticText style="HeaderStyle">
                <reportElement x="300" y="0" width="120" height="35" uuid="col3-001"/>
                <text><![CDATA[单价]]></text>
            </staticText>
            <staticText style="HeaderStyle">
                <reportElement x="420" y="0" width="135" height="35" uuid="col4-001"/>
                <text><![CDATA[小计]]></text>
            </staticText>
        </band>
    </columnHeader>

    <detail>
        <band height="30">
            <textField style="DataStyle">
                <reportElement x="0" y="0" width="200" height="30" uuid="detail1-001"/>
                <textFieldExpression><![CDATA[$F{productName}]]></textFieldExpression>
            </textField>
            <textField style="DataStyle">
                <reportElement x="200" y="0" width="100" height="30" uuid="detail2-001"/>
                <textFieldExpression><![CDATA[$F{quantity}]]></textFieldExpression>
            </textField>
            <textField pattern="#,##0.00" style="AmountStyle">
                <reportElement x="300" y="0" width="120" height="30" uuid="detail3-001"/>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
            <textField pattern="#,##0.00" style="AmountStyle">
                <reportElement x="420" y="0" width="135" height="30" uuid="detail4-001"/>
                <textFieldExpression><![CDATA[$F{amount}.multiply(new java.math.BigDecimal($F{quantity}))]]></textFieldExpression>
            </textField>
        </band>
    </detail>

    <pageFooter>
        <band height="30">
            <textField>
                <reportElement x="0" y="0" width="555" height="30" uuid="footer-001"/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="10"/>
                </textElement>
                <textFieldExpression><![CDATA["第 " + $V{PAGE_NUMBER} + " 页"]]></textFieldExpression>
            </textField>
        </band>
    </pageFooter>
</jasperReport>
EOF
echo "✓ 已生成"

# 运行编译验证
echo ""
echo "7. 运行JasperReports ${JASPERREPORTS_VERSION} 编译器..."
echo ""

java -cp "tools:lib/${JASPERREPORTS_JAR}" JRXMLCompiler test-reports/demo_report.jrxml test-compiled/demo_report.jasper 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 验证成功！"
    echo "=========================================="
    echo ""
    echo "JasperReports版本: ${JASPERREPORTS_VERSION}"
    echo "测试JRXML: test-reports/demo_report.jrxml"
    echo "生成Jasper: test-compiled/demo_report.jasper"
    echo ""
    echo "jasper文件可以直接用于生产环境！"
else
    echo ""
    echo "=========================================="
    echo "❌ 验证失败"
    echo "=========================================="
    exit 1
fi
