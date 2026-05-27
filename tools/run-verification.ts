/**
 * JRXML官方库验证执行脚本
 *
 * 这个脚本会：
 * 1. 检查Java环境
 * 2. 下载JasperReports库（如果不存在）
 * 3. 编译验证器
 * 4. 运行编译测试
 * 5. 输出详细结果
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const execAsync = promisify(exec);

class JRXMLVerifier {
  private libDir: string;
  private toolsDir: string;
  private jasperReportsJar: string;
  private jasperReportsVersion: string = '6.20.0';

  constructor() {
    this.libDir = path.join(__dirname, '..', 'lib');
    this.toolsDir = path.join(__dirname, '..', 'tools');
    this.jasperReportsJar = path.join(this.libDir, `jasperreports-${this.jasperReportsVersion}.jar`);
  }

  async run(): Promise<void> {
    console.log('==========================================');
    console.log('JRXML编译验证（JasperReports官方库）');
    console.log('==========================================\n');

    try {
      // 步骤1：检查Java
      console.log('步骤1: 检查Java环境');
      await this.checkJava();
      console.log('');

      // 步骤2：检查/下载JasperReports库
      console.log('步骤2: 检查JasperReports库');
      await this.checkJasperReports();
      console.log('');

      // 步骤3：编译验证器
      console.log('步骤3: 编译JRXMLCompiler');
      await this.compileCompiler();
      console.log('');

      // 步骤4：运行编译测试
      console.log('步骤4: 运行编译测试');
      await this.runCompilationTest();
      console.log('');

      console.log('==========================================');
      console.log('✅ 验证完成！');
      console.log('==========================================');

    } catch (error: any) {
      console.error('\n❌ 验证失败:', error.message);
      process.exit(1);
    }
  }

  private async checkJava(): Promise<void> {
    try {
      const { stdout } = await execAsync('java -version');
      const version = stdout.split('\n')[0];
      console.log(`✓ Java已安装: ${version}`);
    } catch {
      throw new Error('Java未安装。请安装Java JDK 8+');
    }
  }

  private async checkJasperReports(): Promise<void> {
    if (fs.existsSync(this.jasperReportsJar)) {
      console.log(`✓ JasperReports库已存在: ${this.jasperReportsJar}`);
      return;
    }

    console.log('⚠ JasperReports库不存在，尝试下载...');

    // 创建lib目录
    if (!fs.existsSync(this.libDir)) {
      fs.mkdirSync(this.libDir, { recursive: true });
    }

    const url = `https://sourceforge.net/projects/jasperreports/files/jasperreports/${this.jasperReportsVersion}/jasperreports-${this.jasperReportsVersion}.jar/download`;
    console.log(`下载地址: ${url}`);

    try {
      await this.downloadFile(url, this.jasperReportsJar);
      console.log('✓ 下载完成');
    } catch (error: any) {
      throw new Error(`下载JasperReports库失败: ${error.message}`);
    }
  }

  private async downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);

      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 跟随重定向
          https.get(response.headers.location!, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      }).on('error', (error) => {
        fs.unlink(destPath, () => {});
        reject(error);
      });
    });
  }

  private async compileCompiler(): Promise<void> {
    try {
      const command = `javac -cp "${this.jasperReportsJar}" "${path.join(this.toolsDir, 'JRXMLCompiler.java')}"`;
      await execAsync(command);
      console.log('✓ JRXMLCompiler编译成功');
    } catch (error: any) {
      throw new Error(`编译JRXMLCompiler失败: ${error.message}`);
    }
  }

  private async runCompilationTest(): Promise<void> {
    // 生成测试JRXML
    const testDir = path.join(__dirname, '..', 'test-reports');
    const outputDir = path.join(__dirname, '..', 'test-compiled');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成测试文件
    const testJRXML = `<?xml version="1.0" encoding="UTF-8"?>
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
</jasperReport>`;

    const testFile = path.join(testDir, 'test_textfield.jrxml');
    const outputFile = path.join(outputDir, 'test_textfield.jasper');

    fs.writeFileSync(testFile, testJRXML, 'utf-8');
    console.log(`✓ 测试JRXML已生成: ${testFile}`);

    // 运行编译
    console.log('\n正在编译...');
    try {
      const command = `java -cp "${this.toolsDir}:${this.jasperReportsJar}" JRXMLCompiler "${testFile}" "${outputFile}"`;
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000
      });

      console.log(stdout);

      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        console.log(`✓ jasper文件已生成: ${outputFile} (${stats.size} bytes)`);
        console.log('\n==========================================');
        console.log('✅ 编译成功！JRXML可以被JasperReports编译');
        console.log('==========================================');
      } else {
        throw new Error('输出文件未生成');
      }
    } catch (error: any) {
      console.error('编译错误:', error.stderr || error.message);
      throw new Error('JRXML编译失败');
    }
  }
}

// 运行验证
const verifier = new JRXMLVerifier();
verifier.run().catch(error => {
  console.error('致命错误:', error);
  process.exit(1);
});
