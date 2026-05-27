#!/bin/bash

# JRXML编译验证脚本（使用JasperReports官方库）
# 自动下载JasperReports库并验证JRXML能否成功编译

set -e

# 配置
JASPERREPORTS_VERSION="6.20.0"
JASPERREPORTS_JAR="jasperreports-${JASPERREPORTS_VERSION}.jar"
JASPERREPORTS_URL="https://sourceforge.net/projects/jasperreports/files/jasperreports/${JASPERREPORTS_VERSION}/${JASPERREPORTS_JAR}/download"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/../lib"
TEST_DIR="${SCRIPT_DIR}/../test-reports"
OUTPUT_DIR="${SCRIPT_DIR}/../test-compiled"

# 创建目录
mkdir -p "$LIB_DIR"
mkdir -p "$TEST_DIR"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}JRXML编译验证工具（使用JasperReports官方库）${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# 检查Java是否安装
echo -e "${YELLOW}步骤1: 检查Java环境${NC}"
if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java未安装${NC}"
    echo "请先安装Java JDK 8+"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d '"' -f 2)
echo -e "${GREEN}✓ Java已安装: ${JAVA_VERSION}${NC}"
echo ""

# 检查JasperReports库
echo -e "${YELLOW}步骤2: 检查JasperReports库${NC}"
if [ -f "$LIB_DIR/$JASPERREPORTS_JAR" ]; then
    echo -e "${GREEN}✓ JasperReports库已存在: ${LIB_DIR}/${JASPERREPORTS_JAR}${NC}"
else
    echo -e "${YELLOW}正在下载JasperReports ${JASPERREPORTS_VERSION}...${NC}"
    echo "下载地址: $JASPERREPORTS_URL"

    # 使用wget或curl下载
    if command -v wget &> /dev/null; then
        wget -O "$LIB_DIR/$JASPERREPORTS_JAR" "$JASPERREPORTS_URL"
    elif command -v curl &> /dev/null; then
        curl -L -o "$LIB_DIR/$JASPERREPORTS_JAR" "$JASPERREPORTS_URL"
    else
        echo -e "${RED}✗ 无法下载：请安装wget或curl${NC}"
        exit 1
    fi

    if [ -f "$LIB_DIR/$JASPERREPORTS_JAR" ]; then
        echo -e "${GREEN}✓ JasperReports库下载完成${NC}"
    else
        echo -e "${RED}✗ 下载失败${NC}"
        exit 1
    fi
fi
echo ""

# 编译JRXMLCompiler.java
echo -e "${YELLOW}步骤3: 编译JRXMLCompiler${NC}"
javac -cp "$LIB_DIR/$JASPERREPORTS_JAR" "$SCRIPT_DIR/JRXMLCompiler.java" 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ JRXMLCompiler编译成功${NC}"
else
    echo -e "${RED}✗ 编译失败${NC}"
    exit 1
fi
echo ""

# 生成测试用例
echo -e "${YELLOW}步骤4: 生成测试用例${NC}"
cat > "$TEST_DIR/test_textfield.jrxml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestTextField"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-textfield-001">

    <field name="fieldName" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField isBlankWhenNull="true">
                <reportElement x="0" y="0" width="200" height="20" uuid="text-001"/>
                <textElement textAlignment="Left" verticalAlignment="Top">
                    <font fontName="SansSerif" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{fieldName}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF

cat > "$TEST_DIR/test_textfield_styled.jrxml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestTextFieldStyled"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-textfield-styled-001">

    <field name="amount" class="java.math.BigDecimal"/>

    <style name="AmountStyle" mode="Opaque" backcolor="#FFFFFF" forecolor="#000000">
        <box>
            <pen lineWidth="0.5" lineColor="#000000"/>
            <topPen lineWidth="0.5" lineColor="#000000"/>
            <leftPen lineWidth="0.5" lineColor="#000000"/>
            <bottomPen lineWidth="0.5" lineColor="#000000"/>
            <rightPen lineWidth="0.5" lineColor="#000000"/>
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
            <font fontName="Arial" size="10"/>
        </textElement>
    </style>

    <detail>
        <band height="30">
            <textField pattern="#,##0.00" isBlankWhenNull="true" style="AmountStyle">
                <reportElement x="0" y="0" width="150" height="20" uuid="text-001"/>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF

