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
