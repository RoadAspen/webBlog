# 第 6 章：tools——从定义到执行

## 神经系统

第 5 章向您展示了 agent loop——“while(true)”，它流式传输模型响应、收集工具调用并反馈结果。循环就是心跳。但是，如果没有神经系统将“模型想要运行‘git status’”翻译成实际的 shell 命令，并进行权限检查、结果预算和错误处理，那么心跳就没有意义。

工具系统就是那个神经系统。它涵盖 40 多个工具实现、具有功能标志门控的集中式注册表、14 步执行管道、具有七种模式的权限解析器以及在模型完成响应之前启动工具的流式执行器。

Claude Code 中的每个工具调用（每个文件读取、每个 shell 命令、每个 grep、每个 sub-agent 调度）都流经相同的管道。统一性是重点：无论该工具是内置 Bash 执行器还是第三方 MCP 服务器，它都会获得相同的验证、相同的权限检查、相同的结果预算、相同的错误分类。

“Tool”接口大约有 45 个成员。这听起来令人难以承受，但对于理解系统的工作原理来说，只有五个重要因素：

- `call()` — 执行该工具

- `inputSchema` — 验证并解析输入

- `isConcurrencySafe()` — 可以并行运行吗？

- `checkPermissions()` — 允许这样做吗？

- `validateInput()` — 这个输入有语义意义吗？

其他一切——12 种渲染方法、分析 Hook、搜索 prompt——都是为了支持 UI 和遥测层而存在。从五个开始，其余的就到位了。

## 工具界面

## 三类参数

## 每个工具都通过三种类型进行参数化：

`分机` 工具 < 输入扩展 AnyObject、输出、P 扩展 ToolProgressData > `
`

“Input”是一个具有双重职责的 Zod 对象模式：它生成发送到 API 的 JSON 模式（因此模型知道要提供哪些参数），并在运行时通过“safeParse”验证模型的响应。 “Output”是工具结果的 TypeScript 类型。 “P”是工具在运行时发出的进度事件类型 - BashTool 发出标准输出块，GrepTool 发出匹配计数，AgentTool 发出 sub-agent 记录。

## buildTool() 和故障关闭默认值

没有工具定义直接构造“Tool”对象。每个工具都会通过“buildTool()”，这是一个在特定于工具的定义下传播默认对象的工厂：

`分机` // 伪代码 — 说明失败关闭默认模式
常量 SAFE_DEFAULTS = {
已启用：() => true ，
isParallelSafe: () => false, // 失败关闭：新工具串行运行
isReadOnly: () => false, // 失败关闭：视为写入
是破坏性的: () => false,
checkPermissions: ( 输入 ) => ({ 行为: '允许', UpdatedInput: 输入 }),
}

函数构建工具（定义）{
return {... SAFE_DEFAULTS,...Definition } // 定义覆盖默认值
} `
`

在涉及安全的情况下，默认设置是故意故障关闭的。忘记实现“isConcurrencySafe”的新工具默认为“false”——它串行运行，从不并行运行。忘记“isReadOnly”的工具默认为“false”——系统将其视为写入操作。忘记“toAutoClassifierInput”的工具会返回一个空字符串——自动模式安全分类器会跳过它，这意味着通用**权限系统**会处理它，而不是自动绕过。

未失败关闭的一个默认值是“checkPermissions”，它返回“allow”。在您理解分层权限模型之前，这似乎是倒退的：“checkPermissions”是特定于工具的逻辑，在通用**权限系统**已经评估规则、Hook 和基于模式的策略之后运行。从“checkPermissions”返回“allow”的工具表示“我没有特定于工具的反对意见”——它不授予全面访问权限。分组到子对象（“options”、“readFileState”等命名字段）提供了集中接口将提供的结构，而无需通过 40 多个调用站点声明、实现和线程化五个单独的接口类型。

## 并发取决于输入

签名“isConcurrencySafe(input: z.infer<Input>): boolean”采用解析后的输入，因为同一个工具对于某些输入可能是安全的，而对于其他输入则是不安全的。 BashTool 是典型的示例：“ls -la”是只读且并发安全的，但“rm -rf /tmp/build”不是。该工具解析命令，根据已知安全集对每个子命令进行分类，并仅当每个非中性部分都是搜索或读取操作时才返回“true”。