cat > "$TEST_DIR/test_statictext.jrxml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestStaticText"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-statictext-001">

    <title>
        <band height="50">
            <staticText>
                <reportElement x="0" y="0" width="200" height="30" uuid="text-001"/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="16" isBold="true"/>
                </textElement>
                <text><![CDATA[报表标题]]></text>
            </staticText>
        </band>
    </title>
</jasperReport>
EOF

cat > "$TEST_DIR/test_image.jrxml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestImage"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-image-001">

    <title>
        <band height="100">
            <image hAlign="Center" vAlign="Middle">
                <reportElement x="0" y="0" width="100" height="100" uuid="img-001"/>
                <imageExpression><![CDATA["https://example.com/logo.png"]]>
                </imageExpression>
            </image>
        </band>
    </title>
</jasperReport>
EOF

cat > "$TEST_DIR/test_rectangle.jrxml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestRectangle"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-rectangle-001">

    <detail>
        <band height="50">
            <rectangle>
                <reportElement x="0" y="0" width="200" height="50" uuid="rect-001"/>
                <graphicElement>
                    <pen lineWidth="1.0"/>
                </graphicElement>
            </rectangle>
        </band>
    </detail>
</jasperReport>
EOF

cat > "$TEST_DIR/test_textfield_box.jrxml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
    http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
    name="TestTextFieldBox"
    pageWidth="595"
    pageHeight="842"
    columnWidth="555"
    leftMargin="20"
    rightMargin="20"
    topMargin="20"
    bottomMargin="20"
    uuid="test-textfield-box-001">

    <field name="data" class="java.lang.String"/>

    <detail>
        <band height="30">
            <textField>
                <reportElement x="0" y="0" width="200" height="20" uuid="text-001"/>
                <box>
                    <pen lineWidth="1.0" lineColor="#000000"/>
                    <topPen lineWidth="1.0" lineColor="#000000"/>
                    <leftPen lineWidth="1.0" lineColor="#000000"/>
                    <bottomPen lineWidth="1.0" lineColor="#000000"/>
                    <rightPen lineWidth="1.0" lineColor="#000000"/>
                    <topPadding leftPadding="5"/>
                    <leftPadding leftPadding="5"/>
                </box>
                <textElement textAlignment="Left" verticalAlignment="Middle">
                    <font fontName="Arial" size="10"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{data}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF

echo -e "${GREEN}✓ 测试用例已生成到: ${TEST_DIR}${NC}"
echo ""

# 运行编译验证
echo -e "${YELLOW}步骤5: 运行编译验证${NC}"
echo ""

PASSED=0
FAILED=0
TOTAL=0

for test_file in "$TEST_DIR"/*.jrxml; do
    if [ -f "$test_file" ]; then
        TOTAL=$((TOTAL + 1))
        filename=$(basename "$test_file")
        output_file="$OUTPUT_DIR/${filename%.jrxml}.jasper"

        echo -e "${BLUE}测试 $TOTAL: $filename${NC}"

        # 运行Java编译器
        java -cp "$SCRIPT_DIR:$LIB_DIR/$JASPERREPORTS_JAR" JRXMLCompiler "$test_file" "$output_file" 2>&1

        if [ $? -eq 0 ]; then
            PASSED=$((PASSED + 1))
            echo -e "${GREEN}✓ 编译成功${NC}"
        else
            FAILED=$((FAILED + 1))
            echo -e "${RED}✗ 编译失败${NC}"
        fi
        echo ""
    fi
done

# 输出结果总结
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}测试结果总结${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！JRXML可以被JasperReports成功编译${NC}"
    exit 0
else
    echo -e "${RED}❌ 存在失败的测试，请检查JRXML格式${NC}"
    exit 1
fi
