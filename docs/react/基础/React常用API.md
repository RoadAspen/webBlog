# React 常用 API

React 包含两个部分，一是 React ， 二是 ReactDOM.

React 部分主要是提供了我们常用的**API**，而真正的核心是 **ReactDOM** 。 任务调度、更新、事件中心都在 ReactDOM 中执行的。

基于 React 16.13 暴露出来的 api：

```js
export {
  Children, // React.children 用于对 传入的children 进行处理，在 组件内部 ，常用 React.children.map   React.children.forEach. 第一个参数是 props.children ,第二个是 回调函数
  createRef, // 创建一个 ref
  Component, // React class 组件 抽象类
  createElement, // react 将 type ，props ， children 传换成  fiber 结构, JSX 是createElement 的语法糖。
  cloneElement, // 一般用于 React.Children.map 时， 对当前的组件做一些添加或者删除 属性的操作。 此时使用 cloneElement。
  PureComponent, // React class 组件 抽象类， 比Component 多了一个isPureReactComponent标识
  createContext, // 创建 context，传入一个value，创建一个 context， 将一个 类组件的contextType 指定为这个context，可以在类中使用 this.context 消费这个context
  forwardRef, // 传递 ref 到 HOC内部的参数组件， ref 不属于 props，所以 使用 forwardRef 向子组件传递 ref。 建议 和 useImperativeHandle 一起使用
  lazy, // 懒加载，异步加载 配合 Suspense
  REACT_SUSPENSE_TYPE as Suspense, // 异步加载组件，有一个 fallback 属性，用来执行 异步组件未加载完成之前，显示 fallback 指定的dom结构. 仅支持 React.lazy 加载组件的方式
  memo, // 包裹函数组件，类似于 class 组件的 shouldComponentUpdate
  // ====================== hooks api start===============================

  useCallback, // 用于缓存包裹函数组件组件内的hooks
  useContext, // 在hooks中创建 context，返回
  useEffect, // hooks中的副作用
  useImperativeHandle, // 与 forward 一起使用，选择暴露 current上的哪些属性给父组件。 例 focus、blur 等方法，还可以重定义这些方法
  useDebugValue, // 用于自定义hooks传参时，对参数范围有要求时需要做判断，一般在 hooks 复用的情况下使用
  useLayoutEffect, // 和 useEffect 相似，但它会同步执行，用于一些快速更改状态，但是不想中间状态被渲染的情况。
  useMemo, // 用于 函数组件 缓存一个通过计算获得的变量，如果
  useReducer, // 类似 redux，传入一个 reducer函数， 和一个默认参数， 返回 state 和 一个dispatch。 修改这个state的途径只能是 dispatch一个action。
  useRef, // 返回一个 可变的 ref对象， ref对象有一个 current属性，可以被初始化为传入的参数， 返回的 ref对象在组建的整个生命周期内保持不变
  useState, // 定义函数组件的状态,传入一个value，返回 state 和 修改 state的方法
  // ====================== hooks api end===============================

  isValidElement, // 验证对象是否为 合法的React 元素，返回值为 true 或 false。
  REACT_FRAGMENT_TYPE as Fragment, // 空标签
  REACT_PROFILER_TYPE as Profiler, // 测量包含的组件渲染的时间，并执行回调函数。 在生产环境禁用
  REACT_STRICT_MODE_TYPE as StrictMode, // 严格模式，检查子组件是否符合组件编写规则，发出警告 ，仅在开发模式下运行，不渲染任何组件
  //
  // =========================== Concurrent模式  =========================================

  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  // Deprecated behind disableCreateFactory
  createFactory, //
  // Concurrent Mode
  useTransition, // useTransition 接受带有 timeoutMs 的可选的 Suspense 配置。 此超时（毫秒）告诉 React 在显示下一个状态（上例中为新的用户资料页面）之前等待多长时间。
  useDeferredValue,
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  withSuspenseConfig as unstable_withSuspenseConfig,
  // enableBlocksAPI
  block,
  // enableDeprecatedFlareAPI
  useResponder as DEPRECATED_useResponder,
  createResponder as DEPRECATED_createResponder,
  // enableFundamentalAPI
  createFundamental as unstable_createFundamental,
  // enableScopeAPI
  createScope as unstable_createScope,
  // enableJSXTransformAPI
  jsx,
  jsxs,
  // TODO: jsxDEV should not be exposed as a name. We might want to move it to a different entry point.
  jsxDEV,
};
```

