#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const { CONF_BASE_URL, CONF_USERNAME, CONF_PASSWORD, CONF_SPACE } = process.env;
// 创建 axios 实例
const api = axios.create({
    baseURL: `${CONF_BASE_URL}/rest/api`,
    auth: {
        username: CONF_USERNAME ?? "",
        password: CONF_PASSWORD ?? "",
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`获取页面失败: ${message}`);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`获取页面失败: ${message}`);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`创建页面失败: ${message}`);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`更新页面失败: ${message}`);
    }
}
async function deletePage(pageId) {
    try {
        await api.delete(`/content/${pageId}`);
        return { success: true, message: "页面已删除" };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`删除页面失败: ${message}`);
    }
}
async function listAllSpaces({ type = "global", limit = 200, } = {}) {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`获取 Spaces 失败: ${message}`);
    }
}
async function searchPages(space, query, limit = 25) {
    try {
        const cql = space ? `space=${space} AND title~"${query}"` : `title~"${query}"`;
        const res = await api.get("/content/search", {
            params: {
                cql,
                limit,
                expand: "space,version",
            },
        });
        return res.data.results;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`搜索页面失败: ${message}`);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`获取子页面失败: ${message}`);
    }
}
async function getPageHistory(pageId, limit = 10) {
    try {
        const res = await api.get(`/content/${pageId}/history`, {
            params: { limit },
        });
        return res.data;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`获取页面历史失败: ${message}`);
    }
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
    if (!language)
        return null;
    const raw = String(language).trim().toLowerCase();
    if (!raw)
        return null;
    const normalized = CODE_LANGUAGE_ALIASES.get(raw) ?? raw;
    return KNOWN_SAFE_CODE_LANGUAGES.has(normalized) ? normalized : null;
}
/**
 * 生成 Confluence/KMS Code Macro（storage format）
 * 尽量只使用最稳的参数，避免 InvalidValueException。
 */
function buildCodeMacro({ code, language, linenumbers = false, collapse = false, }) {
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
    return (`<ac:structured-macro ac:name="code">` +
        params.join("") +
        `<ac:plain-text-body><![CDATA[${safeCode}]]></ac:plain-text-body>` +
        `</ac:structured-macro>`);
}
// ===== MCP Server 实现 =====
const server = new Server({
    name: "confluence-kms-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
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
                name: "confluence_build_code_macro",
                description: "生成 Confluence (KMS) 的代码宏（storage format HTML），用于安全插入代码块，避免“代码宏出错: InvalidValueException”。",
                inputSchema: {
                    type: "object",
                    properties: {
                        code: {
                            type: "string",
                            description: "代码内容（原始文本，会自动用 CDATA 包裹并处理特殊序列）",
                        },
                        language: {
                            type: "string",
                            description: "可选：语言（支持常见别名，如 js/ts/sh/yml，会自动归一化；无法识别时将省略 language 参数）",
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
    const { name, arguments: argsRaw } = request.params;
    const args = (argsRaw ?? {});
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
                const content = args.content;
                if (!content) {
                    throw new Error("必须提供 content");
                }
                const result = await createPage(space ?? "", args.title, content, args.parentId ?? null);
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
                }
                else {
                    const space = args.space || CONF_SPACE;
                    page = await getPage(space ?? "", args.title);
                    if (!page) {
                        throw new Error(`页面不存在: ${args.title}`);
                    }
                }
                const content = args.content;
                const result = await updatePage(page, content, args.newTitle ?? null);
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
                const content = args.content;
                if (!content) {
                    throw new Error("必须提供 content");
                }
                const existingPage = await getPage(space ?? "", args.title);
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
                }
                result = await createPage(space ?? "", args.title, content, args.parentId ?? null);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ 页面创建成功！\n\nID: ${result.id}\n标题: ${result.title}\nURL: ${CONF_BASE_URL}${result._links.webui}`,
                        },
                    ],
                };
            }
            case "confluence_get_page": {
                let page;
                if (args.pageId) {
                    page = await getPageById(args.pageId);
                }
                else {
                    const space = args.space || CONF_SPACE;
                    page = await getPage(space ?? "", args.title);
                }
                if (!page) {
                    throw new Error("页面不存在");
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                id: page.id,
                                title: page.title,
                                version: page.version.number,
                                space: page.space.key,
                                url: `${CONF_BASE_URL}${page._links.webui}`,
                                content: page.body?.storage?.value,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "confluence_delete_page": {
                await deletePage(args.pageId);
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
                const results = await searchPages(args.space, args.query, args.limit || 25);
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
            case "confluence_build_code_macro": {
                const macro = buildCodeMacro({
                    code: args.code,
                    language: args.language ?? undefined,
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text",
                    text: `❌ 错误: ${message}`,
                },
            ],
            isError: true,
        };
    }
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
//# sourceMappingURL=mcp-server.js.map