## ToolResult 返回类型

## 每个 `call()` 返回一个 `ToolResult<T>`：

`分机` 类型 ToolResult <T> = {
数据：T
newMessages?: ( UserMessage | AssistantMessage | AttachmentMessage | SystemMessage )[]
contextModifier?: ( 上下文: ToolUseContext ) => ToolUseContext
} `
`

“data”是被序列化到 API 的“tool_result”内容块中的类型化输出。 `newMessages` 允许工具将附加消息注入到对话中 - AgentTool 使用它来附加 sub-agent 记录。 `contextModifier` 是一个为后续工具改变 `ToolUseContext` 的函数 - 这就是 `EnterPlanMode` 切换权限模式的方式。上下文修饰符仅适用于非并发安全工具；如果您的工具并行运行，则其修改器将排队直到批处理完成。

## ToolUseContext：上帝对象

“ToolUseContext”是贯穿每个工具调用的庞大上下文包。它有大约 40 个字段。从任何合理的定义来看，它都是一个神物。它的存在是因为替代方案更糟糕。

像 BashTool 这样的工具需要中止控制器、文件状态缓存、应用程序状态、消息历史记录、工具集、MCP 连接和六个 UI 回调。将它们作为单独的参数进行线程化将产生具有 15 个以上参数的函数签名。实用的解决方案是单个上下文对象，按关注点分组：

配置（`options` 子对象）：工具集、模型名称、MCP 连接、调试标志。在查询开始时设置一次，大部分是不可变的。

执行状态：“abortController”用于取消，“readFileState”用于 LRU 文件缓存，“messages”用于完整对话历史记录。这些在执行过程中会发生变化。

UI 回调：`setToolJSX`、`addNotification`、`requestPrompt`。仅在交互式 (REPL) 上下文中连接。 SDK 和无头模式使它们未定义。

代理上下文：“agentId”、“renderedSystemPrompt”（fork sub-agent 的冻结父 prompt - 由于功能标志预热和破坏缓存，重新渲染可能会出现偏差）。

“ToolUseContext”的 sub-agent 变体尤其具有启发性。当“createSubagentContext()”为 sub-agent 构建上下文时，它会仔细选择要共享哪些字段以及要隔离哪些字段：“setAppState”成为异步代理的无操作，“localDenialTracking”获得一个新对象，“contentReplacementState”是从父代理克隆的。每个选择都编码了从生产错误中吸取的教训。

## 登记处

## getAllBaseTools()：单一事实来源

函数 getAllBaseTools() 返回当前进程中可能存在的每个工具的详尽列表。首先是始终存在的工具，然后是由功能标志控制的有条件包含的工具：

`分机` const SleepTool = feature ( 'PROACTIVE' ) || 功能（“KAIROS”）
？ require('./tools/SleepTool/SleepTool.js').SleepTool
: 空 `
`

从“bun:bundle”导入的“feature()”在捆绑时解析。当“feature('AGENT_TRIGGERS')”静态为 false 时，捆绑器会消除整个“require()”调用——消除死代码，从而保持二进制文件较小。

## assembleToolPool()：合并内置工具和 MCP 工具

## 到达模型的最终工具集来自“assembleToolPool()”：

- 获取内置工具（具有拒绝规则过滤、REPL 模式隐藏和“isEnabled()”检查）

- 通过拒绝规则过滤 MCP 工具

- 按名称字母顺序对每个分区进行排序

- 连接内置插件（前缀）+ MCP 工具（后缀）

先排序再连接的方法并不是审美偏好。 API 服务器在最后一个内置工具之后放置一个 Prompt Cache 断点。对所有工具进行平面排序会将 MCP 工具交错到内置列表中，并且添加或删除 MCP 工具会移动内置工具位置，从而使缓存失效。

## 14 步执行管道

函数“checkPermissionsAndCallTool()”是意图变成行动的地方。每个工具调用都会经过这 14 个步骤。

## 步骤 1-4：验证

工具查找回退到“getAllBaseTools()”来进行别名匹配，处理工具被重命名的旧会话的记录。 中止检查可防止在 Ctrl+C 传播之前排队的工具调用上浪费计算。 Zod 验证捕获类型不匹配；对于延迟工具，错误会附加一个 prompt，要求首先调用 ToolSearch。 语义验证超越了模式一致性——FileEditTool 拒绝无操作编辑，BashTool 在 MonitorTool 可用时阻止独立的“睡眠”。

