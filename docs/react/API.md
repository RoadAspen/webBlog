# React 常用 API

React 包含两个部分，一是 React ， 二是 ReactDOM

React 部分主要是提供了我们常用的 API，而真正的核心是 ReactDOM 。 任务调度、更新、事件中心都在 ReactDOM 中执行的。

基于 React 16.13 暴露出来的 api：

```js
export {
	Children,
	createRef, // 创建一个 ref
	Component, // React class 组件 抽象类
	PureComponent, // React class 组件抽象类
	createContext, // 创建 context
	forwardRef, // 传递 ref 到 HOC内部的参数组件
	lazy, // 懒加载
	memo, // 包裹函数组件，类似于 class 组件的 shouldComponentUpdate
	// ====================== hooks api start===============================
	useCallback, // 包裹
	useContext,
	useEffect,
	useImperativeHandle,
	useDebugValue,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
	// ====================== hooks api end===============================
	REACT_FRAGMENT_TYPE as Fragment, // 空标签
	REACT_PROFILER_TYPE as Profiler,
	REACT_STRICT_MODE_TYPE as StrictMode,
	REACT_SUSPENSE_TYPE as Suspense,
	createElement,
	cloneElement,
	isValidElement,
	ReactVersion as version,
	ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
	// Deprecated behind disableCreateFactory
	createFactory,
	// Concurrent Mode
	useTransition,
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
