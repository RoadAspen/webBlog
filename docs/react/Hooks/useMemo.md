# useMemo

`useMemo` 接受两个参数，第一个参数是一个函数，返回值用于产生保存值。 第二个参数是一个**数组，作为 dep 依赖项**，数组里面的依赖项发生变化，重新执行第一个函数，产生新的值。

可以将一些 非常耗费性能的 操作 或者是 组件放进去，

```js
const number = useMemo(() => {
  /** ....大量的逻辑运算 **/
  return number;
}, [props.number]); // 只有 props.number 改变的时候，重新计算number的值。
```

我们仅仅只能把 useMemo 作为性能优化的手段
