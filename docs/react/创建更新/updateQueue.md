# updateQueue

前面在创建 **FiberRoot** 的时候会 执行 **initializeUpdateQueue** 初始化 **updateQueue**

## 类型

```typescript
type Update<State> = {|
  expirationTime: ExpirationTime,
  // 边界配置
  suspenseConfig: null | SuspenseConfig,

  tag: 0 | 1 | 2 | 3,
  payload: any,
  callback: (() => mixed) | null,

  next: Update<State>,

  // DEV only
  priority?: ReactPriorityLevel,
|};

type SharedQueue<State> = {| pending: Update<State> | null |};

type UpdateQueue<State> = {|
  baseState: State,
  baseQueue: Update<State> | null,
  shared: SharedQueue<State>,
  effects: Array<Update<State>> | null,
|};
```

## initializeUpdateQueue

我们看一下 **initializeUpdateQueue**干了什么：

```js
function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    baseQueue: null, // Update
    shared: {
      pending: null, // Update
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}
```

**initializeUpdateQueue** 方法就是创建了一个 **updateQueue**，并将其赋值给 **fiber.updateQueue**。

**UpdateQueue** 是一个单向链表, 在执行 **render** 和 **setState** 创建一个新的 update 挂载到 **Fiber.UpdateQueue.hared.pending** 中。

生成 **fiber Root** 之后，初始化执行 `unbatchedUpdates` 并执行 `updateContainer` 在里面会 调用 `createUpdate` 生成一个 **生成初始页面的** `update`。

## createUpdate

方法定义在文件 `react-reconcile/src/ReactUpdateQueue.js` 中。

```typescript

export function createUpdate(
  expirationTime: ExpirationTime,
  suspenseConfig: null | SuspenseConfig
): Update<*> {
  let update: Update<*> = {
    expirationTime,
    suspenseConfig,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: (null: any),
  };

  update.next = update;
  return update;
}
```

- **expirationTime** 是更新 的过期时间
- **suspenseConfig** 当前批量更新的配置，是一个全局对象
- **UpdateState** 的值是 0.

```js
export const UpdateState = 0; // 更新state
export const ReplaceState = 1; // 替换state
export const ForceUpdate = 2; // 强制更新
export const CaptureUpdate = 3; // 捕获更新
```

- **payload** 是更新内容, 可以是**对象**，也可以是 **返回对象的函数**
- **callback** 对应的回调，比如 **setState({},callback)**
- **next** 指向下一个更新

创建完 **update** 后会调用 **enqueueUpdate**

## enqueueUpdate

```js
export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  // 此时是初始化updateQueue
  const updateQueue = fiber.updateQueue;

  // 如果 updateQueue === null ，说明 fiber 已卸载
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending; // Update<State> 上一次的update
  // 初始化时是 null
  if (pending === null) {
    // mount 时只有一个update，直接闭环
    update.next = update;
  } else {
    // update时， 将最新的update的next 指向 第一个 update， 将上一次的update的next 指向最新的update
    update.next = pending.next;
    pending.next = update;
  }
  // updateQueue 的 pending 始终指向最后一个 last update， 这样 pending.next 会指向first update
  sharedQueue.pending = update;
}
```

updateQueue 的 update 的 next 会形成一个闭环。

1. a 插入队列时： updateQueue.shared.pending = a; a.next = a;
2. b 插入队列时：a.next = b; b.next = a; updateQueue.shared.pending = b;
3. c 插入队列时：b.next = c; c.next = a; updateQueue.shared.pending = c;
4. d 插入队列时：c.next = d; d.next = a;updateQueue.shared.pending = d;

a -> b -> c -> a 。UpdateQueue 是一个单向链表, 在执行 render 和 setState 创建一个的 update 挂载到 UpdateQueue 的 shared 中 的 pending 属性。

## 总结

为什么 setState 时需要放入 updateQueue，而不是直接更新？

react 希望这几个状态能够合并在一起进行计算，而不是每 setState 就更新一次状态。因为更新状态意为着 fiber tree 的 diff，还有可能会发生真实 dom 的改变。这种耗费时间的操作能少做一次是一次。当有了 updateQueue 后，这种情况会以此存放在 queue 中。react 在一次 diff 中计算出一个最终状态，这样就解决了批量 state 的问题。
