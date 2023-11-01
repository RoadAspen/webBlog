# ReactDOM.render

React 创建更新的三种方式：

- ReactDOM.render || hydrate 或者 ReactDOM.createRoot().render()
- setState
- forceUpdate

我们在 React 程序的入口文件 index.js 中都会写以下代码：

```js
// 老版的入口
ReactDOM.render(<App />, document.getElementById("root"));

// 新版的 create-react-app 已经使用了 并发模式， 主要是根据 tag 不同决定是否开启 fiber 时间切片。
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

这就是 React 渲染的入口方法。

## ReactDOM

`ReactDOM` 定义在文件 `packages/react-dom/src/ReactDOM.js` 中.

在 react-dom/client/ReactDOM.js 可以看到导出了 **render** 和 **createRoot** 等方法

```js
import {
  findDOMNode,
  render,
  hydrate,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,
} from "./ReactDOMLegacy";

import {
  createRoot,
  createBlockingRoot,
  isValidContainer,
} from "./ReactDOMRoot";
```

render 实际是从 `ReactDOMLegacy` 文件中引入过来的：

### render

```js
export function render(
  element: React$Element<any>,
  container: Container,
  callback: ?Function
): React$Component<any, any> | PublicInstance | null {
  if (!isValidContainerLegacy(container)) {
    throw new Error("Target container is not a DOM element.");
  }
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback
  );
}
```

可以看到 render 中实际调用的是 `legacyRenderSubtreeIntoContainer` 这个方法

```js
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList, // react element 节点列表
  container: Container, // html 元素对象 Element ｜ Document
  forceHydrate: boolean,
  callback: ?Function
) {
  // TODO: Without `any` type, Flow says "Property cannot be accessed on any
  //
  let root: RootType = (container._reactRootContainer: any);
  // fiber 的 root
  let fiberRoot;
  // 如果是第一次渲染，container._reactRootContainer 不存在
  if (!root) {
    // 初始渲染 ，legacyCreateRootFromDOMContainer 方法 从 dom容器创建reactRoot。

    // RootType { _internalRoot:FiberRoot,render(),unmount()   }
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate
    );
    // reactRoot中的 _internalRoot 属性就是fiber相关的 FiberRoot
    fiberRoot = root._internalRoot;
    // 封装了callBack函数
    if (typeof callback === "function") {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    // 初始化不走批处理逻辑,为了快
    unbatchedUpdates(() => {
      // 最后执行了 updateContainer
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    // 非初次渲染 直接取值
    fiberRoot = root._internalRoot;
    if (typeof callback === "function") {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Update
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}
```

这里最重要的是

1. 执行 **legacyCreateRootFromDOMContainer** 创建 **FiberRoot**。
2. 最后将 **FiberRoot** 传入 **updateContainer** 方法。

**render 方法传进来的参数：**

| 参数名          | 参数值                          | 描述                       |
| --------------- | ------------------------------- | -------------------------- |
| parentComponent | null                            | 父组件                     |
| children        | element                         | 待渲染的元素， 如 \<App/>  |
| container       | document.getElementById('root') | 根节点，用来渲染元素的容器 |
| forceHydrate    | false                           | 是否 服务端渲染            |
| callback        | null                            | 回调函数                   |

1. 第一次进入时， root 是 `undefined` ,则调用了 `legacyCreateRootFromDOMContainer`方法，从根元素开始创建`ReactRoot`，并将赋值给了 `root` 和`container._reactRootContainer`.
2. 将 `root._internalRoot` 赋值给 `fiberRoot`。
3. 如果有`callback`，则对其进行封装。
4. 初始化执行 `unbatchedUpdates`,并执行 `updateContainer`.
5. 非初始化执行，直接执行`updateContainer`。
6. 返回了 `getPublicRootInstance` 的调用结果。

OK,接下来我们看一下 `legacyCreateRootFromDOMContainer` 干了什么：

```js
function legacyCreateRootFromDOMContainer(
  container: Container, // Element ｜ Document
  forceHydrate: boolean
): RootType {
  // 判断是否是 服务端渲染
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
  // 客户端渲染，清空子元素
  if (!shouldHydrate) {
    let rootSibling;
    // 循环 将 container内的子元素清空
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling);
    }
  }
  // 将container内的子元素清空后开始创建 root。
  return createLegacyRoot(
    container,
    shouldHydrate
      ? {
          hydrate: true,
        }
      : undefined
  );
}
```

1. 判断是不是服务端渲染，很明显上文传的是 false；
2. 执行一个循环，移除了 container 的所有子元素。
3. 返回了 `createLegacyRoot` 的创建结果。

我们在`ReactDOMRoot.js`中 看一下 `createLegacyRoot` 这个方法干了什么：

```js
export function createLegacyRoot(
  container: Container,
  options?: RootOptions
): RootType {
  //  LegacyRoot = 0
  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}
```

这里返回了一个 `ReactDOMBlockingRoot` 的实例化对象：

```js
function ReactDOMBlockingRoot(
  container: Container,
  tag: RootTag, // 0 | 1 | 2  这里只有 0 和 1
  options: void | RootOptions
) {
  this._internalRoot = createRootImpl(container, tag, options);
}

function ReactDOMRoot(container: Container, options: void | RootOptions) {
  // ConcurrentRoot 这里是 写死 的 2
  this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
}

ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render = function(
  children: ReactNodeList
): void {
  const root = this._internalRoot;
  updateContainer(children, root, null, null);
};

ReactDOMRoot.prototype.unmount = ReactDOMBlockingRoot.prototype.unmount = function(): void {
  const root = this._internalRoot;
  const container = root.containerInfo;
  updateContainer(null, root, null, () => {
    unmarkContainerAsRoot(container);
  });
};
```

我们看到 `ReactDOMBlockingRoot` 只是调用了 `createRootImpl`方法 创建了一个属性 `_internalRoot`。

同时我们发现有一个 `ReactDOMRoot` 方法和`ReactDOMBlockingRoot`类似，而且他们挂在原型的方法也是一样的。

## createRoot

// 开启 concurrent 模式，是使用的 createRoot

```js
export function createRoot(
  container: Container,
  options?: RootOptions
): RootType {
  invariant(
    isValidContainer(container),
    "createRoot(...): Target container is not a DOM element."
  );
  warnIfReactDOMContainerInDEV(container);
  return new ReactDOMRoot(container, options);
}
```

我们看到 **createRoot** 实际是调用的 **ReactDOMRoot** 构造函数， 这个函数与上边的 **ReactDOMBlockingRoot** 干的事情是一样的，只是把参数的 tag 写死了。

```js
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// render 方法实际是调用了 updateContainer方法，且不支持回调函数
ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render = function(
  children: ReactNodeList
): void {
  const root = this._internalRoot;
  updateContainer(children, root, null, null);
};
```

我们可以看到 `legacy` 和 `concurrent` 模式 创建 **fiber tree** 用的是同一个方法 **createRootImpl** ， 最后是同样调用了 **updateContainer**开启了渲染， 不同点在于 **tag** 不同；

**tag 为啥不一样暂且不讨论，我们先看看 `createRootImpl` 做了什么**

```js
function createRootImpl(
  container: Container,
  tag: RootTag,
  options: void | RootOptions
) {
  // Tag is either LegacyRoot or Concurrent Root
  const hydrate = options != null && options.hydrate === true;
  const hydrationCallbacks =
    (options != null && options.hydrationOptions) || null;
  // 这里调用了 createContainer, 返回 FiberRoot。
  const root = createContainer(container, tag, hydrate, hydrationCallbacks);

  // 将 FiberFoot 关联到 container上
  markContainerAsRoot(root.current, container);

  // 以下是服务端渲染的代码
  // --------
  return root;
}

// markContainerAsRoot 干了什么
const randomKey = Math.random()
  .toString(36)
  .slice(2);
const internalContainerInstanceKey = "__reactContainere$" + randomKey;
export function markContainerAsRoot(hostRoot, node) {
  node[internalContainerInstanceKey] = hostRoot;
}
```

此方法最重要的是调用了 `createContainer` 创建 `FiberRootNode` 并返回。

我们去 `react-reconciler/src/ReactFiberReconciler.js` 这里去找到 `createContainer`方法。

## createContainer

```js
// FiberRoot 构造函数
function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.current = null;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.pingCache = null;
  this.finishedExpirationTime = NoWork;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackPriority = NoPriority;
  this.firstPendingTime = NoWork;
  this.firstSuspendedTime = NoWork;
  this.lastSuspendedTime = NoWork;
  this.nextKnownPendingLevel = NoWork;
  this.lastPingedTime = NoWork;
  this.lastExpiredTime = NoWork;

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap = new Map();
  }
  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }
}
// 内部调用了 createFiberRoot 方法
export function createContainer(
  containerInfo: Container,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks
): OpaqueRoot {
  return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);
}
// 创建 FiberRootNode ，并将 FiberRoot 的 current 指向 createHostRootFiber(tag)
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks
): FiberRoot {
  // 创建了 FiberRoot 实例
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  // 这里创建了 HostRootFiber 对象, 程序的第一个fiber
  const uninitializedFiber = createHostRootFiber(tag);
  // HostRootFiber 挂在了 fiberRoot 的 current 属性
  root.current = uninitializedFiber;
  // 将 fiberRoot 挂在了 HostRootFiber 的 stateNode 属性
  uninitializedFiber.stateNode = root;

  // 初始化 fiber.updateQueue,这个留下后边讲
  initializeUpdateQueue(uninitializedFiber);

  return root;
}
```

可以看到 **createContainer** 方法实际调用的是 **createFiberRoot**。在 **createFiberRoot** 中实例化创建了 **FiberRootNode**对象 。

接下来我们看看 **createHostRootFiber** 干了什么

```js
export function createHostRootFiber(tag: RootTag): Fiber {
  // 根据 tag 不同，创建了 mode
  // legacy 模式 （同步）， Blocking 模式 （过渡模式），Concurrent 模式 （并发模式）
  // 模式不同点主要在于 开启的功能， legacy 模式就是原始的同步模式， Blocking 是用于过渡的
  let mode;
  if (tag === ConcurrentRoot) {
    mode = ConcurrentMode | BlockingMode | StrictMode;
  } else if (tag === BlockingRoot) {
    mode = BlockingMode | StrictMode;
  } else {
    mode = NoMode;
  }

  if (enableProfilerTimer && isDevToolsPresent) {
    mode |= ProfileMode;
  }

  return createFiber(HostRoot, null, null, mode);
}
```

我们看看 **createFiber** 干了什么：

```js
const createFiber = function(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode
): Fiber {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
};
```

我们看到 **createFiber** 返回了一个 **FiberNode** 实例。

到此我们上面的创建过程就走完，过程如下：

1. 创建 **ReactRoot** 的过程中创建了 **FiberRoot**，挂载到了 dom 元素的 **\_reactRootContainer** 上，从 **new ReactDOMBlockingRoot** 的 **\_internalRoot** 取出创建的 **FiberRoot** 并赋值给了 fiberRoot。
2. 在创建 **FiberRoot** 过程中，又创建了 第一个**HostRootFiber**，并通过 **FiberRoot.current = HostRootFiber , HostRootFiber.stateNode = FiberRoot** 的方式将二者关联起来。
3. 创建更新队列 **updateQueue** 并赋值给 **Fiber.updateQueue**.

## unbatchedUpdates

创建完 FiberRoot 和 Fiber，初始化 updateQueue，之后开始执行 **unbatchedUpdates**，初始化阶段为了速度，不走批处理，也在 **react-reconciler/src/ReactFiberReconciler.js** 文件

```js
export function unbatchedUpdates<A, R>(fn: (a: A) => R, a: A): R {
  const prevExecutionContext = executionContext;
  // 按位操作
  executionContext &= ~BatchedContext;
  executionContext |= LegacyUnbatchedContext;

  try {
    // 直接执行了回调函数
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
    if (executionContext === NoContext) {
      // Flush the immediate callbacks that were scheduled during this batch
      flushSyncCallbackQueue();
    }
  }
}
```

我们看到这里面直接执行了传入的回调函数 **updateContainer**，我们看看这里做了什么

## updateContainer

在 **unbatchedUpdates** 的回调中 调用了 **updateContainer**

```js
export function updateContainer(
  element: ReactNodeList, // ReactElement
  container: OpaqueRoot, // FiberRoot
  parentComponent: ?React$Component<any, any>,
  callback: ?Function
): ExpirationTime {
  // current 就是 Fiber
  const current = container.current;
  const currentTime = requestCurrentTimeForUpdate();
  const suspenseConfig = requestCurrentSuspenseConfig();
  // 根据 Fiber 给任务分优先级，得到不同的过期时间
  const expirationTime = computeExpirationForFiber(
    currentTime,
    current,
    suspenseConfig
  );

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  // 这里根据过期时间会生成一个 update 对象
  const update = createUpdate(expirationTime, suspenseConfig);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = { element };

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }
  // update 添加到 fiber.updateQueue
  enqueueUpdate(current, update);
  // // 调度和更新当前current对象(HostRootFiber)
  scheduleWork(current, expirationTime);

  return expirationTime;
}
```

**updateContainer** 做了以下几件事情

1. 拿到 **HostRootFiber** 节点 (**FiberRoot.current**)
2. 设置 **expirationTime**,过期时间,并设置优先级
3. 调用 **createUpdate** 获得一个 **update**对象。
4. 调用 **enqueueUpdate** 方法将 **update** 放入更新队列 里面，并形成 **环形链表**。
5. 根据 **Fiber** 和 **expirationTime**，开始执行调度 **scheduleWork**。

## 总结

1.  ReactDOM.render 调用了

- 创建 **ReactRoot**
- 创建 **ReactRoot** 会调用 **createContainer** 中调用 **createFiberRoot**。
- **createFiberRoot** 生成 **FiberRoot** 和 **HostRootFiber**，初始化 Fiber.updateQueue ,并关联 FiberRoot 和 Fiber。
- 调用 **unbatchUpdate** 非批次处理 ，调用 **updateContainer**
- **updateContainer** 中 根据 **current(Fiber)** 设置 **expirationTime** 超时时间。
- 根据 **expirationTime**, 调用 **createUpdate** 创建 **update**
- 执行 **enqueueUpdate（current,update）**
- 进入 **scheduleWork(current, expirationTime)**,执行任务调度

2. ReactDOM.createRoot().render() 调用了

- **createRoot** 创建 **ReactRoot**
- 创建 **ReactRoot** 会调用 **createContainer** 中调用 **createFiberRoot**。
- **createFiberRoot** 生成 **FiberRoot** 和 **Fiber**，初始化 Fiber.updateQueue ,并关联 FiberRoot 和 Fiber。
- 调用 **updateContainer**
- **updateContainer** 中 根据 **current(Fiber)** 设置 **expirationTime** 超时时间。
- 根据 **expirationTime**, 调用 **createUpdate** 创建 **update**
- 执行 **enqueueUpdate（current,update）**
- 进入 **scheduleWork(current, expirationTime)**,执行任务调度

两者的在调用 createRootImpl 之前不同，但是之后的调用流程是相同的。不同点在于：**后续执行的 mode 是基于 tag 生成， tag 目前一共有三种 legacy 、 block 、concurrent，相对应的 mode 也是三种 legacyMode 、 BlockingMode 、ConcurrentMode。 fiber 树中所有的 mode 都会和 HostRootFiber.mode 一致**。

本章节介绍了 react 应用的 新旧启动方式. 分析了启动后创建了 3 个关键对象（ReactDOMRoot、FiberRoot、HostRootFiber）. 启动过程最后调用 updateContainer 进入 react-reconciler 包,进而调用 schedulerUpdateOnFiber 函数, 与 reconciler 运作流程中的输入阶段相衔接.
