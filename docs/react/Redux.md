# Redux

## Redux 介绍

Redux 是 JavaScript 状态容器，提供可预测化的状态管理。
随着 JavaScript 单页应用（SPA）开发日趋复杂,JavaScript 需要管理比任何时候都要多的 state（状态）,Redux 就是用来降低管理难度的. Redux 不依赖于任何框架,但是它可以适用于任何框架，更像是一种设计模式。

## 三大原则

### 单一数据源

**整个应用的数据 state 全部被存储在一棵对象树中（object tree），并且这个 object tree 只存在于一个 store 中。**

```js
store = {
  reducer: {
    age: 20,
    name: "jack",
  },
  reducer2: {
    speak: "english",
    loading: true,
  },
};
```

应用 1 的 state 叫做 reducer ， 应用 2 的 state 叫做 reducer2。

### state 是只读的

**唯一可以改变 state 的方法是通过触发 action，action 是一个用于描述已发生事件的描述。**

`action`通常由一个 type 和 一个 payload 来表示行为和行为负载

```js
action = {
  type: "修改年龄",
  payload: {
    age: 24,
  },
};

action = {
  type: "修改名称",
  payload: {
    name: "tom",
  },
};
```

### 使用纯函数来修改 state

**为了描述 action 如何修改 state，即 将 action 和 state 关联起来，我们需要编写 reducer 函数。**

Reducer 是一个纯函数 （同样的输入必定得到同样的输出），它接受当前的 state 和 action，返回新的 state。

```ts
action = {
  type: "新增名字",
  payload: {
    name: "tom",
  },
};
// 这里的prevState 是  store.reducer
function reducer(prevState: any = {}, action: { type: string; payload: any }) {
  switch (action.type) {
    case "修改年龄":
      return {
        ...prevState,
        // 虚岁 + 1
        age: action.payload.age + 1,
      };
    case "新增名字":
      return {
        ...prevState,
        name: prevState.name + action.payload.name,
      };
    default:
      return { ...prevState };
  }
}
```

刚开始可能只有一个 reducer，但是随着应用越来越大，就需要拆分成很多个 reducers 出来，分别独立的操作 state tree 的一部分。redux 提供了 combineReducers 用来将 众多的 reducers 再合并起来，形成一个大的 reducer。

```js
// 这里的prevState 是 store.reducer2
function reducer2(prevState: any, action: { type: string, state: any }) {
  if (!action) return prevState;
  switch (action.type) {
    case "test":
      return { ...prevState };
    default:
      return prevState;
  }
}

const reducers = combineReducers({
  reducer: reducer,
  reducer2: reducer2,
});

// 这里输出一个 {reducer:{},reducer2:{}}  的对象
const store = createStore(reducers);
```

## Redux Store 的基础

store 是一个单一对象

- 管理应用给的 state
- 通过 store.getState() 可以获取当前的完整 state
- 通过 store.dispatch(action) 来触发 state 更新
- 通过 store.subscribe(listener) 来注册 state 变化监听器
- 通过 createStore(reducer, [initialState]) 创建

## redux 实现

[代码实现]()
