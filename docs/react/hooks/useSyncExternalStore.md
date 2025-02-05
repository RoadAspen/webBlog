# useSyncExternalStore

useSyncExternalStore 是一个让你订阅外部 store 的 React Hook。

## 原理

1. 订阅外部 store
2. 订阅浏览器 API
3. 把逻辑抽取到自定义 Hook
4. 添加服务端渲染支持

外部的 store 必须提供一个 subscribe 方法，用于 useSyncExternalStore 去注册监听函数，当 store 中的值发生改变时，会触发这个监听函数，在监听函数内去触发组件的更新

```jsx
import { useSyncExternalStore } from "react";
import { todosStore } from "./todoStore.js";

function TodosApp() {
  const todos = useSyncExternalStore(
    todosStore.subscribe,
    todosStore.getSnapshot
  );
  // ...
}
```
