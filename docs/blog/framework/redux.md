# Redux 实现

## Redux 介绍

Redux 是 Javascript 状态容器，提供可预测化的状态管理。可以让你构建一致化的应用，运行于不同的开发环境，并且易于测试。不仅于此，它还提供了超爽的开发体验，比如 时间旅行器。

## 核心概念

Redux 本身很简单，主要是将 state 变得可预测。 根据触发 action，来更新 state。

## 三大原则

1. 单一数据源。
   整个应用的 state 被储存在一棵 object tree 中，并且这个 object tree 只存在于唯一一个 store 中。
2. state 是只读的。
   唯一改变 state 的方法是触发 action，action 是一个用于描述已发生事件的普通对象。
3. 使用纯函数来执行修改
   为了表述 action 如何改变 state，你需要编写纯函数 reducers。

## Redux 基础

### action

action 用来表示修改 state 的动作 type 以及 载荷 payload， action 是 store 的唯一数据来源。

```js
// 有载荷
{
    type:'add',
    payload:{
        count:2
    }
}

// 无载荷
{
    type:'reset'
}
```

可以是一个返回 action 的 action 创建函数

```js
function addCount(count) {
  return {
    type: "add",
    payload: {
      count,
    },
  };
}
```
