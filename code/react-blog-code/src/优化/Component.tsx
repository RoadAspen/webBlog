import React from "react";

class Button1 extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      count: [1, 2, 3],
    };
  }
  handleClick = () => {
    // setState 内部使用了 Object.assign， 所以组件必定会更新
    this.setState(this.state);
  };
  componentDidUpdate() {
    console.log("Button1 更新了", this.state.count[0]);
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>无优化 点击更新</button>;
      </div>
    );
  }
}

class Button2Child extends React.Component<any, any> {
  componentDidUpdate() {
    console.log("Button2Child 更新了", this.state);
  }
  shouldComponentUpdate(
    nextProps: Readonly<any>,
    nextState: Readonly<any>
  ): boolean {
    // 这里引用更新了
    console.log("Button2Child nextProps", nextProps, nextProps === this.props);
    console.log("Button2Child nextState", nextState === this.state);
    return true;
  }
  render() {
    return <div>Button2Child</div>;
  }
}
class Button2 extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      count: {
        index: [1, 2, 3],
      },
    };
  }
  handleClick = () => {
    // 函数改变state，组件也会更新
    this.setState((state: any) => {
      return state;
    });
  };
  componentDidMount(): void {
    const that = this;
    console.log("setTimeout before", this.state.count.index[0]);
    setTimeout(() => {
      that.setState({
        count: {
          index: [2, 2, 3],
        },
      });
      console.log("setTimeout after", this.state.count.index[0]);
    }, 2000);
  }
  componentDidUpdate() {
    console.log("Button2 更新了", this.state.count.index);
  }
  shouldComponentUpdate(
    nextProps: Readonly<any>,
    nextState: Readonly<any>
  ): boolean {
    // 这里引用更新了
    console.log("Button2 nextProps", nextProps === this.props);
    console.log("Button2 nextState", nextState === this.state);
    // if (nextState.count.count === this.state.count.count) {
    //   return false;
    // }
    return true;
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>
          添加shouldComponentUpdate 点击更新
        </button>
        <Button2Child />
      </div>
    );
  }
}

class Component extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      age: { index: 1 },
    };
  }
  handleClick = () => {
    // 实际改变了引用
    this.setState(this.state);
  };
  forceClick = () => {
    // 实际改变了引用
    this.forceUpdate();
  };
  render(): React.ReactNode {
    return (
      <div>
        Component 的 优化
        <button onClick={this.handleClick}>点击修改props</button>
        <button onClick={this.forceClick}>点击 forceUpdate</button>
        <Button1 state={this.state.age} />
        <Button2 state={this.state.age} />
      </div>
    );
  }
}

export default Component;