## 步骤 5-6：准备

推测分类器启动为 Bash 命令并行启动自动模式安全分类器，从而缩短了公共路径数百毫秒的时间。 输入回填克隆已解析的输入并添加派生字段（将 `~/foo.txt` 扩展为绝对路径）用于 Hook 和权限，保留原始内容以确保转录稳定性。

## 步骤 7-9：许可

PreToolUse Hooks 是扩展机制——它们可以做出权限决策、修改输入、注入上下文或完全停止执行。 权限解析连接了 Hook 和通用**权限系统**：如果 Hook 已经决定，那就是最终的；否则，`canUseTool()` 会触发规则匹配、特定于工具的检查、基于模式的默认值和交互式 prompt。 权限被拒绝处理构建错误消息并执行“PermissionDenied”Hook。

## 步骤 10-14：执行和清理

工具执行使用原始输入运行实际的“call()”。 结果预算将超大输出保留到“~/.claude/tool-results/{hash}.txt”，并将其替换为预览。 PostToolUse Hooks 可以修改 MCP 输出或块延续。 附加新消息（sub-agent 记录、系统提醒）。 错误处理对遥测错误进行分类，从可能损坏的名称中提取安全字符串，并发出 OTel 事件。

## 权限系统

## 七种模式

模式行为“默认”特定于工具的检查；prompt 用户无法识别的操作 `acceptEdits` 自动允许文件编辑；prompt 其他操作 `plan` 只读 — 拒绝所有写入操作 `dontAsk` 自动拒绝任何通常会 prompt 的操作（后台代理） `bypassPermissions` 允许所有操作而不 prompt `auto` 使用脚本分类器来决定（带有功能标记的） `bubble` 升级到父代理的 sub-agent 的内部模式
解决链

## 当工具调用达到权限解析时：

- Hook 决定：如果 PreToolUse Hook 已返回“允许”或“拒绝”，则这是最终决定。

- 规则匹配：三个规则集 — `alwaysAllowRules`、`alwaysDenyRules`、`alwaysAskRules` — 匹配工具名称和可选内容模式。 `Bash(git *)` 匹配任何以 `git` 开头的 Bash 命令。

- 特定于工具的检查：该工具的 `checkPermissions()` 方法。大多数返回“passthrough”。

- 基于模式的默认值：`bypassPermissions` 允许一切。 “计划”否认写入。 `dontAsk` 拒绝 prompt。

- 交互式 prompt：在“default”和“acceptEdits”模式下，未解决的决策会显示 prompt。

- 自动模式分类器：两阶段分类器（快速模型，然后对不明确的情况进行扩展思考）。

“safetyCheck”变体有一个“classifierApprovable”布尔值：“.claude/”和“.git/”编辑是“classifierApprovable: true”（不常见但有时合法），而 Windows 路径绕过尝试是“classifierApprovable: false”（几乎总是对抗性的）。

## 权限规则及匹配

权限规则存储为包含三个部分的“PermissionRule”对象：“source”跟踪来源（userSettings、projectSettings、localSettings、cliArg、policySettings、session 等）、“ruleBehavior”（允许、拒绝、询问）以及带有工具名称和可选内容模式的“ruleValue”。

`ruleContent` 字段支持细粒度匹配。 `Bash(git *)` 允许任何以 `git` 开头的 Bash 命令。 `Edit(/src/**)` 只允许在 `/src` 内进行编辑。 `Fetch(domain:example.com)` 允许从特定域获取。没有“ruleContent”的规则匹配该工具的所有调用。

BashTool 的权限匹配器通过“parseForSecurity()”（bash AST 解析器）解析命令，并将复合命令拆分为子命令。如果 AST 解析失败（带有 heredocs 或嵌套子 shell 的复杂语法），匹配器将返回 `() => true` — 故障安全，意味着 Hook 始终运行。假设是，如果命令太复杂而无法解析，则它也太复杂而无法自信地从安全检查中排除。

## sub-agent 的气泡模式

