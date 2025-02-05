# useDebugValue

可用于在 React 开发者工具中显示自定义 hook 的标签。这个 hooks 目的就是检查自定义 hooks

```js
function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);
  // ...
  // 在开发者工具中的这个 Hook 旁边显示标签
  // e.g. "FriendStatus: Online"
  useDebugValue(isOnline ? "Online" : "Offline");

  return isOnline;
}
```

> 我们不推荐你向每个自定义 Hook 添加 debug 值。当它作为共享库的一部分时才最有价值。在某些情况下，格式化值的显示可能是一项开销很大的操作。除非需要检查 Hook，否则没有必要这么做。因此，useDebugValue 接受一个格式化函数作为可选的第二个参数。该函数只有在 Hook 被检查时才会被调用。它接受 debug 值作为参数，并且会返回一个格式化的显示值。
