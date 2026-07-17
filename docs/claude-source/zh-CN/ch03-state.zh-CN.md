# 第 3 章：状态——两层架构

第 2 章跟踪了从进程启动到首次渲染的引导管道。至此，系统环境已经配置完毕。但配置什么？会话 ID 位于哪里？目前的型号？消息历史记录？成本跟踪器？权限模式？国家存在于哪里，为什么存在于那里？

每个长时间运行的应用程序最终都会面临这个问题。对于一个简单的 CLI 工具来说，答案很简单——“main()”中的一些变量。但 Claude Code 并不是一个简单的 CLI 工具。它是一个通过 Ink 渲染的 React 应用程序，具有跨越数小时的流程生命周期、在任意时间加载的插件系统、必须从缓存上下文构造prompt的 API 层、在流程重新启动后仍能生存的成本跟踪器，以及需要读取和写入共享数据而无需相互导入的数十个基础设施模块。

这种幼稚的方法——单一的全球商店——立即失败了。如果成本跟踪器更新了驱动 React 重新渲染的同一存储，则每个 API 调用都将触发完整的组件树协调。基础设施模块（引导、上下文构建、成本跟踪、遥测）无法导入 React。它们在 React 安装之前运行。它们在 React 卸载后运行。它们在根本不存在组件树的上下文中运行。将所有内容放入 React 感知存储中会在整个导入图中创建循环依赖关系。

Claude Code 使用两层架构解决了这个问题：用于基础设施状态的可变进程单例，以及用于 UI 状态的最小响应式存储。本章解释了这两层、桥接它们的副作用系统以及依赖于此基础的支持子系统。随后的每一章都假设您了解状态所在的位置以及它为何存在在那里。

3.1 引导状态——进程单例

## 为什么是可变单例

引导状态模块（`bootstrap/state.ts`）是在进程启动时创建的单个可变对象：

` 分机
` const STATE: 状态 = getInitialState () `
`

此行上方的注释为：“尤其是这里”。类型定义上方有两行：“不要在此处添加更多状态 - 对全局状态要谨慎”。这些评论的语气就像是工程师们经历了惨痛的教训才了解到不受监管的全球物体的成本。

可变单例在这里是正确的选择，原因有三个。首先，引导状态必须在任何框架初始化之前可用——在 React 挂载之前、在创建存储之前、在加载插件之前。模块范围初始化是保证导入时可用性的唯一机制。其次，数据本质上是进程范围的：会话 ID、遥测计数器、成本累加器、缓存路径。没有有意义的“先前状态”可供比较，没有订阅者需要通知，没有撤消历史记录。第三，该模块必须是导入依赖图中的叶子。如果它导入了 React、store 或任何服务模块，它会创建破坏第 2 章中描述的引导序列的循环。通过只依赖于实用程序类型和“node:crypto”，它仍然可以从任何地方导入。

## ~80 个字段

`State` 类型包含大约 80 个字段。抽样揭示了其广度：

身份和路径 - `originalCwd`、`projectRoot`、`cwd`、`sessionId`、`parentSessionId`。 “originalCwd”通过“realpathSync”解析并在进程启动时进行 NFC 标准化。它永远不会改变。

成本和指标 - `totalCostUSD`、`totalAPIDuration`、`totalLinesAdded`、`totalLinesRemoved`。这些在会话中单调累积，并在退出时保留到磁盘。

遥测 — `meter`、`sessionCounter`、`costCounter`、`tokenCounter`。 OpenTelemetry 句柄，全部可为空（在遥测初始化之前为空）。

模型配置 — `mainLoopModelOverride`、`initialMainLoopModel`。当用户在会话中更改模型时，会设置覆盖。

会话标志 — `isInteractive`、`kairosActive`、`sessionTrustAccepted`、`hasExitedPlanMode`。控制会话持续时间行为的布尔值。

缓存优化 — `promptCache1hAllowlist`、`promptCache1hEligible`、`systemPromptSectionCache`、`cachedClaudeMdContent`。它们的存在是为了防止冗余计算并Prompt Cache清除。