协调员-工作人员模式中的 sub-agent 无法显示权限 prompt——它们没有终端。 “冒泡”模式导致权限请求传播到父上下文。协调器代理在具有终端访问权限的主线程中运行，处理 prompt 并将决策发送回。

## 工具延迟加载

带有 `shouldDefer: true` 的工具会通过 `defer_loading: true` 发送到 API — 名称和描述，但不是完整的参数模式。这会减少初始 prompt 的大小。要使用延迟工具，模型必须首先调用“ToolSearchTool”来加载其架构。失败模式很有启发性：调用延迟工具而不加载它会导致 Zod 验证失败（所有类型参数均以字符串形式到达），并且系统会附加目标恢复 prompt。

延迟加载还提高了缓存命中率：使用“defer_loading: true”发送的工具仅将其名称贡献给 prompt，因此添加或删除延迟的 MCP 工具会将 prompt 更改几个标记，而不是数百个标记。

## 结果预算

## 每个工具的尺寸限制

## 每个工具都声明“maxResultSizeChars”：

工具 maxResultSizeChars 基本原理 BashTool 30,000 足够用于最有用的输出 FileEditTool 100,000 差异可能很大，但模型需要它们 GrepTool 100,000 带有上下文行的搜索结果快速累加 FileReadTool Infinity 通过自己的令牌限制进行自绑定；持久化会创建循环读取循环
当结果超过阈值时，完整内容将保存到磁盘并替换为包含预览和文件路径的“<persisted-output>”包装器。如果需要，模型可以使用“Read”来访问完整的输出。

## 每次对话的总预算

除了每个工具的限制之外，“ContentReplacementState”还跟踪整个对话的总预算，防止因一千次削减而导致死亡——许多工具每个返回其个人限制的 90% 仍然可以压倒上下文窗口。

## 个别工具亮点

## BashTool：最复杂的工具

BashTool 是迄今为止系统中最复杂的工具。它解析复合命令，将子命令分类为只读或写入，管理后台任务，通过魔术字节检测图像输出，并实现安全编辑预览的 sed 模拟。

复合命令的解析特别有趣。 `splitCommandWithOperators()` 将像 `cd /tmp && mkdir build && ls build` 这样的命令分解为单独的子命令。每个命令集都根据已知安全的命令集（“BASH_SEARCH_COMMANDS”、“BASH_READ_COMMANDS”、“BASH_LIST_COMMANDS”）进行分类。仅当所有非中性部分都是安全时，复合命令才是只读的。中性集（echo、printf）被忽略——它们不会使命令只读，但也不会将其设为只写。

sed 模拟（`_simulatedSedEdit`）值得特别关注。当用户在权限对话框中批准 sed 命令时，系统通过在沙箱中运行 sed 命令并捕获输出来预先计算结果。预先计算的结果作为“\_simulatedSedEdit”注入到输入中。当 `call()` 执行时，它会直接应用编辑，绕过 shell 执行。这保证了用户预览的内容正是写入的内容 - 如果文件在预览和执行之间发生更改，则重新执行可能会产生不同的结果。

## FileEditTool：陈旧性检测

FileEditTool 与“readFileState”集成，后者是在整个对话过程中维护的文件内容和时间戳的 LRU 缓存。在应用编辑之前，它会检查自模型上次读取文件以来文件是否已被修改。如果文件已过时（被后台进程、其他工具或用户修改），则编辑将被拒绝，并显示一条消息，告诉模型首先重新读取文件。

“findActualString()”中的模糊匹配处理模型出现空格轻微错误的常见情况。它在匹配之前标准化空格和引号样式，因此针对带有尾随空格的“old_string”的编辑仍然匹配文件的实际内容。 `replace_all` 标志支持批量替换；如果没有它，非唯一匹配将被拒绝，要求模型提供足够的上下文来识别单个位置。

## FileReadTool：多功能阅读器

FileReadTool 是唯一具有“maxResultSizeChars: Infinity”的内置工具。如果读取输出保存到磁盘，模型将需要读取保存的文件，这本身可能会超出限制，从而创建无限循环。相反，该工具通过令牌估计进行自我限制并在源处截断。

