# 第 5 章：agent loop

## 跳动的心

第 4 章展示了 API 层如何把配置转换成流式 HTTP 请求：如何构建客户端、如何组装 system prompt，以及如何处理服务端返回的事件流。那一层解决的是“如何和模型对话”，但单个 API 调用本身并不是 agent。agent 的本质是一个 loop：调用模型、执行工具、反馈结果、再次调用模型，直到任务完成。

每个系统都有一个重心。在数据库中，它是存储引擎。在编译器中，它是中间表示。在 Claude Code 中，它是“query.ts”——一个 1,730 行的文件，其中包含运行每次交互的异步生成器，从 REPL 中的第一次击键到无头“--print”调用的最后一个工具调用。

这并不夸张。只有一条代码路径会负责与模型对话、执行工具、管理上下文、从错误中恢复，并最终决定何时停止。它就是 `query()` 函数。REPL 调它，SDK 调它，sub-agent 调它，无头模式也调它。只要你在使用 Claude Code，本质上你就在 `query()` 里面。

文件很密集，但并不像错综复杂的继承层次结构那样复杂。它的复杂程度与潜艇的复杂程度一样：单个船体具有许多冗余系统，每个系统都是因为海洋找到了进入的途径而添加的。每个“如果”分支都有一个故事。每条保留的错误消息都代表 SDK 使用者在恢复过程中断开连接的真正错误。每个断路器阈值都是根据实际会话进行调整的，这些会话在无限循环中消耗了数千个 API 调用。

本章从头到尾跟踪整个循环。到最后，您不仅会了解发生了什么，还会了解每种机制为何存在，以及如果没有它，会出现什么问题。

## 为什么使用异步生成器

第一个架构问题是：为什么 agent loop 要做成生成器，而不是基于回调的事件发射器？

` 分机
` // 简化 — 显示概念，而不是确切类型
异步函数* agentLoop ( params: LoopParams ): AsyncGenerator < Message | 事件、终端原因 > `
`

实际签名会生成多种消息和事件类型，并返回一个可区分的联合，编码循环停止的原因。

三个原因，按重要性排序。

背压。 无论消费者是否准备好，事件发射器都会触发。仅当消费者调用“.next()”时，生成器才会产生。当 REPL 的 React 渲染器忙于绘制前一帧时，生成器自然会暂停。当 SDK 使用者正在处理工具结果时，生成器会等待。没有缓冲区溢出，没有消息丢失，没有“快速生产者/慢速消费者”问题。

返回值语义。 生成器的返回类型是“Terminal”——一个可区分的联合，编码了循环停止的确切原因。是正常完成的吗？用户中止？象征性的预算耗尽？停止钩干预？最大转数限制？不可恢复的模型错误？有 10 种不同的终止状态。调用者不需要订阅“结束”事件并希望有效负载包含原因。他们将其作为来自“for wait...of”或“yield*”的类型化返回值。

通过“yield*”实现可组合性。 外部的“query()”函数通过“yield*”委托给“queryLoop()”，它透明地转发每个产生的值和最终返回。像“handleStopHooks()”这样的子生成器使用相同的模式。这创建了一个干净的责任链，没有回调，没有承诺包装承诺，没有事件转发样板。

这种选择是有代价的——JavaScript 中的异步生成器不能“倒回”或分叉。但agent loop也不需要。它是一个严格向前移动的状态机。

还有一个微妙之处：“function*”语法使函数变得惰性。直到第一个“.next()”调用之后，主体才会执行。这意味着“query()”立即返回——所有繁重的初始化（配置快照、内存预取、预算跟踪器）仅在消费者开始提取值时发生。在 REPL 中，这意味着 React 渲染管道在循环的第一行运行之前就已经设置好了。

## 调用方提供什么

在跟踪 loop 之前，先看一眼它接收的输入会更容易理解：

` 分机
` // 简化 — 说明关键字段
类型 LoopParams = {
消息：消息[]
prompt：system prompt
权限检查：CanUseToolFn
上下文：工具使用上下文
source: QuerySource // 'repl'、'sdk'、'agent:xyz'、'compact' 等。
最大匝数?: 数量
预算?: { Total: number } // API级任务预算
deps?: LoopDeps // 注入用于测试
}`
`

