# useLayoutEffect

`useEffect` **执行顺序**: 组件更新挂载完成 -> 浏览器 dom 绘制完成 -> 执行 useEffect 回调。

`useLayoutEffect` **执行顺序**: 组件更新挂载完成 -> 执行 useLayoutEffect 回调-> 浏览器 dom 绘制完成。

所以 `useLayoutEffect` 代码可能会阻塞浏览器的绘制。

```js
const DemoUseLayoutEffect = () => {
  const target = useRef();
  useLayoutEffect(() => {
    /*我们需要在dom绘制之前，移动dom到制定位置*/
    const { x, y } = getPosition(); /* 获取要移动的 x,y坐标 */
    animate(target.current, { x, y });
  }, []);
  return (
    <div>
      <span ref={target} className="animate"></span>
    </div>
  );
};
```

useLayoutEffect 会在浏览器绘制之前触发再次渲染，在某个初始值在组件渲染后立即需要更改的场景使用，避免出现页面跳动。
**副作用在当前流程渲染之前执行,所有会阻塞浏览器的绘制**
