#!/bin/bash

# JRXML属性验证编译测试
# 使用本地JasperReports 6.21.5库验证每个属性是否被允许

set -e

JASPERREPORT_JAR="/Users/yan.yang/open/jrxml_web_designer/lib/jasperreports-6.21.5.jar"
TEST_DIR="/Users/yan.yang/open/jrxml_web_designer/test-attribute-validation"
OUTPUT_DIR="$TEST_DIR/compiled"
COMPILER_CLASSPATH=".:$JASPERREPORT_JAR"

# 创建测试目录
mkdir -p "$TEST_DIR" "$OUTPUT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试计数器
PASSED=0
FAILED=0
TOTAL=0

# 测试函数
test_jrxml() {
    local name="$1"
    local jrxml_content="$2"
    local expected_result="$3"  # "pass" or "fail"

    TOTAL=$((TOTAL + 1))
    echo -e "\n${YELLOW}测试 $TOTAL: $name${NC}"
    echo "─────────────────────────────────────────"

    # 保存JRXML文件
    local jrxml_file="$TEST_DIR/$name.jrxml"
    echo "$jrxml_content" > "$jrxml_file"

    # 尝试编译
    if java -cp "$COMPILER_CLASSPATH" JRXMLCompiler "$jrxml_file" "$OUTPUT_DIR/$name.jasper" 2>&1 | tee "$OUTPUT_DIR/$name.output"; then
        # 编译成功
        if [ "$expected_result" = "pass" ]; then
            echo -e "${GREEN}✅ PASS: 编译成功（预期行为）${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAIL: 编译成功，但预期应该失败${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        # 编译失败
        local error_output=$(cat "$OUTPUT_DIR/$name.output")
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS: 编译失败（预期行为）${NC}"
            echo -e "错误信息: $(echo "$error_output" | grep -E "错误|Exception|error" | head -1)"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAIL: 编译失败，但预期应该成功${NC}"
            echo -e "错误信息: $(echo "$error_output" | grep -E "错误|Exception|error" | head -1)"
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}JRXML属性验证编译测试${NC}"
echo -e "${GREEN}使用JasperReports: $JASPERREPORT_JAR${NC}"
echo -e "${GREEN}========================================${NC}"

# ============================================================================
# 测试1: uuid属性验证
# ============================================================================

echo -e "\n${YELLOW}========== 1. uuid属性验证 ==========${NC}"

# 测试1.1: field带uuid（预期失败）
test_jrxml "field_with_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <field name="testField" class="java.lang.String" uuid="field-uuid-123"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[$F{testField}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "fail"

# 测试1.2: field不带uuid（预期通过）
test_jrxml "field_without_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <field name="testField" class="java.lang.String"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[$F{testField}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试1.3: variable带uuid（预期失败）
test_jrxml "variable_with_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <variable name="testVar" class="java.lang.String" uuid="var-uuid-123"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[$V{testVar}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "fail"

# 测试1.4: variable不带uuid（预期通过）
test_jrxml "variable_without_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <variable name="testVar" class="java.lang.String"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[$V{testVar}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试1.5: parameter带uuid（预期通过）
test_jrxml "parameter_with_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <parameter name="testParam" class="java.lang.String" uuid="param-uuid-123"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[$P{testParam}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试1.6: parameter不带uuid（预期通过）
test_jrxml "parameter_without_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <parameter name="testParam" class="java.lang.String"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[$P{testParam}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试1.7: sortField带uuid（预期失败）
test_jrxml "sortField_with_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <sortField name="testSort" uuid="sort-uuid-123"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "fail"

# 测试1.8: sortField不带uuid（预期通过）
test_jrxml "sortField_without_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <sortField name="testSort"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试1.9: group带uuid（预期失败）
test_jrxml "group_with_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <group name="testGroup" uuid="group-uuid-123"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "fail"

# 测试1.10: group不带uuid（预期通过）
test_jrxml "group_without_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <group name="testGroup"/>
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <textFieldExpression><![CDATA[1]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试1.11: band带uuid（预期失败）
test_jrxml "band_with_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30" uuid="band-uuid-123">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>' "fail"

# 测试1.12: band不带uuid（预期通过）
test_jrxml "band_without_uuid" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>' "pass"

# ============================================================================
# 测试2: positionType枚举值验证
# ============================================================================

echo -e "\n${YELLOW}========== 2. positionType枚举值验证 ==========${NC}"

# 测试2.1: positionType=FixRelativeToTop（预期通过）
test_jrxml "positionType_FixRelativeToTop" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid" positionType="FixRelativeToTop"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试2.2: positionType=FixRelativeToBottom（预期通过）
test_jrxml "positionType_FixRelativeToBottom" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid" positionType="FixRelativeToBottom"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试2.3: positionType=Float（预期通过）
test_jrxml "positionType_Float" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid" positionType="Float"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>' "pass"

# 测试2.4: positionType=FixRelativeToBand（预期失败）
test_jrxml "positionType_FixRelativeToBand" '<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
  <detail>
    <band height="30">
      <staticText>
        <reportElement x="0" y="0" width="200" height="20" uuid="test-uuid" positionType="FixRelativeToBand"/>
        <text><![CDATA[Test]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>' "fail"

# ============================================================================
# 测试总结
# ============================================================================

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "总计: $TOTAL"

# 输出详细结果到文件
echo -e "\n========== 详细测试结果 ==========" > "$TEST_DIR/test-results.txt"
echo "测试时间: $(date)" >> "$TEST_DIR/test-results.txt"
echo "总计: $TOTAL, 通过: $PASSED, 失败: $FAILED" >> "$TEST_DIR/test-results.txt"
echo "" >> "$TEST_DIR/test-results.txt"
for file in "$OUTPUT_DIR"/*.output; do
    if [ -f "$file" ]; then
        echo "--- $(basename $file .output) ---" >> "$TEST_DIR/test-results.txt"
        cat "$file" >> "$TEST_DIR/test-results.txt"
        echo "" >> "$TEST_DIR/test-results.txt"
    fi
done

echo -e "\n详细结果已保存到: $TEST_DIR/test-results.txt"
