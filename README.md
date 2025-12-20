# Confluence Node MCP Server

🚀 一个功能完整的 Confluence MCP (Model Context Protocol) 服务器，让 AI 助手能够直接在 Cursor 中创建、更新和管理 Confluence 文档。

## ✨ 特性

- 🤖 **AI 驱动**：在 Cursor 中通过自然语言操作 Confluence (KMS)
- 📄 **页面管理**：创建、更新、删除、搜索 Confluence 页面
- 📋 **灵活模板系统**：预置常用模板，支持自定义模板目录，多级优先级
- 🔍 **强大搜索**：支持全文搜索、子页面查询、历史版本查看
- 🏢 **Space 管理**：列出和管理所有可访问的 Spaces
- 🔒 **安全可靠**：使用 API Token 认证，支持所有 Confluence Cloud 功能

## 📦 项目结构

```
confluence-node/
├── index.js                 # 原始脚本（保留）
├── mcp-server.js           # MCP Server 实现
├── test-connection.js      # 连接测试脚本
├── template.html           # 原始模板（保留）
├── templates/              # 内置模板目录
│   ├── template.html      # 基础模板
│   ├── meeting-notes.html # 会议纪要模板
│   ├── tech-design.html   # 技术设计模板
│   └── code-review.html   # 代码评审模板
├── examples/               # 示例目录
│   └── custom-templates-example/  # 自定义模板示例
│       ├── README.md
│       ├── .env.example
│       └── templates/
│           ├── sprint-planning.html
│           ├── weekly-report.html
│           └── api-specification.html
├── package.json
├── .env                    # 配置文件（需要创建）
├── env-example.txt         # 配置示例
├── mcp-config-example.json # Cursor MCP 配置示例
├── README.md               # 项目总览（本文件）
├── QUICKSTART.md          # 快速开始指南
├── MCP_README.md          # MCP 详细文档
├── TEMPLATES_README.md    # 模板系统文档
├── USAGE_EXAMPLES.md      # 使用示例
├── KMS_ALIAS_README.md    # KMS 别名说明
└── CHANGELOG.md           # 更新日志
```

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 配置环境变量

复制 `env-example.txt` 为 `.env`，并填入你的配置：

```env
CONF_BASE_URL=https://your-confluence-instance.atlassian.net
CONF_USERNAME=your-email@example.com
CONF_PASSWORD=your-api-token
CONF_SPACE=YOUR_SPACE_KEY
# 可选：自定义模板目录
# CONF_TEMPLATES_DIR=/path/to/your/templates
```

### 3️⃣ 配置 Cursor

编辑 `~/.cursor/mcp.json`（参考 `mcp-config-example.json`）：

```json
{
  "mcpServers": {
    "confluence": {
      "command": "node",
      "args": ["/绝对路径/到/confluence-node/mcp-server.js"],
      "env": {
        "CONF_BASE_URL": "你的Confluence地址",
        "CONF_USERNAME": "你的邮箱",
        "CONF_PASSWORD": "你的API-Token",
        "CONF_SPACE": "你的Space-Key"
      }
    }
  }
}
```

### 4️⃣ 重启 Cursor

完全关闭并重新打开 Cursor。

### 5️⃣ 开始使用

在 Cursor 中直接对话即可：

```
帮我在 Confluence 创建一个技术设计文档，标题是"用户认证系统"
```

## 📖 文档

- **[快速开始指南](./QUICKSTART.md)** - 5分钟上手教程
- **[MCP 完整文档](./MCP_README.md)** - 详细的功能说明和 API 参考

## 🛠️ 可用工具

| 类别 | 工具 | 说明 |
|------|------|------|
| **Space** | `confluence_list_spaces` | 列出所有可访问的 Spaces |
| **页面操作** | `confluence_create_page` | 创建新页面 |
|  | `confluence_update_page` | 更新现有页面 |
|  | `confluence_upsert_page` | 创建或更新（智能判断） |
|  | `confluence_get_page` | 获取页面详情 |
|  | `confluence_delete_page` | 删除页面 |
| **搜索** | `confluence_search_pages` | 搜索页面 |
|  | `confluence_get_child_pages` | 获取子页面 |
|  | `confluence_get_page_history` | 查看页面历史 |
| **模板** | `confluence_list_templates` | 列出所有模板 |
|  | `confluence_load_template` | 加载模板内容 |
|  | `confluence_save_template` | 保存新模板 |

## 📝 模板系统

### 预置模板

- **template** - 基础通用模板
- **meeting-notes** - 会议纪要（包含议题、结论、待办事项）
- **tech-design** - 技术设计文档（包含架构、API、测试计划）
- **code-review** - 代码评审文档（包含评审维度、问题追踪）

### 自定义模板目录

支持设置自定义模板路径，提供更好的拓展性：

```bash
# .env
CONF_TEMPLATES_DIR=/path/to/your/templates
```

**特性：**
- ✅ 支持绝对路径和相对路径
- ✅ 自定义模板优先级高于内置模板
- ✅ 团队可以共享统一的模板库
- ✅ 支持模板版本控制

详细说明：[模板系统文档](./TEMPLATES_README.md)

## 💡 使用示例

### 创建页面

```
在 Confluence 创建一个会议纪要，标题是"2024 年度规划会议"
```

### 搜索页面

```
搜索所有包含"API"的技术文档
```

### 更新页面

```
更新"用户认证系统"文档，添加密码加密章节
```

### 查看 Spaces

```
列出我可以访问的所有 Confluence Spaces
```

## 🔧 开发和测试

### 测试 MCP Server

```bash
npm run mcp
```

### 使用 MCP Inspector 调试

```bash
npx @modelcontextprotocol/inspector node mcp-server.js
```

### 查看 Cursor MCP 日志

- macOS: `~/Library/Logs/Cursor/`
- Windows: `%APPDATA%\Cursor\logs\`

## 🐛 故障排查

### MCP Server 无法启动

1. 检查 `.env` 配置是否正确
2. 验证 API Token 是否有效
3. 确认 Confluence URL 可访问
4. 运行 `npm run mcp` 查看错误信息

### 在 Cursor 中看不到 MCP 工具

1. 检查 `~/.cursor/mcp.json` 路径是否正确（必须是绝对路径）
2. 重启 Cursor（完全退出）
3. 查看 Cursor 日志文件

### 权限错误

1. 确认 API Token 权限足够
2. 检查用户对目标 Space 有写入权限
3. 使用 `confluence_list_spaces` 验证 Space Key

## 📚 相关资源

- [Confluence REST API 文档](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/)
- [MCP 协议文档](https://modelcontextprotocol.io)
- [Cursor IDE](https://cursor.sh)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

**快速链接：**
- [快速开始](./QUICKSTART.md) | [完整文档](./MCP_README.md) | [模板系统](./TEMPLATES_README.md) | [使用示例](./USAGE_EXAMPLES.md)