## Children

这个对象提供了一堆帮你处理 props.children 的方法，因为 children 是一个类似数组的但不是数组的数据结构，如果你要对 Children 做出处理，那么可以用 React.Children 提供的方法。

```js
const Children = {
  map,
  forEach,
  count,
  toArray,
  only,
};
```

## createRef

新的 ref 用法，React 抛弃了`<div ref="myDiv" />`这种 `string ref`` 的用法，将来你只能使用两种方式来使用 ref.

```js
class App extends React.Component {
  constructor() {
    this.ref = React.createRef();
  }

  render() {
    return <div ref={this.ref} />;
    // or
    return <div ref={(node) => (this.funRef = node)} />;
  }
}
```

## Component & PureComponent

这两个类基本相同，唯一的区别是 PureComponent 比 Component 多了一个标识。

```js
if (ctor.prototype && ctor.prototype.isPureReactComponent) {
  return !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState);
}
```

在决定组件是否需要更新时，他会判断你是否继承自 PureComponent，如果是的话就会 shallowEqual 比较 state 和 props。
**React 中对比一个 ClassComponent 是否需要更新，只有两个地方。一是看有没有 shouldComponentUpdate 方法，二就是这里的 PureComponent 判断**

## createContext

createContext 是用于替换老的`context API`

使用方法：

```js
const { Provider, Consumer } = React.createContent("defaultValue");

const ProviderComp = (props) => (
  <Provider value={"realValue"}>{props.children}</Provider>
);

const ConsumerComp = (props) => (
  <Consumer>{(value) => <p>{value}</p>}</Consumer>
);

<ProviderComp>
  <ConsumerComp />
</ProviderComp>;
```

## forwardRef

`forwardRef`不常用，是用于解决 HOC 组件传递 ref 的问题。

应用场景：

1. 转发 `ref`` 到组件内部的 DOM 节点上.
2. 在高阶组件中转发 ref.

原因：如果需要将 ref 传递到一个组件的子组件中，是无法使用 ref 作为 props 属性传递的，因为组件的 ref 属性会自动绑定 current。
之前的解决方案是 通过别名，如： childRef = {ref} 的方式，将 childRef 传递过去。使用 forwardRef 的话就不用了别名来。

```js
function logProps(WrappedComponent) {
  class LogProps extends React.Component {
    render() {
      const { forwardedRef, ...rest } = this.props;
      return <WrappedComponent ref={forwardedRef} {...rest} />;
    }
  }

  return React.forwardRef((props, ref) => {
    return <LogProps forwardedRef={ref} {...props} />;
  });
}

class Child extends Component {
  constructor() {
    super();
  }
  render() {
    return <div>{this.props.txt}</div>;
  }
}
const LogChild = logProps(Child);
class Parent extends Component {
  constructor() {
    super();
  }
  componentDidMount() {
    console.log(ref); //获取Child组件
  }
  render() {
    return <LogChild ref={ref} txt="parent props txt" />;
  }
}
```

## createElement & cloneElement & createFactory & isValidElement

createElement 可谓是 React 中最重要的 API 了，他是用来创建 ReactElement 的.但是我们平时基本没用过，这是为啥呢？因为我们用了 JSX，编译之后，createElement 就出现了：

```js
// jsx
<div id="app">content</div>;

// js
React.createElement("div", { id: "app" }, "content");
```

**cloneElement** 是用来克隆一个 ReactElement。  
**createFactory** 用来创建专门创建一类 ReactElement 的工厂：

```js
export function createFactory(type) {
  const factory = createElement.bind(null, type);
  factory.type = type;
  return factory;
}
```

他其实就是绑定了第一个参数的 createElement，一般我们用 **JSX** 进行编程的时候不会用到这个 API.

**isValidElement** 顾名思义就是用来验证是否是一个 ReactElement 的，基本也用不太到