值得注意的字段有这些：

-
`querySource` ：字符串判别式，如 `'repl_main_thread'`、`'sdk'`、`'agent:xyz'`、`'compact'` 或 `'session_memory'`。许多条件句都以此为分支。紧凑代理使用“querySource: 'compact'”，因此阻塞限制防护不会死锁（紧凑代理需要运行以减少令牌计数）。

-
`taskBudget` ：API 级任务预算 (`output_config.task_budget`)。与“+500k”自动继续代币预算功能不同。 “总计”是整个代理轮次的预算； “剩余”是根据累积 API 使用情况在每次迭代中计算的，并跨压缩边界进行调整。

-
`deps` ：可选的依赖注入。默认为“productDeps()”。这就是测试在假模型调用、假压缩和确定性 UUID 中交换的接缝。

-

`canUseTool` ：返回是否允许给定工具的函数。这是权限层——它检查信任设置、Hook决策和当前权限模式。

## 两层入口点

公共 API 只是对真实循环的一层薄包装：

外部函数包装内部循环，跟踪在轮次期间消耗了哪些排队命令。内部循环完成后，使用的命令将被标记为“已完成”。如果循环抛出异常或生成器通过“.return()”关闭，则完成通知永远不会触发 - 失败的回合不应将命令标记为已成功处理。在轮次期间排队的命令（通过“/”斜杠命令或任务通知）在循环内标记为“已开始”，在包装器中标记为“已完成”。如果循环抛出异常或生成器通过“.return()”关闭，则完成通知永远不会触发。这是有意为之的——失败的转向不应将命令标记为已成功处理。

## 状态对象

loop 会把运行时状态集中放在一个类型对象里：

` 分机
` // 简化 — 说明关键字段
类型循环状态 = {
消息：消息[]
上下文：工具使用上下文
回合数：数量
过渡：继续 | 未定义
//...加上恢复计数器、压缩跟踪、待处理摘要等。
} `
`

十个领域。每一个都赢得了自己的位置：

字段 存在原因 `messages` 对话历史记录，每次迭代都会增长 `toolUseContext` 可变上下文：工具、中止控制器、代理状态、选项 `autoCompactTracking` 跟踪压缩状态：回合计数器、回合 ID、连续失败、压缩标志 `maxOutputTokensRecoveryCount` 输出令牌限制的多回合恢复尝试次数（最多 3） `hasAttemptedReactiveCompact` 一次性防范无限反应性压缩循环`maxOutputTokensOverride` 在升级期间设置为 64K，在 `pendingToolUseSummary` 之后清除 来自上一次迭代的俳句摘要的承诺，在当前流期间解决 `stopHookActive` 防止在阻塞重试后重新运行停止Hook `turnCount` 单调计数器，对照 `maxTurns` 检查 `transition` 为什么上一次迭代继续 — 第一次迭代时为“未定义”
可变循环中的不可变转换

下面这个模式几乎会出现在 loop 里每一次 `continue` 之前：

` 分机
` const next: 状态 = {
消息：[...messagesForQuery，...assistantMessages，...toolResults]，
toolUseContext：toolUseContextWithQueryTracking，
autoCompactTracking：跟踪，
回合计数：下一个回合计数，
最大输出令牌恢复计数：0，
hasAttemptedReactiveCompact: false,
endingToolUseSummary：nextPendingToolUseSummary，
maxOutputTokensOverride：未定义，
停止Hook活动，
转换：{原因：'next_turn'}，
}
状态=下一个`
`

每个继续站点都会构造一个完整的新“State”对象。不是“state.messages = newMessages”。不是“state.turnCount++”。全面重建。好处是每次转换都是自我记录的。您可以阅读任何“继续”站点，并准确查看哪些字段发生变化以及哪些字段被保留。新状态上的“transition”字段记录了循环继续的原因 - 对此进行测试断言以验证是否触发了正确的恢复路径。

## 循环体

