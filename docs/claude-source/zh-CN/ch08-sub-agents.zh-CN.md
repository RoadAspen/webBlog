# 第 8 章：生成sub-agent

## 智力倍增

单一代理人的力量是强大的。它可以读取文件、编辑代码、运行测试、搜索网络并对结果进行推理。但是，一个代理在一次对话中可以执行的操作存在一个硬性上限：上下文窗口被填满，任务向需要不同功能的方向分支，并且工具执行的串行性质成为瓶颈。解决方案不是更大的模型。这是更多的代理。

Claude Code的sub-agent系统可以让模型请求帮助。当父代理遇到一项可以从委托中受益的任务时——不应污染主要对话的代码库搜索、需要对抗性思维的验证过程、一组可以并行运行的独立编辑——它会调用“代理”工具。该调用产生一个子代：一个完全独立的代理，具有自己的对话循环、自己的工具集、自己的权限边界和自己的中止控制器。孩子完成它的工作并返回结果。父母永远看不到孩子的内在推理，只看到最终的输出。

这不是一个方便的功能。它是从并行文件探索到协调员-工作人员层次结构再到多智能体群体团队等一切事物的架构基础。这一切都流经两个文件：定义面向模型的接口的“AgentTool.tsx”和实现生命周期的“runAgent.ts”。

设计挑战是巨大的。sub-agent需要足够的上下文来完成其工作，但又不能太多，以免在不相关的信息上浪费令牌。它需要足够严格的权限边界以保证安全，但又足够灵活以保证实用性。它需要生命周期管理来清理它接触到的每个资源，而不需要调用者记住要清理的内容。所有这些都必须适用于一系列代理类型——从廉价、快速、只读俳句搜索器到昂贵、彻底、Opus 支持的在后台运行对抗性测试的验证代理。

本章追溯了从模型的“我需要帮助”到完全可操作的sub-agent的路径。我们将检查模型看到的工具定义、创建执行环境的十五步生命周期、六种内置代理类型以及每种类型的优化目的、允许用户定义自定义代理的 frontmatter 系统，以及由此产生的设计原则。

关于术语的说明：在本章中，“父”指的是调用“Agent”工具的代理，“子”指的是生成的代理。父级通常（但并非总是）顶级 REPL 代理。在协调器模式下，协调器生成工人，即子工人。在嵌套场景中，子级本身可以生成孙子级 - 相同的生命周期递归地应用。

编排层跨越“tools/AgentTool/”、“tasks/”、“coordinator/”、“tools/SendMessageTool/”和“utils/swarm/”中的大约 40 个文件。本章重点介绍生成机制——AgentTool 定义和 runAgent 生命周期。下一章介绍运行时：进度跟踪、结果检索和多代理协调模式。

## AgentTool 定义

“AgentTool”以“Agent”名称注册，并带有旧别名“Task”，以便向后兼容旧的脚本、权限规则和Hook配置。它是使用标准的“buildTool()”工厂构建的，但其架构比系统中的任何其他工具都更加动态。

## 输入模式

输入模式是通过“lazySchema()”延迟构建的——我们在第 6 章中看到的一种模式，它将 zod 编译推迟到第一次使用。有两层：基本模式和添加多代理和隔离参数的完整模式。

## 基本字段始终存在：

字段类型 必需 目的 `description` `string` 是 任务的简短 3-5 个单词摘要 `prompt` `string` 是 代理的完整任务描述 `subagent_type` `string` 否 要使用哪个专用代理 `model` `enum('sonnet','opus','haiku')` 否 此代理的模型覆盖 `run_in_background` `boolean` 否 异步启动
完整模式添加了多代理参数（当群体功能处于活动状态时）和隔离控制：

字段类型 用途 `name` `string` 使代理可通过 `SendMessage({to: name})` 进行寻址 `team_name` `string` 用于生成的团队上下文 `mode` `PermissionMode` 生成的队友的权限模式 `isolation` `enum('worktree','remote')` 文件系统隔离策略 `cwd` `string` 工作目录的绝对路径覆盖
多代理字段启用第 9 章中介绍的集群模式：命名代理可以在并发运行时通过“SendMessage({to: name})”相互发送消息。隔离字段可确保文件系统安全：工作树隔离创建一个临时 git 工作树，以便代理在存储库的副本上进行操作，从而防止多个代理同时在同一代码库上工作时出现编辑冲突。

## 这个模式的不同寻常之处在于它是由功能标志动态塑造的：

` 分机
` // 伪代码 — 说明功能门控模式模式
输入模式 = 惰性模式 (() => {
让架构 = 基本架构 ()
if (!featureEnabled('ASSISTANT_MODE')) schema = schema. 省略 ({ cwd: true })
if (backgroundDisabled || forkMode) schema = schema. 省略 ({ run_in_background: true })
返回模式
}) `
`

当分叉实验处于活动状态时，“run_in_background”将从架构中完全消失，因为所有生成都在该路径下强制异步。当后台任务被禁用时（通过“CLAUDE_CODE_DISABLE_BACKGROUND_TASKS”），该字段也会被删除。当 KAIROS 功能标志关闭时，`cwd` 被省略。该模型永远不会看到它不能使用的字段。

这是一个微妙但重要的设计选择。模式不仅仅是验证——它是模型的使用手册。模式中的每个字段都在模型读取的工具定义中进行描述。删除模型不应使用的字段比在prompt中添加“不要使用此字段”更有效。模型不能滥用它看不到的东西。

## 输出模式

## 输出是具有两个公共变体的可区分联合：

- `{ status: 'completed',prompt,...AgentToolResult }` — 与代理的最终输出同步完成

- `{ status: 'async_launched',agentId,description,prompt,outputFile }` — 后台启动确认

存在两个额外的内部变体（“TeammateSpawnedOutput”和“RemoteLaunchedOutput”），但被排除在导出模式之外，以消除外部构建中的死代码。当相应的功能标志被禁用时，捆绑器会剥离这些变体及其关联的代码路径，从而使分布式二进制文件保持更小。

“async_launched”变体因其包含的内容而引人注目：“outputFile”路径，代理完成后将在其中写入结果。这允许父级（或任何其他使用者）轮询或观察文件的结果，从而提供基于文件系统的通信通道，该通道在进程重新启动后仍然存在。

## 动态prompt

