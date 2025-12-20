# 更新日志

## [1.1.0] - 2024-12-20

### 新增功能

- ✨ **自定义模板目录支持**
  - 新增 `CONF_TEMPLATES_DIR` 环境变量
  - 支持自定义模板路径（绝对路径或相对路径）
  - 实现多级模板优先级：自定义 > 内置 > 根目录
  - 团队可以共享统一的模板库

- 🏷️ **KMS 别名支持**
  - 在所有工具描述中添加 KMS (Knowledge Management System) 说明
  - AI 现在能理解 "KMS" 和 "Confluence" 是同一个系统
  - 更新 MCP Server 名称为 `confluence-kms-mcp-server`

### 改进

- 📝 模板列表增强
  - 列出模板时显示模板来源（custom/builtin/root）
  - 显示当前配置的自定义模板目录
  - 保存模板时显示详细的保存路径

- 📚 文档完善
  - 新增 `TEMPLATES_README.md` - 模板系统完整文档
  - 新增 `KMS_ALIAS_README.md` - KMS 别名说明
  - 新增 `USAGE_EXAMPLES.md` - 20+ 个实用示例
  - 新增 `CHANGELOG.md` - 版本更新日志
  - 更新所有现有文档以反映新特性

### 优化

- 🔧 代码重构
  - 提取 `getTemplateDirs()` 函数统一管理模板路径
  - 优化模板查找逻辑，支持多路径查找
  - 改进错误处理和日志输出

- 📦 配置示例更新
  - `env-example.txt` 添加模板目录配置示例
  - `mcp-config-example.json` 添加 `CONF_TEMPLATES_DIR` 说明

## [1.0.0] - 2024-12-20

### 初始版本

- 🎉 Confluence MCP Server 首次发布

### 核心功能

- **Space 管理**
  - 列出所有可访问的 Spaces

- **页面操作**
  - 创建页面
  - 更新页面
  - 创建或更新页面（upsert）
  - 获取页面详情
  - 删除页面
  
- **搜索功能**
  - 搜索页面
  - 获取子页面列表
  - 查看页面历史

- **模板系统**
  - 预置 4 个常用模板
  - 列出所有模板
  - 加载模板内容
  - 保存新模板

### 预置模板

- `template.html` - 基础模板
- `meeting-notes.html` - 会议纪要
- `tech-design.html` - 技术设计文档
- `code-review.html` - 代码评审文档

### 工具支持

提供 12 个 MCP 工具：
- `confluence_list_spaces`
- `confluence_create_page`
- `confluence_update_page`
- `confluence_upsert_page`
- `confluence_get_page`
- `confluence_delete_page`
- `confluence_search_pages`
- `confluence_get_child_pages`
- `confluence_get_page_history`
- `confluence_list_templates`
- `confluence_load_template`
- `confluence_save_template`

### 文档

- `README.md` - 项目概述
- `QUICKSTART.md` - 快速开始指南
- `MCP_README.md` - 完整功能文档
- `test-connection.js` - 连接测试脚本

---

## 版本规范

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

## 计划功能

### v1.2.0（计划中）

- [ ] 支持页面标签管理
- [ ] 支持页面评论功能
- [ ] 支持附件上传
- [ ] 批量操作优化

### v1.3.0（计划中）

- [ ] 页面模板变量替换功能
- [ ] 支持 Markdown 转 Confluence 格式
- [ ] 页面版本对比
- [ ] 自动生成目录

### 未来规划

- [ ] 支持页面权限管理
- [ ] 支持页面导出（PDF、Word）
- [ ] 页面分析和统计
- [ ] AI 智能内容建议