下面是一次迭代的完整执行路径，先压缩成骨架来看：

这就是整个循环。 Claude Code 中的每个功能（从内存到sub-agent再到错误恢复）都馈入或消耗这个单一迭代结构。

## 上下文管理：四个压缩层

在每次 API 调用之前，消息历史记录会经过最多四个上下文管理阶段。它们按照特定的顺序运行，并且该顺序很重要。

## 第0层：工具结果预算

在进行任何压缩之前，“applyToolResultBudget()”会对工具结果强制执行每条消息的大小限制。没有有限“maxResultSizeChars”的工具除外。

## 第 1 层：剪切紧凑型

最轻量的操作。 Snip 从数组中物理删除旧消息，生成一条边界消息以向 UI 发出删除信号。它报告释放了多少代币，并将该数字纳入自动紧凑的阈值检查中。

## 第 2 层：微型

Microcompact 删除不再需要的工具结果，由“tool_use_id”标识。对于缓存的微型紧凑型（编辑 API 缓存），边界消息被推迟到 API 响应之后。原因是：客户端令牌估计不可靠。 API 响应中的实际“cache_deleted_input_tokens”告诉您真正释放的内容。

## 第三层：上下文崩溃

上下文崩溃用摘要取代了对话的范围。它在自动压缩之前运行，并且顺序是经过深思熟虑的：如果折叠将上下文降低到自动压缩阈值以下，则自动压缩将变为无操作。这保留了细粒度的上下文，而不是用单个整体摘要替换所有内容。

## 第 4 层：自动压缩

最重的操作：它分叉了整个 Claude 对话来总结历史。该实现有一个断路器——连续 3 次失败后，它会停止尝试。这可以防止生产中出现的噩梦场景：会话卡在上下文限制之上，每天在无限紧凑失败重试循环中燃烧 250K API 调用。

## 自动压缩阈值

这些阈值来自模型的上下文窗口：

` 分机
` effectiveContextWindow = contextWindow - min(modelMaxOutput, 20000)

阈值（相对于 effectiveContextWindow）：
自动压缩火灾： effectiveWindow - 13,000
阻止限制（硬）： effectiveWindow - 3,000 `
`

常量值 用途 `AUTOCOMPACT_BUFFER_TOKENS` 13,000 低于自动压缩触发有效窗口的余量 `MANUAL_COMPACT_BUFFER_TOKENS` 3,000 保留空间，以便 `/compact` 仍然有效 `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES` 3 断路器阈值
13,000 个令牌缓冲区意味着自动压缩会在硬限制之前触发。自动压缩阈值和阻塞限制之间的差距是响应式压缩运行的地方 - 如果主动式自动压缩失败或被禁用，响应式压缩会捕获 413 错误并按需压缩。

## 令牌计数

规范函数“tokenCountWithEstimation”将权威 API 报告的令牌计数（来自最近的响应）与该响应之后添加的消息的粗略估计相结合。这个近似值是保守的——它会倾向于更高的计数，这意味着自动紧凑型发动机会稍微早一点而不是稍微晚一点点火。

## 模型流式传输

## callModel() 循环

API 调用发生在“while(attemptWithFallback)”循环内，该循环启用模型回退：

` 分机
` 让 attemptsWithFallback = true
while (attemptWithFallback) {
尝试WithFallback = false
尝试{
for wait ( const message of deps.callModel ({ messages, systemPrompt, tools, signal })) {
// 处理每个流式消息
}
} 捕捉（内部错误）{
if (FallbackTriggeredError && FallbackModel 的内部错误实例) {
当前模型 = 后备模型
尝试WithFallback = true
继续
}
抛出内部错误
}
} `
`

启用后，“StreamingToolExecutor”一旦“tool_use”块在流式传输过程中到达就开始执行工具，而不是在完整响应完成后。如何将工具编排成并发批处理是第 7 章的主题。

## 预扣税模式

这是文件中最重要的模式之一。可恢复的错误从产量流中被抑制：

