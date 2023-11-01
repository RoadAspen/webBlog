# 模拟 UpdateQueue

在 Fiber 中很多地方用到链表,链表可以很方便的中断和恢复,来简单模拟一下 React 中 的 UpdateQueue

```js
class Update {
  //payload数据或者 说元素
  constructor(payload, nextUpdate) {
    this.payload = payload;
    this.nextUpdate = nextUpdate; //指向下一个节点的指针
  }
}
class UpdateQueue {
  constructor() {
    this.baseState = null; //原状态
    this.firstUpdate = null; //第一个更新
    this.lastUpdate = null; //最后一个更新
  }
  enqueueUpdate(update) {
    if (this.firstUpdate == null) {
      this.firstUpdate = this.lastUpdate = update;
    } else {
      this.lastUpdate.nextUpdate = update; //上一个最后一个节点的nextUpdate指向自己
      this.lastUpdate = update; //让最后一个节指向自己
    }
  }
  //1.获取老状态。然后遍历这个链表，进行更新 得到新状态
  forceUpdate() {
    let currentState = this.baseState || {}; //初始状态
    let currentUpdate = this.firstUpdate;
    while (currentUpdate) {
      let nextState =
        typeof currentUpdate.payload == "function"
          ? currentUpdate.payload(currentState)
          : currentUpdate.payload;
      currentState = { ...currentState, ...nextState }; //使用当前更新得到新的状态
      currentUpdate = currentUpdate.nextUpdate; // 找下一个节点
    }
    this.firstUpdate = this.lastUpdate = null; //更新完成后要把链表清空
    this.baseState = currentState;
    return currentState;
  }
}
//计数器 {number:0}  setState({number:1})  setState((state)=>({number:state.number+1}))
let queue = new UpdateQueue();
// 每次调用 setState 就会生成一个 Update 并加入到 Fiber 的 updateQueue 中
queue.enqueueUpdate(new Update({ name: "Aotu" }));
queue.enqueueUpdate(new Update({ number: 0 }));
queue.enqueueUpdate(new Update((state) => ({ number: state.number + 1 })));
queue.enqueueUpdate(new Update((state) => ({ number: state.number + 1 })));
queue.forceUpdate();
console.log(queue.baseState);
```

以下是 updateQueue 的状态计算逻辑

```js
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes
): void {
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any);

  hasForceUpdate = false;

  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;

  let pendingQueue = queue.shared.pending;
  // 如果 pending 不为空的情况需要剪开环型链表并合并
  if (pendingQueue !== null) {
    // 将 pending 设为空，表示这些 pending 已经处理过
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue; // pending 的最后一个 udpdate
    const firstPendingUpdate = lastPendingUpdate.next; // pending 的第一个 update
    // 剪开环，使最后一个 update 不再指向第一个 update
    lastPendingUpdate.next = null;
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 如果上一次有跳过的 update，那么 baseUpdate 链表不为空
      // 需要将 pending 的第一个 update 接上 baseUpdate
      lastBaseUpdate.next = firstPendingUpdate;
    }
    // 将 lastBaseUpdate 赋值为 lastPendingUpdate
    // 此时已经形成了 以 firstBaseUpdate 为头以 lastBaseUpdate 为尾的新链表
    // 也即为本次需要处理的 update 链表
    lastBaseUpdate = lastPendingUpdate;
  }

  if (firstBaseUpdate !== null) {
    let newState = queue.baseState;
    let newLanes = NoLanes;
    // 这里的 newBaseState， newFirstBaseUpdate，newLastBaseUpdate 是计算的临时变量
    // 实际上会用来更新 updateQueue 的 baseState, firstBaseUpdate, lastBaseUpdate
    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;
    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      const updateEventTime = update.eventTime;
      // 更新优先级不满足，该 update 会被跳过
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        const clone: Update<State> = {
          eventTime: updateEventTime,
          lane: updateLane,

          tag: update.tag,
          payload: update.payload,
          callback: update.callback,

          next: null, // 注意这里的 next 设置为 null，
          // 因此由 firstBaseUpdate 以及 lastBaseUpdate 组成的链表不是环形的
        };
        // 如果 newLastBaseUpdate 为空，说明这是第一个被跳过的 update
        // 因此 newFirstBaseUpdate 为该 update
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          // 同时表明在该 update 之前没有任何 upadte 被跳过
          // 需要即记录第一个跳过的 update 之前的最终状态
          newBaseState = newState;
        } else {
          // 否则直接将该 update 添加到 baseUpdate 链表最后，等价于
          // newLastBaseUpdate.next = clone
          // newLastBaseUpdate = newLastBaseUpdate.next
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        // Update the remaining priority in the queue.
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        // 该 update 更新优先级满足，本次更新不会跳过
        // 如果 newLastBaseUpdate 不存在，说明之前没有跳过任何 upadte 无需添加新增
        // 否则无论无论该 update 是否跳过都需要添加到 baseUpdate 链表之后
        if (newLastBaseUpdate !== null) {
          const clone: Update<State> = {
            eventTime: updateEventTime,
            // 这个 update 本次不会跳过，因此将其优先级设置为最高
            // 后续的更新计算一定不会跳过该 update
            lane: NoLane,

            tag: update.tag,
            payload: update.payload,
            callback: update.callback,

            next: null, // 注意这里的 next 设置为 null，
            // 因此由 firstBaseUpdate 以及 lastBaseUpdate 组成的链表不是环形的
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }

        // 计算最新的 state.
        newState = getStateFromUpdate(
          workInProgress,
          queue,
          update,
          newState,
          props,
          instance
        );
      }
      update = update.next;
      if (update === null) {
        pendingQueue = queue.shared.pending;
        if (pendingQueue === null) {
          // 计算到链表尾部，退出
          break;
        }
      }
    } while (true);

    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }

    // 更新 updateQueue 的 baseState，firstBaseUpdate， lastBaseUpdate 三个属性
    queue.baseState = ((newBaseState: any): State);
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
  }
}
```
