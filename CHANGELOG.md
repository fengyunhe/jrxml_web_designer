# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.4.0] - 2026-01-21

### Added
- 实现多语言支持并添加相关翻译
- 添加英文版帮助和打赏弹窗，完善国际化支持
- 添加子数据集解析功能
- 集成Naive UI框架并重构UI组件
- 添加表格组件支持及表格列拖拽排序功能
- 支持从数据集添加表格列功能
- 添加Dependabot配置用于依赖更新
- 添加英文版README文档

### Changed
- 移除未使用的CSS样式并优化组件结构
- 优化样式代码结构并移除未使用的CSS规则
- 更新项目规则文档，添加提交代码时使用英文消息的规则
- 更新依赖包版本：@tauri-apps/cli、@types/node、vue-tsc、@vitejs/plugin-vue、vue
- 更新项目文档和变更日志
- 更新和删除静态资源文件

### Fixed
- 修正翻译字符串中的变量格式
- 修复解析带命名空间的JRXML文件问题
- 修复JRXML解析中CSS选择器的命名空间问题
- 更新表达式提示文本的占位符格式
- 修复表达式提示中的字段名显示并添加转义配置
- 更新默认图片URL路径
- 移除图片预览区域的背景色

### Security

## [0.3.0] - 2026-01-20

### Added
- 添加预览服务器设置功能
- 添加报表参数管理功能
- 添加图片预览功能并设置默认高度
- 实现多语言支持，中英文切换功能
- 增强设计画布和纸张尺寸支持
- 添加模态对话框组件

### Changed
- 更新测试用例以使用i18n键和更准确的选择器
- 移除图片路径显示和计算逻辑
- 优化默认文本显示
- 将DesignerCanvas中bands类型从any[]替换为Band类型
- 清理未使用的依赖项
- 更新应用版本号至0.2.1

### Fixed
- 解决中文斜体字体显示问题

### Security

## [0.2.1] - 2026-01-19

### Fixed
- 解决中文斜体字体显示问题

## [0.2.0] - 2026-01-19

### Added
- 实现自动数据字段创建：当动态文本元素表达式引用不存在的字段时自动添加
- 添加报表元素列表的删除功能
- 支持macOS上的Command键作为Ctrl键的替代
- image元素支持imageExpression属性，可在属性面板中设置图片表达式

### Changed

### Deprecated

### Removed

### Fixed
- 修复表达式在属性设置中不显示的问题
- 避免删除元素时的重复确认对话框
- 修复TypeScript语法错误
- 修复输入框中复制粘贴快捷键的默认行为

### Security

## [0.1.0] - 2026-01-15

### Added
- 项目初始化
- Vue 3 + TypeScript 基础架构
- PDF元素设计组件
- JRXML生成功能
