# useReducer

类似于 Redux 中的 reducer 和 dispatch， 利用纯函数及 action 去修改状态数据。

```js
const DemoUseReducer = () => {
  /* number为更新后的state值,  dispatchNumber 为当前的派发函数 */
  const [number, dispatchNumber] = useReducer((state, action) => {
    const { payload, name } = action;
    /* return的值为新的state */
    switch (name) {
      case "add":
        return state + 1;
      case "sub":
        return state - 1;
      case "reset":
        return payload;
    }
    return state;
  }, 0);
  return (
    <div>
      当前值：{number}
      {/* 派发更新 */}
      <button onClick={() => dispatchNumber({ name: "add" })}>增加</button>
      <button onClick={() => dispatchNumber({ name: "sub" })}>减少</button>
      <button onClick={() => dispatchNumber({ name: "reset", payload: 666 })}>
        赋值
      </button>
      {/* 把dispatch 和 state 传递给子组件  */}
      <MyChildren dispatch={dispatchNumber} State={{ number }} />
    </div>
  );
};
```
