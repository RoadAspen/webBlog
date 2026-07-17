# 第 15 章：MCP — 通用工具协议

## 为什么 MCP 比 Claude Code 更重要

本书前面的章节都在讲 Claude Code 的内部实现，但这一章不太一样。MCP，也就是模型上下文协议，是一套任何智能体都可以实现的开放规范。Claude Code 的 MCP 子系统只是当前最完整的生产级客户端之一。如果你正在构建一个需要调用外部工具的智能体，不论用什么语言、接什么模型，这一章里的很多模式都可以直接借鉴。

核心命题很简单：MCP 定义了一套 JSON-RPC 2.0 协议，用于客户端（智能体）和服务器（工具提供方）之间的工具发现与调用。客户端通过 `tools/list` 了解服务器提供了什么，再通过 `tools/call` 发起执行。服务器则用名称、描述和输入 JSON Schema 来描述每个工具。协议本体其实就这么多。其余一切，比如传输方式、身份验证、配置加载、工具名称规范化，都是为了让这份简洁规范在真实世界里真正落地。

Claude Code 的 MCP 实现跨越四个核心文件：“types.ts”、“client.ts”、“auth.ts”和“InProcessTransport.ts”。它们共同支持八种传输类型、七种配置范围、跨两个 RFC 的 OAuth 发现以及一个工具包装层，该工具包装层使 MCP 工具与内置工具无法区分 - 与第 6 章中介绍的“工具”接口相同。本章将介绍每一层。

## 八种传输类型

任何 MCP 集成中的第一个设计决策是客户端如何与服务器通信。 Claude Code 支持八种传输配置：

三个设计选择值得注意。首先，“stdio”是默认值——当省略“type”时，系统假定一个本地子进程。这与最早的 MCP 配置向后兼容。其次，获取包装器堆栈：在升压检测之外、在基本获取之外的超时包装。每个包装器处理一个问题。第三，“ws-ide”分支具有 Bun/Node 运行时拆分 — Bun 的“WebSocket”本身接受代理和 TLS 选项，而 Node 则需要“ws”包。

什么时候用哪个。 对于本地工具（文件系统、数据库、自定义脚本），“stdio”——没有网络，没有身份验证，只有管道。对于远程服务，“http”（流式 HTTP）是当前的规范建议。 “sse”是遗留的，但被广泛部署。 “sdk”、IDE 和“claudeai-proxy”类型是其各自生态系统的内部类型。

## 配置加载和范围界定

## MCP 服务器配置从七个范围加载，并进行合并和重复数据删除：

范围 来源 工作目录中的信任 `local` `.mcp.json` 需要用户批准 `user` `~/.claude.json` mcpServers 字段 用户管理的 `project` 项目级配置 共享项目设置 `enterprise` 托管企业配置 由组织预先批准 `托管` 插件提供的服务器 自动发现 `claudeai` Claude.ai Web 界面 通过 Web “动态”预先授权 运行时注入 (SDK) 以编程方式添加了
重复数据删除是基于内容的，而不是基于名称的。 名称不同但命令或 URL 相同的两个服务器被识别为同一服务器。 `getMcpServerSignature()` 函数计算一个规范密钥：`stdio:["command","arg1"]` 对于本地服务器，`url:https://example.com/mcp` 对于远程服务器。签名与手动配置匹配的插件提供的服务器将被抑制。

## 工具包装：从 MCP 到 Claude Code

当连接成功时，客户端调用“tools/list”。每个工具定义都会转换为 Claude Code 的内部“Tool”接口 - 与内置工具使用的接口相同。包装后，模型无法区分内置工具和 MCP 工具。

## 包裹过程分为四个阶段：

1. 名称规范化。 `normalizeNameForMCP()` 用下划线替换无效字符。完全限定名称遵循“mcp__{serverName}__{toolName}”。

2.描述截断。 上限为 2,048 个字符。据观察，OpenAPI 生成的服务器将 15-60KB 的数据转储到“tool.description”中——单个工具每轮大约转储 15,000 个令牌。

3. 模式直通。 该工具的“inputSchema”直接传递到 API。包装时没有转换、没有验证。架构错误在调用时出现，而不是在注册时出现。

4.注释映射。 MCP 注释映射到行为标志：“readOnlyHint”标记工具可以安全地并发执行（如第 7 章的流式执行器中所述），“destroyHint”触发额外的权限审查。这些注释来自 MCP 服务器——恶意服务器可以将破坏性工具标记为只读。这是一个公认的信任边界，但值得理解：用户选择进入服务器，而将破坏性工具标记为只读的恶意服务器是真正的攻击媒介。系统接受这种权衡，因为替代方案（完全忽略注释）将阻止合法服务器改善用户体验。

## MCP 服务器的 OAuth

远程 MCP 服务器通常需要身份验证。 Claude Code 通过基于 RFC 的发现、跨应用程序访问和错误正文标准化来实现完整的 OAuth 2.0 + PKCE 流程。

## 探索链

“authServerMetadataUrl”逃逸口的存在是因为某些 OAuth 服务器既不实现 RFC，也不实现 RFC。

## 跨应用程序访问 (XAA)

当 MCP 服务器配置具有“oauth.xaa: true”时，系统通过身份提供者执行联合令牌交换 — 一次 IdP 登录可解锁多个 MCP 服务器。

## 误差体标准化

