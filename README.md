# 简易PDF报表设计工具

这是一个基于Vue 3的 JasperReport 的模板设计器。最近在下载官方的JasperReport Studio 时，发现受到出口管制的限制，不能直接使用 JasperReport 的 Studio，但是仍然有对报表做改动的需求，所以我自己实现了一个简单的设计器。功能有限，仅满足基本的功能；如果需要更多的需求，欢迎大家自行开发或参与贡献。

这是一个完全在浏览器运行的JasperReport模板设计器，依赖于浏览器的本地存储，设计完成后直接下载或COPY jrxml 文件的内容，随用随走。

jrxml 是 JasperReport 报表设计文件的格式，它是一个 XML 文件，用于描述报表的设计布局、数据字段、样式等信息。可以通过 jrxml 文件来定义报表的设计，然后使用 JasperReport 引擎来生成报表。

本工具只用于生成jrxml文件，不用于生成PDF文件。生成PDF文件请使用 JasperReport 引擎。

如对您的工作有帮助，欢迎大家点赞、分享、参与贡献，也可以在界面右上角扫码打赏，感谢您的支持。

## 在线体验
https://fengyunhe.github.io/jrxml_web_designer/


## 许可证

本项目采用MIT许可证 - 详情请查看 [LICENSE](LICENSE) 文件，生成的 jrxml 文件的版权归您所有，您可以自由使用、修改、分发和商业使用。

JasperReport 版权归 [Jaspersoft 公司](https://www.jaspersoft.com/) 所有。