` 分机
` 让保留 = false
if (contextCollapse?.isWithheldPromptTooLong(消息)) 保留 = true
if (reactiveCompact?.isWithheldPromptTooLong(消息)) 保留 = true
if ( isWithheldMaxOutputTokens(消息)) 保留 = true
if (! 保留) 产生yieldMessage`
`

为什么要扣留？因为 SDK 使用者（Cowork、桌面应用程序）会终止任何带有“错误”字段的消息的会话。如果您产生prompt太长的错误，然后通过响应式压缩成功恢复，则消费者已经断开连接。恢复循环继续运行，但没有人在听。因此错误被保留，推送到“assistantMessages”，以便下游恢复检查可以找到它。如果所有恢复路径均失败，则保留的消息最终会浮出水面。

## 模型回退

当捕获“FallbackTriggeredError”（对主模型的高要求）时，循环会切换模型并重试。但是思维签名是模型绑定的——将受保护的思维块从一个模型重放到另一个后备模型会导致 400 错误。该代码在重试之前剥离签名块。失败尝试中的所有孤立助手消息都会被逻辑删除，以便 UI 删除它们。

## 错误恢复：升级阶梯

query.ts 中的错误恢复不是单一策略。这是一个越来越激进的干预措施的阶梯，每一次干预措施都是在前一项干预措施失败时触发的。

## 死亡螺旋守卫

最危险的故障模式是无限循环。该代码有多个守卫：

- `hasAttemptedReactiveCompact` ：一次性标志。响应式紧凑型每个错误类型触发一次。

- `MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3`：多轮恢复尝试的硬上限。

- 自动压缩上的断路器：连续 3 次失败后，自动压缩完全停止尝试。

- 错误响应上没有停止Hook：当最后一条消息是 API 错误时，代码在到达停止Hook之前显式返回。注释解释道：“错误 -> Hook阻塞 -> 重试 -> 错误 -> …（Hook每个周期注入更多令牌）。”

- 跨停止Hook重试保留“hasAttemptedReactiveCompact”：当停止Hook返回阻塞错误并强制重试时，将保留响应式紧凑防护。该评论记录了该错误：“此处重置为 false 导致无限循环消耗数千个 API 调用。”

添加这些防护措施中的每一个都是因为有人在生产中遇到了故障模式。

## 工作示例：“修复 auth.ts 中的错误”

为了使循环具体化，让我们通过三个迭代来跟踪真实的交互。

用户输入：“修复 src/auth/validate.ts 中的空指针错误”

迭代 1：模型读取文件。

循环进入。上下文管理运行（不需要压缩——对话很短）。该模型会发出响应：“让我看看该文件。”它发出一个“tool_use”块：“Read({ file_path: "src/auth/validate.ts" })”。流执行器看到并发安全工具并立即启动它。当模型完成其响应文本时，文件内容已在内存中。

流后处理：模型使用了工具，所以我们进入工具使用路径。读取结果（带有行号的文件内容）被推送到“toolResults”。一段俳句的简短承诺在后台拉开序幕。使用新消息“transition: { Reason: 'next_turn' }”重建状态，然后循环继续。

迭代 2：模型编辑文件。

上下文管理再次运行（仍低于阈值）。模型流：“我看到第 42 行的错误 - `userId` 可以为 null。”它发出 `Edit({ file_path: "src/auth/validate.ts", old_string: "const user = getUser(userId)", new_string: "if (!userId) return { error: 'unauthorized' }\nconst user = getUser(userId)" })`。

编辑不是并发安全的，因此流执行器将其排队直到响应完成。然后触发 14 步执行管道：Zod 验证通过、输入回填扩展路径、PreToolUse Hook检查权限（用户批准），然后应用编辑。迭代 1 中的待定俳句摘要在流式传输期间解析 - 其结果作为“ToolUseSummaryMessage”生成。状态被重建，循环继续。

迭代 3：模型声明完成。

模型流：“我通过添加一个保护子句修复了空指针错误。”没有“tool_use”块。我们进入“完成”路径。恢复时间太长？不需要。最大输出令牌？不会。停止Hook运行——没有阻塞错误。代币预算检查通过。循环返回“{reason: 'completed'}”。

