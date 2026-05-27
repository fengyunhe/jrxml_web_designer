import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import java.io.*;

/**
 * JRXML编译验证器（使用JasperReports官方库）
 * 支持JasperReports 6.21.5
 *
 * 编译命令:
 * javac -cp jasperreports-6.21.5.jar JRXMLCompiler.java
 *
 * 运行命令:
 * java -cp .:jasperreports-6.21.5.jar JRXMLCompiler input.jrxml
 */

public class JRXMLCompiler {

    /**
     * 编译JRXML文件
     * @param inputPath JRXML文件路径
     * @param outputPath 输出jasper文件路径
     * @return 编译是否成功
     */
    public static boolean compile(String inputPath, String outputPath) {
        try {
            System.out.println("正在编译: " + inputPath);

            // 1. 加载JRXML
            InputStream is = new FileInputStream(inputPath);
            JasperDesign jasperDesign = JRXmlLoader.load(is);
            is.close();

            System.out.println("✓ JRXML加载成功");
            System.out.println("  报表名称: " + jasperDesign.getName());
            System.out.println("  页面大小: " + jasperDesign.getPageWidth() + " x " + jasperDesign.getPageHeight());
            System.out.println("  列宽: " + jasperDesign.getColumnWidth());

            // 2. 编译JRXML
            JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

            System.out.println("✓ JRXML编译成功");

            // 3. 保存jasper文件
            ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(outputPath));
            oos.writeObject(jasperReport);
            oos.close();

            System.out.println("✓ jasper文件已保存: " + outputPath);

            return true;

        } catch (JRException e) {
            System.err.println("✗ 编译失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        } catch (FileNotFoundException e) {
            System.err.println("✗ 文件未找到: " + inputPath);
            return false;
        } catch (Exception e) {
            System.err.println("✗ 未知错误: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 仅验证JRXML语法（不编译）
     * @param inputPath JRXML文件路径
     * @return 验证是否成功
     */
    public static boolean validate(String inputPath) {
        try {
            System.out.println("正在验证: " + inputPath);

            InputStream is = new FileInputStream(inputPath);
            JasperDesign jasperDesign = JRXmlLoader.load(is);
            is.close();

            System.out.println("✓ JRXML语法验证通过");
            System.out.println("  报表名称: " + jasperDesign.getName());

            return true;

        } catch (JRException e) {
            System.err.println("✗ 验证失败: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("✗ 未知错误: " + e.getMessage());
            return false;
        }
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("用法:");
            System.out.println("  java JRXMLCompiler <input.jrxml> [output.jasper]");
            System.out.println("");
            System.out.println("示例:");
            System.out.println("  java JRXMLCompiler report.jrxml");
            System.out.println("  java JRXMLCompiler report.jrxml report.jasper");
            System.exit(1);
        }

        String inputPath = args[0];
        String outputPath;

        if (args.length >= 2) {
            outputPath = args[1];
        } else {
            // 默认输出路径：将.jrxml替换为.jasper
            outputPath = inputPath.replace(".jrxml", ".jasper");
        }

        boolean success = compile(inputPath, outputPath);

        System.exit(success ? 0 : 1);
    }
}
