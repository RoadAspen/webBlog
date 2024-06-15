# useDeferredValue

## 原理

react18 新增的一个 hook，可以让你延迟更新 UI 的某些部分

```js
const deferredValue = useDeferredValue(value);
当我们使用 deferredValue 时，在新内容加载期间显示旧内容，延迟渲染UI的某些部分。内部使用 Object.is 浅比较。
```

主要原理在于 deferredValue 的值的更新是滞后的，类似于防抖机制。

## 机制

1. 当更新位于 Transition 内时，useDeferredValue 始终返回新值并且不会生成延迟渲染，因为更新已经延迟。
2. 您传递给 useDeferredValue 的值应该是原始值（如字符串和数字）或在渲染之外创建的对象。 如果您在渲染期间创建一个新对象并立即将其传递给 useDeferredValue，则每次渲染时它都会有所不同，从而导致不必要的后台重新渲染。
3. 当 useDeferredValue 接收到与之前不同的值（使用 Object.is 进行比较）时，除了当前渲染（此时它仍然使用旧值），它还会安排一个后台重新渲染。这个后台重新渲染是可以被中断的，如果 value 有新的更新，React 会从头开始重新启动后台渲染。举个例子，如果用户在输入框中的输入速度比接收延迟值的图表重新渲染的速度快，那么图表只会在用户停止输入后重新渲染。

4. useDeferredValue 与 <Suspense> 集成。如果由于新值引起的后台更新导致 UI 暂停，用户将不会看到后备方案。他们将看到旧的延迟值，直到数据加载完成。

5. useDeferredValue 本身并不能阻止额外的网络请求。

6. useDeferredValue 本身不会引起任何固定的延迟。一旦 React 完成原始的重新渲染，它会立即开始使用新的延迟值处理后台重新渲染。由事件（例如输入）引起的任何更新都会中断后台重新渲染，并被优先处理。

7. 由 useDeferredValue 引起的后台重新渲染在提交到屏幕之前不会触发 Effect。如果后台重新渲染被暂停，Effect 将在数据加载后和 UI 更新后运行。

## 使用场景

主要用作 input 更新值，另一个组件（图表、表格之类的复杂组件）依赖 input 值的时候会导致这个组件频繁更新，使用 useDeferredValue 可以减少组件更新次数。

### 使用 Suspense 的场景

```js
import { Suspense, useState } from "react";
import SearchResults from "./SearchResults.js";

export default function App() {
  const [query, setQuery] = useState("");
  return (
    <>
      <label>
        Search albums:
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <Suspense fallback={<h2>Loading...</h2>}>
        <SearchResults query={query} />
      </Suspense>
    </>
  );
}
```

当 query 改变时，会出现 Loading

### 使用 Suspense 和 useDeferredValue 的场景

```js
import { Suspense, useState, useDeferredValue } from "react";
import SearchResults from "./SearchResults.js";

export default function App() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  return (
    <>
      <label>
        Search albums:
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <Suspense fallback={<h2>Loading...</h2>}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </>
  );
}
```

这种情况下 Loading 不会出现