## Getter/Setter 模式

`STATE` 对象永远不会被导出。所有访问都会经过大约 100 个单独的 getter 和 setter 函数：

` 分机
` // 伪代码 — 说明模式
导出函数 getProjectRoot (): string {
返回状态.projectRoot
}

导出函数 setProjectRoot ( dir: string ): void {
状态.projectRoot = 目录。 Normalize ( 'NFC' ) // 每个路径设置器上的 NFC 标准化
}`
`

此模式在每个路径设置器上强制封装、NFC 规范化（防止 macOS 上的 Unicode 不匹配）、类型缩小和引导隔离。代价是冗长——八十个字段有一百个函数。但在一个杂散突变可能破坏 50,000 个令牌Prompt Cache的代码库中，明确性获胜。

## 信号模式

Bootstrap 无法导入侦听器（它是 DAG 叶子），因此它使用名为“createSignal”的最小 pub/sub 原语。 “sessionSwitched”信号只有一个消费者：“concurrentSessions.ts”，它使 PID 文件保持同步。该信号公开为“onSessionSwitch = sessionSwitched.subscribe”，让调用者可以注册自己，而无需引导程序知道他们是谁。

## 五个粘性闩锁

引导状态中最微妙的字段是遵循相同模式的五个布尔锁存器：一旦在会话期间首次激活某个功能，相应的标志就会在会话的其余部分保持“true”。它们存在的原因只有一个：Prompt Cache保存。

Claude 的 API 支持服务器端Prompt Cache。当连续请求共享相同的system prompt符前缀时，服务器会重用缓存的计算。但缓存键包括 HTTP 标头和请求正文字段。如果 beta 标头出现在请求 N 中但未出现在请求 N+1 中，则缓存将被破坏 - 即使prompt内容相同。对于超过 50,000 个令牌的system prompt，缓存未命中的代价是昂贵的。

## 五个锁存器：

Latch 它会阻止什么 `afkModeHeaderLatched` Shift+Tab 自动模式切换可打开/关闭 AFK beta 标头 `fastModeHeaderLatched` 快速模式冷却进入/退出可翻转快速模式标头 `cacheEditingHeaderLatched` 远程功能标志更改会破坏每个活动用户的缓存 `thinkingClearLatched` 在确认的缓存未命中（> 1 小时空闲）时触发。防止重新启用思维块破坏新预热的缓存`pendingPostCompaction` 用于遥测的消耗一次标志：区分压缩引起的缓存未命中和 TTL 过期未命中
所有五个都使用三态类型：`boolean |空`。 “null”初始值意味着“尚未评估”。 “true”的意思是“锁定”。一旦设置为“true”，它们就不会返回“null”或“false”。这是锁存器的定义属性。

## 实施模式：

` 分机
` 函数 shouldSendBetaHeader ( featureCurrentlyActive: boolean ): boolean {
const 锁存 = getAfkModeHeaderLatched ()
if (latched === true ) return true // 已经锁存——总是发送
如果（功能当前活动）{
setAfkModeHeaderLatched ( true ) // 第一次激活——锁住它
返回真
}
return false // 从未激活——不发送
} `
`

为什么不总是发送所有测试版标头呢？因为标头是缓存键的一部分。发送无法识别的标头会创建不同的缓存命名空间。闩锁确保您仅在实际需要时才进入缓存名称空间，然后留在那里。

3.2 AppState——响应式存储

## 34 行实现

## UI 状态存储位于 `state/store.ts` 中：

存储实现大约有 30 行：“state”变量的闭包、防止虚假更新的“Object.is”相等性检查、同步侦听器通知以及用于副作用的“onChange”回调。骨架看起来像：

` 分机
` // 伪代码 — 说明模式
函数 makeStore ( 初始, onTransition ) {
设当前值 = 初始值
const subs = new Set()
返回{
读：() => 当前，
update: ( fn ) => { /* Object.is 守护，然后通知 */ },
订阅: ( cb ) => { 订阅。 添加（cb）； 返回 () => 子。 删除 (cb) },
}
} `
`

