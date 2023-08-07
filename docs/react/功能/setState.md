# setState

## 执行 setState 会立即更新吗？

[React 官网]有一段话：

> WARNING
>
> setState() 将对组件 state 的更改排入队列，并通知 React 需要使用更新后的 state 重新渲染此组件及其子组件。这是用于更新用户界面以响应事件处理器和处理服务器数据的主要方式
>
> 将 setState() 视为请求而不是立即更新组件的命令。为了更好的感知性能，React 会延迟调用它，然后通过一次传递更新多个组件。React 并不会保证 state 的变更会立即生效。
>
> setState() 并不总是立即更新组件。它会批量推迟更新。这使得在调用 setState() 后立即读取 this.state 成为了隐患。为了消除隐患，请使用 componentDidUpdate 或者 setState 的回调函数（setState(updater, callback)），这两种方式都可以保证在应用更新后触发。如需基于之前的 state 来设置当前的 state，请阅读下述关于参数 updater 的内容。
>
> 除非 shouldComponentUpdate() 返回 false，否则 setState() 将始终执行重新渲染操作。如果可变对象被使用，且无法在 shouldComponentUpdate() 中实现条件渲染，那么仅在新旧状态不一时调用 setState()可以避免不必要的重新渲染
>
> 在 React 中调用 setState 可以触发组件重新渲染，但是在不同的地方使用 setState 会有不同的表现，异步或者同步。

由此可见，我们在执行 **setState**之后并不会马上执行更新，它会批量推迟更新，每次调用 **setState** ，都会创建一个 **update** 并加入到 **fiber** 的 **updateQueue** 中。

> WARNING
>
> **传入对象就会被合并**
>
> **传入函数不会被合并**,函数没法合并

## 异步 or 同步

setState 是异步还是同步，这个问题的本质在于我们想在 setState 后直接拿到更新后的值：

```js
state = {index:1}
click(){
    this.setState({index:2});
    // 打印的 1
    console.log(this.state.index)
}
```

会出现这种迷惑行为，这个时候就会问出来 `同步` 还是 `异步`。

### isBatchingUpdates

在源码中，存在一个决定批量处理的 全局变量 **isBatchingUpdates**，初始值为 false， batchedUpdates 会将 **isBatchingUpdates** 设为 true。

是否同步更新 取决于 是不是进入了 **batchedUpdates** 流程

### 同步

- setTimeout、setInterval
- 原生 dom 事件

```js
componentDidMount(): void {
const that = this;
console.log("setTimeout before", this.state.count.index[0]);
setTimeout(() => {
    that.setState({
    count: {
        index: [2, 2, 3],
    },
    });
    console.log("setTimeout after", this.state.count.index[0]);
}, 2000);
}

componentDidMount(): void {
const that = this;
console.log("setTimeout before", this.state.count.index[0]);
btn1.addEventLister('click',()=>{
    that.setState({
    count: {
        index: [2, 2, 3],
    },
    });
    console.log("setTimeout after", this.state.count.index[0]);
})
}
```

在 dom 事件和 setTimeout、setInterval 执行的时候 **isBatchingUpdates** 为 false，所以将会视为同步， 使用 **unstable_batchUpdates** 方法，可以将 **同步更新转换为异步更新**

### 异步

**异步上下文**，执行之前会先将 **isBatchingUpdates** 设置为 true ， 在执行之后 **isBatchingUpdates** 设置为 false，

- 生命周期中
- React 合成事件中

在此期间 多次调用 setState 会批量处理，视图也只会更新一次。
**如果是**

## isBatchingUpdates 移除

在 React v16.9 版本中，React 官方移除了 **isBatchingUpdates**，新增了 执行上下文 **executionContext**，

1. **LegacyUnBatchedContext(同步上下文)**
2. **BatchedContext(批量处理上下文)**

如果是处于 **executionContext === LegacyUnBatchedContext(同步上下文)**， 则执行`同步更新`。否则为`异步更新`。

## 同步转异步

ReactDOM 提供了一个方法，

1. **unstable_batchedUpdate** 可以让我们将 定时器中的同步任务转为异步任务

```js
handleClick = () => {
  Promise.resolve().then(() => {
    ReactDOM.unstable_batchedUpdates(() => {
      this.setState({ number: this.state.number + 1 });
      console.log(this.state.number);
      this.setState({ number: this.state.number + 1 });
      console.log(this.state.number);
      this.setState({ number: this.state.number + 1 });
      console.log(this.state.number);
    });
  });
};
```

渲染次数一次,完美解决批量更新问题。

2. **flushSync** 可以将回调函数中的更新任务，放在一个较高的优先级中并同步更新。

```js
import ReactDOM from "react-dom";
class Index extends React.Component {
  state = { number: 0 };
  handleClick = () => {
    setTimeout(() => {
      this.setState({ number: 1 });
    });
    this.setState({ number: 2 });
    ReactDOM.flushSync(() => {
      this.setState({ number: 3 });
    });
    this.setState({ number: 4 });
  };
  render() {
    const { number } = this.state;
    console.log(number); // 打印什么？？
    return (
      <div>
        <div>{number}</div>
        <button onClick={this.handerClick}>测试flushSync</button>
      </div>
    );
  }
}
```

打印 0 3 4 1 ，相信不难理解为什么这么打印了。

1. 0 是在挂在阶段 打印
2. 3 由于是提高了优先级并同步更新，所以先打印
3. 4 **2 和 4**批量更新，打印了 4
4. 1 setTimeout 在下一个更新 event loop 执行，所以最后执行。

## 代码

### setState

React 类组件中的 setState 是继承自 Component 的原型方法

```js
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}
Component.prototype.setState = function(partialState, callback) {
  // partialState 必须是 一个对象或者函数或者 null， 否则就报错
  invariant(
    typeof partialState === "object" ||
      typeof partialState === "function" ||
      partialState == null,
    "setState(...): takes an object of state variables to update or a " +
      "function which returns an object of state variables."
  );
  this.updater.enqueueSetState(this, partialState, callback, "setState");
};
```

我们可以看到实际调用的是 **enqueueSetState** 方法，传入了 `组件实例`, `value`

### enqueueSetState

```js
enqueueSetState(inst, payload, callback) {
    // 查找对应的fiber对象
    const fiber = getInstance(inst);
    const currentTime = requestCurrentTimeForUpdate();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const expirationTime = computeExpirationForFiber(
        currentTime,
        fiber,
        suspenseConfig
    );
    // 创建一个 update 对象
    const update = createUpdate(expirationTime, suspenseConfig);
    // payload 存放的是需要更新的状态
    update.payload = payload;
    // 回调函数
    if (callback !== undefined && callback !== null) {
        update.callback = callback;
    }
    // 将 update 对象插入到更新列表中
    enqueueUpdate(fiber, update);
    // 添加调度任务， 在调度任务中 对比 expirationTime，是否过期，过期则直接执行
    scheduleWork(fiber, expirationTime);
}
```

**enqueueSetState** 会创建一个 **update** 对象，并将需要更新的状态 **payload** 、状态更新后的回调 **callback** 和 渲染的过期时间 **expirationTime** 等挂载到上边，然后将 **update 对象** 添加到更新队列中，并且产生一个调度任务。
