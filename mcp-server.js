#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { 
  CONF_BASE_URL, 
  CONF_USERNAME, 
  CONF_PASSWORD, 
  CONF_SPACE,
  CONF_TEMPLATES_DIR // 自定义模板目录路径（可选）
} = process.env;

// 创建 axios 实例
const api = axios.create({
  baseURL: `${CONF_BASE_URL}/rest/api`,
  auth: {
    username: CONF_USERNAME,
    password: CONF_PASSWORD,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== Confluence API 函数 =====

async function getPage(space, title) {
  try {
    const res = await api.get("/content", {
      params: {
        spaceKey: space,
        title,
        expand: "version,space,body.storage",
      },
    });
    return res.data.results[0];
  } catch (error) {
    throw new Error(`获取页面失败: ${error.message}`);
  }
}

async function getPageById(pageId) {
  try {
    const res = await api.get(`/content/${pageId}`, {
      params: {
        expand: "version,space,body.storage",
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(`获取页面失败: ${error.message}`);
  }
}

async function createPage(space, title, content, parentId = null) {
  try {
    const pageData = {
      type: "page",
      title,
      space: { key: space },
      body: {
        storage: {
          value: content,
          representation: "storage",
        },
      },
    };

    if (parentId) {
      pageData.ancestors = [{ id: parentId }];
    }

    const res = await api.post("/content", pageData);
    return res.data;
  } catch (error) {
    throw new Error(`创建页面失败: ${error.message}`);
  }
}

async function updatePage(page, content, title = null) {
  try {
    const res = await api.put(`/content/${page.id}`, {
      id: page.id,
      type: "page",
      title: title || page.title,
      version: {
        number: page.version.number + 1,
      },
      body: {
        storage: {
          value: content,
          representation: "storage",
        },
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(`更新页面失败: ${error.message}`);
  }
}

async function deletePage(pageId) {
  try {
    await api.delete(`/content/${pageId}`);
    return { success: true, message: "页面已删除" };
  } catch (error) {
    throw new Error(`删除页面失败: ${error.message}`);
  }
}

async function listAllSpaces({ type = "global", limit = 200 } = {}) {
  try {
    const res = await api.get("/space", {
      params: { type, limit },
    });
    return res.data.results.map((s) => ({
      key: s.key,
      name: s.name,
      type: s.type,
      id: s.id,
    }));
  } catch (error) {
    throw new Error(`获取 Spaces 失败: ${error.message}`);
  }
}

async function searchPages(space, query, limit = 25) {
  try {
    const cql = space
      ? `space=${space} AND title~"${query}"`
      : `title~"${query}"`;

    const res = await api.get("/content/search", {
      params: {
        cql,
        limit,
        expand: "space,version",
      },
    });
    return res.data.results;
  } catch (error) {
    throw new Error(`搜索页面失败: ${error.message}`);
  }
}

async function getChildPages(parentId, limit = 50) {
  try {
    const res = await api.get(`/content/${parentId}/child/page`, {
      params: {
        limit,
        expand: "version,space",
      },
    });
    return res.data.results;
  } catch (error) {
    throw new Error(`获取子页面失败: ${error.message}`);
  }
}

async function getPageHistory(pageId, limit = 10) {
  try {
    const res = await api.get(`/content/${pageId}/history`, {
      params: { limit },
    });
    return res.data;
  } catch (error) {
    throw new Error(`获取页面历史失败: ${error.message}`);
  }
}

// ===== 模板管理 =====

/**
 * 获取所有模板目录（按优先级排序）
 * 1. 自定义目录（CONF_TEMPLATES_DIR）
 * 2. 内置 templates/ 目录
 * 3. 根目录（兼容旧版）
 */
function getTemplateDirs() {
  const dirs = [];
  
  // 1. 自定义模板目录（最高优先级）
  if (CONF_TEMPLATES_DIR) {
    const customDir = path.isAbsolute(CONF_TEMPLATES_DIR)
      ? CONF_TEMPLATES_DIR
      : path.join(__dirname, CONF_TEMPLATES_DIR);
    dirs.push({ path: customDir, type: 'custom' });
  }
  
  // 2. 内置 templates/ 目录
  dirs.push({ 
    path: path.join(__dirname, "templates"), 
    type: 'builtin' 
  });
  
  // 3. 根目录（向后兼容）
  dirs.push({ 
    path: __dirname, 
    type: 'root' 
  });
  
  return dirs;
}

function listTemplates() {
  const templateDirs = getTemplateDirs();
  const templates = new Map(); // 使用 Map 去重，保留优先级高的
  
  for (const dir of templateDirs) {
    if (!fs.existsSync(dir.path)) {
      if (dir.type === 'builtin') {
        // 确保内置目录存在
        fs.mkdirSync(dir.path, { recursive: true });
      }
      continue;
    }
    
    try {
      const files = fs.readdirSync(dir.path).filter((f) => f.endsWith(".html"));
      
      for (const file of files) {
        const name = file.replace(".html", "");
        
        // 如果模板名已存在，保留优先级更高的（先找到的）
        if (!templates.has(name)) {
          templates.set(name, {
            name,
            path: path.join(dir.path, file),
            source: dir.type,
          });
        }
      }
    } catch (error) {
      console.error(`读取模板目录失败 ${dir.path}:`, error.message);
    }
  }
  
  return Array.from(templates.values());
}

function loadTemplate(templateName) {
  const templateDirs = getTemplateDirs();
  
  // 按优先级查找模板
  for (const dir of templateDirs) {
    if (!fs.existsSync(dir.path)) {
      continue;
    }
    
    const templatePath = path.join(dir.path, `${templateName}.html`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf-8");
    }
  }
  
  throw new Error(`模板不存在: ${templateName}`);
}

function saveTemplate(templateName, content) {
  // 保存到自定义目录（如果配置了），否则保存到内置目录
  let targetDir;
  
  if (CONF_TEMPLATES_DIR) {
    targetDir = path.isAbsolute(CONF_TEMPLATES_DIR)
      ? CONF_TEMPLATES_DIR
      : path.join(__dirname, CONF_TEMPLATES_DIR);
  } else {
    targetDir = path.join(__dirname, "templates");
  }
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const templatePath = path.join(targetDir, `${templateName}.html`);
  fs.writeFileSync(templatePath, content, "utf-8");
  
  return { 
    success: true, 
    path: templatePath,
    directory: targetDir 
  };
}

// ===== Confluence/KMS 宏（macro）辅助 =====

/**
 * CDATA 内部不能出现 "]]>"，需要拆分/转义
 */
function escapeForCdata(text) {
  return String(text ?? "").replaceAll("]]>", "]]]]><![CDATA[>");
}

/**
 * Confluence Code Macro 支持的 language 值在不同版本/插件可能有差异。
 * 为了避免 InvalidValueException，这里做常见别名归一化；无法识别时直接不写 language 参数（最稳）。
 */
const CODE_LANGUAGE_ALIASES = new Map([
  ["js", "javascript"],
  ["jsx", "javascript"],
  ["node", "javascript"],
  ["ts", "typescript"],
  ["tsx", "typescript"],
  ["sh", "bash"],
  ["shell", "bash"],
  ["zsh", "bash"],
  ["yml", "yaml"],
  ["py", "python"],
  ["golang", "go"],
  ["ps", "powershell"],
]);

const KNOWN_SAFE_CODE_LANGUAGES = new Set([
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "diff",
  "go",
  "groovy",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "makefile",
  "objectivec",
  "perl",
  "php",
  "plaintext",
  "powershell",
  "python",
  "ruby",
  "rust",
  "scala",
  "sql",
  "swift",
  "typescript",
  "xml",
  "yaml",
]);

function normalizeCodeLanguage(language) {
  if (!language) return null;
  const raw = String(language).trim().toLowerCase();
  if (!raw) return null;
  const normalized = CODE_LANGUAGE_ALIASES.get(raw) ?? raw;
  return KNOWN_SAFE_CODE_LANGUAGES.has(normalized) ? normalized : null;
}

/**
 * 生成 Confluence/KMS Code Macro（storage format）
 * 尽量只使用最稳的参数，避免 InvalidValueException。
 */
function buildCodeMacro({ code, language, linenumbers = false, collapse = false } = {}) {
  const safeCode = escapeForCdata(code);
  const lang = normalizeCodeLanguage(language);

  const params = [];
  if (lang) {
    params.push(`<ac:parameter ac:name="language">${lang}</ac:parameter>`);
  }
  if (typeof linenumbers === "boolean") {
    params.push(`<ac:parameter ac:name="linenumbers">${linenumbers ? "true" : "false"}</ac:parameter>`);
  }
  if (typeof collapse === "boolean") {
    params.push(`<ac:parameter ac:name="collapse">${collapse ? "true" : "false"}</ac:parameter>`);
  }

  return (
    `<ac:structured-macro ac:name="code">` +
    params.join("") +
    `<ac:plain-text-body><![CDATA[${safeCode}]]></ac:plain-text-body>` +
    `</ac:structured-macro>`
  );
}

// ===== MCP Server 实现 =====

const server = new Server(
  {
    name: "confluence-kms-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 列出所有工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "confluence_list_spaces",
        description: "列出当前用户可访问的所有 Confluence (KMS) Spaces。注意：KMS 是公司内部对 Confluence 知识管理系统的别名，两者是同一个系统。",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Space 类型: global 或 personal",
              enum: ["global", "personal"],
              default: "global",
            },
          },
        },
      },
      {
        name: "confluence_create_page",
        description: "在指定的 Space 中创建新的 Confluence (KMS) 页面。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            space: {
              type: "string",
              description: "Space Key，如果不提供则使用环境变量中的 CONF_SPACE",
            },
            title: {
              type: "string",
              description: "页面标题",
            },
            content: {
              type: "string",
              description: "页面内容（Confluence Storage Format HTML）",
            },
            template: {
              type: "string",
              description: "可选：使用的模板名称（不含 .html 后缀）",
            },
            parentId: {
              type: "string",
              description: "可选：父页面 ID，用于创建子页面",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "confluence_update_page",
        description: "更新现有的 Confluence (KMS) 页面。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            space: {
              type: "string",
              description: "Space Key",
            },
            title: {
              type: "string",
              description: "页面标题（用于查找页面）",
            },
            pageId: {
              type: "string",
              description: "页面 ID（如果提供则直接使用 ID 而不是标题查找）",
            },
            content: {
              type: "string",
              description: "新的页面内容",
            },
            newTitle: {
              type: "string",
              description: "可选：新的页面标题",
            },
            template: {
              type: "string",
              description: "可选：使用的模板名称",
            },
          },
        },
      },
      {
        name: "confluence_upsert_page",
        description: "创建或更新 Confluence (KMS) 页面（如果页面存在则更新，否则创建）。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            space: {
              type: "string",
              description: "Space Key",
            },
            title: {
              type: "string",
              description: "页面标题",
            },
            content: {
              type: "string",
              description: "页面内容",
            },
            template: {
              type: "string",
              description: "可选：使用的模板名称",
            },
            parentId: {
              type: "string",
              description: "可选：父页面 ID（仅在创建新页面时使用）",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "confluence_get_page",
        description: "获取指定 Confluence (KMS) 页面的详细信息。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            space: {
              type: "string",
              description: "Space Key",
            },
            title: {
              type: "string",
              description: "页面标题",
            },
            pageId: {
              type: "string",
              description: "页面 ID（如果提供则直接使用 ID）",
            },
          },
        },
      },
      {
        name: "confluence_delete_page",
        description: "删除指定的 Confluence (KMS) 页面。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "要删除的页面 ID",
            },
          },
          required: ["pageId"],
        },
      },
      {
        name: "confluence_search_pages",
        description: "在 Confluence (KMS) 中搜索页面。KMS 是公司内部 Confluence 知识管理系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "搜索关键词",
            },
            space: {
              type: "string",
              description: "可选：限制在指定 Space 中搜索",
            },
            limit: {
              type: "number",
              description: "返回结果数量限制",
              default: 25,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "confluence_get_child_pages",
        description: "获取指定 Confluence (KMS) 页面的所有子页面。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            parentId: {
              type: "string",
              description: "父页面 ID",
            },
            limit: {
              type: "number",
              description: "返回结果数量限制",
              default: 50,
            },
          },
          required: ["parentId"],
        },
      },
      {
        name: "confluence_get_page_history",
        description: "获取 Confluence (KMS) 页面的版本历史。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "页面 ID",
            },
            limit: {
              type: "number",
              description: "返回历史记录数量",
              default: 10,
            },
          },
          required: ["pageId"],
        },
      },
      {
        name: "confluence_list_templates",
        description: "列出所有可用的 Confluence (KMS) 页面模板。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "confluence_load_template",
        description: "加载指定 Confluence (KMS) 模板的内容。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            templateName: {
              type: "string",
              description: "模板名称（不含 .html 后缀）",
            },
          },
          required: ["templateName"],
        },
      },
      {
        name: "confluence_save_template",
        description: "保存新的 Confluence (KMS) 模板。KMS 是公司内部 Confluence 系统的别名。",
        inputSchema: {
          type: "object",
          properties: {
            templateName: {
              type: "string",
              description: "模板名称（不含 .html 后缀）",
            },
            content: {
              type: "string",
              description: "模板内容（HTML）",
            },
          },
          required: ["templateName", "content"],
        },
      },
      {
        name: "confluence_build_code_macro",
        description:
          "生成 Confluence (KMS) 的代码宏（storage format HTML），用于安全插入代码块，避免“代码宏出错: InvalidValueException”。",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "代码内容（原始文本，会自动用 CDATA 包裹并处理特殊序列）",
            },
            language: {
              type: "string",
              description:
                "可选：语言（支持常见别名，如 js/ts/sh/yml，会自动归一化；无法识别时将省略 language 参数）",
            },
            linenumbers: {
              type: "boolean",
              description: "可选：是否显示行号（true/false）",
              default: false,
            },
            collapse: {
              type: "boolean",
              description: "可选：是否折叠（true/false）",
              default: false,
            },
          },
          required: ["code"],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "confluence_list_spaces": {
        const spaces = await listAllSpaces({ type: args.type || "global" });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(spaces, null, 2),
            },
          ],
        };
      }

      case "confluence_create_page": {
        const space = args.space || CONF_SPACE;
        let content = args.content;

        if (args.template) {
          content = loadTemplate(args.template);
        }

        if (!content) {
          throw new Error("必须提供 content 或 template");
        }

        const result = await createPage(
          space,
          args.title,
          content,
          args.parentId
        );

        return {
          content: [
            {
              type: "text",
              text: `✅ 页面创建成功！\n\nID: ${result.id}\n标题: ${result.title}\nURL: ${CONF_BASE_URL}${result._links.webui}`,
            },
          ],
        };
      }

      case "confluence_update_page": {
        let page;
        
        if (args.pageId) {
          page = await getPageById(args.pageId);
        } else {
          const space = args.space || CONF_SPACE;
          page = await getPage(space, args.title);
          if (!page) {
            throw new Error(`页面不存在: ${args.title}`);
          }
        }

        let content = args.content;
        if (args.template) {
          content = loadTemplate(args.template);
        }

        const result = await updatePage(page, content, args.newTitle);

        return {
          content: [
            {
              type: "text",
              text: `✅ 页面更新成功！\n\nID: ${result.id}\n标题: ${result.title}\n版本: ${result.version.number}\nURL: ${CONF_BASE_URL}${result._links.webui}`,
            },
          ],
        };
      }

      case "confluence_upsert_page": {
        const space = args.space || CONF_SPACE;
        let content = args.content;

        if (args.template) {
          content = loadTemplate(args.template);
        }

        if (!content) {
          throw new Error("必须提供 content 或 template");
        }

        const existingPage = await getPage(space, args.title);

        let result;
        if (existingPage) {
          result = await updatePage(existingPage, content);
          return {
            content: [
              {
                type: "text",
                text: `✅ 页面更新成功！\n\nID: ${result.id}\n标题: ${result.title}\n版本: ${result.version.number}\nURL: ${CONF_BASE_URL}${result._links.webui}`,
              },
            ],
          };
        } else {
          result = await createPage(space, args.title, content, args.parentId);
          return {
            content: [
              {
                type: "text",
                text: `✅ 页面创建成功！\n\nID: ${result.id}\n标题: ${result.title}\nURL: ${CONF_BASE_URL}${result._links.webui}`,
              },
            ],
          };
        }
      }

      case "confluence_get_page": {
        let page;
        
        if (args.pageId) {
          page = await getPageById(args.pageId);
        } else {
          const space = args.space || CONF_SPACE;
          page = await getPage(space, args.title);
        }

        if (!page) {
          throw new Error("页面不存在");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: page.id,
                  title: page.title,
                  version: page.version.number,
                  space: page.space.key,
                  url: `${CONF_BASE_URL}${page._links.webui}`,
                  content: page.body?.storage?.value,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "confluence_delete_page": {
        const result = await deletePage(args.pageId);
        return {
          content: [
            {
              type: "text",
              text: "✅ 页面已成功删除",
            },
          ],
        };
      }

      case "confluence_search_pages": {
        const results = await searchPages(
          args.space,
          args.query,
          args.limit || 25
        );

        const formatted = results.map((p) => ({
          id: p.id,
          title: p.title,
          space: p.space.key,
          version: p.version.number,
          url: `${CONF_BASE_URL}${p._links.webui}`,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case "confluence_get_child_pages": {
        const children = await getChildPages(args.parentId, args.limit || 50);

        const formatted = children.map((p) => ({
          id: p.id,
          title: p.title,
          space: p.space.key,
          version: p.version.number,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case "confluence_get_page_history": {
        const history = await getPageHistory(args.pageId, args.limit || 10);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(history, null, 2),
            },
          ],
        };
      }

      case "confluence_list_templates": {
        const templates = listTemplates();
        
        // 添加模板路径配置信息
        const info = {
          customTemplatesDir: CONF_TEMPLATES_DIR || "未配置（使用内置路径）",
          templates: templates,
        };
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "confluence_load_template": {
        const content = loadTemplate(args.templateName);
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "confluence_save_template": {
        const result = saveTemplate(args.templateName, args.content);
        return {
          content: [
            {
              type: "text",
              text: `✅ 模板已保存\n\n文件路径: ${result.path}\n保存目录: ${result.directory}`,
            },
          ],
        };
      }

      case "confluence_build_code_macro": {
        const macro = buildCodeMacro({
          code: args.code,
          language: args.language,
          linenumbers: args.linenumbers ?? false,
          collapse: args.collapse ?? false,
        });
        return {
          content: [
            {
              type: "text",
              text: macro,
            },
          ],
        };
      }

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ 错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 列出资源
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const templates = listTemplates();
  
  return {
    resources: templates.map((t) => ({
      uri: `template://${t.name}`,
      name: `Template: ${t.name}`,
      mimeType: "text/html",
      description: `Confluence (KMS) 页面模板: ${t.name}`,
    })),
  };
});

// 读取资源
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri.startsWith("template://")) {
    const templateName = uri.replace("template://", "");
    const content = loadTemplate(templateName);
    
    return {
      contents: [
        {
          uri,
          mimeType: "text/html",
          text: content,
        },
      ],
    };
  }
  
  throw new Error(`未知的资源 URI: ${uri}`);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence (KMS) MCP Server 已启动");
}

main().catch((error) => {
  console.error("服务器错误:", error);
  process.exit(1);
});
