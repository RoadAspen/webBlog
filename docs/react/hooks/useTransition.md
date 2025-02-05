# useTransition

useTransition 是一个帮助你在不阻塞 UI 的情况下更新状态的 React Hook。

```jsx
function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState("about");

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);
    });
  }
  // ……
}
```

transition 可以使用户界面的更新在慢速设备上仍保持响应性。

通过 transition，UI 仍将在重新渲染过程中保持响应性。例如用户点击一个选项卡，但改变了主意并点击另一个选项卡，他们可以在不等待第一个重新渲染完成的情况下完成操作。

## 注意

1. 不应将控制输入框的状态变量标记为 transition， input 的值需要实时更新
2. startTransition 函数的回调函数中，所有的代码都是同步执行的。
