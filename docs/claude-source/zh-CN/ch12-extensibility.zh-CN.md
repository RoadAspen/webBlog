# 第 12 章：可扩展性——Skill与Hook

## 二维延伸

每个可扩展性系统都回答两个问题：系统可以做什么以及何时做。大多数框架将两者混为一谈——插件在同一个对象中注册功能和生命周期回调，并且“添加功能”和“拦截功能”之间的界限模糊为单个注册 API。

Claude Code 把这两件事分得很清楚。Skill扩展的是模型的能力。它们本质上是 Markdown 文件，会变成 slash command，在被调用时把新的指令注入对话。Hook扩展的则是事情发生的时机与方式。它们是生命周期拦截器，会在一次会话中的二十多个节点触发，执行任意代码，用来阻止操作、修改输入、强制继续，或者静默观察。

这种分离不是偶然的。Skill属于内容层，它通过追加prompt文本来扩展模型的知识和能力；Hook属于控制流层，它会改变执行路径，但不直接改变模型知道什么。一个Skill可以教模型如何运行团队的部署流程，而一个Hook 可以保证在测试没通过之前，任何部署命令都不会执行。Skill增加能力，Hook增加约束。

本章深入介绍了这两个系统，然后研究了它们的交叉点：Skill声明的Hook在调用Skill时注册为会话范围的生命周期拦截器。

## Skill：教授模型新技巧

## 两相加载

Skill 系统的核心优化是frontmatter在启动时加载，但完整内容仅在调用时加载。

第 1 阶段读取每个“SKILL.md”文件，从 Markdown 正文中拆分 YAML frontmatter，并提取元数据。 frontmatter 字段成为system prompt的一部分，因此模型知道该Skill的存在。 Markdown 主体被捕获在闭包中，但未进行处理。具有 50 项Skill的项目只需支付 50 份简短描述的象征性费用，而不是 50 份完整文档。

当模型或用户调用Skill时，将触发第 2 阶段。 `getPromptForCommand` 在基目录前面添加，替换变量（`$ARGUMENTS`、`${CLAUDE_SKILL_DIR}`、`${CLAUDE_SESSION_ID}`），并执行内联 shell 命令（反引号前缀为 `!`）。结果以注入到对话中的内容块的形式返回。

## 七个优先来源

## Skill来自七个不同的来源，并行加载并按优先级合并：

优先级源位置注释 1 托管（策略） `<MANAGED_PATH>/.claude/skills/` 企业控制 2 用户 `~/.claude/skills/` 个人，随处可用 3 项目 `.claude/skills/`（步行回家）签入版本控制 4 其他目录 `<add-dir>/.claude/skills/` 通过 `--add-dir` 标志 5 旧命令`.claude/commands/` 向后兼容 6 捆绑 编译成二进制 功能门控 7 MCP MCP 服务器prompt 远程、不受信任

重复数据删除使用“realpath”来解析符号链接和重叠的父目录。最先看到的来源获胜。 `getFileIdentity` 函数通过 `realpath` 解析为规范路径，而不是依赖 inode 值，这在容器/NFS 挂载和 ExFAT 上不可靠。

## 前沿合同

## 控制Skill行为的关键前沿领域：

YAML 字段 用途 `name` 面向用户的显示名称 `description` 在自动完成和system prompt中显示 `when_to_use` 模型发现的详细使用场景 `allowed-tools` Skill可以使用哪些工具 `disable-model-inspiration` 块自治模型使用 `context` `'fork'` 作为sub-agent运行 `hooks` 在调用上注册的生命周期Hook `paths` 用于条件激活的 Glob 模式
`context: 'fork'` 选项将Skill作为具有自己的上下文窗口的sub-agent运行，这对于需要大量工作而不污染主对话的令牌预算的Skill至关重要。 “disable-model-invocable”和“user-invocable”字段控制两个不同的访问路径 - 将两者设置为 true 会使Skill不可见，这对于仅HookSkill很有用。

## MCP 安全边界

