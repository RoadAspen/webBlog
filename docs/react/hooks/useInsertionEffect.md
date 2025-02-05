# useInsertionEffect

useInsertionEffect 是为 CSS-in-JS 库的作者特意打造的。除非你正在使用 CSS-in-JS 库并且需要注入样式，否则你应该使用 useEffect 或者 useLayoutEffect。

## 原理

调用 useInsertionEffect 在任何可能需要读取布局的副作用启动之前插入样式：

```jsx
import { useInsertionEffect } from "react";

// 在你的 CSS-in-JS 库中
function useCSS(rule) {
  useInsertionEffect(() => {
    // ... 在此注入 <style> 标签 ...
  });
  return rule;
}
```
