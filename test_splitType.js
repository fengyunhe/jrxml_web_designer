// 测试脚本：验证band标签的splitType属性在解析和重新生成时的保留
import { parseJRXMLContent, generateJRXMLContent } from './src/utils/jrxmlGenerator.js';

// 测试用例1：包含splitType属性的JRXML
const jrxmlWithSplitType = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" splitType="Prevent">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

// 测试用例2：同时包含splitType和isSplitAllowed属性的JRXML（splitType应该优先）
const jrxmlWithBothAttributes = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" splitType="Stretch" isSplitAllowed="false">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

// 测试用例3：只包含isSplitAllowed属性的JRXML（应该转换为splitType）
const jrxmlWithDeprecatedAttribute = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="Test Report" pageWidth="595" pageHeight="842" leftMargin="20" rightMargin="20" topMargin="30" bottomMargin="30">
  <detail>
    <band height="50" isSplitAllowed="false">
      <staticText>
        <reportElement x="10" y="10" width="100" height="20"/>
        <text><![CDATA[Test Text]]></text>
      </staticText>
    </band>
  </detail>
</jasperReport>`;

console.log('=== 测试用例1：包含splitType属性的JRXML ===');
console.log('原始JRXML:');
console.log(jrxmlWithSplitType);

// 解析JRXML
const { properties: props1, bands: bands1 } = parseJRXMLContent(jrxmlWithSplitType);
console.log('\n解析结果:');
console.log('Band splitType:', bands1[0].splitType);

// 重新生成JRXML
const regeneratedJrxml1 = generateJRXMLContent(props1, bands1, []);
console.log('\n重新生成的JRXML:');
console.log(regeneratedJrxml1);

// 验证是否保留了splitType属性
console.log('\n验证结果:');
console.log('是否包含splitType="Prevent":', regeneratedJrxml1.includes('splitType="Prevent"'));
console.log('是否包含isSplitAllowed:', regeneratedJrxml1.includes('isSplitAllowed'));

console.log('\n=== 测试用例2：同时包含splitType和isSplitAllowed属性的JRXML ===');
console.log('原始JRXML:');
console.log(jrxmlWithBothAttributes);

// 解析JRXML
const { properties: props2, bands: bands2 } = parseJRXMLContent(jrxmlWithBothAttributes);
console.log('\n解析结果:');
console.log('Band splitType:', bands2[0].splitType);

// 重新生成JRXML
const regeneratedJrxml2 = generateJRXMLContent(props2, bands2, []);
console.log('\n重新生成的JRXML:');
console.log(regeneratedJrxml2);

// 验证是否优先使用splitType属性
console.log('\n验证结果:');
console.log('是否包含splitType="Stretch":', regeneratedJrxml2.includes('splitType="Stretch"'));
console.log('是否包含isSplitAllowed:', regeneratedJrxml2.includes('isSplitAllowed'));

console.log('\n=== 测试用例3：只包含isSplitAllowed属性的JRXML ===');
console.log('原始JRXML:');
console.log(jrxmlWithDeprecatedAttribute);

// 解析JRXML
const { properties: props3, bands: bands3 } = parseJRXMLContent(jrxmlWithDeprecatedAttribute);
console.log('\n解析结果:');
console.log('Band splitType:', bands3[0].splitType);

// 重新生成JRXML
const regeneratedJrxml3 = generateJRXMLContent(props3, bands3, []);
console.log('\n重新生成的JRXML:');
console.log(regeneratedJrxml3);

// 验证是否正确转换了isSplitAllowed属性
console.log('\n验证结果:');
console.log('是否包含splitType="Prevent":', regeneratedJrxml3.includes('splitType="Prevent"'));
console.log('是否包含isSplitAllowed:', regeneratedJrxml3.includes('isSplitAllowed'));