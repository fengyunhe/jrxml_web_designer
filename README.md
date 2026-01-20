# JRXML Web 设计器

这是一个基于 Vue 3 的 JasperReport 模板设计器，完全在浏览器中运行，无需安装任何软件。设计完成后可直接下载或复制 JRXML 文件内容，随用随走。

## 🎯 项目定位

由于官方 JasperReport Studio 受到出口管制限制，本项目旨在提供一个轻量级、易用的替代方案，满足基本的 JRXML 设计需求。

## ✨ 核心功能

### 设计功能
- 📋 支持多种报表带区：Title、Page Header、Column Header、Detail、Column Footer、Page Footer、Summary
- 🎨 丰富的元素库：静态文本、文本字段、矩形、椭圆、线条、图像、框架、分页符
- 📐 精确的网格对齐与磁吸功能
- 🔄 完整的撤销/重做机制
- 🔍 支持画布缩放（25% - 400%）
- 🎯 精确的元素定位与大小调整
- 📏 实时元素属性编辑
- 🔧 支持元素复制、粘贴、删除
- ⚡ 拖拽式元素添加与布局

### 元素属性支持
- 📄 静态文本：内容、字体、颜色、对齐方式
- 🔤 文本字段：数据源字段绑定、表达式支持
- 🖼️ 图像：URL 或 Base64 支持
- 📐 图形元素：边框、填充、圆角
- 🔗 框架：容器支持，可嵌套其他元素

### 文件管理
- 💾 本地存储设计文件
- 📁 支持多文件管理
- 📤 导出 JRXML 文件
- 📥 导入 JRXML 文件
- 🔄 支持设计文件的版本管理

### 预览与测试
- 🖨️ PDF 预览功能（需要配置预览服务器）
- 🔍 实时验证 JRXML 语法

### 国际化
- 🌐 支持中英文切换

## 📦 支持的元素类型

| 元素类型 | 描述 | 主要属性 |
|---------|------|---------|
| **静态文本** | 固定内容的文本 | 文本内容、字体、大小、颜色、对齐方式 |
| **文本字段** | 动态数据绑定 | 数据源字段、表达式、字体样式、格式化 |
| **矩形** | 矩形图形 | 宽度、高度、边框、填充、圆角 |
| **椭圆** | 椭圆图形 | 宽度、高度、边框、填充 |
| **线条** | 直线元素 | 起点、终点、线条样式、颜色 |
| **图像** | 图片元素 | 图片 URL、尺寸、缩放模式 |
| **框架** | 容器元素 | 宽度、高度、边框、可嵌套其他元素 |
| **分页符** | 强制分页 | 分页位置 |

## 🛠️ 技术特性

- 📱 基于 Vue 3 + TypeScript 开发
- 🎨 使用 Vite 构建，支持热更新
- 📦 组件化设计，易于扩展
- 🧪 完善的单元测试
- 📝 符合 JasperReport XSD 规范
- 🔒 完全在浏览器中运行，数据安全可控
- 🚀 轻量级，加载速度快

## 🚀 快速开始

### 在线体验
访问 [在线演示](https://fengyunhe.github.io/jrxml_web_designer/) 立即体验设计器功能。

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/fengyunhe/jrxml_web_designer.git
cd jrxml_web_designer
```

2. 安装依赖
```bash
pnpm install
```

3. 启动开发服务器
```bash
pnpm run dev
```

4. 打开浏览器访问
```
http://localhost:5173
```

### 构建生产版本
```bash
pnpm run build
```

## 📖 使用指南

### 1. 创建新报表
- 点击左侧"新建文件"按钮
- 输入报表名称
- 选择报表方向（横向/纵向）
- 设置页面尺寸

### 2. 添加元素
- 从左侧元素库拖拽元素到画布
- 调整元素位置和大小
- 在右侧属性面板编辑元素属性

### 3. 配置数据源字段
- 点击顶部"字段管理"按钮
- 添加或编辑数据源字段
- 在文本字段属性中绑定字段

### 4. 预览报表
- 点击顶部"PDF 预览"按钮
- 配置预览服务器地址（如果需要）
- 查看生成的 PDF 效果

### 5. 导出 JRXML
- 完成设计后，点击"导出"按钮
- 选择保存位置，获取 JRXML 文件

## 🔧 开发指南

### 项目结构
```
src/
├── components/          # Vue 组件
│   ├── common/         # 通用组件
│   ├── designer/       # 设计器核心组件
│   ├── elements/       # 报表元素组件
│   ├── modals/         # 模态框组件
│   └── panels/         # 面板组件
├── composables/        # 组合式函数
├── config/             # 配置文件
├── constants/          # 常量定义
├── locales/            # 国际化资源
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数
    └── jrxml/          # JRXML 生成与解析
```

### 添加新元素类型
1. 在 `src/components/elements/` 目录下创建新元素组件
2. 继承 `BaseElement.vue` 或实现相同接口
3. 在 `ElementRegistry.ts` 中注册新元素
4. 在元素库中添加新元素

### 运行测试
```bash
pnpm run test
```

### 代码规范
- 使用 TypeScript 编写
- 遵循 Vue 3 组合式 API 风格
- 组件化设计，保持单一职责
- 编写单元测试覆盖核心功能

## 📝 变更记录

本项目遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 规范维护变更记录。

### 查看变更历史
请查看 [CHANGELOG.md](CHANGELOG.md) 文件获取详细的版本变更历史。

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

- 生成的 JRXML 文件版权归您所有，可自由使用、修改、分发和商业使用
- JasperReport 版权归 [Jaspersoft 公司](https://www.jaspersoft.com/) 所有

## 🤝 贡献指南

欢迎大家参与贡献！您可以：
- 提交 Issue 报告 bug 或建议新功能
- 提交 Pull Request 修复问题或添加功能
- 改进文档
- 分享使用经验

## 🙏 致谢

感谢所有为项目做出贡献的开发者和用户！

如果本工具对您的工作有帮助，欢迎点赞、分享、参与贡献，也可以在界面右上角扫码打赏，感谢您的支持。

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：
- GitHub Issues: [https://github.com/fengyunhe/jrxml_web_designer/issues](https://github.com/fengyunhe/jrxml_web_designer/issues)
- 项目地址: [https://github.com/fengyunhe/jrxml_web_designer](https://github.com/fengyunhe/jrxml_web_designer)

---

**JRXML Web 设计器** - 让 JasperReport 设计更简单！ 🎉