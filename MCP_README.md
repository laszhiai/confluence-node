# Confluence MCP Server

这是一个功能完整的 Confluence MCP (Model Context Protocol) 服务器，可以让 AI 助手直接在 Cursor 中创建、更新和管理 Confluence 文档。

## 功能特性

### 核心功能

✅ **页面管理**
- 创建新页面
- 更新现有页面
- 创建或更新页面（智能判断）
- 获取页面详情
- 删除页面
- 搜索页面
- 获取子页面列表
- 查看页面历史

✅ **Space 管理**
- 列出所有可访问的 Spaces
- 支持 global 和 personal Space

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并配置以下变量：

```env
CONF_BASE_URL=https://your-confluence-instance.atlassian.net
CONF_USERNAME=your-email@example.com
CONF_PASSWORD=your-api-token
CONF_SPACE=YOUR_SPACE_KEY
```

**注意：** 对于 Atlassian Cloud，`CONF_PASSWORD` 应该是 API Token，不是密码。
获取 API Token：https://id.atlassian.com/manage-profile/security/api-tokens

### 3. 测试 MCP Server

```bash
npm run mcp
```

如果配置正确，你会看到 "Confluence MCP Server 已启动" 的消息。

## 在 Cursor 中配置

### 方法 1：全局配置（推荐）

编辑 Cursor 的 MCP 配置文件：

**macOS/Linux:**
```bash
code ~/.cursor/mcp.json
```

**Windows:**
```powershell
code %APPDATA%\Cursor\mcp.json
```

添加以下配置：

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

**请替换以下内容：**
- 将路径 `/Users/caijing/work/confluence-node/mcp-server.js` 改为你的实际路径
- 填写你的 Confluence 实例信息

### 方法 2：使用 npm bin

如果你想全局安装：

```bash
npm link
```

然后在 `mcp.json` 中使用：

```json
{
  "mcpServers": {
    "confluence": {
      "command": "confluence-mcp",
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

## 可用工具列表

MCP Server 提供以下工具供 AI 使用：

### 📋 Space 管理

#### `confluence_list_spaces`
列出所有可访问的 Confluence Spaces

**参数：**
- `type` (可选): "global" 或 "personal"

### 📄 页面操作

#### `confluence_create_page`
创建新的 Confluence 页面

**参数：**
- `title` (必需): 页面标题
- `space` (可选): Space Key，默认使用环境变量
- `content` (可选): 页面内容（HTML）
- `parentId` (可选): 父页面 ID

#### `confluence_update_page`
更新现有页面

**参数：**
- `title` (可选): 页面标题（用于查找）
- `pageId` (可选): 页面 ID
- `space` (可选): Space Key
- `content` (可选): 新内容
- `newTitle` (可选): 新标题

#### `confluence_upsert_page`
创建或更新页面（智能判断）

**参数：**
- `title` (必需): 页面标题
- `space` (可选): Space Key
- `content` (可选): 页面内容
- `parentId` (可选): 父页面 ID

#### `confluence_get_page`
获取页面详细信息

**参数：**
- `title` (可选): 页面标题
- `pageId` (可选): 页面 ID
- `space` (可选): Space Key

#### `confluence_delete_page`
删除页面

**参数：**
- `pageId` (必需): 页面 ID

### 🔍 搜索功能

#### `confluence_search_pages`
搜索页面

**参数：**
- `query` (必需): 搜索关键词
- `space` (可选): 限制在指定 Space
- `limit` (可选): 结果数量，默认 25

#### `confluence_get_child_pages`
获取子页面列表

**参数：**
- `parentId` (必需): 父页面 ID
- `limit` (可选): 结果数量，默认 50

#### `confluence_get_page_history`
获取页面历史版本

**参数：**
- `pageId` (必需): 页面 ID
- `limit` (可选): 历史记录数量，默认 10

### 🧩 宏辅助

#### `confluence_build_code_macro`
生成 Confluence (KMS) 的代码宏（storage format HTML），用于安全插入代码块

## 使用示例

重启 Cursor 后，你可以在对话中使用 MCP 工具：

### 示例 1：创建新页面

```
请帮我在 Confluence 中创建一个新页面，标题是"产品需求文档"，内容包括：
## 背景
...
## 需求
...
```

### 示例 2：更新现有页面

```
更新"产品需求文档"这个页面，添加以下内容...
```

### 示例 3：搜索页面

```
帮我搜索所有包含"API"的页面
```

### 示例 4：查看可用 Spaces

```
列出我可以访问的所有 Confluence Spaces
```

## 常见问题

### 1. MCP Server 无法启动

检查：
- 环境变量配置是否正确
- Confluence URL 是否可访问
- API Token 是否有效

### 2. 权限错误

确保：
- API Token 有足够的权限
- 用户对目标 Space 有写入权限

### 3. 找不到 Space

使用 `confluence_list_spaces` 工具查看所有可访问的 Spaces，确保使用正确的 Space Key。

## 开发和调试

### 查看 MCP 日志

Cursor 的 MCP 日志位置：
- macOS: `~/Library/Logs/Cursor/`
- Windows: `%APPDATA%\Cursor\logs\`

### 测试单个工具

你可以使用 MCP Inspector 来测试工具：

```bash
npx @modelcontextprotocol/inspector node mcp-server.js
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
