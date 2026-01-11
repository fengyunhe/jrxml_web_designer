# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [0.1.0] - YYYY-MM-DD

### Added
- 项目初始化
- Vue 3 + TypeScript 基础架构
- PDF元素设计组件
- JRXML生成功能
