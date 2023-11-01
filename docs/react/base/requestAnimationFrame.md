# requestAnimationFrame

在 web 应用中，我们可以用很多中方法去实现一个动画。 `requestAnimationFrame`在渲染之前执行。

JS 动画：

- `setTimeout` 或 `setInterval`定时器（容易卡顿、抖动）
- `canvas` 画布（js 操作画笔）
- `requestAnimationFrame` 帧动画（推荐）

CSS3 动画:

- `transition` 过渡动画
- `animation` 直接动画

## 原理

我们知道，在浏览器中，页面是一帧一帧绘制出来的，渲染的帧率与设备的刷新率保持一致。一般情况下设备的屏幕刷新率为 1s 60 次，就是说浏览器的刷新频率是 60HZ，那么一帧的时间就是大约 16ms。浏览器在一帧内会做哪些事情：

1. 处理用户输入事件 。
2. javascript 执行。
3. requestAnimationFrame 调用。
4. 布局 Layout。
5. 绘制 Point。
6. requestIdleCallback （是否剩余时间）

浏览器会在每次绘制之前 执行 `requestAnimationFrame()`，如果上一帧的第二步的执行时间超过了 16ms，那么也会造成失帧.

## 用法

```js
// requestAnimationFrame请求动画帧方式
function requestAnimationFrameFn() {
  /**
   *  这里执行动画绘制
   */

  window.requestAnimationFrame(requestAnimationFrameFn);
}
// 在浏览器下一次绘制之前执行。
window.requestAnimationFrame(requestAnimationFrameFn);
```

## 优点

1. 当页面隐藏时、未处于激活状态下，requestAnimationFrame 暂停执行，节省 CPU 资源。
2. setTimeout 和 setInterval 实际的执行时间是固定的，导致与浏览器（浏览器的刷新频率紧跟设备的刷新频率）的刷新频率不一致，导致掉帧的情况发生。
3. requestAnimationFrame 会在每一帧绘制之前执行完成，和浏览器的刷新频率保持一致，不会丢帧（除非 JS 阻塞）。
4. 用于函数节流，一帧之内只执行一次。

## 缺点

1. 多次绑定 `requestAnimationFrame` 函数会导致在同一个帧内多次触发执行。因此保证同一时间内 `requestAnimationFrame` 只会被调用一次。
2. 如果`requestAnimationFrame`中的回调函数逻辑复杂，也有可能会造成失帧。