三十四行。没有中间件，没有开发工具，没有时间旅行调试，没有操作类型。只是一个可变变量的闭包、一组侦听器和“Object.is”相等性检查。这是没有图书馆的 Zustand。

## 值得研究的设计决策：

更新程序功能模式。 没有“setState(newValue)”——只有“setState((prev) => next)”。每个突变都会接收当前状态，并且必须产生下一个状态，从而消除并发突变带来的陈旧状态错误。

`Object.is` 相等性检查。 如果更新器返回相同的引用，则该突变是无操作的。没有听众开火。运行无副作用。对于性能至关重要——在不改变值的情况下展开和设置的组件不会产生重新渲染。

`onChange` 在听众之前触发。 可选的“onChange”回调接收旧状态和新状态，并在通知任何订阅者之前同步触发。这用于必须在 UI 重新呈现之前完成的副作用（第 3.4 节）。

没有中间件，没有开发工具。 这并非疏忽。当您的商店恰好需要三个操作（获取、设置、订阅）、“Object.is”相等性检查和同步“onChange”Hook时，您拥有的 34 行代码比依赖项更好。您可以控制确切的语义。您可以在三十秒内阅读整个实现。

## 应用程序状态类型

`AppState` 类型（约 452 行）是 UI 需要渲染的所有内容的形状。对于大多数字段，它被包装在“DeepImmutable <>”中，并显式排除包含函数类型的字段：

` 分机
` 导出类型 AppState = DeepImmutable <{
设置：SettingsJson
详细：布尔值
//... ~150 个以上字段
}> & {
jobs: { [ taskId: string ]: TaskState } // 包含中止控制器
agentNameRegistry: 映射 < string, AgentId >
} `
`

交集类型允许大多数字段深度不可变，同时排除保存函数、映射和可变引用的字段。完全不变性是默认的，有外科手术逃生舱口，类型系统将对抗运行时语义。

## 反应集成

该商店通过 `useSyncExternalStore` 与 React 集成：

