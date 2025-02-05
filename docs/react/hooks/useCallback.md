# useCallback

```js
import React, { useState, useCallback } from "react";
import Button from "./Button";

export default function App() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

  const handleClickButton1 = () => {
    setCount1(count1 + 1);
  };

  const handleClickButton2 = useCallback(() => {
    setCount2(count2 + 1);
  }, [count2]);

  return (
    <div>
      <div>
        <Button onClickButton={handleClickButton1}>Button1</Button>
      </div>
      <div>
        <Button onClickButton={handleClickButton2}>Button2</Button>
      </div>
      <div>
        <Button
          onClickButton={() => {
            setCount3(count3 + 1);
          }}
        >
          Button3
        </Button>
      </div>
    </div>
  );
}

Button2 = React.memo(function({ onClickButton, children }) {
  return <button onCLick={onClickButton}>{children}</button>;
});
```

只有当 count2 更改的时候，才会重新生成一个 function， 这样依赖传入的 Button2 如果是被 React.memo 包裹的，就不会触发更新。
