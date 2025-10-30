一、根元素 <jasperReport>
所有 JRXML 文件的根标签，定义报表全局属性。核心属性：
name：报表唯一标识（必填），如 name="SalesReport"
pageWidth/pageHeight：页面尺寸（单位：像素），默认 595x842（A4）
columnWidth：内容区域宽度（需满足 columnWidth ≤ pageWidth - leftMargin - rightMargin）
leftMargin/rightMargin/topMargin/bottomMargin：边距（默认 20）
columnCount：多列报表的列数（默认 1）
columnSpacing：多列之间的间距（默认 0）
printOrder：打印顺序（Horizontal 水平 / Vertical 垂直，默认 Vertical）
whenNoDataType：无数据时的行为（NoPages 不生成页面 / BlankPage 空白页 / AllSectionsNoDetail 显示除 detail 外的区域，默认 NoPages）
language：表达式语言（java / groovy，默认 groovy）
scriptletClass：自定义脚本类（用于复杂计算）
isTitleNewPage/isSummaryNewPage：标题 / 摘要是否单独占一页（true/false）
子标签：
<property>：自定义属性，如 PDF 导出配置：
xml
<property name="net.sf.jasperreports.export.pdf.author" value="Admin"/>
<queryString>：SQL 查询语句（用于数据库数据源）：
xml
<queryString><![CDATA[SELECT * FROM sales WHERE date >= $P{startDate}]]></queryString>
二、数据定义标签
1. <parameter>：报表参数（外部传入的值）
属性：
name：参数名（必填），如 name="startDate"
class：数据类型（必填），如 java.util.Date、java.lang.String
isForPrompting：是否在报表运行时提示用户输入（true/false，默认 true）
子标签：
<defaultValueExpression>：默认值表达式（可选）：
xml
<parameter name="startDate" class="java.util.Date">
    <defaultValueExpression><![CDATA[new java.util.Date()]]></defaultValueExpression>
</parameter>
2. <field>：数据源字段（从数据集获取的值）
属性：
name：字段名（必填，用于表达式引用，如 $F{amount}）
class：数据类型（必填），如 java.math.BigDecimal
子标签：
<fieldDescription>：字段映射（如数据库列名，可选）：
xml
<field name="amount" class="java.math.BigDecimal">
    <fieldDescription><![CDATA[sales_amount]]></fieldDescription> <!-- 对应数据库列 -->
</field>
3. <variable>：计算变量（基于字段 / 参数的动态计算值）
属性：
name：变量名（必填，如 totalAmount）
class：数据类型（必填）
calculation：计算方式（可选，默认 Nothing）：
Sum/Avg/Count/Min/Max：聚合计算
First/Last：取首 / 尾值
System：自定义计算（通过 <variableExpression>）
子标签：
<variableExpression>：计算表达式（必填）：
xml
<variable name="totalAmount" class="java.math.BigDecimal" calculation="Sum">
    <variableExpression><![CDATA[$F{amount}]]></variableExpression>
</variable>
<initialValueExpression>：初始值（可选，如聚合计算的初始值 0）
三、报表区域标签（<band> 子类）
所有区域标签均继承 <band>，包含 height 属性（区域高度，像素），用于定义报表布局结构。
标签	位置	显示时机	典型用途
<title>	报表最顶部	仅第一页显示	报表标题、Logo
<pageHeader>	每页顶部	除第一页（若 title 存在）外每页	页头标题、过滤条件
<columnHeader>	数据区域顶部	每页数据区域上方	表格列名
<detail>	报表主体	按数据源行数重复显示	具体数据行
<columnFooter>	数据区域底部	每页数据区域下方	列小计
<pageFooter>	每页底部	每页底部	页码（$V{PAGE_NUMBER}）
<summary>	报表最后	仅最后一页底部（或单独成页）	总计、统计信息
示例：
xml
<pageHeader height="50">
    <staticText>
        <reportElement x="0" y="0" width="555" height="20"/>
        <text><![CDATA[月度销售报表]]></text>
    </staticText>
</pageHeader>
四、元素标签（报表内容）
1. 文本元素
<staticText>：静态文本（固定内容）
xml
<staticText>
    <reportElement x="10" y="10" width="100" height="20"/> <!-- 位置和大小 -->
    <textElement>
        <font size="12" isBold="true"/> <!-- 字体样式 -->
    </textElement>
    <text><![CDATA[销售额：]]></text> <!-- 文本内容 -->
