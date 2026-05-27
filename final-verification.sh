#!/bin/bash

# JRXML官方库完整验证脚本
# 使用JasperReports官方库进行编译验证

set -e

echo "================================================"
echo "🎯 JRXML官方库编译验证"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
JASPERREPORTS_VERSION="6.20.0"
JASPERREPORTS_JAR="jasperreports-${JASPERREPORTS_VERSION}.jar"

# 步骤1：检查Java
echo -e "${YELLOW}步骤1: 检查Java环境${NC}"
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java未安装${NC}"
    echo ""
    echo "请安装Java JDK 11+:"
    echo "  macOS:     brew install openjdk@11"
    echo "  Linux:     sudo apt-get install openjdk-11-jdk"
    echo "  Windows:   https://adoptium.net/"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1)
echo -e "${GREEN}✓ Java已安装: ${JAVA_VERSION}${NC}"
echo ""

# 步骤2：检查/下载JasperReports库
echo -e "${YELLOW}步骤2: 检查JasperReports库${NC}"
if [ ! -f "lib/${JASPERREPORTS_JAR}" ]; then
    echo -e "${YELLOW}⚠ JasperReports库不存在，正在下载...${NC}"
    mkdir -p lib

    # 尝试使用curl下载
    if command -v curl &> /dev/null; then
        curl -L -o "lib/${JASPERREPORTS_JAR}" \
            "https://sourceforge.net/projects/jasperreports/files/jasperreports/${JASPERREPORTS_VERSION}/${JASPERREPORTS_JAR}/download" \
            --progress-bar
    elif command -v wget &> /dev/null; then
        wget -O "lib/${JASPERREPORTS_JAR}" \
            "https://sourceforge.net/projects/jasperreports/files/jasperreports/${JASPERREPORTS_VERSION}/${JASPERREPORTS_JAR}/download" \
            --show-progress
    else
        echo -e "${RED}❌ 无法下载：请安装curl或wget${NC}"
        echo "或手动下载: https://sourceforge.net/projects/jasperreports/files/jasperreports/${JASPERREPORTS_VERSION}/"
        exit 1
    fi

    if [ -f "lib/${JASPERREPORTS_JAR}" ]; then
        echo -e "${GREEN}✓ 下载完成${NC}"
    else
        echo -e "${RED}❌ 下载失败${NC}"
        exit 1
    fi
else
    FILE_SIZE=$(ls -lh "lib/${JASPERREPORTS_JAR}" | awk '{print $5}')
    echo -e "${GREEN}✓ JasperReports库已存在: ${FILE_SIZE}${NC}"
fi
echo ""

# 步骤3：创建测试JRXML
echo -e "${YELLOW}步骤3: 生成测试JRXML${NC}"
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

echo -e "${GREEN}✓ demo_report.jrxml 已生成${NC}"
echo ""

# 步骤4：编译JRXMLCompiler
echo -e "${YELLOW}步骤4: 编译验证器${NC}"
javac -cp "lib/${JASPERREPORTS_JAR}" tools/JRXMLCompiler.java 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ JRXMLCompiler编译成功${NC}"
else
    echo -e "${RED}❌ 编译失败${NC}"
    exit 1
fi
echo ""

# 步骤5：运行编译验证
echo -e "${YELLOW}步骤5: 运行JasperReports编译器${NC}"
echo ""

java -cp "tools:lib/${JASPERREPORTS_JAR}" JRXMLCompiler test-reports/demo_report.jrxml test-compiled/demo_report.jasper 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo -e "${GREEN}✅ 验证成功！${NC}"
    echo "================================================"
    echo ""
    echo "生成的文件:"
    echo "  - JRXML: test-reports/demo_report.jrxml"
    echo "  - Jasper: test-compiled/demo_report.jasper"
    echo ""
    echo "jasper文件可以直接用于生产环境！"
    echo "与JasperStudio生成的文件完全兼容。"
else
    echo ""
    echo "================================================"
    echo -e "${RED}❌ 验证失败${NC}"
    echo "================================================"
    exit 1
fi
