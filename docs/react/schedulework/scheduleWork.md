# scheduleWork

在前面流程中 render 后会执行 **updateContainer**

```js
function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function
) {
  //...
  const update = createUpdate(expirationTime, suspenseConfig);
  update.payload = { element };

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }
  // update 添加到 fiber.updateQueue链表
  enqueueUpdate(current, update);
  // 开启调度更新
  scheduleWork(current, expirationTime);
}
```

在 **scheduleWork** 可以看到相对应的方法， 实际方法是 **scheduleUpdateOnFiber**

## scheduleUpdateOnFiber

```js
export function scheduleUpdateOnFiber(
  fiber: Fiber,
  expirationTime: ExpirationTime
) {
  // 检测最近的更新次数
  checkForNestedUpdates();
  warnAboutRenderPhaseUpdatesInDEV(fiber);
  // 找到 rootFiber 并遍历更新子节点的 expirationTime
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  if (root === null) {
    warnAboutUpdateOnUnmountedFiberInDEV(fiber);
    return;
  }
  // 判断是否有高优先级任务打断当前正在执行的任务
  checkForInterruption(fiber, expirationTime);
  //
  recordScheduleUpdate();

  // 获取当前任务的优先级
  // if：onClick事件: currentPriorityLevel = UserBlockingPriority
  const priorityLevel = getCurrentPriorityLevel();

  // 同步立即执行
  if (expirationTime === Sync) {
    if (
      // 是否 处于 unbatchedUpdates中
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      // 检查 不在render阶段和commit阶段
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // Register pending interactions on the root to avoid losing traced interaction data.
      // 注册或更新待处理的更新集合
      schedulePendingInteractions(root, expirationTime);

      // 传入FiberRoot对象, 执行同步更新
      performSyncWorkOnRoot(root);
    } else {
      ensureRootIsScheduled(root);
      // 注册或更新pendingInteractions——update的集合
      schedulePendingInteractions(root, expirationTime);
      if (executionContext === NoContext) {
        // 立即更新同步队列
        // 故意将其放置在scheduleUpdateOnFiber而不是scheduleCallbackForFiber内，
        // 以保留在不立即刷新回调的情况下调度回调的功能。
        // 我们仅对用户启动的更新执行此操作，以保留旧版模式的历史行为。
        flushSyncCallbackQueue();
      }
    }
  } else {
    // 异步执行

    ensureRootIsScheduled(root);
    // 注册或更新pendingInteractions——update的集合
    schedulePendingInteractions(root, expirationTime);
  }

  if (
    (executionContext & DiscreteEventContext) !== NoContext &&
    // 只有在用户阻止优先级或更高优先级的更新才被视为离散，即使在离散事件中也是如此
    (priorityLevel === UserBlockingPriority ||
      priorityLevel === ImmediatePriority)
  ) {
    //这是离散事件的结果。 跟踪每个根的最低优先级离散更新，以便我们可以在需要时尽早清除它们。
    //如果rootsWithPendingDiscreteUpdates为null，则初始化它
    if (rootsWithPendingDiscreteUpdates === null) {
      rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
    } else {
      const lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);
      if (lastDiscreteTime === undefined || lastDiscreteTime > expirationTime) {
        rootsWithPendingDiscreteUpdates.set(root, expirationTime);
      }
    }
  }
}
export const scheduleWork = scheduleUpdateOnFiber;
```

获取优先级的方法可以在 **getCurrentPriorityLevel** 中看到

## getCurrentPriorityLevel

```js
// 除NoPriority以外，这些都与Scheduler优先级相对应。 我们用
//递增数字，因此我们可以像数字一样比较它们。 他们从90开始避免与Scheduler的优先级冲突。
// reactDom.render(), commitRoot
// NormalPriority
export const ImmediatePriority: ReactPriorityLevel = 99;
export const UserBlockingPriority: ReactPriorityLevel = 98;
export const NormalPriority: ReactPriorityLevel = 97;
export const LowPriority: ReactPriorityLevel = 96;
export const IdlePriority: ReactPriorityLevel = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority: ReactPriorityLevel = 90;

export function getCurrentPriorityLevel(): ReactPriorityLevel {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return ImmediatePriority;
    case Scheduler_UserBlockingPriority:
      return UserBlockingPriority;
    case Scheduler_NormalPriority:
      return NormalPriority;
    case Scheduler_LowPriority:
      return LowPriority;
    case Scheduler_IdlePriority:
      return IdlePriority;
    default:
      invariant(false, "Unknown priority level.");
  }
}
```

然后就判断当前是同步任务还是异步任务,是同步任务会执行 **performSyncWorkOnRoot** ,异步任务在最终也会进入 **performSyncWorkOnRoot**

## performSyncWorkOnRoot

在 **performSyncWorkOnRoot** 之中我们会做两件事

1. 调用 **workLoopSync** 创建 fiber 树和生成 dom 节点。
2. 执行 **finishSyncRender** 进行 commit 提交。

