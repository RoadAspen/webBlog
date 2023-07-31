# useState

## 含义

`useState` 使得 函数式组件 拥有了自己的“state”。 **useState 接受一个初始值，或者是一个返回初始值的函数**， 返回一个数组，数组的第一个值是 `state`, 第二个值是 `用于改变state 的函数`

## 用法

```js
import { useState } from "react";
function App() {
  const [useList, setUserList] = useState(["小明", "小方", "小花"]);
  const [classList, setClassList] = useState(() => {
    return ["一班", "二班", "三班"];
  });

  return <div>
    <div>
        班级：
        <ul>
        {classList.map(class=><li key={class}>{class}</li>)}
        </ul>
    </div>
    <div>
        人员：
        <ul>
        {useList.map(user=><li key={user}>{user}</li>)}
        </ul>
    </div>
    <button onClick={()=>{setClassList((class)=>{
        return [...class,'四班']
    })}}>新增班级</button>
     <button onClick={()=>{setUserList((user)=>{
        return [...user,'小华']
    })}}>新增人员</button>
  </div>
}
```

##