“normalizeOAuthErrorBody()”函数处理违反规范的 OAuth 服务器。 Slack 针对错误响应返回 HTTP 200，并将错误隐藏在 JSON 正文中。该函数查看 2xx POST 响应主体，当主体与“OAuthErrorResponseSchema”匹配但不与“OAuthTokensSchema”匹配时，将响应重写为 HTTP 400。 它还将 Slack 特定的错误代码（“invalid_refresh_token”、“expired_refresh_token”、“token_expired”）标准化为标准“invalid_grant”。

## 进程内传输

并非每个 MCP 服务器都需要是单独的进程。 `InProcessTransport` 类允许在同一进程中运行 MCP 服务器和客户端：

` 分机
` 类 InProcessTransport 实现 Transport {
异步发送（消息：JSONRPCMessage）：Promise <void> {
if ( this.close) throw new Error ( '传输已关闭' )
queueMicrotask (() => { this.peer?. onmessage?.(message) })
}
异步 close(): Promise <void> {
if (this.close) 返回
这个.close = true
这个。 关闭？.()
if (这个.peer &&!这个.peer.close) {
这个.peer.close = true
这个.peer。 关闭？.()
}
}
} `
`

整个文件有63行。有两个设计决策值得关注。首先，“send()”通过“queueMicrotask()”传递，以防止同步请求/响应周期中的堆栈深度问题。其次，“close()”级联到对等点，防止半打开状态。 Chrome MCP 服务器和计算机使用 MCP 服务器都使用此模式。

## 连接管理

## 连接状态

每个 MCP 服务器连接都存在以下五种状态之一：“已连接”、“失败”、“需要身份验证”（具有 15 分钟 TTL 缓存，以防止 30 个服务器独立发现相同的过期令牌）、“待处理”或“已禁用”。

## 会话过期检测

MCP 的 Streamable HTTP 传输使用会话 ID。当服务器重新启动时，请求返回 HTTP 404 和 JSON-RPC 错误代码 -32001。 `isMcpSessionExpiredError()` 函数检查这两个信号 - 请注意，它使用错误消息中的字符串包含来检测错误代码，这是实用但脆弱的：

` 分机
` 导出函数 isMcpSessionExpiredError ( 错误: 错误 ): boolean {
const httpStatus = '代码' 错误？ （任何错误）。代码：未定义
if (httpStatus!== 404 ) 返回 false
返回错误信息。 包括 ('"代码":-32001') ||
错误信息。 包括（'“代码”：-32001'）
} `
`

检测到后，连接缓存将被清除，并且调用会重试一次。

## 批量连接

本地服务器以 3 个为一组进行连接（生成进程可能会耗尽文件描述符），远程服务器以 20 个为一组进行连接。React 上下文提供程序“MCPConnectionManager.tsx”管理生命周期，将当前连接与新配置进行比较。

## Claude.ai 代理传输

“claudeai-proxy”传输说明了一种常见的代理集成模式：通过中介进行连接。 Claude.ai 订阅者通过 Web 界面配置 MCP“连接器”，CLI 通过 Claude.ai 处理供应商端 OAuth 的基础设施进行路由。

`createClaudeAiProxyFetch()` 函数在请求时捕获 `sentToken`，而不是在 401 之后重新读取。在来自多个连接器的并发 401 情况下，另一个连接器的重试可能已经刷新了令牌。即使刷新处理程序返回 false，该函数也会检查并发刷新 - 这是另一个连接器赢得锁定文件竞赛的“ELOCKED 争用”情况。

## 超时架构

## MCP 超时是分层的，每种超时都针对不同的故障模式提供保护：

层持续时间可防止连接 30 秒 无法访问或启动缓慢的服务器 每个请求 60 秒（每个请求都是新的） 过时的超时信号错误 工具调用 ~27.8 小时 合法的长时间操作 Auth 每个 OAuth 请求 30 秒 无法访问的 OAuth 服务器
每个请求的超时值得强调。早期的实现在连接时创建了一个“AbortSignal.timeout(60000)”。 60 秒的空闲时间后，下一个请求将立即中止——信号已经过期。修复：“wrapFetchWithTimeout()”为每个请求创建一个新的超时信号。它还将“Accept”标头标准化，作为针对丢弃该标头的运行时和代理的最后一步防御。

## 应用此：将 MCP 集成到您自己的代理中

从 stdio 开始，稍后增加复杂性。 `StdioClientTransport` 处理一切：生成、管道、终止。一行配置、一种传输类，您就拥有了 MCP 工具。

标准化名称并截断描述。 名称必须匹配“^[a-zA-Z0-9_-]{1,64}$”。前缀为 `mcp__{serverName}__` 以避免冲突。描述上限为 2,048 个字符 — 否则 OpenAPI 生成的服务器将浪费上下文令牌。

延迟处理身份验证。 在服务器返回 401 之前不要尝试 OAuth。大多数 stdio 服务器不需要身份验证。

对内置服务器使用进程内传输。 `createLinkedTransportPair()` 消除了您控制的服务器的子进程开销。

尊重工具注释并清理输出。 `readOnlyHint` 启用并发执行。清理针对可能误导模型的恶意 Unicode（双向覆盖、零宽度连接器）的响应。

MCP 协议故意做到最小化——两种 JSON-RPC 方法。这些方法和生产部署之间的一切都是工程：八个传输、七个配置范围、两个 OAuth RFC 和超时分层。 Claude Code 的实施展示了该工程的规模。

下一章将研究当代理超出本地主机时会发生什么：远程执行协议让 Claude Code 在云容器中运行，接受来自 Web 浏览器的指令，并通过凭证注入代理传输 API 流量。