#!/bin/bash

# JRXML属性完整验证测试
# 使用本地JasperReports 6.21.5 + Maven依赖

set -e

JASPERREPORT_JAR="/Users/yan.yang/open/jrxml_web_designer/lib/jasperreports-6.21.5.jar"
MAVEN_REPO="/Users/yan.yang/.m2/repository"
TEST_DIR="/Users/yan.yang/open/jrxml_web_designer/test-attribute-validation"
OUTPUT_DIR="$TEST_DIR/compiled"

# 完整类路径
export CLASSPATH="/Users/yan.yang/open/jrxml_web_designer/tools:$JASPERREPORT_JAR:$MAVEN_REPO/commons-digester/commons-digester/2.1/commons-digester-2.1.jar:$MAVEN_REPO/commons-beanutils/commons-beanutils/1.11.0/commons-beanutils-1.11.0.jar:$MAVEN_REPO/commons-logging/commons-logging/1.3.5/commons-logging-1.3.5.jar:$MAVEN_REPO/org/apache/commons/commons-collections4/4.4/commons-collections4-4.4.jar:$MAVEN_REPO/commons-collections/commons-collections/3.2.2/commons-collections-3.2.2.jar"

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
    local expected_result="$2"  # "pass" or "fail"
    local jrxml_file="$TEST_DIR/$name.jrxml"
    local output_file="$OUTPUT_DIR/$name.output"

    TOTAL=$((TOTAL + 1))
    echo -e "\n${YELLOW}测试 $TOTAL: $name${NC}"
    echo "─────────────────────────────────────────"

    # 运行编译器
    if java JRXMLCompiler "$jrxml_file" "$OUTPUT_DIR/$name.jasper" > "$output_file" 2>&1; then
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
        local error_msg=$(grep -E "不允许|不允许出现|not allowed|error" "$output_file" | head -1)
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS: 编译失败（预期行为）${NC}"
            echo -e "错误: $error_msg"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAIL: 编译失败，但预期应该成功${NC}"
            echo -e "错误: $error_msg"
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}JRXML属性完整验证测试${NC}"
echo -e "${GREEN}使用JasperReports 6.21.5 + Maven依赖${NC}"
echo -e "${GREEN}========================================${NC}"

# ============================================================================
# 测试1: uuid属性验证
# ============================================================================

echo -e "\n${YELLOW}========== 1. uuid属性验证 ==========${NC}"

test_jrxml "field_with_uuid" "fail"
test_jrxml "field_without_uuid" "pass"
test_jrxml "variable_with_uuid" "fail"
test_jrxml "variable_without_uuid" "pass"
test_jrxml "parameter_with_uuid" "pass"
test_jrxml "parameter_without_uuid" "pass"
test_jrxml "sortField_with_uuid" "fail"
test_jrxml "sortField_without_uuid" "pass"
test_jrxml "group_with_uuid" "fail"
test_jrxml "group_without_uuid" "pass"
test_jrxml "band_with_uuid" "fail"
test_jrxml "band_without_uuid" "pass"

# ============================================================================
# 测试2: positionType枚举值验证
# ============================================================================

echo -e "\n${YELLOW}========== 2. positionType枚举值验证 ==========${NC}"

test_jrxml "positionType_FixRelativeToTop" "pass"
test_jrxml "positionType_FixRelativeToBottom" "pass"
test_jrxml "positionType_Float" "pass"
test_jrxml "positionType_FixRelativeToBand" "fail"

# ============================================================================
# 测试总结
# ============================================================================

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "总计: $TOTAL"

# 保存结果
cat > "$TEST_DIR/validation-summary.txt" << EOF
JRXML属性验证测试结果
====================
测试时间: $(date)
总计: $TOTAL, 通过: $PASSED, 失败: $FAILED

uuid属性验证:
- field带uuid: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/field_with_uuid.output" 2>/dev/null || echo "未运行")
- variable带uuid: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/variable_with_uuid.output" 2>/dev/null || echo "未运行")
- parameter带uuid: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/parameter_with_uuid.output" 2>/dev/null || echo "未运行")
- sortField带uuid: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/sortField_with_uuid.output" 2>/dev/null || echo "未运行")
- group带uuid: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/group_with_uuid.output" 2>/dev/null || echo "未运行")
- band带uuid: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/band_with_uuid.output" 2>/dev/null || echo "未运行")

positionType枚举值验证:
- FixRelativeToTop: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/positionType_FixRelativeToTop.output" 2>/dev/null || echo "未运行")
- FixRelativeToBottom: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/positionType_FixRelativeToBottom.output" 2>/dev/null || echo "未运行")
- Float: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/positionType_Float.output" 2>/dev/null || echo "未运行")
- FixRelativeToBand: $(grep -o "✅ PASS\|❌ FAIL" "$OUTPUT_DIR/positionType_FixRelativeToBand.output" 2>/dev/null || echo "未运行")
EOF

echo -e "\n详细结果已保存到: $TEST_DIR/validation-summary.txt"