` 分机

` // 标准 React 模式 — useSyncExternalStore 和选择器
导出函数 useAppState < T >( 选择器: ( state: AppState ) => T ): T {
const store = useContext (AppStoreContext)
返回 useSyncExternalStore (
商店.订阅,
() => 选择器(store.getState()),
）
} `
`

选择器必须返回现有的子对象引用（不是新构造的对象）以进行“Object.is”比较，以防止不必要的重新渲染。如果您编写 useAppState(s => ({ a: s.a, b: s.b }))`，则每次渲染都会生成一个新的对象引用，并且组件会在每次状态更改时重新渲染。这与 Zustand 用户面临的约束相同——比较成本更低，但选择器作者必须了解参考标识。

3.3 两层之间的关系

这两层通过显式的、狭窄的接口进行通信。

Bootstrap 状态在初始化期间流入 AppState：`getDefaultAppState()` 从磁盘读取设置（引导程序帮助定位），检查功能标志（引导程序评估），并设置初始模型（引导程序从 CLI 参数和设置解析）。

AppState 通过副作用流回到 bootstrap 状态：当用户更改模型时，`onChangeAppState` 会在 bootstrap 中调用 `setMainLoopModelOverride()`。当设置更改时，引导程序中的凭据缓存将被清除。

但这两个层从不共享引用。导入引导状态的模块不需要了解 React。读取 AppState 的组件不需要了解进程单例。

一个具体的例子阐明了数据流。当用户输入“/model claude-sonnet-4”时：

- 命令处理程序调用 `store.setState(prev => ({...prev, mainLoopModel: 'claude-sonnet-4' }))`

- 商店的“Object.is”检查检测到更改

- `onChangeAppState` 触发，检测模型更改，调用 `setMainLoopModelOverride()` （更新引导程序）和 `updateSettingsForSource()` （保存到磁盘）

- 所有商店订阅者都会触发 - React 组件重新渲染以显示新的模型名称

- 下一个 API 调用在引导状态下从 `getMainLoopModelOverride()` 读取模型

步骤 1-4 是同步的。步骤 5 中的 API 客户端可能会在几秒钟后运行。但它从引导状态（在步骤 3 中更新）读取，而不是从 AppState 读取。这是两层切换：UI 存储是用户选择内容的真实来源，但引导状态是 API 客户端使用内容的真实来源。

DAG 属性 - bootstrap 不依赖任何东西，AppState 依赖于 init 的 bootstrap，React 依赖于 AppState - 由 ESLint 规则强制执行，该规则防止“bootstrap/state.ts”导入其允许集之外的模块。

3.4 副作用：onChangeAppState

`onChange` 回调是两层同步的地方。每个“setState”调用都会触发“onChangeAppState”，它接收先前的状态和新的状态，并决定要触发哪些外部效果。

权限模式同步是主要用例。在此集中式处理程序之前，权限模式仅通过 8 个以上突变路径中的 2 个同步到远程会话 (CCR)。其他六个——Shift+Tab 循环、对话框选项、斜杠命令、倒回、桥接回调——所有这些都在不通知 CCR 的情况下改变了 AppState。外部元数据不同步。

解决方法：停止在突变位点之间分散通知，而是将差异Hook在一处。源代码中的注释列出了每个被破坏的突变路径，并指出“上面分散的调用点需要零更改”。这是集中式副作用的架构优势——覆盖是结构性的，而不是手动的。

模型更改使引导状态与 UI 呈现的内容保持同步。 设置更改会清除凭据缓存并重新应用环境变量。 详细切换和扩展视图保留到全局配置中。

该模式（可区分状态转换的集中副作用）本质上是在状态差异而不是单个事件的粒度上应用的观察者模式。它比分散事件发射的扩展性更好，因为副作用数量的增长比突变位点数量的增长慢得多。

3.5 上下文构建

`context.ts` 中的三个记忆异步函数构建了每个对话前面的system prompt上下文。每个每个会话计算一次，而不是每回合计算一次。

`getGitStatus` 并行运行五个 git 命令（`Promise.all`），生成一个包含当前分支、默认分支、最近提交和工作树状态的块。 `--no-optional-locks` 标志可防止 git 获取可能干扰另一个终端中并发 git 操作的写入锁。

`getUserContext` 加载 CLAUDE.md 内容并通过 `setCachedClaudeMdContent` 将其缓存在引导状态。此缓存打破了循环依赖关系：自动模式分类器需要 CLAUDE.md 内容，但 CLAUDE.md 加载会通过文件系统，文件系统会通过权限，从而调用分类器。通过在引导状态（DAG 叶子）下进行缓存，循环被打破。

所有三个上下文函数都使用 Lodash 的“memoize”（计算一次，永久缓存）而不是基于 TTL 的缓存。推理：如果 git status 每 5 分钟重新计算一次，则更改将破坏服务器端Prompt Cache。system prompt甚至告诉模型：“这是对话开始时的 git 状态。请注意，此状态是时间快照。”

3.6 成本跟踪

每个 API 响应都流经“addTotalSessionCost”，它会累积每个模型的使用情况、更新引导状态、向 OpenTelemetry 报告，并递归处理顾问工具的使用情况（响应中的嵌套模型调用）。

通过保存并恢复到项目配置文件，成本状态在流程重新启动后仍然存在。会话 ID 用作保护 — 仅当保留的会话 ID 与正在恢复的会话匹配时，成本才会恢复。

直方图使用水库采样（算法 R）来维护有限内存，同时准确表示分布。 1,024 个条目的水库产生 p50、p95 和 p99 百分位数。为什么不采用简单的移动平均值呢？因为平均值隐藏了分布形状。 95% 的 API 调用需要 200 毫秒、5% 需要 10 秒的会话与所有调用需要 690 毫秒的会话的平均值相同，但用户体验却截然不同。

3.7 我们学到了什么

代码库已经从一个简单的 CLI 发展成为一个具有约 450 行状态类型定义、约 80 个进程状态字段、副作用系统、多个持久性边界和缓存优化锁存器的系统。这些都不是预先设计的。当缓存清除成为一个可衡量的成本问题时，就添加了粘性锁存器。当发现 8 个权限同步路径中的 6 个被破坏时，“onChange”处理程序被集中化。当循环依赖出现时，添加了 CLAUDE.md 缓存。

这是复杂应用程序中状态的自然增长模式。两层架构提供了足够的结构来容纳增长——新的引导字段不会影响 React 渲染，新的 AppState 字段不会创建导入周期——同时保持足够的灵活性，以适应原始设计中未预期的模式。

3.8 状态架构总结

属性 Bootstrap State AppState Location 模块范围单例 React context 可变性 通过 setters 可变 通过 updater 的不可变快照 订阅者 针对特定事件的信号（pub/sub） `useSyncExternalStore` for React 可用性 导入时间（React 之前） 提供程序安装后 持久化进程退出处理程序 通过 onChange 到磁盘 平等 N/A（强制读取） `Object.is` 引用检查 依赖项 DAG leaf（不导入任何内容） 从跨代码库导入类型 测试重置 `resetStateForTests()` 创建新的商店实例 主要消费者 API 客户端、成本跟踪器、上下文构建器 React 组件、副作用

## 应用此

按访问模式而不是域分隔状态。 Session ID 属于单例，并不是因为它是抽象的“基础设施”，而是因为它必须在 React 挂载之前可读，并且在不通知订阅者的情况下可写。权限模式属于响应式存储，因为更改它必须触发重新渲染和副作用。让访问模式驱动层，架构自然就会遵循。

粘性闩锁图案。 任何与缓存（Prompt Cache、CDN、查询缓存）交互的系统都面临同样的问题：在会话中更改缓存密钥的功能切换会导致失效。激活某个功能后，其缓存密钥贡献在会话中保持活动状态。三状态类型（“boolean | null”，意思是“未评估/打开/从不关闭”）使意图自我记录。当缓存不受您控制时尤其有价值。

将副作用集中在状态差异上。 当多个代码路径可以更改相同状态时，请勿将通知分散到突变站点。Hook商店的“onChange”回调并检测哪些字段发生了变化。覆盖范围变成结构性的（任何突变都会触发效果）而不是手动的（每个突变位点必须记住通知）。

比起您不拥有的库，更喜欢您拥有的 34 行。 当您的需求正是获取、设置、订阅和更改回调时，最小的实现可以让您完全控制语义。在一个状态管理错误可能会花费大量金钱的系统中，这种透明度是有价值的。关键的见解是认识到您何时不需要图书馆。

有目的地使用进程出口作为持久性边界。 多个子系统在进程退出时保留状态。权衡是明确的：非优雅终止（SIGKILL、OOM）会丢失累积的数据。这是可以接受的，因为数据是诊断性的，而不是事务性的，并且对于每个会话递增数百次的计数器来说，在每次状态更改时写入磁盘的成本太高。

本章中建立的两层架构——基础设施的引导单例、UI 的响应式存储、桥接它们的副作用——是后续章节构建的基础。对话循环（第 4 章）从记忆的构建器中读取上下文。工具系统（第 5 章）检查 AppState 的权限。代理系统（第 8 章）在 AppState 中创建任务条目，同时跟踪引导状态中的成本。了解状态所在的位置及其原因是了解这些系统如何运作的先决条件。

有些田地跨越边界。主循环模型存在于两层中：AppState 中的“mainLoopModel”（用于 UI 渲染）和引导状态中的“mainLoopModelOverride”（用于 API 客户端消耗）。 `onChangeAppState` 处理程序使它们保持同步。这种重复就是两层分割的成本。但另一种选择——让 API 客户端导入 React 存储，或者让 React 组件从进程单例中读取——将违反保持架构健全的依赖方向。通过集中同步点桥接的少量受控复制比纠结的依赖图更可取。