`AgentTool` prompt由 `getPrompt()` 生成，并且是上下文相关的。它根据可用代理（内联列出或作为附件列出，以避免破坏Prompt Cache）、分叉是否处于活动状态（添加“何时分叉”指导）、会话是否处于协调器模式（由于协调器system prompt已涵盖使用情况而导致prompt精简）以及订阅层进行调整。非专业用户会收到有关同时启动多个代理的说明。

基于附件的代理列表值得强调。代码库注释提到“大约 10.2% 的队列 cache_creation 令牌”是由动态工具描述引起的。将代理列表从工具描述移动到附件消息可保持工具描述静态，因此连接 MCP 服务器或加载插件不会破坏每个后续 API 调用的Prompt Cache。

对于任何使用具有动态内容的工具定义的系统来说，这是一个值得内化的模式。 Anthropic API 缓存prompt前缀（system prompt、工具定义和对话历史记录），并为共享相同前缀的后续请求重用缓存的计算。如果工具定义在 API 调用之间发生更改（因为添加了代理或连接了 MCP 服务器），则整个缓存将失效。将易失性内容从工具定义（作为缓存前缀的一部分）移动到附件消息（附加在缓存部分之后）可以保留缓存，同时仍将信息传递给模型。

了解了工具定义后，我们现在可以跟踪模型实际调用它时发生的情况。

## 特征门控

sub-agent系统具有代码库中最复杂的功能门控。至少十二个功能标志和 GrowthBook 实验控制哪些代理可用、哪些参数出现在模式中以及采用哪些代码路径：

功能门控制 `FORK_SUBAGENT` 分叉代理路径 `BUILTIN_EXPLORE_PLAN_AGENTS` 探索和规划代理 `VERIFICATION_AGENT` 验证代理 `KAIROS` `cwd` 覆盖，助理强制异步 `TRANSCRIPT_CLASSIFIER` 切换分类，`自动` 模式覆盖 `PROACTIVE` 主动模块集成
每个门都使用 Bun 死代码消除系统（编译时）中的“feature()”或 GrowthBook（运行时 A/B 测试）中的“getFeatureValue_CACHED_MAY_BE_STALE()”。编译时门在构建期间被字符串替换 - 当“FORK_SUBAGENT”为“ant”时，包含整个 fork 代码路径；当它是“外部”时，它可以被完全排除。 GrowthBook 门允许进行实时实验：“tengu_amber_stoat”实验可以 A/B 测试删除 Explore 和 Plan 代理是否会改变用户行为，而无需发布新的二进制文件。

## call() 决策树

在调用“runAgent()”之前，“AgentTool.tsx”中的“call()”方法通过决策树路由请求，该决策树确定要生成哪种代理以及如何生成它：

` 分机
` 1. 这是队友重生吗？ （团队名称 + 名称均已设置）
是 -> spawnTeammate() -> 返回 teammate_spawned
否 -> 继续

2、解决有效代理类型
- 提供了 subagent_type -> 使用它
- subagent_type 省略，fork 已启用 -> 未定义（fork 路径）
- subagent_type 省略，fork 禁用 -> “通用”（默认）

3. 这是岔路吗？ （有效类型 === 未定义）
是 -> 递归分叉防护检查 -> 使用 FORK_AGENT 定义

4. 从 activeAgents 列表中解析代理定义
- 按权限拒绝规则过滤
- 按 allowedAgentTypes 过滤
- 如果没有找到或拒绝则抛出

## 5. 检查所需的MCP服务器（最多等待30秒待处理）

6.解决隔离模式（param覆盖agent def）
- “远程” -> teleportToRemote() -> 返回remote_launched

- “工作树” -> createAgentWorktree()
- null -> 正常执行

7. 确定同步与异步
shouldRunAsync = run_in_background || selectedAgent.background ||
是协调员 ||强制异步 ||是积极主动的

## 8. 组装工人工具池

## 9.构建system prompt及prompt信息

10.执行(异步->注册AsyncAgent + void生命周期;同步->迭代runAgent)`
`

步骤 1 到 6 是纯路由 — 尚未创建代理。实际的生命周期从“runAgent()”开始，同步路径直接迭代，异步路径包装在“runAsyncAgentLifecycle()”中。

路由是在“call()”而不是“runAgent()”中完成的，原因是：“runAgent()”是一个纯粹的生命周期函数，不了解队友、远程代理或 fork 实验。它接收已解析的代理定义并执行它。解析哪个定义、如何隔离代理以及同步还是异步运行的决定都属于上面的层。这种分离使 runAgent() 保持可测试和可重用——它可以从正常的 AgentTool 路径调用，也可以在恢复后台代理时从异步生命周期包装器调用。

步骤 3 中的叉护罩值得关注。分叉子级将“Agent”工具保留在其池中（用于与父级缓存相同的工具定义），但递归分叉将是病态的。两个守卫阻止它：“querySource === 'agent:builtin:fork'”（在子进程的上下文选项上设置，自动压缩后仍然存在）和“isInForkChild(messages)”（扫描对话历史记录中的“<fork-boilerplate>”标记作为后备）。腰带和背带——主要防护快速可靠；后备捕获 querySource 未线程化的边缘情况。

## runAgent 生命周期

`runAgent.ts` 中的 `runAgent()` 是一个异步生成器，驱动sub-agent的整个生命周期。当代理工作时，它会产生“Message”对象。每个sub-agent（分叉、内置、自定义、协调员工作人员）都流经这个单一函数。该函数大约有 400 行，每行的存在都是有原因的。

## 函数签名揭示了问题的复杂性：

` 分机
` 导出异步函数* runAgent ({
agentDefinition, // 什么样的代理
PromptMessages, // 告诉它什么
toolUseContext, // 父级的执行上下文
canUseTool, // 权限回调
isAsync, // 后台还是阻塞？
可以显示权限 prompt，
forkContextMessages, // 父级的历史记录（仅限 fork）
querySource, // 原点跟踪
override, // system prompt、中止控制器、代理 ID 覆盖
model, // 来自调用者的模型覆盖
maxTurns, // 转弯限制
availableTools, // 预组装工具池
allowedTools, // 权限范围

onCacheSafeParams, // 后台汇总回调
useExactTools, // 分叉路径：使用父级的精确工具
worktreePath, // 隔离目录
description, // 人类可读的任务描述
//...
}: {... }): AsyncGenerator < 消息, void > `
`

十七个参数。每一个都代表生命周期必须处理的变化维度。这并不是过度设计——这是服务于分叉代理、内置代理、自定义代理、同步代理、异步代理、工作树隔离代理和协调器工作人员的单个函数的自然结果。另一种选择是七个具有重复逻辑的不同生命周期函数，这更糟糕。

