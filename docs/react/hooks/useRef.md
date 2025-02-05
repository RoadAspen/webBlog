# useRef

ref 历经三代

1. string ref

```js
import React, { Component } from "react";
class App extends Component {
  componentDidMount() {
    console.log("this.refs.XXX");
    console.log(this.refs.h1Ref);
  }
  render() {
    return <h1 ref="h1Ref">Hello World!</h1>;
  }
}
export default App;
```

可以用来获取 DOM 元素节点、获取组件实例

2. createRef

类组件中推荐使用，用于替代 string ref 的方式。

```js
import React, { Component, createRef } from "react";
class App extends Component {
  constructor(props) {
    super(props);
    this.h1Ref = createRef();
  }
  componentDidMount() {
    console.log("React.createRef()");
    console.log(this.h1Ref.current);
  }
  render() {
    return <h1 ref={this.h1Ref}>Hello World!</h1>;
  }
}
export default App;
```

DOM 元素节点或组件实例 存放在 ref.current 中。

3. useRef

在函数式组件中是无法使用前面两种的，因为函数组件没有实例，取而代之的是 `useRef`.

```js
import React, { useEffect, useRef } from "react";
function App() {
  const h1Ref = useRef();
  useEffect(() => {
    console.log("useRef");
    console.log(h1Ref.current);
  }, []);
  return <h1 ref={h1Ref}>Hello World!</h1>;
}
export default App;
```

`useRef` 也可以存储一些变量，**这些变量的更改不会引起组件的重新渲染。**

```js
import React, { useEffect, useRef } from "react";
function App() {
  const aRef = useRef();
  useEffect(() => {
    console.log("useRef");
    console.log(h1Ref.current);
  }, []);

  handleClick = () => {
    h1Ref.current = "更改不会导致组件重新渲染";
    console.log(h1Ref.current);
  };

  return <button onClick={handleClick}>Hello World!</button>;
}
export default App;
```