</staticText>
<textField>：动态文本（绑定字段 / 变量 / 参数）
xml
<textField>
    <reportElement x="110" y="10" width="100" height="20"/>
    <textElement textAlignment="Right"/> <!-- 右对齐 -->
    <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression> <!-- 绑定字段 -->
    <pattern>#,##0.00</pattern> <!-- 数字格式化 -->
</textField>
2. 图形元素
<line>：线条
xml
<line>
    <reportElement x="0" y="30" width="555" height="1"/> <!-- 水平线（y固定） -->
    <lineDirection>Horizontal</lineDirection>
</line>
<rectangle>：矩形（可用于边框）
xml
<rectangle>
    <reportElement x="0" y="0" width="555" height="50" backcolor="#F0F0F0"/>
    <graphicElement fill="Solid"/> <!-- 实心填充 -->
</rectangle>
<image>：图片（本地路径或二进制数据）
xml
<image>
    <reportElement x="450" y="5" width="100" height="40"/>
    <imageExpression><![CDATA["logo.png"]]></imageExpression> <!-- 图片路径 -->
</image>
3. 子报表 <subreport>
嵌入其他报表，用于复杂嵌套结构：
xml
<subreport>
    <reportElement x="0" y="0" width="555" height="100"/>
    <subreportExpression><![CDATA["sub_report.jrxml"]]></subreportExpression> <!-- 子报表路径 -->
    <dataSourceExpression><![CDATA[new net.sf.jasperreports.engine.data.JRBeanCollectionDataSource($F{subDataList})]]></dataSourceExpression> <!-- 子报表数据源 -->
</subreport>
五、样式与格式
1. <reportElement>：所有元素的基础样式
每个可视元素（文本、图形等）都包含此标签，定义位置和基础样式：
x/y：左上角坐标（像素）
width/height：宽高（像素）
forecolor/backcolor：前景色 / 背景色（如 #FF0000 或 red）
mode：显示模式（Opaque 不透明 / Transparent 透明，默认 Transparent）
printWhenExpression：打印条件（返回布尔值，如仅打印金额 > 1000 的行）：
xml
<reportElement ...>
    <printWhenExpression><![CDATA[$F{amount}.compareTo(new BigDecimal(1000)) > 0]]></printWhenExpression>
</reportElement>
2. <style>：可重用样式（类似 CSS）
xml
<style name="HeaderStyle" forecolor="#0000FF" isBold="true">
    <textElement>
        <font size="14"/>
        <paragraph alignment="Center"/> <!-- 居中对齐 -->
    </textElement>
    <box> <!-- 边框 -->
        <topPen lineWidth="1"/>
        <bottomPen lineWidth="1"/>
    </box>
</style>

<!-- 使用样式 -->
<staticText>
    <reportElement style="HeaderStyle" x="0" y="0" width="555" height="30"/>
    <text><![CDATA[报表标题]]></text>
</staticText>
六、分组与排序
1. <group>：数据分组（如按地区、月份分组）
xml
<group name="RegionGroup">
    <groupExpression><![CDATA[$F{region}]]></groupExpression> <!-- 按region字段分组 -->
    <groupHeader height="30"> <!-- 组头 -->
        <staticText>
            <reportElement x="0" y="0" width="555" height="20"/>
            <text><![CDATA[地区：]]></text>
        </staticText>
        <textField>
            <reportElement x="50" y="0" width="100" height="20"/>
            <textFieldExpression><![CDATA[$F{region}]]></textFieldExpression>
        </textField>
    </groupHeader>
    <groupFooter height="20"> <!-- 组脚（如分组小计） -->
        <textField>
            <reportElement x="455" y="0" width="100" height="20"/>
            <textFieldExpression><![CDATA["小计：" + $V{GroupTotal}]]></textFieldExpression>
        </textField>
    </groupFooter>
</group>
2. <sortField>：数据排序
xml
<sortField name="saleDate" order="Ascending"/> <!-- 按saleDate升序 -->
<sortField name="amount" order="Descending"/> <!-- 按amount降序 -->
七、表达式语法
JRXML 中表达式使用 ${} 格式，常见变量：
$P{paramName}：引用参数
$F{fieldName}：引用字段
$V{varName}：引用变量
系统变量：$V{PAGE_NUMBER}（页码）、$V{REPORT_COUNT}（总记录数）等
通过以上标签，你可以构建几乎所有类型的报表。开发生成工具时，建议按 “报表属性→数据定义→区域结构→元素内容” 的顺序组织逻辑，同时注意标签嵌套关系（如 <band> 子类只能包含元素标签，不能直接嵌套其他区域）。