“覆盖”对象特别重要——它是 fork 代理和恢复代理的逃生口，需要将预先计算的值（system prompt、中止控制器、代理 ID）注入到生命周期中，而无需重新派生它们。

这是十五个步骤。

## 第 1 步：模型解析

` 分机
` const 已解决的AgentModel = getAgentModel (
agentDefinition.model, // Agent 声明的偏好
toolUseContext.options.mainLoopModel, // 父级模型
model, // 调用者的覆盖（来自输入）
PermissionMode, // 当前权限模式
）`
`

解析链为：调用者覆盖 > 代理定义 > 父模型 > 默认。 getAgentModel() 函数处理特殊值，如“继承”（使用父级使用的任何值）和特定代理类型的 GrowthBook 门控覆盖。例如，Explore 代理默认为外部用户使用 Haiku，这是最便宜且最快的模型，适合每周运行 3400 万次的只读搜索专家。

为什么这个顺序很重要：调用者（父模型）可以通过在工具调用中传递“model”参数来覆盖代理定义的首选项。这使得父级可以将通常便宜的代理升级为功能更强大的模型，以进行特别复杂的搜索，或者在任务简单时将昂贵的代理降级。但代理定义的模型是默认的，而不是父级的 - Haiku Explore 代理不应该仅仅因为没有人另外指定而意外地继承父级的 Opus 模型。

理解模型解析链很重要，因为它建立了一个在整个生命周期中重复出现的设计原则：显式覆盖击败声明，声明击败继承，继承击败默认值。 同样的原则也适用于权限模式、中止控制器和system prompt。一致性使系统具有可预测性——一旦您了解了一个解析链，您就了解了所有解析链。

## 第 2 步：创建代理 ID

` 分机
` const agentId = override?.agentId? override.agentId: createAgentId () `
`

代理 ID 遵循“agent-<hex>”模式，其中十六进制部分源自“crypto.randomUUID()”。品牌类型“AgentId”可防止类型级别的意外字符串混淆。覆盖路径适用于需要保留其原始 ID 以保证转录连续性的恢复代理。

## 第 3 步：背景准备

## Fork 代理和新鲜代理在这里有所不同：

` 分机
` const contextMessages: Message [] = forkContextMessages
？ 过滤器不完整工具调用（forkContextMessages）
：[]
constinitialMessages: 消息 [] = [...contextMessages,...promptMessages]

const agentReadFileState = forkContextMessages!== 未定义
？ 克隆文件状态缓存（toolUseContext.readFileState）
：createFileStateCacheWithSizeLimit（READ_FILE_STATE_CACHE_SIZE）`
`

对于分叉代理，父级的整个对话历史记录都被克隆到“contextMessages”中。但有一个关键的过滤器：“filterIncompleteToolCalls()”会删除任何缺少匹配的“tool_result”块的“tool_use”块。如果没有此过滤器，API 将拒绝格式错误的对话。当父进程在分叉时处于中间工具执行状态时，就会发生这种情况 - tool_use 已发出，但结果尚未到达。

文件状态缓存遵循相同的分叉或刷新模式。 Fork 子进程获得父进程缓存的克隆（它们已经“知道”哪些文件已被读取）。新代理开始空。克隆是浅拷贝——文件内容字符串通过引用共享，而不是重复。这对于内存很重要：具有 50 个文件缓存的 fork 子进程不会复制 50 个文件内容，而是复制 50 个指针。 LRU 驱逐行为是独立的——每个缓存根据自己的访问模式进行驱逐。

## 第四步：CLAUDE.md 剥离

像 Explore 和 Plan 这样的只读代理的定义中有 `omitClaudeMd: true` ：

` 分机
` const shouldOmitClaudeMd =
agentDefinition.omitClaudeMd &&
！ 覆盖？.userContext &&
getFeatureValue_CACHED_MAY_BE_STALE ( 'tengu_slim_subagent_claudemd', true )
const { claudeMd: _omissClaudeMd,... userContextNoClaudeMd } = baseUserContext
常量已解决的用户上下文=shouldOmitClaudeMd
？ userContextNoClaudeMd
: 基本用户上下文`
`

CLAUDE.md 文件包含有关提交消息、PR 约定、lint 规则和编码标准的项目特定说明。只读搜索代理不需要任何这些 - 它无法提交、无法创建 PR、无法编辑文件。父代理拥有完整的上下文并将解释搜索结果。在这里删除 CLAUDE.md 每周可以在整个队列中节省数十亿个代币——总成本的降低证明了条件上下文注入增加的复杂性是合理的。

同样，探索和计划代理已从系统上下文中删除“gitStatus”。会话启动时拍摄的 git status 快照最大可达 40KB，并明确标记为过时。如果这些代理需要 git 信息，他们可以自己运行“git status”并获取最新数据。

这些并不是过早的优化。每周有 3400 万个 Explore 生成，每一个不必要的代币都会复合成可衡量的成本。终止开关（“tengu_slim_subagent_claudemd”）默认为 true，但如果剥离导致回归，则可以通过 GrowthBook 翻转。

## 第五步：权限隔离

这是最复杂的一步。每个代理都有一个自定义的“getAppState()”包装器，它将其权限配置覆盖到父级的状态上：

` 分机
` const agentGetAppState = () => {
const 状态 = toolUseContext. 获取应用程序状态()
让 toolPermissionContext = state.toolPermissionContext

// 除非父级处于bypassPermissions、acceptEdits 或auto 模式，否则覆盖模式
if (agentPermissionMode && canOverride) {
工具权限上下文 = {
...工具PermissionContext，
mode: 代理权限模式,
}
}

// 自动拒绝无法显示 UI 的代理的prompt
const 应该避免prompt =
canShowPermissionPrompts!== 未定义
？ ！ 可以显示权限 prompt
: agentPermissionMode === '气泡'
？ 假的
: 异步
如果（应该避免prompt）{
工具权限上下文 = {
...工具PermissionContext，
shouldAvoidPermissionPrompts: true,
}
}

// 范围工具允许规则
if (allowedTools!== 未定义) {
工具权限上下文 = {
...工具PermissionContext，
总是允许规则：{
cliArg：state.toolPermissionContext.alwaysAllowRules.cliArg，
会话：[... allowedTools]，
},
}
}

返回 {... 状态、toolPermissionContext、effortValue }
} `
`

## 有四个不同的问题叠加在一起：

权限模式级联。 如果父级处于“bypassPermissions”、“acceptEdits”或“auto”模式，则父级模式始终获胜 - 代理定义无法削弱它。否则，将应用代理定义的“permissionMode”。当用户明确设置会话的许可模式时，这可以防止自定义代理降低安全性。

及时回避。 后台代理无法显示权限对话框 - 没有连接终端。因此，“shouldAvoidPermissionPrompts”设置为“true”，这会导致**权限系统**自动拒绝而不是阻止。例外是“气泡”模式：这些代理向父级终端显示prompt，因此无论同步/异步状态如何，它们始终可以显示prompt。

自动检查订购。 可以显示prompt（气泡模式）的后台代理设置 `awaitAutomatedChecksBeforeDialog`。这意味着分类器和权限Hook首先运行；仅当自动解决失败时，用户才会被中断。对于后台工作，为分类器多等待一秒钟就可以了——用户不应该被不必要的打扰。

工具权限范围。 当提供“allowedTools”时，它完全取代会话级允许规则。这可以防止家长的批准泄露给范围内的代理。但是 SDK 级别的权限（来自 `--allowedTools` CLI 标志）被保留 - 这些权限代表嵌入应用程序的显式安全策略，并且应该适用于所有地方。

## 第 6 步：工具解析

` 分机
` constsolvedTools = useExactTools
？ 可用工具
：resolveAgentTools（agentDefinition，availableTools，isAsync）.resolvedTools`
`

Fork 代理使用 `useExactTools: true`，它会原封不动地传递父级的工具数组。这不仅仅是方便——这是一种缓存优化。不同的工具定义序列化方式不同（不同的权限模式产生不同的工具元数据），工具块中的任何分歧都会破坏Prompt Cache。分叉子项需要字节相同的前缀。

## 对于普通代理，“resolveAgentTools()”应用分层过滤器：

- `tools: ['*']` 表示所有工具； `tools: ['Read', 'Bash']` 表示仅那些

- `disallowedTools: ['Agent', 'FileEdit']` 从池中删除它们

- 内置代理和自定义代理具有不同的基本不允许的工具集

- 异步代理通过“ASYNC_AGENT_ALLOWED_TOOLS”进行过滤

结果是每种代理类型都准确地看到了它应该拥有的工具。 Explore 代理无法调用 FileEdit。验证代理无法调用代理（验证程序不会递归生成）。自定义代理具有比内置代理更严格的默认拒绝列表。

## 第7步：system prompt

` 分机
` const agentSystemPrompt = override?.systemPrompt
？ 覆盖.systemPrompt
:assystem prompt符(
等待 getAgentSystemPrompt (
代理定义、工具使用上下文、
solvedAgentModel、additionalWorkingDirectories、resolvedTools
）
）`
`

Fork 代理通过“override.systemPrompt”接收父级的预渲染system prompt。这是从“toolUseContext.renderedSystemPrompt”线程化的——父级在上次 API 调用中使用的确切字节。通过“getSystemPrompt()”重新计算system prompt符可能会出现偏差。在父母的呼唤和孩子的呼唤之间，GrowthBook 的功能可能已经从冷淡转变为温暖。system prompt符中的单个字节差异会破坏整个prompt符缓存前缀。

对于普通代理，“getAgentSystemPrompt()”调用代理定义的“getSystemPrompt()”函数，然后使用环境详细信息进行增强 - 绝对路径、表情符号指导（Claude 倾向于在某些上下文中过度使用表情符号）和特定于模型的指令。

## 步骤 8：中止控制器隔离

` 分机
` const agentAbortController = override?.abortController
？ 覆盖.abortController
: 异步
？ 新的中止控制器()
: toolUseContext.abortController `
`

## 三行，三种行为：

- 覆盖：在恢复后台代理或特殊生命周期管理时使用。优先。

- 异步代理获得一个新的、未链接的控制器。 当用户按下 Escape 时，父级的中止控制器将触发。异步代理应该能够幸存下来——它们是用户选择委托的后台工作。他们的独立控制器意味着他们可以继续运行。

- 同步代理共享父级的控制器。 逃跑会杀死两人。孩子挡住了父母；如果用户想停止，他们想停止一切。

回想起来，这是一个显而易见的决定，但如果错误的话将是灾难性的。当父级中止时中止的异步代理将在每次用户按 Escape 询问后续问题时丢失所有工作。忽略父级中止的同步代理会让用户盯着冻结的终端。

## 第9步：Hook注册

` 分机
` if (agentDefinition.hooks && hooksAllowedForThisAgent) {
注册FrontmatterHooks (
rootSetAppState、agentId、agentDefinition.hooks、
`代理'${ 代理定义. 代理类型 }'`, true
）
} `
`

代理定义可以在 frontmatter 中声明自己的Hook（PreToolUse、PostToolUse 等）。这些Hook通过“agentId”限定在代理的生命周期内——它们仅在该代理的工具调用时触发，并且当代理终止时，它们会在“finally”块中自动清除。

“isAgent: true”标志（最后一个“true”参数）将“Stop”Hook转换为“SubagentStop”Hook。sub-agent触发“SubagentStop”，而不是“Stop”，因此转换可确保Hook在正确的事件上触发。

安全在这里很重要。当Hook的“strictPluginOnlyCustomization”处于活动状态时，仅注册插件、内置和策略设置代理Hook。用户控制的代理（来自`.claude/agents/`）的Hook会被默默地跳过。这可以防止恶意或错误配置的代理定义注入绕过安全控制的Hook。

## 第10步：Skill预加载

` 分机
` const SkillsToPreload = agentDefinition.skills?? []
if (skillsToPreload.length > 0 ) {
const allSkills = 等待 getSkillToolCommands ( getProjectRoot ())
// 解析名称、加载内容、添加到initialMessages 之前
} `
`

代理定义可以在其 frontmatter 中指定 `skills: ["my-skill"]`。该解决方案尝试了三种策略：精确匹配、代理插件名称前缀（例如，“my-skill”变为“plugin:my-skill”），以及插件命名空间Skill的后缀匹配“":skillName”。三策略解决方案可确保无论代理作者使用的是完全限定名称、短名称还是插件相对名称，Skill参考都有效。

加载的Skill成为客服人员对话前面的用户消息。这意味着代理在看到任务prompt之前“读取”其Skill指令——与主 REPL 中斜线命令使用的机制相同，重新用于自动Skill注入。Skill内容通过“Promise.all()”同时加载，以最大限度地减少指定多个Skill时的启动延迟。

## 步骤11：MCP初始化

` 分机
` const { 客户端：mergedMcpClients，工具：agentMcpTools，清理：mcpCleanup } =
等待initializeAgentMcpServers（agentDefinition，toolUseContext.options.mcpClients）`
`

代理可以在 frontmatter 中定义自己的 MCP 服务器，作为父级客户端的补充。支持两种形式：

- 按名称引用：`"slack"` 查找现有的 MCP 配置并获取共享的、记忆的客户端

- 内联定义：`{ "my-server": { command: "...", args: [...] } }` 创建一个新客户端，当代理完成时该客户端将被清理

仅清理新创建的（内联）客户端。共享客户端在父级别被记住，并在代理的生命周期之外持续存在。这种区别可以防止代理意外断开其他代理或父代理仍在使用的 MCP 连接。

MCP 初始化发生在Hook注册和Skill预加载之后、上下文创建之前。这种顺序很重要：在 `createSubagentContext()` 将工具快照到代理选项之前，必须将 MCP 工具合并到工具池中。对这些步骤重新排序意味着代理要么没有 MCP 工具，要么拥有这些工具，但它们不在其工具池中。

## 第 12 步：创建上下文

` 分机
` const agentToolUseContext = createSubagentContext (toolUseContext, {
选项：代理选项，
代理 ID,
代理类型：代理定义.代理类型，
消息：初始消息，
readFileState：代理ReadFileState，
abortController：代理AbortController，
getAppState：agentGetAppState，
共享设置应用程序状态：！ 是异步的，
shareSetResponseLength： true ，
关键系统提醒_实验：
agentDefinition.riticalSystemReminder_EXPERIMENTAL，
内容替换状态，
}) `
`

`utils/forkedAgent.ts` 中的 `createSubagentContext()` 组装新的 `ToolUseContext`。关键的隔离决策：

- 同步代理与父级共享“setAppState”。状态更改（如权限批准）对双方都立即可见。用户看到一种相干状态。

- 异步代理获得隔离的“setAppState”。父级的副本对于子级的写入来说是无操作的。但是“setAppStateForTasks”到达根存储 - 子级仍然可以更新 UI 观察到的任务状态（进度、完成）。

- 两者共享“setResponseLength”用于响应指标跟踪。

- Fork 代理继承 `thinkingConfig` 来处理缓存相同的 API 请求。普通智能体会得到“{ type: 'disabled' }”——思维（扩展推理标记）被禁用以控制输出成本。父母为思考付出代价；孩子们执行。

“createSubagentContext()”函数值得检查它隔离的内容和共享的内容。隔离边界并不是全有或全无——它是一组精心选择的共享和隔离通道：

关注 同步代理 异步代理 `setAppState` 共享（父级看到更改） 隔离（父级的副本无操作） `setAppStateForTasks` 共享 共享（任务状态必须到达根） `setResponseLength` 共享 共享（指标需要全局视图） `readFileState` 自己的缓存 自己的缓存 `abortController` 父级的独立 `thinkingConfig` Fork：继承/正常：禁用 Fork：继承/正常：禁用`messages` 自己的数组 自己的数组
“setAppState”（异步隔离）和“setAppStateForTasks”（始终共享）之间的不对称是一个关键的设计决策。异步代理无法将状态更改推送到父级的响应式存储 - 这将导致父级的 UI 意外跳转。但是代理仍然必须能够更新全局任务注册表，因为这是父级知道后台代理已完成的方式。分离通道解决了这两个要求。

## 第 13 步：缓存安全参数回调

` 分机
` if (onCacheSafeParams) {
onCacheSafeParams ({
system prompt：代理system prompt，
用户上下文：已解决的用户上下文，
系统上下文：已解决的系统上下文，
toolUseContext：agentToolUseContext，
forkContextMessages：初始消息，
})
} `
`

此回调由后台摘要消耗。当异步代理运行时，摘要服务可以分叉代理的对话 - 使用这些精确的参数来构造与缓存相同的前缀 - 并生成定期进度摘要，而不会干扰主对话。这些参数是“缓存安全的”，因为它们生成代理正在使用的相同 API 请求前缀，从而最大限度地提高缓存命中率。

## 第 14 步：query loop

` 分机
` 尝试{
for wait ( const 查询消息 ({
消息：初始消息，
system prompt：代理system prompt，
用户上下文：已解决的用户上下文，
系统上下文：已解决的系统上下文，
可以使用工具，
toolUseContext：agentToolUseContext，
查询来源，
最大转数：最大转数?? agentDefinition.maxTurns,
})) {
// 转发 API 请求开始获取指标
// 生成附件消息
// 记录到侧链转录本

// 向调用者产生可记录的消息
}
} `
`

第 3 章中的相同“query()”函数驱动sub-agent的对话。sub-agent的消息返回给调用者——同步代理的“AgentTool.call()”（它内联迭代生成器）或异步代理的“runAsyncAgentLifecycle()”（它在分离的异步上下文中消耗生成器）。

每条生成的消息都通过“recordSidechainTranscript()”记录到侧链转录本中——每个代理一个仅附加的 JSONL 文件。这可以实现恢复：如果会话中断，可以从其记录中重建代理。每条消息的记录时间复杂度为“O(1)”，仅附加新消息以及对先前 UUID 的引用以保证链的连续性。

## 第 15 步：清理

“finally” 块在正常完成、中止或错误时运行。这是代码库中最全面的清理序列：

` 分机
`终于{
wait mcpCleanup () // 关闭特定于代理的 MCP 服务器
clearSessionHooks (rootSetAppState, agentId) // 删除代理范围的Hook
cleanupAgentTracking(agentId) //Prompt Cache跟踪状态
agentToolUseContext.readFileState。 clear() //释放文件状态缓存内存
初始消息。 length = 0 // 释放fork上下文（GCprompt）
unregisterPerfettoAgent (agentId) // Perfetto 跟踪层次结构
clearAgentTranscriptSubdir (agentId) // 转录本子目录映射
rootSetAppState ( prev => { // 删除代理的待办事项条目
const { [agentId]: _removed,... todos } = prev.todos
返回 {... 上一个，待办事项 }
})
killShellTasksForAgent (agentId,... ) // 杀死孤立的 bash 进程
} `
`

代理在其生命周期中接触的每个子系统都会被清理。 MCP 连接、Hook、缓存跟踪、文件状态、perfetto 跟踪、todo 条目和孤立的 shell 进程。关于“鲸鱼会话”产生数百个代理的评论很能说明问题——如果没有这种清理，每个代理都会留下小泄漏，这些泄漏在长时间会话中累积成可测量的内存压力。

`initialMessages.length = 0` 行是手动 GC prompt。对于分叉代理，“initialMessages”包含父级的整个对话历史记录。将长度设置为零会释放这些引用，以便垃圾收集器可以回收内存。在具有 200K 令牌上下文的会话中，该会话会生成 5 个分叉子项，即每个子项包含 1 MB 的重复消息对象。

这里有一个关于长期运行的代理系统中的资源管理的课程。每个清理步骤都针对不同类型的泄漏：MCP 连接（文件描述符）、Hook（应用程序状态存储中的内存）、文件状态缓存（内存中的文件内容）、Perfetto 注册（跟踪元数据）、todo 条目（反应性状态键）和 shell 进程（操作系统级进程）。代理在其生命周期内与许多子系统交互，并且当代理完成时必须通知每个子系统。 “finally”块是所有这些通知发生的唯一位置，并且生成器协议保证它运行。这就是为什么基于生成器的架构不仅仅是一种便利——它还是一种正确性要求。

## 发电机链

在检查内置代理类型之前，值得退一步看看使所有这些工作正常进行的结构模式。整个sub-agent系统构建在异步生成器上。链流：

## 这种基于生成器的架构实现了四种关键功能：

流媒体。 消息增量地流经系统。父级（或异步生命周期包装器）可以在生成每条消息时观察它——更新进度指示器、转发指标、记录文字记录——而无需缓冲整个对话。

消除。 返回异步迭代器会触发 runAgent() 中的finally 块。无论代理是否正常完成、被用户中止或引发错误，十五步清理都会运行。 JavaScript 的异步生成器协议保证了这一点。

背景。 花费太长时间的同步代理可以在执行过程中进入后台。迭代器从前台（其中 `AgentTool.call()` 对其进行迭代）移交给异步上下文（其中 `runAsyncAgentLifecycle()` 接管）。代理不会重新启动 - 它会从原来的位置继续。

进度跟踪。 每条产生的消息都是一个观察点。异步生命周期包装器使用这些观察点来更新任务状态机、计算进度百分比并在代理完成时生成通知。

## 内置代理类型

内置代理通过“builtInAgents.ts”中的“getBuiltInAgents()”注册。注册表是动态的——哪些代理可用取决于功能标志、GrowthBook实验和会话的入口点类型。系统附带六个内置代理，每个代理都针对特定的工作类别进行了优化。

## 通用型

当省略“subagent_type”且 fork 未激活时的默认代理。完整的工具访问，没有 CLAUDE.md 遗漏，模型由 `getDefaultSubagentModel()` 确定。它的system prompt将其定位为以完成为导向的员工：“全面完成任务——不要镀金，但也不要半途而废。”它包括搜索策略指南（先广泛，然后缩小）和文件创建规则（除非任务需要，否则切勿创建文件）。

这是主力。当模型不知道它需要哪种代理时，它会得到一个通用代理，它可以完成父代理可以做的所有事情，而不需要生成自己的sub-agent。 “负生成”限制很重要：没有它，通用子级可以生成自己的子级，而子级又可以生成自己的子级，从而产生指数扇出，在几秒钟内耗尽 API 预算。 “Agent”工具位于默认禁止列表中是有充分理由的。

## 探索

只读搜索专家。使用 Haiku（最便宜、最快的模型）。省略 CLAUDE.md 和 git status。将“FileEdit”、“FileWrite”、“NotebookEdit”和“Agent”从其工具池中删除，并在工具级别和system prompt符中的“=== CRITICAL：READ-ONLY MODE ===”部分强制执行。

Explore 代理是最积极优化的内置代理，因为它是最频繁生成的 — 在整个队列中每周生成 3400 万次。它被标记为一次性代理（“ONE_SHOT_BUILTIN_AGENT_TYPES”），这意味着从其prompt中跳过了 agentId、SendMessage 指令和使用预告片，每次调用节省了大约 135 个字符。在 3400 万次调用中，这 135 个字符总计每周保存的prompt令牌约为 46 亿个字符。

可用性由“BUILTIN_EXPLORE_PLAN_AGENTS”功能标志和“tengu_amber_stoat”GrowthBook 实验控制，该实验对删除这些专用代理的影响进行 A/B 测试。

## 计划

软件架构师代理。与 Explore 相同的只读工具集，但对其模型使用“继承”（与父级具有相同的功能）。其system prompt引导其完成结构化的四步流程：了解需求、彻底探索、设计解决方案、详细制定计划。它必须以“实施的关键文件”列表结尾。

Plan 代理继承父模型，因为架构需要与实现相同的推理能力。您不希望 Haiku 级模型做出 Opus 级模型必须执行的设计决策。模型不匹配会产生执行代理无法遵循的计划，或者更糟糕的是，这些计划听起来似乎合理，但在某些方面却存在微妙的错误，只有更强大的模型才能捕捉到。

与探索相同的可用性门（`BUILTIN_EXPLORE_PLAN_AGENTS` + `tengu_amber_stoat`）。

## 验证

对抗性测试者。只读工具，“继承”模型，始终在后台运行（“background: true”），在终端中显示为红色。它的system prompt符是所有内置代理中最详细的，大约有 130 行。

验证代理的有趣之处在于它的反规避编程。prompt明确列出了模型可能会寻找的借口，并指示它“识别它们并做相反的事情”。每次检查都必须包含一个带有实际终端输出的“命令运行”块——没有挥手，没有“这应该可以工作”。代理必须包含至少一种对抗性探测（并发性、边界、幂等性、孤立清理）。在报告故障之前，它必须检查该行为是否是故意的或在其他地方处理过。

“riticalSystemReminder_EXPERIMENTAL”字段会在每个工具结果后插入提醒，强调这只是验证。这是防止模型从“验证”转向“修复”的护栏——这种趋势会破坏独立验证通行证的整个目的。语言模型有很强的提供帮助的倾向，并且在大多数情况下“有帮助”意味着“解决问题”。验证代理的整个价值主张取决于抵制这种倾向。

“background: true”标志意味着验证代理始终异步运行。父级不会等待验证结果 - 当验证器在后台进行探测时，它会继续工作。验证程序完成后，将显示一条包含结果的通知。这反映了人工代码审查的工作原理：当审查者阅读他们的 PR 时，开发者不会停止编码。

可用性由“VERIFICATION_AGENT”功能标志和“tengu_hive_evidence”GrowthBook 实验来控制。

## Claude Code指南

一个文档获取代理，用于解决有关 Claude Code 本身、Claude Agent SDK 和 Claude API 的问题。使用 Haiku，以“dontAsk”权限模式运行（不需要用户 prompt——它只读取文档），并且有两个硬编码的文档 URL。

它的“getSystemPrompt()”是独一无二的，因为它接收“toolUseContext”并动态包含有关项目的自定义Skill、自定义代理、配置的 MCP 服务器、插件命令和用户设置的上下文。这让它回答“我如何配置 X？”通过了解已经配置的内容。

当入口点是 SDK（TypeScript、Python 或 CLI）时排除，因为 SDK 用户不会询问 Claude Code 如何使用 Claude Code。他们正在在此基础上构建自己的工具。

Guide 代理是代理设计中一个有趣的案例研究，因为它是唯一一个system prompt是动态的内置代理，其方式取决于用户的项目。它需要知道配置了什么才能回答“我如何配置 X？”有效地。这使得它的“getSystemPrompt()”函数比其他函数更复杂，但这种权衡是值得的——一个不知道用户已经设置了什么的文档代理会给出比知道用户已经设置的内容更糟糕的答案。

## 状态行设置

用于配置终端状态行的专用代理。使用 Sonnet，以橙色显示，仅限于“阅读”和“编辑”工具。知道如何将 shell PS1 转义序列转换为 shell 命令、写入 `~/.claude/settings.json` 以及处理 `statusLine` 命令的 JSON 输入格式。

这是范围最窄的内置代理 - 它的存在是因为状态行配置是一个独立的域，具有特定的格式规则，这会扰乱通用代理的上下文。始终可用，无功能门。

Statusline 设置代理说明了一个重要原则：有时专用代理比具有更多上下文的通用代理更好。 将状态行文档作为上下文的通用代理可能会正确配置它。但它也会更昂贵（更大的模型）、更慢（需要处理更多上下文），并且更有可能因状态行语法和手头任务之间的交互而感到困惑。具有阅读和编辑工具以及集中system prompt的专用 Sonnet 代理可以更快、更便宜、更可靠地完成工作。

## Worker Agent（协调器模式）

## 不在“built-in/”目录中，但在协调器模式处于活动状态时动态加载：

` 分机
` if ( isEnvTruthy (process.env.CLAUDE_CODE_COORDINATOR_MODE )) {
const { getCoordinatorAgents } = require ( '../../coordinator/workerAgent.js' )
返回 getCoordinatorAgents ()
} `
`

工作代理取代了协调器模式下的所有标准内置代理。它具有单一类型“worker”和完整的工具访问权限。这种简化是经过深思熟虑的——当协调员协调工作人员时，协调员决定每个工作人员做什么。工人不需要“探索”或“计划”的专业化；它需要灵活性来完成协调员分配的任何事情。

## 分叉代理

分叉代理——sub-agent继承父代理的完整对话历史记录、system prompt和用于Prompt Cache利用的工具数组——是第 9 章的主题。当模型从代理工具调用中省略“subagent_type”并且分叉实验处于活动状态时，分叉路径就会触发。 fork 系统中的每个设计决策都可以追溯到一个目标：并行子级之间的字节相同的 API 请求前缀，从而在共享上下文上实现 90% 的缓存折扣。

## 来自 Frontmatter 的代理定义

用户和插件可以通过将 markdown 文件放置在 `.claude/agents/` 中来定义自定义代理。 frontmatter 架构支持全方位的代理配置：

` 分机
` ---
描述：“何时使用此代理”
工具：
- 阅读
- 猛击
- 格列普
不允许的工具：
- 文件写入
型号：俳句
权限模式：不问
最大匝数：50
Skill：
- 我的自定义Skill
mcp服务器：
- 松弛
- 我的内联服务器：
命令：节点
参数：[“./server.js”]
Hook：
预工具使用：

- 命令：“回显验证”
事件：PreToolUse
颜色：蓝色
背景：假
隔离：工作树
努力程度：高
---

# 我的自定义代理

您是...的专门代理人`
`

Markdown 正文成为代理的system prompt符。 frontmatter 字段直接映射到 runAgent() 使用的 AgentDefinition 接口。 `loadAgentsDir.ts` 中的加载管道根据 `AgentJsonSchema` 验证 frontmatter，解析源（用户、插件或策略），并将代理注册到可用代理列表中。

## 存在四种代理定义来源，按优先顺序排列：

- 内置代理 - 在 TypeScript 中硬编码，始终可用（受功能门限制）

- 用户代理 — `.claude/agents/` 中的 markdown 文件

- 插件代理 — 通过 `loadPluginAgents()` 加载

- 策略代理 — 通过组织策略设置加载

当模型使用“subagent_type”调用“Agent”时，系统会根据此组合列表解析名称，并按权限规则（拒绝“Agent(AgentName)”规则）和工具规范中的“allowedAgentTypes”进行过滤。如果未找到或拒绝请求的代理类型，则工具调用将失败并出现错误。

这种设计意味着组织可以通过插件（代码审查代理、安全审核代理、部署代理）发布自定义代理，并让它们与内置代理无缝显示。该模型将它们视为在同一列表中，具有相同的接口，并以相同的方式委托给它们。

frontmatter 定义的代理的强大之处在于它们需要零 TypeScript。想要“公关审查”代理的团队负责人会编写一个包含正确标题的 Markdown 文件，将其放入“.claude/agents/”中，然后它会出现在每个团队成员下一次会话的代理列表中。system prompt符是markdown正文。工具限制、模型偏好和权限模式在 YAML 中声明。 `runAgent()` 生命周期处理其他所有事情 - 相同的十五个步骤，相同的清理，相同的隔离保证。

这也意味着代理定义与代码库一起受版本控制。存储库可以提供根据其架构、约定和工具定制的代理。代理随着代码的发展而发展。当团队采用新的测试框架时，验证代理的prompt会在添加框架依赖项的同一提交中更新。

有一个重要的安全考虑因素：信任边界。用户代理（来自“.claude/agents/”）是用户控制的——当这些策略处于活动状态时，它们的Hook、MCP 服务器和工具配置受到“strictPluginOnlyCustomization”限制。插件代理和策略代理受管理员信任，可以绕过这些限制。内置代理是 Claude Code 二进制文件本身的一部分。系统精确跟踪每个代理定义的“来源”，以便安全策略可以区分“用户编写的”和“组织批准的”。

“source”字段不仅仅是元数据——它控制着真实的行为。当 MCP 的仅插件策略处于活动状态时，声明 MCP 服务器的用户代理 frontmatter 将被静默跳过（不建立 MCP 连接）。当Hook的仅插件策略处于活动状态时，用户代理 frontmatter Hook不会注册。代理仍在运行 - 它只是在没有不受信任的扩展的情况下运行。这是优雅降级的原则：即使代理的全部功能受到策略限制，它也是有用的。

## 应用此：设计代理类型

内置代理演示了代理设计的模式语言。如果您正在构建一个生成sub-agent的系统 - 无论是直接使用 Claude Code 的 AgentTool 还是设计您自己的多代理架构 - 设计空间分为五个维度。

维度 1：它能看到什么？

`omitClaudeMd`、git 状态剥离和Skill预加载的组合控制了代理的意识。只读代理看到的较少（他们不需要项目约定）。专业代理看到更多（预装Skill注入领域知识）。

关键的见解是上下文不是免费的。system prompt、用户上下文或对话历史记录中的每个标记都需要花钱并取代工作记忆。 Claude Code 将 CLAUDE.md 从 Explore 代理中剥离并不是因为这些指令有害，而是因为它们无关紧要——每周 3400 万次生成的无关性成为基础设施账单上的一个项目。在设计自己的代理类型时，请询问：“该代理需要知道什么才能完成其工作？”并剥夺其他一切。

维度 2：它能做什么？

`tools` 和 `disallowedTools` 字段设置了硬边界。验证代理无法编辑文件。 Explore 代理无法写入任何内容。通用代理可以执行除生成其自己的sub-agent之外的所有操作。

工具限制有两个目的：安全（验证代理不会意外地“修复”它所发现的内容，从而保持其独立性）和焦点（拥有较少工具的代理可以花更少的时间来决定使用哪个工具）。将工具级限制与system prompt指导相结合的模式（Explore 的 `=== CRITICAL: READ-ONLY MODE ===`）是深度防御 - 工具机械地强制边界，prompt解释边界存在的原因，这样模型就不会浪费时间尝试绕过它。

维度 3：它如何与用户交互？

“permissionMode”和“canShowPermissionPrompts”设置确定代理是否请求许可、自动拒绝或向家长终端发出气泡prompt。不能中断用户的后台代理必须在预先批准的边界内工作或冒泡。

`awaitAutomatedChecksBeforeDialog` 设置是一个值得理解的细微差别。可以显示prompt的后台代理（冒泡模式）会在中断用户之前等待分类器和权限Hook运行。这意味着用户只会因真正不明确的权限而被中断，而不会因自动化系统可以解决的问题而被中断。在五个后台代理同时运行的多代理系统中，这就是可用界面和权限 prompt弹幕之间的区别。

维度 4：它与父母有何关系？

同步代理会阻止父代理并共享其状态。异步代理使用自己的中止控制器独立运行。 Fork 代理继承完整的对话上下文。这个选择决定了用户体验（父母会等待吗？）和系统行为（Escape 会杀死孩子吗？）。

第 8 步中的中止控制器决策明确了这一点：同步代理共享父级的控制器（Escape 会杀死两者），异步代理获得自己的控制器（Escape 让它们继续运行）。 Fork 代理更进一步——它们继承父级的system prompt、工具数组和消息历史记录，以最大限度地提高Prompt Cache共享。每种关系类型都有一个明确的用例：用于顺序委托的同步（“执行此操作，然后我将继续”），用于并行工作的异步（“在我做其他事情的同时执行此操作”），以及用于上下文密集型委托的分叉（“你知道我所知道的一切，现在去处理这部分”）。

维度 5：有多贵？

模型选择、思维配置和上下文大小都会影响成本。用于廉价只读作品的俳句。适用于中等任务的十四行诗。从父级继承，用于需要父级推理能力的任务。非分叉代理无法思考控制输出代币成本——父级为推理付费；孩子们执行。

经济维度在多智能体系统设计中通常是事后才想到的，但它是 Claude Code 架构的核心。使用 Opus 而不是 Haiku 的 Explore 代理对于任何单独的调用都可以正常工作。但对于每周 3400 万次调用，模型选择是一个倍增的成本因素。每次 Explore 调用可节省 135 个字符的一次性优化意味着每周可保存 46 亿个字符的prompt令牌。这些不是微观优化——它们是可行产品和难以承受的产品之间的区别。

## 统一生命周期

“runAgent()”生命周期通过十五个步骤实现了所有五个维度，从同一组构建块中为每种代理类型组装了一个独特的执行环境。结果是在系统中生成sub-agent并不是“运行父代理的另一个副本”。它创建一个范围精确、资源控制、隔离的执行上下文——根据手头的工作量身定制，并在工作完成后彻底清理。

建筑的优雅在于统一。无论代理是 Haiku 支持的只读搜索器，还是具有完整工具访问权限和气泡权限的 Opus 支持的 fork 子项，它都会经历相同的 15 个步骤。这些步骤不会根据代理类型进行分支——它们是参数化的。模型分辨率选择正确的模型。上下文准备选择正确的文件状态。权限隔离选择正确的模式。代理类型未编码在控制流中；它被编码在配置中。这就是系统可扩展的原因：添加新的代理类型意味着编写定义，而不是修改生命周期。

## 设计空间总结

## 六个内置代理涵盖了一系列范围：

代理模型工具 上下文 同步/异步目的 通用 默认 全部 全部 任一 主力委托 探索 Haiku 只读 剥离同步 快速、廉价的搜索 计划 继承只读 剥离同步 架构设计 验证 继承只读 完整 始终异步 对抗性测试 指南 Haiku 阅读 + Web 动态同步 文档查找 状态行 Sonnet 阅读 + 编辑 最小同步配置任务
没有两个代理在所有五个维度上做出相同的选择。每个都针对其特定用例进行了优化。 “runAgent()”生命周期通过相同的十五个步骤处理所有这些，并由代理定义参数化。这就是架构的力量：生命周期是一台通用机器，代理定义是在其上运行的程序。

下一章将深入研究分叉代理——一种使并行委托在经济上可行的即时缓存利用机制。第 10 章接着介绍编排层：异步代理如何通过任务状态机报告进度、父级如何检索结果，以及协调器模式如何协调数十个代理朝着单一目标努力。如果说本章是关于创建代理，那么第 9 章是关于如何降低代理成本，而第 10 章是关于管理代理。