# 快速开始指南

## 🚀 5分钟上手 Confluence MCP

### 步骤 1：安装依赖（已完成）

```bash
npm install
```

### 步骤 2：配置环境变量

1. 复制 `env-example.txt` 为 `.env`
2. 编辑 `.env` 文件，填入你的 Confluence 配置：

```env
CONF_BASE_URL=https://your-confluence-instance.atlassian.net
CONF_USERNAME=your-email@example.com
CONF_PASSWORD=your-api-token
CONF_SPACE=YOUR_SPACE_KEY
```

**获取 API Token：**
1. 访问 https://id.atlassian.com/manage-profile/security/api-tokens
2. 点击 "Create API token"
3. 复制生成的 token 到 `CONF_PASSWORD`

### 步骤 3：配置 Cursor MCP

编辑 Cursor 的 MCP 配置文件：

**macOS/Linux:**
```bash
code ~/.cursor/mcp.json
```

**Windows:**
```powershell
code %APPDATA%\Cursor\mcp.json
```

添加以下内容（替换为你的实际路径和配置）：

```json
{
  "mcpServers": {
    "confluence": {
      "command": "node",
      "args": ["/Users/caijing/work/confluence-node/mcp-server.js"],
      "env": {
        "CONF_BASE_URL": "https://your-confluence-instance.atlassian.net",
        "CONF_USERNAME": "your-email@example.com",
        "CONF_PASSWORD": "your-api-token",
        "CONF_SPACE": "YOUR_SPACE_KEY"
      }
    }
  }
}
```

💡 **提示：** 路径 `/Users/caijing/work/confluence-node/mcp-server.js` 需要改成你的实际路径

### 步骤 4：重启 Cursor

完全关闭并重新打开 Cursor，让 MCP 配置生效。

### 步骤 5：开始使用！

在 Cursor 中，你可以直接对话来操作 Confluence：

#### 示例 1：查看可用的 Spaces
```
帮我列出所有可用的 Confluence Spaces
```

#### 示例 2：创建新页面
```
在 Confluence 中创建一个新页面，标题是"项目技术方案"，内容包括：
## 背景
...
## 方案
...
```

#### 示例 3：更新页面
```
更新"项目技术方案"这个页面，在"架构设计"部分添加以下内容：...
```

#### 示例 4：搜索页面
```
搜索包含"API"的所有 Confluence 页面
```

## 🛠️ 可用工具

MCP Server 提供了以下工具：

| 工具 | 功能 |
|------|------|
| `confluence_list_spaces` | 列出所有 Spaces |
| `confluence_create_page` | 创建新页面 |
| `confluence_update_page` | 更新现有页面 |
| `confluence_upsert_page` | 创建或更新页面 |
| `confluence_get_page` | 获取页面详情 |
| `confluence_delete_page` | 删除页面 |
| `confluence_search_pages` | 搜索页面 |
| `confluence_get_child_pages` | 获取子页面 |
| `confluence_get_page_history` | 查看页面历史 |
| `confluence_build_code_macro` | 生成 Confluence Code Macro（storage format） |

## ❓ 常见问题

### MCP Server 没有在 Cursor 中显示？

1. 检查 `~/.cursor/mcp.json` 配置是否正确
2. 确保文件路径是绝对路径
3. 重启 Cursor（完全退出再打开）
4. 查看 Cursor 日志：`~/Library/Logs/Cursor/`

### 测试 MCP Server 是否正常

```bash
npm run mcp
```

如果看到 "Confluence MCP Server 已启动"，说明配置正确。

### 权限错误

确保：
1. API Token 有效且未过期
2. 用户对目标 Space 有写入权限
3. Space Key 正确（使用 `confluence_list_spaces` 查看）

## 📚 更多信息

查看完整文档：[MCP_README.md](./MCP_README.md)