总计：3 次 API 调用、2 次工具执行、1 次用户权限 prompt。该循环处理流工具执行、俳句摘要与 API 调用重叠以及完整的权限管道 - 所有这些都通过相同的“while(true)”结构。

## 代币预算

用户可以请求一个回合的代币预算（例如“+500k”）。预算系统在模型完成响应后决定是继续还是停止。

`checkTokenBudget` 通过三个规则做出二元继续/停止决策：

- sub-agent总是停止。 预算只是一个顶层概念。

- 完成门槛为 90%。 如果“turnTokens < 预算 * 0.9”，则继续。

- 收益递减检测。 连续 3 次以上后，如果当前和之前的 Delta 均低于 500 个代币，请尽早停止。该模型每次延续产生的输出越来越少。

当决定“继续”时，会注入一条prompt消息，告诉模型还剩多少预算。

## Stop Hook：强制模型继续工作

当模型完成而不请求使用任何工具时停止Hook运行 - 它认为已经完成。Hook评估它是否确实完成。

管道运行模板作业分类，触发后台任务（prompt建议、内存提取），然后正确执行停止Hook。当 stop hook 返回阻塞错误时——“你说你已经完成了，但是 linter 发现了 3 个错误”——这些错误将被附加到消息历史记录中，并且循环以 `stopHookActive: true` 继续。该标志可防止在重试时重新运行相同的Hook。

当停止Hook发出“preventContinuation”信号时，循环会立即退出并显示“{reason: 'stop_hook_prevented'}”。

## 状态转换：完整目录

循环的每次退出都是两种类型之一：“Terminal”（循环返回）或“Continue”（循环迭代）。

## 终端状态（10 个原因）

原因 触发 `blocking_limit` 令牌计数达到硬限制，自动压缩关闭 `image_error` ImageSizeError、ImageResizeError 或不可恢复的媒体错误 `model_error` 不可恢复的 API/模型异常 `aborted_streaming` 模型流期间用户中止 `prompt_too_long` 在所有恢复耗尽后保留 413 `completed` 正常完成（未使用工具，或预算耗尽，或 API 错误） `stop_hook_prevented` 停止Hook显式阻止继续操作 `aborted_tools` 用户在工具执行期间中止 `hook_stopped` PreToolUse Hook停止继续操作 `max_turns` 达到 `maxTurns` 限制
继续状态（7 个原因）

原因 触发器 `collapse_drain_retry` 上下文崩溃在 413 上耗尽分阶段崩溃 `reactive_compact_retry` 413 或媒体错误后响应式紧凑成功 `max_output_tokens_escalate` 8K 上限命中，升级到 64K `max_output_tokens_recovery` 64K 仍然命中，多轮恢复（最多 3 次尝试） `stop_hook_blocking` 停止Hook返回阻塞错误，必须重试`token_budget_continuation` 令牌预算未用尽，微移消息注入`next_turn` 正常工具使用延续

## 孤立工具的结果：协议安全网

API 协议要求每个“tool_use”块后跟一个“tool_result”。函数“yieldMissingToolResultBlocks”为模型发出的每个“tool_use”块创建错误“tool_result”消息，但从未得到相应的结果。如果没有这个安全网，流式传输期间的崩溃将留下孤立的“tool_use”块，这将导致下一个 API 调用时出现协议错误。

它在三个地方触发：外部错误处理程序（模型崩溃）、回退处理程序（模型中途切换）和中止处理程序（用户中断）。每个路径都有不同的错误消息，但机制是相同的。

## 中止处理：两条路径

中止可能发生在两个点：流传输期间和工具执行期间。每个人都有不同的行为。

流式传输期间中止：流式传输执行器（如果处于活动状态）会耗尽剩余结果，为排队工具生成合成“tool_results”。如果没有执行器，“yieldMissingToolResultBlocks”将填补空白。 “signal.reason”检查区分硬中止 (Ctrl+C) 和提交中断（用户输入新消息）——提交中断会跳过中断消息，因为排队的用户消息已经提供了上下文。