该工具非常通用：它可以读取带有行号的文本文件、图像（返回 base64 多模式内容块）、PDF（通过“extractPDFPages()”）、Jupyter 笔记本（通过“readNotebook()”）和目录（回退到“ls”）。它会阻止危险的设备路径（`/dev/zero`、`/dev/random`、`/dev/stdin`）并处理 macOS 屏幕截图文件名怪异（U+202F 窄不间断空格与“屏幕截图”文件名中的常规空格）。

## GrepTool：通过 head_limit 分页

GrepTool 包装了 `ripGrep()` 并通过 `head_limit` 添加了分页机制。默认值为 250 个条目 — 足以获得有用的结果，但又足够小以避免上下文膨胀。当发生截断时，响应包括“appliedLimit: 250”，指示模型在下一次调用分页时使用“offset”。显式的“head_limit: 0”会完全禁用该限制。

GrepTool 自动排除六个 VCS 目录（`.git`、`.svn`、`.hg`、`.bzr`、`.jj`、`.sl`）。在“.git/objects”内部搜索几乎从来都不是模型想要的，并且意外包含二进制包文件会耗尽令牌预算。

## AgentTool 和上下文修饰符

AgentTool 生成运行自己的 query loop 的 sub-agent。它的“call()”返回包含 sub-agent 的记录的“newMessages”，以及可选的将状态更改传播回父代理的“contextModifier”。由于 AgentTool 默认情况下不是并发安全的，因此单个响应中的多个代理工具调用会串行运行 - 每个 sub-agent 的上下文修饰符在下一个子代 ​​ 理启动之前应用。在协调器模式下，模式相反：协调器为独立任务分派 sub-agent，并且“isAgentSwarmsEnabled()”检查解锁并行代理执行。

## 工具如何与消息历史记录交互

工具结果不仅仅将数据返回到模型。他们以结构化消息的形式参与对话。

API 期望工具结果为通过 ID 引用原始“tool_use”块的“ToolResultBlockParam”对象。大多数工具都会序列化为文本。 FileReadTool 可以序列化为图像内容块（base64 编码）以进行多模式响应。 BashTool 通过检查 stdout 中的魔术字节来检测图像输出，并相应地切换到图像块。

“ToolResult.newMessages”是工具如何将对话扩展到简单的呼叫和响应模式之外的。 代理转录：AgentTool 将 sub-agent 的消息历史记录作为附件消息注入。 系统提醒：内存工具注入出现在工具结果之后的系统消息 - 在下一回合对模型可见，但在“normalizeMessagesForAPI”边界处被剥离。 附件消息：Hook 结果、附加上下文和错误详细信息携带模型可以在后续回合中引用的结构化元数据。

`contextModifier` 函数是改变执行环境的工具机制。当 `EnterPlanMode` 执行时，它返回一个将权限模式设置为“plan”的修饰符。当“ExitWorktree”执行时，它会修改工作目录。这些修饰符是工具影响后续工具的唯一方法——直接改变“ToolUseContext”是不可能的，因为上下文在每次工具调用之前都会进行传播复制。仅串行限制是由编排层强制执行的：如果两个并发工具都修改工作目录，哪个会获胜？

## 应用此：设计工具系统

故障关闭默认值。 新工具应该是保守的，除非另有明确标记。忘记设置标志的开发者会得到安全行为，而不是危险行为。

依赖于输入的安全性。 “isConcurrencySafe(input)”和“isReadOnly(input)”采用解析后的输入，因为不同输入的同一工具具有不同的安全配置文件。将 BashTool 标记为“始终串行”的工具注册表是正确的，但很浪费。

分层您的权限。 特定于工具的检查、基于规则的匹配、基于模式的默认值、交互式 prompt 和自动分类器各自处理不同的情况。没有单一机制是足够的。

预算结果，而不仅仅是投入。 输入的令牌限制是标准的。但工具结果可以任意大，并且它们会在回合中累积。每个工具的限制可以防止单独的爆炸。聚合会话限制可防止累积溢出。

使错误分类遥测安全。 在缩小版本中，“error.constructor.name”被破坏。 “classifyToolError()”函数提取信息最丰富的可用安全字符串——遥测安全消息、错误代码、稳定错误名称——而无需将原始错误消息记录到分析中。

## 接下来会发生什么

本章跟踪了单个工具调用如何从定义到验证、许可、执行和结果预算。但该模型很少一次只需要一种工具。如何将工具编排成并发批处理是第 7 章的主题。
