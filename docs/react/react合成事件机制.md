# React 事件机制

## 浏览器事件委托

假设有如下 html，我们想要在每个 li 上绑定 onClick 事件，最直观的做法当然就是给每个 li 分别添加事件，增加事件回调。这种做法当然没错，但是我们有一种更好的做法，那就是在 ul 上添加有个监听事件，由于事件的冒泡机制，事件就会冒泡到 ul 上，因为 ul 上有事件监听，所以事件就会触发。

Event 对象提供了一个属性叫 target，可以返回事件的目标节点，我们称为事件源，也就是说，target 就可以表示为触发当前的事件 dom，我们可以根据 dom 进行判断到底是哪个元素触发了事件，根据不同的元素，执行不同的回调方法。

**事件委托有以下优点**：

1. 减少事件注册,节省内存，能够提升整体性能。
2. 简化了 dom 节点更新时,相应事件的更新（用过 jquery 的都知道，动态加入的元素，事件需要重新绑定）。

## React 事件机制

> React 并不是将 click 事件直接绑定在 dom 上面，而是采用事件冒泡的形式冒泡到 document 上面，这个思路借鉴了事件委托机制。所以，React 中所有的事件最后都是被委托到了 document 这个顶级 DOM 上。

### React 事件流程

```js
/**
 *
 * Overview of React and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 */
```

从这个图可以看出，Dom 事件发生后，React 通过事件委托机制将大部分事件代理至 Document 层，ReactEventListener 就是负责给元素绑定事件的。ReactEventEmitter 暴露接口给 React 组件层用于添加事件订阅（对外暴露了 listenTo 等方法）。EventPluginHub 负责管理和注册各种插件。在事件分发时，调用插件来生成合成事件。 React 事件系统使用了插件机制来管理不同行为的事件。这些插件会处理自己感兴趣的事件类型，并生成合成事件对象。

比如 `SimpleEventPlugin` 负责处理一些比较通用的事件类型，如`blur、focus、click、submit、touchMove、mouseMove、scroll、drag、load`。

**EnterLeaveEventPlugin** 负责处理 `mouseEnter/mouseLeave` 和 `pointerEnter/pointerLeave` 这两类事件，**单独处理的原因是这两类事件不支持冒泡**。

**TapEventPlugin** 是为了解决移动端 IOS 300ms 点击延迟，该插件增加了一个 `onTouchTap` 事件，这个事件触发后，会忽略 300ms 后的 onClick 事件。

这里还需要了解的是，EventPluginHub 中处理的时间其实是合成事件 (SyntheticEvent)，React 为什么要定义合成事件这个概念呢，有三点原因：

1. 合成事件 `SyntheticEvent` 可以认为是**浏览器原生事件跨浏览器的封装**，相当于 React 帮我们做了浏览器的兼容性处理。
2. React 想通过 `SyntheticEvent` 实现跨平台事件机制。
3. 原生事件升级、改造，比如 React 的 `onChange` 事件，它为表单元素定义了统一的值变动事件，例如 `blur`、`change`、`focus`、`input` 等。

对于依赖的原生事件，scroll blur focus cancel close 方法注册捕获阶段的事件监听器。invalid submit reset 事件不做处理。剩下的事件需要判断是否是媒体触发的，比如 video / audio 的 onplaying 事件，onprogress 事件， onratechange 事件等，这些媒体事件也不需要处理。

React 这么做的原因和事件有关，有些事件是不冒泡的，所以不能在冒泡阶段进行事件委托。  
DiscreteEvent：click，blur,focus,submit,tuchStart 等，优先级是 0。
UserBlockingEvent：touchMove,mouseMove,scroll,drag,dragOver 等，这些事件会阻塞用户的交互，优先级是 1。
ContinuousEvent：load,error,loadStart,abort,animationend 等，优先级是 2，这个优先级最高，不会被打断。
根据优先级的不同，监听函数做了不同的包装，我们先不管这里生成的监听函数和最初的监听方法有什么不同。最终我们会调用 addEventBubbleListener 方法。

addEventBubbleListener 就是 element.addEventListener，为目标添加事件监听函数。

1. React 借鉴事件委托的方式将大部分事件委托给了 Document 对象。
2. React 中的事件分为 3 类。分别是 DiscreteEvent（离散事件），UserBlockingEvent（用户阻塞事件），ContinuousEvent（连续事件）。
3. 不同类型的事件代表了不同的优先级。
   事件委托需要区分捕获和冒泡，有些事件由于没有冒泡过程，只能在捕获阶段进行事件委托。
4. 没有进行委托的事件是 Form 事件和 Media 事件，原因是这些事件委托后会触发两次回调函数。
