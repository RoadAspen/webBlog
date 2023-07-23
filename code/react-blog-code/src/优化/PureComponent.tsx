import React from "react";

class Button1 extends React.PureComponent<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      index: 1,
    };
  }
  handleClick = () => {
    // 即使引用没有改变，组件也会更新
    // eslint-disable-next-line react/no-direct-mutation-state
    this.setState(this.state);
  };
  componentDidUpdate() {
    console.log("更新了", this.state.index);
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>点击更新</button>;
      </div>
    );
  }
}
class Button2 extends React.PureComponent<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      index: 1,
    };
  }
  handleClick = () => {
    // 即使引用没有改变，组件也会更新
    // eslint-disable-next-line react/no-direct-mutation-state
    this.setState(this.state);
  };
  componentDidUpdate() {
    console.log("更新了", this.state.index);
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>点击更新</button>;
      </div>
    );
  }
}

class PureComponent extends React.PureComponent {
  render(): React.ReactNode {
    return (
      <div>
        PureComponent 的 优化
        <Button1 />
        <Button2 />
      </div>
    );
  }
}

export default PureComponent;