变量替换后，执行内联 shell 命令。安全边界是绝对的：MCP Skill从不执行内联 shell 命令。 MCP 服务器是外部系统。如果允许，包含“!`rm -rf /`` 的 MCP prompt将以用户的完全权限执行。系统仅将 MCP Skill视为内容。该信任边界连接到第 15 章讨论的更广泛的 MCP 安全模型。

## 动态发现

Skill不仅仅在启动时加载。当模型接触文件时，“discoverSkillDirsForPaths”会从每个路径向上查找“.claude/skills/”目录。带有“paths”frontmatter的Skill存储在“conditionalSkills”地图中，并且仅当触摸的路径与其模式匹配时才激活。声明 `paths: "packages/database/**"` 的Skill在模型读取或编辑数据库文件之前保持不可见 - 上下文相关的功能扩展。

## Hooks：控制事情发生的时间

Hook是 Claude Code 在生命周期点拦截和修改行为的机制。主执行引擎超过4900行。该系统服务于三个受众：个人开发者（自定义 linting、验证）、团队（检查项目的共享质量门）和企业（策略管理的合规性规则）。

## 现实世界的Hook：防止提交到主程序

在深入了解机械之前，先看看Hook在实践中的样子。假设您的团队希望阻止模型直接提交到“main”分支。

## 步骤1：settings.json配置：

` 分机
` {
“Hook”：{
“预工具使用”：[
{
“匹配器”：“重击”，
“Hook”：[
{
“类型”：“命令”，
“命令”：“/path/to/check-not-main.sh”，

“如果”：“Bash（git提交*）”
}
]
}
]
}
} `
`

## 第二步：shell脚本：

` 分机
` #!/bin/bash
分支 = $( git rev-parse --abbrev-ref HEAD 2> /dev/null )
如果[“$BRANCH”=“主”]; 然后
echo“无法直接提交到主分支。先创建一个功能分支。” >&2
exit 2 # Exit 2 = 阻塞错误
菲
退出 0`
`

第三步：模型经历了什么。 当模型在“main”分支上尝试“git commit”时，Hook会在命令执行之前触发。该脚本检查分支，写入 stderr，并以代码 2 退出。模型看到一条系统消息：“无法直接提交到 main。首先创建一个功能分支。”提交永远不会运行。该模型创建一个分支并在那里提交。

`if: "Bash(git commit*)"` 条件意味着脚本仅针对 git commit 命令运行——而不是针对每个 Bash 调用。退出代码2块；退出代码 0 通过；任何其他退出代码都会产生非阻塞警告。这是完整的协议。

## 四种用户可配置类型

Claude Code 定义了六种Hook类型——四种用户可配置，两种内部。

命令Hook生成一个 shell 进程。 Hook 输入 JSON 通过管道传输到 stdin；Hook通过退出代码和 stdout/stderr 进行通信。这是主力类型。

promptHook进行单个 LLM 调用，返回 `{"ok": true}` 或 `{"ok": false, "reason": "..."}`。由人工智能驱动的轻量级验证，无需完整的agent loop。

代理Hook运行多轮agent loop（最多 50 轮，“dontAsk”权限，禁用思考）。每个都有自己的会话范围。这是“验证测试套件是否通过并涵盖新功能”的重型机器。

HTTP Hook将Hook输入 POST 到 URL。启用远程策略服务器和审核日志记录，而无需生成本地进程。

两种内部类型是回调Hook（以编程方式注册，通过跳过跨度跟踪的快速路径在热路径上产生 -70% 的开销）和函数Hook（会话范围的 TypeScript 回调，用于在代理Hook中执行结构化输出）。

## 五个最重要的生命周期事件

Hook 系统在二十多个生命周期点触发。五种主导现实世界的使用：

PreToolUse — 在每个工具执行之前触发。可以阻止、修改输入、自动批准或注入上下文。权限行为遵循严格的优先级：拒绝 > 询问 > 允许。优质门最常见的Hook点。

PostToolUse — 成功执行后触发。可以注入上下文或完全替换 MCP 工具输出。对于工具结果的自动反馈很有用。

Stop——在 Claude 结束响应之前触发。阻塞Hook强制继续。这就是自动验证循环的机制：“你真的完成了吗？”

SessionStart — 在会话开始时触发。可以设置环境变量、覆盖第一条用户消息或注册文件监视路径。无法阻止（Hook无法阻止会话启动）。

UserPromptSubmit — 当用户提交prompt时触发。可以阻止处理，在模型看到输入之前启用输入验证或内容过滤。

## 参考表——剩余事件：

类别 事件 工具生命周期 PostToolUseFailure、PermissionDenied、PermissionRequest Session SessionEnd（1.5 秒超时）、设置sub-agent SubagentStart、SubagentStop 压缩 PreCompact、PostCompact 通知通知、Eliitation、EliitationResult 配置 ConfigChange、InstructionsLoaded、CwdChanged、FileChanged、TaskCreated、TaskCompleted、TeammateIdle
阻塞不对称是故意的。代表可恢复决策（工具调用、停止条件）的事件支持阻塞。代表不可撤销事实的事件（会话启动、API 失败）则不然。

## 退出代码语义

## 对于命令Hook，退出代码具有特定含义：

退出代码 含义 块 0 成功，如果 JSON 则解析 stdout 否 2 阻塞错误，stderr 显示为系统消息 是 其他 非阻塞警告，仅向用户显示 否
退出代码 2 是故意选择的。退出代码 1 太常见 - 任何未处理的异常、断言失败或语法错误都会产生退出 1。使用退出 2 可防止意外执行。

## 六种Hook来源

源信任级别注释 `userSettings` 用户 `~/.claude/settings.json`，最高优先级 `projectSettings` 项目 `.claude/settings.json`，版本控制的 `localSettings` 本地 `.claude/settings.local.json`，gitignored `policySettings` 企业 无法覆盖 `pluginHook` 插件优先级 999（最低） `sessionHook` 会话 仅在内存中，按Skill注册

## 快照安全模型

Hook执行任意代码。项目的“.claude/settings.json”可以定义在每次工具调用之前触发的Hook。如果恶意存储库在用户接受工作区信任对话框后修改其Hook，会发生什么情况？

没有什么。Hook配置在启动时被冻结。

`captureHooksConfigSnapshot()` 在启动期间被调用一次。从那时起，`executeHooks()` 从快照中读取，永远不会隐式重新读取设置文件。快照仅通过显式通道更新：“/hooks”命令或文件观察程序检测，两者都通过“updateHooksConfigSnapshot()”重建。

策略执行级联：策略设置中的“disableAllHooks”会清除所有内容。 `allowManagedHooksOnly` 排除用户和项目Hook。用户可以通过设置“disableAllHooks”来禁用自己的Hook，但不能禁用企业管理的Hook。策略层总是获胜。

信任检查本身（shouldSkipHookDueToTrust()）是在两个漏洞之后引入的：SessionEnd Hook在用户拒绝信任对话框时执行，而 SubagentStop Hook在信任出现之前触发。两者具有相同的根本原因——在用户不同意工作区代码执行的生命周期状态下触发Hook。解决方案是“executeHooks()”顶部的集中门。

## 执行流程

内部回调的快速路径是一个重要的优化。当所有匹配的Hook都是内部的（文件访问分析、提交归因）时，系统会跳过跨度跟踪、中止信号创建、进度消息和完整的输出处理管道。大多数 PostToolUse 调用仅命中内部回调。

Hook输入 JSON 通过惰性“getJsonInput()”闭包序列化一次，并在所有并行Hook中重用。环境注入设置“CLAUDE_PROJECT_DIR”、“CLAUDE_PLUGIN_ROOT”，对于某些事件，设置“CLAUDE_ENV_FILE”，其中Hook 可以写入环境导出。

## 集成：Skill与Hook的结合

当调用Skill时，其 frontmatter 声明的Hook将注册为会话范围的Hook。对于Hook的 shell 命令，`skillRoot` 变为 `CLAUDE_PLUGIN_ROOT`：

` 分机
` 我的Skill/
SKILL.md # Skill内容
validate.sh # 由 frontmatter ` 中声明的 PreToolUse Hook调用
`

## 该Skill的前言声明：

` 分机
` Hook：
预工具使用：
- 匹配器：“Bash”
Hook：
- 类型：命令
命令：“${CLAUDE_PLUGIN_ROOT}/validate.sh”
一次：真实`
`

当用户调用“/my-skill”时，Skill内容会加载到对话中并注册 PreToolUse Hook。下一个 Bash 工具调用将触发“validate.sh”。因为设置了“once: true”，所以Hook会在第一次成功执行后自行删除。

对于代理，frontmatter 中声明的 `Stop` Hook会自动转换为 `SubagentStop` Hook，因为sub-agent会触发 `SubagentStop`，而不是 `Stop`。如果没有转换，代理的停止验证Hook将永远不会触发。

## 权限行为优先级

`executePreToolHooks()` 可以阻止（通过 `blockingError`）、自动批准（通过 `permissionBehavior: 'allow'`）、强制询问（通过 `'ask'`）、拒绝（通过 `'deny'`）、修改输入（通过 `updatedInput`）或添加上下文（通过 `additionalContext`）。当多个Hook返回不同的行为时，拒绝总是获胜。这是安全相关决策的正确默认值。

## 停止Hook：强制继续

当 Stop Hook返回退出代码 2 时，stderr 将作为反馈显示给模型，并且对话继续。这将单次prompt响应转变为目标导向的循环。 Stop Hook 可以说是整个系统中最强大的集成点。

## 应用此：设计可扩展性系统

将内容与控制流分开。 Skill增加能力；Hook限制行为。将两者混为一谈使得无法推断插件的作用和阻止的作用。

冻结信任边界处的配置。 快照机制在同意的那一刻捕获Hook，并且永远不会隐式地重新读取。如果您的系统执行用户提供的代码，就可以消除 TOCTOU 攻击。

对语义信号使用不常见的退出代码。 退出代码 1 是噪音——每个未处理的错误都会产生它。退出代码 2 作为阻止信号可防止意外执行。选择需要刻意意图的信号。

在套接字级别验证，而不是应用程序级别。 SSRF 防护在 DNS 查找时运行，而不是作为飞行前检查。这消除了 DNS 重新绑定窗口。验证网络目标时，检查必须是连接的原子性。

针对常见情况进行优化。 内部回调快速路径（-70% 开销）识别大多数Hook调用仅命中内部回调。两阶段Skill加载认识到大多数Skill在给定会话中从未被调用。每个优化都针对实际的使用分布。

可扩展性系统反映了对功率与安全之间紧张关系的成熟理解。Skill为模型提供了受 MCP 安全线限制的新功能（第 15 章）。Hook使外部代码对受快照机制、退出代码语义和策略级联限制的模型操作产生影响。两个系统都不信任对方，而正是这种相互不信任使得组合可以安全地大规模部署。

下一章转向视觉层：Claude Code 如何以 60fps 渲染响应式终端 UI 并处理跨五种终端协议的输入。