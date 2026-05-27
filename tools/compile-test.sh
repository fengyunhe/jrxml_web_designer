#!/bin/bash

# JRXML编译验证脚本
# 验证生成的JRXML能否成功编译成jasper文件

set -e

REPORT_DIR="/Users/yan.yang/open/jrxml_web_designer/test-reports"
OUTPUT_DIR="/Users/yan.yang/open/jrxml_web_designer/test-compiled"
JASPERREPORT_JAR="jasperreports-6.20.0.jar"

# 创建测试目录
mkdir -p "$REPORT_DIR"
mkdir -p "$OUTPUT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试用例1：基础TextField
cat > "$REPORT_DIR/test_textfield.jrxml" << 'EOF'
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
                <reportElement x="0" y="0" width="200" height="20" uuid="..."/>
                <textElement textAlignment="Left" verticalAlignment="Top">
                    <font fontName="SansSerif" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{fieldName}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF

# 测试用例2：带样式的TextField
cat > "$REPORT_DIR/test_textfield_styled.jrxml" << 'EOF'
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
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
            <font fontName="Arial" size="10"/>
        </textElement>
    </style>

    <detail>
        <band height="30">
            <textField pattern="#,##0.00" isBlankWhenNull="true" style="AmountStyle">
                <reportElement x="0" y="0" width="150" height="20" uuid="..."/>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
</jasperReport>
EOF

# 测试用例3：StaticText
cat > "$REPORT_DIR/test_statictext.jrxml" << 'EOF'
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
                <reportElement x="0" y="0" width="200" height="30" uuid="..."/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font fontName="Arial" size="16" isBold="true"/>
                </textElement>
                <text><![CDATA[报表标题]]></text>
            </staticText>
        </band>
    </title>

    <detail>
        <band height="30">
            <staticText>
                <reportElement x="0" y="0" width="200" height="20" uuid="..."/>
                <textElement textAlignment="Left" verticalAlignment="Top">
                    <font fontName="SansSerif" size="12" isItalic="true"/>
                </textElement>
                <text><![CDATA[静态文本示例]]></text>
            </staticText>
        </band>
    </detail>
</jasperReport>
EOF

# 测试用例4：Image
cat > "$REPORT_DIR/test_image.jrxml" << 'EOF'
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
            <image>
                <reportElement x="0" y="0" width="100" height="100" uuid="..."/>
                <imageExpression><![CDATA["https://example.com/logo.png"]]>
                </imageExpression>
            </image>
        </band>
    </title>
</jasperReport>
EOF

# 测试用例5：Rectangle
cat > "$REPORT_DIR/test_rectangle.jrxml" << 'EOF'
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
                <reportElement x="0" y="0" width="200" height="50" uuid="..."/>
                <graphicElement>
                    <pen lineWidth="1.0"/>
                </graphicElement>
            </rectangle>
        </band>
    </detail>
</jasperReport>
EOF

# 测试用例6：带Box的TextField（边框样式）
cat > "$REPORT_DIR/test_textfield_box.jrxml" << 'EOF'
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
                <reportElement x="0" y="0" width="200" height="20" uuid="..."/>
                <box>
                    <pen lineWidth="1.0" lineColor="#000000"/>
                    <topPen lineWidth="1.0"/>
                    <leftPen lineWidth="1.0"/>
                    <bottomPen lineWidth="1.0"/>
                    <rightPen lineWidth="1.0"/>
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

echo -e "${GREEN}✓ 测试用例已生成${NC}"
