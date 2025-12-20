# 模板系统使用指南

## 概述

Confluence MCP Server 提供了灵活的模板系统，支持：

- ✅ 内置模板（预置常用模板）
- ✅ 自定义模板目录
- ✅ 多级模板优先级
- ✅ 动态模板创建和管理

## 模板目录优先级

系统按以下顺序查找模板（优先级从高到低）：

### 1. 自定义模板目录（最高优先级）⭐

通过环境变量 `CONF_TEMPLATES_DIR` 设置：

```bash
# .env 文件
CONF_TEMPLATES_DIR=/path/to/your/templates
```

或在 Cursor MCP 配置中：

```json
{
  "mcpServers": {
    "confluence": {
      "env": {
        "CONF_TEMPLATES_DIR": "/Users/yourname/confluence-templates"
      }
    }
  }
}
```

**支持的路径格式：**

```bash
# 绝对路径
CONF_TEMPLATES_DIR=/Users/yourname/confluence-templates

# 相对路径（相对于项目根目录）
CONF_TEMPLATES_DIR=../shared-templates
CONF_TEMPLATES_DIR=./custom-templates

# Windows 路径
CONF_TEMPLATES_DIR=C:\Users\yourname\templates
```

### 2. 内置模板目录

默认路径：`项目根目录/templates/`

预置模板：
- `template.html` - 基础模板
- `meeting-notes.html` - 会议纪要
- `tech-design.html` - 技术设计文档
- `code-review.html` - 代码评审文档

### 3. 根目录（向后兼容）

项目根目录下的 `.html` 文件（兼容旧版本）

## 使用场景

### 场景 1：使用内置模板

最简单的方式，无需配置：

```
在 KMS 创建一个会议纪要，使用 meeting-notes 模板
```

### 场景 2：团队共享模板

团队有统一的模板库，放在共享目录：

```bash
# .env
CONF_TEMPLATES_DIR=/shared/company/confluence-templates
```

目录结构：
```
/shared/company/confluence-templates/
├── project-proposal.html
├── weekly-report.html
├── incident-report.html
└── design-review.html
```

### 场景 3：多项目共享

多个项目共享同一套模板：

```bash
# 项目 A
CONF_TEMPLATES_DIR=../shared-templates

# 项目 B
CONF_TEMPLATES_DIR=../shared-templates
```

### 场景 4：覆盖内置模板

自定义目录中的模板会覆盖同名的内置模板：

```
内置: templates/tech-design.html
自定义: /custom/tech-design.html  ← 优先使用这个
```

## 模板管理

### 列出所有可用模板

```
列出所有 KMS 模板
```

返回示例：
```json
{
  "customTemplatesDir": "/Users/yourname/templates",
  "templates": [
    {
      "name": "project-proposal",
      "path": "/Users/yourname/templates/project-proposal.html",
      "source": "custom"
    },
    {
      "name": "meeting-notes",
      "path": "/path/to/project/templates/meeting-notes.html",
      "source": "builtin"
    }
  ]
}
```

### 加载模板内容

```
显示 tech-design 模板的内容
```

### 保存新模板

```
创建一个新模板叫 sprint-planning，内容包括：
- Sprint 目标
- Story 列表
- 团队容量
- 风险评估
```

**保存位置：**
- 如果配置了 `CONF_TEMPLATES_DIR`，保存到自定义目录
- 否则保存到内置 `templates/` 目录

## 配置示例

### 示例 1：个人开发者

使用内置模板，无需额外配置：

```bash
# .env
CONF_BASE_URL=https://your-instance.atlassian.net
CONF_USERNAME=your-email@example.com
CONF_PASSWORD=your-api-token
CONF_SPACE=YOUR_SPACE_KEY
# 不设置 CONF_TEMPLATES_DIR，使用默认的 templates/ 目录
```

### 示例 2：团队协作

团队共享模板目录：

```bash
# .env
CONF_BASE_URL=https://your-instance.atlassian.net
CONF_USERNAME=your-email@example.com
CONF_PASSWORD=your-api-token
CONF_SPACE=YOUR_SPACE_KEY
CONF_TEMPLATES_DIR=/shared/team/confluence-templates
```

### 示例 3：项目特定模板

每个项目有自己的模板集：

```bash
# .env
CONF_TEMPLATES_DIR=./project-templates
```