工具执行期间中止：类似的逻辑，在中断消息上使用“toolUse: true”参数向 UI 发出工具正在运行的信号。

## 思维规则

Claude 的 thinking / redacted thinking block 有三条不能破坏的规则：

- 包含思考块的消息必须是“max_thinking_length > 0”查询的一部分

- 思考块可能不是消息中的最后一个块

- 在辅助轨迹期间必须保留思维块

违反任何这些都会产生不透明的 API 错误。代码在几个地方处理它们：后备处理程序剥离签名块（受模型限制），压缩管道保留受保护的尾部，并且微压缩层从不触及思考块。

## 依赖注入

`QueryDeps` 类型有意缩小——四个依赖项，而不是四十个：

四个注入的依赖项：模型调用程序、压缩器、微型压缩器和 UUID 生成器。测试将“deps”传递到循环参数中以直接注入假货。使用“typeof fn”作为类型定义可以自动保持签名同步。除了可变的“State”和可注入的“QueryDeps”之外，不可变的“QueryConfig”在“query()”入口处快照一次 - 功能标志、会话状态和环境变量捕获一次并且永远不会重新读取。三路分离（可变状态、不可变配置、可注入依赖）使循环可测试，并使最终重构为纯“步骤（状态，事件，配置）”减速器变得简单。

## 应用此：构建你自己的 Agent Loop

使用生成器，而不是回调。 背压是自由的。返回值语义是自由的。通过“yield*”的可组合性是免费的。agent loop是严格向前移动的——你永远不需要倒带或分叉。

使状态转换明确。 在每个“继续”站点重建完整的状态对象。冗长是它的特点——它可以防止部分更新错误并使每个转换都能自记录。

保留可恢复的错误。 如果您的消费者因错误而断开连接，请不要产生错误，直到您知道恢复失败为止。将它们推入内部缓冲区，尝试恢复，并仅在耗尽时浮出水面。

分层上下文管理。 先进行轻量操作（删除），最后进行重度操作（汇总）。这会在可能的情况下保留细粒度的上下文，并仅在必要时才回退到整体摘要。

为每次重试添加断路器。 `query.ts` 中的每个恢复机制都有明确的限制：3 次自动压缩失败、3 次最大输出恢复尝试、1 次响应式压缩尝试。如果没有这些限制，触发失败重试循环的第一个生产会话将在一夜之间耗尽您的 API 预算。

如果从头开始，一个最小化的 Agent Loop 骨架大致是这样：

` 分机
` 异步函数* agentLoop(params) {
让状态 = initState(参数)
而（真）{
const context = compressIfNeeded(state.messages)
const 响应 = 等待 callModel(上下文)
如果（响应。错误）{
如果 (canRecover(response.error, 状态)) { 状态 = 恢复状态(状态);继续}
返回 { 原因：'错误' }
}
if (!response.toolCalls.length) return { Reason: '已完成' }
const 结果=等待executeTools(response.toolCalls)
状态 = {...状态，消息：[...上下文，response.message，...结果] }
}
} `
`

Claude Code 循环中的每个功能都是对这些步骤之一的详细阐述。四个压缩层详细说明了步骤 3（压缩）。扣留模式详细阐述了模型调用。升级阶梯详细阐述了错误恢复。停止Hook详细阐述了“不使用工具”退出。从这个骨架开始。仅当您遇到它解决的问题时才添加每个详细说明。

## 总结

agent loop是 1,730 行的单个“while(true)”，它可以完成所有操作。它流式传输模型响应，同时执行工具，通过四层压缩上下文，从五类错误中恢复，通过收益递减检测跟踪令牌预算，运行可以强制模型恢复工作的停止Hook，管理内存和Skill的预取管道，并生成一个类型化的可区分联合来准确说明其停止的原因。

它是系统中最重要的文件，因为它是唯一涉及所有其他子系统的文件。上下文管道将输入其中。工具系统由此产生。错误恢复围绕它进行。Hook拦截它。状态层通过它持续存在。 UI 由它渲染。

如果您了解“query()”，您就了解了Claude Code。其他一切都是外围设备。