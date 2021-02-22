# React setState 异步 or 同步

在 React 中调用 setState 可以触发组件重新渲染，但是在不同的地方使用 setState 会有不同的表现，异步或者同步。

## 现象

在 React 中，如果是由 React 引发的事件处理（通过 onClick 等 React 封装的合成事件）和组件生命周期函数内（componentDidMount 等），调用 this.setState 不会同步更新 state，在 this.setState 之后也获取不到最新的 state。 除此之外，都会同步更新 state。 **除此之外**指的是绕过 React 通过 addEventListener 直接添加的事件处理函数，还有通过 setTimeout 和 setInterval 产生的异步调用。

## 为什么会这样

在 React 的 setState 函数实现中，会根据一个变量 `isBatchingUpdates` （是否为批量更新） 判断是直接更新还是放到队列中回头再说， 而 `isBatchingUpdates` 默认是 false ， 也就是说 setState 是同步更新 state， 但是，有一个函数 `beatchedUpdates`(批量更新)，这个函数会把 isBatchingUpdates 修改为 true，而当 React 在调用事件处理函数和自身生命周期之前就会调用这个 `beatchedUpdates`，造成的后果就是 React 控制的事件处理和生命周期中的同步调用 setState 变成了异步更新。

> 在合成事件和生命周期内的异步调用 setState（ajax 和 setTimeout），也会同步更新。
