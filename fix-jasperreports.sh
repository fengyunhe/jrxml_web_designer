#!/bin/bash

# 修复JasperReports库下载问题

echo "=========================================="
echo "修复JasperReports库"
echo "=========================================="

# 删除损坏的文件
echo "1. 删除损坏的文件..."
rm -f lib/jasperreports-6.20.0.jar
echo "✓ 已删除"

# 重新下载
echo ""
echo "2. 重新下载JasperReports 6.20.0..."
echo "下载地址: https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/"
echo ""

# 尝试方式1：使用curl
if command -v curl &> /dev/null; then
    echo "使用curl下载..."
    curl -L -o lib/jasperreports-6.20.0.jar \
        "https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/jasperreports-6.20.0.jar/download" \
        --retry 3 \
        --retry-delay 5

# 尝试方式2：使用wget
elif command -v wget &> /dev/null; then
    echo "使用wget下载..."
    wget -O lib/jasperreports-6.20.0.jar \
        "https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/jasperreports-6.20.0.jar/download" \
        --tries=3

else
    echo "❌ 请安装curl或wget"
    echo ""
    echo "手动下载步骤："
    echo "1. 访问: https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/"
    echo "2. 点击 'jasperreports-6.20.0.jar' 下载"
    echo "3. 保存到: /Users/yan.yang/open/jrxml_web_designer/lib/jasperreports-6.20.0.jar"
    exit 1
fi

# 验证下载
echo ""
echo "3. 验证下载..."
if [ -f "lib/jasperreports-6.20.0.jar" ]; then
    FILE_SIZE=$(ls -lh "lib/jasperreports-6.20.0.jar" | awk '{print $5}')
    echo "✓ 文件大小: ${FILE_SIZE}"

    # 尝试解压验证
    echo ""
    echo "4. 验证JAR完整性..."
    jar tf lib/jasperreports-6.20.0.jar > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ JAR文件完整"
        echo ""
        echo "=========================================="
        echo "✅ JasperReports库修复成功！"
        echo "=========================================="
        echo ""
        echo "现在可以运行验证："
        echo "  ./final-verification.sh"
    else
        echo "❌ JAR文件仍然损坏，请手动下载"
        echo ""
        echo "手动下载："
        echo "  1. 访问: https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/"
        echo "  2. 下载 jasperreports-6.20.0.jar"
        echo "  3. 保存到 lib/ 目录"
    fi
else
    echo "❌ 下载失败"
    echo ""
    echo "请手动下载："
    echo "  1. 访问: https://sourceforge.net/projects/jasperreports/files/jasperreports/6.20.0/"
    echo "  2. 下载 jasperreports-6.20.0.jar"
    echo "  3. 保存到 /Users/yan.yang/open/jrxml_web_designer/lib/"
fi