```js
function performSyncWorkOnRoot(root) {
  // Check if there's expired work on this root. Otherwise, render at Sync.
  const lastExpiredTime = root.lastExpiredTime;
  //初次 render, lastExpiredTime = NoWork
  const expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;

  flushPassiveEffects();

  // 如果根目录或过期时间已更改，则抛出现有堆栈
  //准备一个新的。否则我们将继续我们离开的地方。
  if (root !== workInProgressRoot || expirationTime !== renderExpirationTime) {
    // 如果已过期，创建 新的 work in progress
    prepareFreshStack(root, expirationTime);
    startWorkOnPendingInteractions(root, expirationTime);
  }
  //
  if (workInProgress !== null) {
    // 1. 设置RenderContext
    // 2. 调用workLoopSync
    const prevExecutionContext = executionContext;
    // 设置当前执行上下文为renderContext (渲染阶段上下文)
    executionContext |= RenderContext;
    const prevDispatcher = pushDispatcher(root);
    const prevInteractions = pushInteractions(root);
    // 开始执行
    startWorkLoopTimer(workInProgress);

    do {
      try {
        //
        workLoopSync();
        break;
      } catch (thrownValue) {
        handleError(root, thrownValue);
      }
    } while (true);
    resetContextDependencies();
    executionContext = prevExecutionContext;
    popDispatcher(prevDispatcher);
    if (enableSchedulerTracing) {
      popInteractions(((prevInteractions: any): Set<Interaction>));
    }
    // 失败
    if (workInProgressRootExitStatus === RootFatalErrored) {
      const fatalError = workInProgressRootFatalError;
      stopInterruptedWorkLoopTimer();
      prepareFreshStack(root, expirationTime);
      markRootSuspendedAtTime(root, expirationTime);
      ensureRootIsScheduled(root);
      throw fatalError;
    }

    // CommitContext  不能被打断的部分
    // 1. 调用CommitRoot
    if (workInProgress !== null) {
    } else {
      stopFinishedWorkLoopTimer();
      root.finishedWork = (root.current.alternate: any);
      root.finishedExpirationTime = expirationTime;
      // commit 阶段
      finishSyncRender(root);
    }
    // 再次对fiberRoot进行调度(退出之前保证fiberRoot没有需要调度的任务)
    ensureRootIsScheduled(root);
  }

  return null;
}
```

在执行之前首先会调用 **prepareFreshStack** 创建 **workInProgress**

## prepareFreshStack

```js
function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    //前一个根暂停并计划超时以提交备用状态。现在我们有了额外的工作，取消超时。
    root.timeoutHandle = noTimeout;
    // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above
    cancelTimeout(timeoutHandle);
  }

  if (workInProgress !== null) {
    let interruptedWork = workInProgress.return;
    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  renderExpirationTime = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootLatestProcessedExpirationTime = Sync;
  workInProgressRootLatestSuspenseTimeout = Sync;
  workInProgressRootCanSuspendUsingConfig = null;
  workInProgressRootNextUnprocessedUpdateTime = NoWork;
  workInProgressRootHasPendingPing = false;

  if (enableSchedulerTracing) {
    spawnedWorkDuringRender = null;
  }
}
```

在 React 中最多同时存在两颗 fiber 树。 当前屏幕上正在显示的是对应的 Fiber 树是 current 树。 正在内存中构建更新的 fiber 树 我们称之为 workInProgress 树。这个方式 我们称之为 **双缓存技术**

## ensureRootIsScheduled

如果是 **异步更新** 会执行 **ensureRootIsScheduled**进入到异步流程中，

```js
function ensureRootIsScheduled(root: FiberRoot) {
  const lastExpiredTime = root.lastExpiredTime;
  // lastExpiredTime 初始值为 noWork，只有当任务过期时，会被更改为过期时间（markRootExpiredAtTime方法）
  if (lastExpiredTime !== NoWork) {
    // 任务过期，需要立即执行
    root.callbackExpirationTime = Sync;
    root.callbackPriority = ImmediatePriority;
    root.callbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root),
    );
    return;
  }
  // 获取下一个任务的到期时间。
  const expirationTime = getNextRootExpirationTimeToWorkOn(root);
  const existingCallbackNode = root.callbackNode;
  // 2. 没有新的任务, return
  if (expirationTime === NoWork) {
    // There's nothing to work on.
    if (existingCallbackNode !== null) {
      // 重置
      root.callbackNode = null;
      root.callbackExpirationTime = NoWork;
      root.callbackPriority = NoPriority;
    }
    return;
  }
  ...
    let callbackNode;
  // 最高的优先级
  if (expirationTime === Sync) {
    // Sync React callbacks are scheduled on a special internal queue
    // 1. 把callback添加到syncQueue中
    // 2. 以Scheduler_ImmediatePriority调用Scheduler_scheduleCallback
    callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else if (disableSchedulerTimeoutBasedOnReactExpirationTime) {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    );
  } else {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
      // Compute a task timeout based on the expiration time. This also affects
      // ordering because tasks are processed in timeout order.
      // 设置了过期时间
      { timeout: expirationTimeToMs(expirationTime) - now() },
    );
```

1. 判断任务有没有过期，如果过期，则设置最高优先级，需要立即执行。
2. 如果没有新的任务，则重置。
3. 上一个任务没有完成，来了新的任务，判断优先级，如果上一个任务的优先级高，就指继续执行之前的任务，否则就取消之前的任务，准备调度新的。
4. 执行 scheduleSyncCallback/scheduleCallback => unstable_scheduleCallback

在 **ensureRootIsScheduled** 可以看到根据**优先级不同**判断执行 **performSyncWorkOnRoot** 和 **performConcurrentWorkOnRoot**

异步最终都会执行 **performSyncWorkOnRoot** 方法。
