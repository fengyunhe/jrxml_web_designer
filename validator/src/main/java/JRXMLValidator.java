/**
 * JRXML验证器（使用Maven管理依赖）
 *
 * 这个类使用JasperReports官方库进行JRXML编译验证
 */

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import java.io.*;

public class JRXMLValidator {

    /**
     * 编译JRXML文件
     */
    public static boolean compile(String inputPath, String outputPath) {
        try {
            System.out.println("正在编译: " + inputPath);

            // 加载JRXML
            InputStream is = new FileInputStream(inputPath);
            JasperDesign jasperDesign = JRXmlLoader.load(is);
            is.close();

            System.out.println("✓ JRXML加载成功");
            System.out.println("  报表名称: " + jasperDesign.getName());
            System.out.println("  页面大小: " + jasperDesign.getPageWidth() + " x " + jasperDesign.getPageHeight());
            System.out.println("  列宽: " + jasperDesign.getColumnWidth());

            // 编译JRXML
            JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

            System.out.println("✓ JRXML编译成功");

            // 保存jasper文件
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

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("用法:");
            System.out.println("  java JRXMLValidator <input.jrxml> [output.jasper]");
            System.out.println("");
            System.out.println("示例:");
            System.out.println("  java JRXMLValidator report.jrxml");
            System.out.println("  java JRXMLValidator report.jrxml report.jasper");
            System.exit(1);
        }

        String inputPath = args[0];
        String outputPath;

        if (args.length >= 2) {
            outputPath = args[1];
        } else {
            outputPath = inputPath.replace(".jrxml", ".jasper");
        }

        boolean success = compile(inputPath, outputPath);

        System.exit(success ? 0 : 1);
    }
}