目录结构：
```
project/
├── confluence-node/
│   ├── mcp-server.js
│   └── templates/          # 内置模板（fallback）
└── project-templates/      # 项目特定模板（优先）
    ├── api-spec.html
    ├── release-notes.html
    └── user-guide.html
```

### 示例 4：多环境配置

开发和生产使用不同的模板：

```bash
# .env.development
CONF_TEMPLATES_DIR=./dev-templates

# .env.production
CONF_TEMPLATES_DIR=/company/prod-templates
```

## 模板文件格式

模板使用 Confluence Storage Format（HTML）：

```html
<h1>项目名称</h1>

<h2>项目概述</h2>
<p>项目描述...</p>

<h2>目标</h2>
<ul>
  <li>目标 1</li>
  <li>目标 2</li>
</ul>

<h2>时间表</h2>
<table>
  <thead>
    <tr>
      <th>阶段</th>
      <th>开始时间</th>
      <th>结束时间</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>需求分析</td>
      <td>YYYY-MM-DD</td>
      <td>YYYY-MM-DD</td>
    </tr>
  </tbody>
</table>
```

## 实用技巧

### 1. 版本控制模板

将模板目录加入 Git：

```bash
# 项目特定模板
git add project-templates/
git commit -m "Add project templates"

# 或使用 Git submodule 共享团队模板
git submodule add https://github.com/company/confluence-templates.git
```

### 2. 模板命名规范

建议的命名约定：

```
meeting-notes.html        # 会议纪要
tech-design.html          # 技术设计
code-review.html          # 代码评审
project-proposal.html     # 项目立项
sprint-planning.html      # Sprint 规划
weekly-report.html        # 周报
incident-report.html      # 故障报告
api-spec.html            # API 规范
release-notes.html       # 发布说明
```

### 3. 模板测试

测试模板是否正确：

```bash
# 1. 列出所有模板
npm run mcp  # 启动 MCP server

# 2. 在 Cursor 中测试
"列出所有模板"
"加载 your-template 模板"
"用 your-template 创建测试页面"
```

### 4. 模板共享

与团队共享模板：

```bash
# 1. 创建共享仓库
git init confluence-templates
cd confluence-templates

# 2. 添加模板文件
cp /path/to/templates/*.html .
git add .
git commit -m "Initial templates"

# 3. 团队成员使用
CONF_TEMPLATES_DIR=/path/to/confluence-templates
```

## 故障排查

### 模板找不到

```
❌ 错误: 模板不存在: my-template
```

**解决方法：**
1. 检查模板文件名是否正确（不含 `.html` 后缀）
2. 使用 `列出所有模板` 查看可用模板
3. 检查 `CONF_TEMPLATES_DIR` 路径是否正确
4. 确认文件扩展名是 `.html`

### 自定义目录不生效

**检查清单：**
1. 环境变量是否正确设置
2. 路径是否存在且可访问
3. 重启 Cursor 使配置生效

### 模板优先级问题

如果自定义模板没有生效：

1. 检查模板名称是否完全一致
2. 确认自定义目录路径正确
3. 查看 `列出所有模板` 的 `source` 字段

## 最佳实践

### ✅ 推荐做法

1. **使用版本控制** - 将模板纳入 Git 管理
2. **统一命名** - 遵循团队的命名规范
3. **文档化** - 为每个模板添加使用说明
4. **定期审查** - 定期更新和优化模板
5. **分类组织** - 按类型组织模板文件

### ❌ 避免的做法

1. 不要在模板中硬编码具体的项目信息
2. 不要使用特殊字符命名模板文件
3. 不要频繁修改已发布的模板（考虑版本控制）

## 高级用法

### 条件模板选择

根据不同场景选择模板：

```
如果是技术类文档，使用 tech-design 模板
如果是会议记录，使用 meeting-notes 模板
如果是代码评审，使用 code-review 模板
```

### 模板组合

组合使用多个模板的部分：

```
创建一个文档，包含：
- meeting-notes 模板的会议信息部分
- tech-design 模板的技术方案部分
```

### 动态模板

让 AI 帮你创建定制模板：

```
创建一个新模板叫 quarterly-okr，包括：
- 季度目标（Objectives）
- 关键结果（Key Results）
- 进度跟踪表
- 风险和挑战
```

---

**相关文档：**
- [快速开始](./QUICKSTART.md)
- [MCP 完整文档](./MCP_README.md)
- [使用示例](./USAGE_EXAMPLES.md)
