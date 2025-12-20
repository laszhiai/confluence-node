# 自定义模板目录示例

这个示例展示如何使用自定义模板目录。

## 目录结构

```
examples/custom-templates-example/
├── README.md              # 本文件
├── .env.example          # 环境配置示例
└── templates/            # 自定义模板目录
    ├── sprint-planning.html
    ├── weekly-report.html
    └── api-specification.html
```

## 使用方法

### 1. 配置环境变量

创建 `.env` 文件：

```bash
# 复制项目根目录的配置
CONF_BASE_URL=https://your-confluence-instance.atlassian.net
CONF_USERNAME=your-email@example.com
CONF_PASSWORD=your-api-token
CONF_SPACE=YOUR_SPACE_KEY

# 指定自定义模板目录（相对于项目根目录）
CONF_TEMPLATES_DIR=./examples/custom-templates-example/templates
```

或使用绝对路径：

```bash
CONF_TEMPLATES_DIR=/Users/yourname/work/confluence-node/examples/custom-templates-example/templates
```

### 2. 在 Cursor 中使用

重启 Cursor 后，这些自定义模板就可以使用了：

```
列出所有可用模板
```

你会看到：
- `sprint-planning` - 来自自定义目录
- `weekly-report` - 来自自定义目录
- `api-specification` - 来自自定义目录
- `meeting-notes` - 来自内置目录
- `tech-design` - 来自内置目录
- 等等...

### 3. 创建页面

```
用 sprint-planning 模板在 KMS 创建一个 Sprint 10 规划文档
```

```
用 weekly-report 模板创建本周的周报
```

## 模板说明

### sprint-planning.html
Sprint 规划模板，包含：
- Sprint 信息
- Sprint 目标
- Story 列表
- 团队容量
- 风险评估

### weekly-report.html
周报模板，包含：
- 本周工作总结
- 下周工作计划
- 遇到的问题
- 需要的支持

### api-specification.html
API 规范模板，包含：
- API 概述
- 接口列表
- 请求/响应格式
- 错误码说明
- 示例代码

## 优势

### 1. 团队协作

整个团队可以使用统一的模板库：

```bash
# 团队共享目录
CONF_TEMPLATES_DIR=/shared/team/confluence-templates
```

### 2. 版本控制

模板可以纳入 Git 管理：

```bash
git add examples/custom-templates-example/templates/
git commit -m "Update sprint planning template"
```

### 3. 灵活切换

不同项目可以使用不同的模板集：

```bash
# 项目 A
CONF_TEMPLATES_DIR=./project-a-templates

# 项目 B
CONF_TEMPLATES_DIR=./project-b-templates
```

### 4. 覆盖内置模板

如果你不喜欢内置的 `tech-design` 模板，可以创建自己的版本：

```bash
# 在自定义目录创建同名模板
touch templates/tech-design.html
```

自定义的会优先被使用！

## 注意事项

1. **路径格式**：支持相对路径和绝对路径
2. **文件扩展名**：必须是 `.html`
3. **优先级**：自定义模板 > 内置模板
4. **重启 Cursor**：修改配置后需要重启 Cursor

## 相关文档

- [模板系统完整文档](../../TEMPLATES_README.md)
- [快速开始指南](../../QUICKSTART.md)
