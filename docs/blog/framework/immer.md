# immer.js

现在很多项目都会用到 immer.js 来保证数据的不可变性，熟悉 Mobx 的同学可能会发现，Immer 就是更底层的 Mobx，它将 Mobx 特性发扬光大，可以结合到任何数据流框架，使用起来非常优雅。

## 概述

immer.js 的核心实现是利用 ES6 的 Proxy，以最小的成本实现了 js 的不可变数据结构。

## 解决的问题

在 React 中，React UI 更新的原则就是 **Immutable** ，不能直接修改 state，必须返回新的对象。

setState 支持函数式写法。

```js
const [state, setState] = useState({ age: 100, name: 2 });

setState((state) => {
  return { ...state, name: 20 };
});
```

配合 结构语法，看起来还是很优雅的，那如果是比较复杂的数据呢？比如下面这样的 👇：

```js
{
  a: 1,
  b: {
    age: 123,
    c: {
      name: 11,
      d: 2,
    },
  },
};
```

此时，如果我想改变 **state.b.c.d 为 3** ，那我们就必须要使用下边的方法：

```js
setState({
    ...state,
    b:{
        ...state.b,
        {
            ...state.b.c,
            d:3
        }
    }
})
```

这样就显得十分的不方便，要解决这个问题，我们也可以使用深拷贝，比如 `JSON.parse(JSON.stringify(state))`, 或者 **lodash** 提供的 **cloneDeep** 方法。 但是这两者都不太好：

1. **JSON.parse(JSON.stringify(state))** 如果对象的 value 是 null、undefined、function 时 有很多问题，不能完美的 copy。
2. **cloneDeep** 需要深层递归，不可复用，浪费性能和内存。

然而使用了 **Immer**，一切就不一样了：

```js
import produce from "immer";

const [state, setState] = useState({
  a: 1,
  b: {
    age: 123,
    c: {
      name: 11,
      d: 2,
    },
  },
});
setState(produce(state, (draft) => (draft.b.c.d = 3)));
```

这和上面比起来真的是太方便了

## Immer

Immer 通过 递归式的 **proxy 对象代理** 和 **浅拷贝**，提高了不可变数据的性能，尽可能的复用数据结构当中其他节点的内存。既满足了性能要求，又使得数据达到了不可变数据的要求。保证数据的不可变性，也就是保证不会直接更改当前对象，而是最小单元的去复制对象，然后再进行更改，以防其他使用该对象的地方出现异常。
