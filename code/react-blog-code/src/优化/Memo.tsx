import React, { useState } from "react";

function Button1(props: any) {
  const [state, setState] = useState({ index: 1 });
  const handleClick = () => {
    // 即使引用没有改变，组件也会更新
    // eslint-disable-next-line react/no-direct-mutation-state
    setState(state);
  };
  return (
    <div>
      <button onClick={handleClick}>点击更新</button>;<p>{props.age}</p>
    </div>
  );
}
function Button2(props: any) {
  const [state, setState] = useState({ index: 1 });
  const handleClick = () => {
    // 即使引用没有改变，组件也会更新
    // eslint-disable-next-line react/no-direct-mutation-state
    setState(state);
  };
  return (
    <div>
      <button onClick={handleClick}>点击更新</button>;<p>{props.age}</p>
    </div>
  );
}
const MemoButton2 = React.memo(Button2);

class Memo extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      age: 1,
    };
  }
  handleClick = () => {
    // 实际改变了引用
    this.setState(this.state);
  };
  render(): React.ReactNode {
    return (
      <div>
        Memo 的 优化
        <button onClick={this.handleClick}>点击修改props</button>
        <Button1 state={this.state} />
        <MemoButton2 state={this.state} />
      </div>
    );
  }
}

export default Memo;
