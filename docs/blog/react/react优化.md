# react 优化

在react程序中优化有两个方面，一个是类优化，一个是函数内优化。

## 类组件优化

主要依赖于 `shouldComponentUpate`。

### Component 和 PureComponent 区别

> `React.PureComponent` 与 `React.Component` 几乎完全相同，但 `React.PureComponent` 通过`props`和`state`的浅对比来实现 `shouldComponentUpate()`。如果对象包含复杂的数据结构，它可能会因深层的数据不一致而产生错误的否定判断(表现为对象深层的数据已改变视图却没有更新）。

如果是 PureComponent 则不需要书写 shouldComponentUpdate 这个生命周期。如果写了会被警告。⚠️  
Component 却需要 shouldComponentUpdate 来优化性能。

## Component

### 调用 setState 时是否更新

1. 每次调用 setState，都会更新，无论值是否发生变化。
如：

```js
// 组件为class，无论值改不改变，只要执行setState，就会更新。
this.setState({
  age: 3 || this.state.age + 1,
});

this.setState({
  name: this.state.name,
});

// name的引用改变，但值改变。组件更新
this.setState({
  name: {
    ...this.state.name,
    first: this.state.name.first + 1,
  },
});

// name的引用改变，但值未改变。组件更新
this.setState({
  name: {
    ...this.state.name,
    first: this.state.name.first,
  },
});
```

结论为 class extends React.Component 时，只要调用 setState，无论 state 是否改变，都会触发组件更新。

## props 改变

1. 传入 props 为基础类型时。父组件更新，无论 age 是否改变，无论是否传入 age，子组件也跟着更新。

```js
interface Props {
  age: number;
}
let id = 0;
export default class Children2 extends React.Component<Props, any> {
  state = {};
  render() {
    console.log("子组件2更新");
    return (
      <div>
        <button>查看function是否更新</button>
        {this.props.age}
      </div>
    );
  }
}
```

2. 传入 props 为引用类型时。父组件更新，如果 name 的引用是否改变，子组件都会更新。

```js
// name引用不变
//父组件
this.setState({
  name: this.state.name,
});

//子组件引用也不变
interface Props {
  name: { first: string };
}
interface State {}
let id = 0;
export default class Children1 extends React.Component<Props, State> {
  state = {};
  render() {
    console.log("子组件1更新");
    return (
      <div>
        <button>查看function是否更新</button>
        {this.props.name.first}
      </div>
    );
  }
}

//引用改变
this.setState({
  name: { ...this.state.name, first: this.state.name.first },
});
// 子组件props的name引用也不变，子组件更新
```

> 综上所述，只要是继承于 Component，调用 SetState，无论 state 是否改变，组件都会更新，子组件继承 Component，每次父组件更新，无论有无 props，子组件都会更新。

## PureComponent

### 调用 setState

1. 当值为基础类型时，如 age=3，当 age 改变时，组件更新，age 不变时，组件不更新。

```js
// age改变，组件会更新
this.setState({
  age: this.state.age + 1,
});

// age不变，组件不会更新
this.setState({
  age: this.state.age,
});
```

2. 当值为引用类型时，如 name={first:string}。

```js
// 引用不变，组件不更新
this.state.name.first = this.state.name.first + 1;
this.setState({
  name: this.state.name,
});

// 引用改变，组件更新，无论first是否改变
this.setState({
  name: { ...this.state.name, first: this.state.name.first },
});
```

> 调用 setState 时，基础类型值改变，引用类型指针改变时，组件更新。基础类型值不变时，引用类型指针不变时，组件不更新。

### props 改变 。

1.当值为基础类型时，如 age=3，当 age 改变时，组件更新，当 age 不变时，组件不更新。

```js
    // age改变，组件更新
    this.setState({
		age: this.state.age + 1
	})

	// age不变，组件不更新
	this.setState({
		age: this.state.age
	})

	<Childred2 age={this.state.age} />
```

2. 当值为引用类型时，如 name={first:string}。

```js
    // name引用指针改变，组件更新。
    this.setState({
	    name: { ...this.state.name, first: this.state.name.first}
	})
	 // name引用指针不改变，组件不更新。
    this.state.name.first = this.state.name.first+1;
	this.setState({
		name:this.state.name
	})

	<Childred1 name={this.state.name} />
```

> 综上所诉，当`class extends PureComponent`时，如果 props 为基础类型，当 props 改变时，组件更新，否则不更新。当 props 为引用类型时，如果引用指针不变，即使引用的内部值改变了，也不更新。引用值改变时，即使引用的内部值不变，也会更新。

## 函数组件

> 函数组件，只接收 props 和 自己的 hook state。 由于没有生命周期，所以每次父组件更新，函数组件都要更新

## 区别

| 更改数据方式 | 数据类型 | 改变     | Component | PureComponent | FuncComponent hook |
| ------------ | -------- | -------- | --------- | ------------- | ------------------ |
| setState     | 基础类型 | 值更改   | 更新      | 更新          | 更新               |
| setState     | 基础类型 | 值不变   | 更新      | 不更新        | 不更新             |
| setState     | 引用类型 | 指针更改 | 更新      | 更新          | 更新               |
| setState     | 引用类型 | 指针不变 | 更新      | 不更新        | 不更新             |
| props        | 基础类型 | 值更改   | 更新      | 更新          | 更新               |
| props        | 基础类型 | 值不变   | 更新      | 不更新        | 更新               |
| props        | 引用类型 | 指针更改 | 更新      | 更新          | 更新               |
| props        | 引用类型 | 指针不变 | 更新      | 不更新        | 更新               |

> 由此可见，`component`和`PureComponent`主要差异在于`component`需要使用`shouldComponentUpdate`来决定是否更新组件，如引用改变，但是引用内部并没有改变的情况下，组件不需要更新。  
> `Function Component` 组件只要父组件更新，那么函数组件就会更新。使用 useState 时，如果引用不变，则不更新，更类似 purement，所以每次都返回一个新的对象引用才会更新。

```js
shouldComponentUpdate(nextProps: any, nextState: any) {
	// 判断 name内容是否改变，如果state的结构更加复杂，则需要diff
	// 算法比较新旧state。此处是简单的算法。
	if (nextState.name.first !== this.state.name.first) {
		return true
	}else if(nextState.age!== this.state.age){
		return true
	}else{
		return false
	}

	// diff 算法，比较两个对象是否相同
	if(diff(nextProps,this.props)||diff(nextState,this.state)){
	    return true
	}else{
	    false
	}
}
```

> `PureComponent`已经默认在 shouldComponentUpdate 中使用 Object.is 来比较前后两次的变化。Object.is 是一种浅比较，基本类型比较值，引用类型比较指针的指向。

> `function Component`的 useState，也是使用 Object.is 是一种浅比较，基本类型比较值，引用类型比较指针的指向。

## 函数组件优化

函数内优化主要采用 `useMemo` 和 `useCallback`。 函数外部优化采用 `React.memo` 。
### 组件外
#### React.memo
类似于 pureComponent, React.memo 只会检查 props 变更。
```js
function App(){
  return <div>1</div>
}
function areEqual(prevProps,nextProps){
  // 在这里比较 props的变化
}
const Napp = React.memo(App, areEqual)
```
### 组件内
### useMemo
useMemo 是为了缓存一个经过大量计算得出的变量，如果变量依赖的其他变量没有发生变化，则不会重新计算。
```js
a = [1,2,3,4,5]
let num = useMemo(()=>{
  return a.reduce((q,w)=>q+w)
},[a])
```
如果变量a不发生任何变化，则 每次都把缓存值赋值给num。
### useCallback
useCallback 是为了缓存一个函数，如果依赖的变量没有发生变化，则不会重新生成新的函数。
```js
 // 使用ref，获取真实dom，或者组件本身
  const forms = useRef<HTMLFormElement>(null);

  // 在这里，每次更新不会创建新的函数，但是可以取到新的forms 的 current
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      let username, password;
      if (forms && forms.current) {
        username = (forms.current.elements[0] as HTMLFormElement).value;
        password = (forms.current.elements[1] as HTMLFormElement).value;
        console.log(username, password);
      }
      // const username = (event.currentTarget.elements[0] as HTMLFormElement).value;
      // const password = (event.currentTarget.elements[1] as HTMLFormElement).value;
      login({ username, password });
    },
    [forms],
  )
```
## 总结

> react 中的性能开销主要在于 `diff（vdom diff）` 和 `reconciliation(vdom->true dom)` ，所以在这两个方面下手来优化 react 性能。

1. 慎重分配 state，避免不必要的 render 调用。
2. 在 函数组件内部使用 `useMemo` 和 `useCallback`git。
3. 使用 `shouldComponentUpdate`、`PureComponent` 和 `React.memo` 减少 render 调用，React.memo 作用于函数组件，只对 props 有效，将函数组件接收 props 时的标签变得和 PureComponent 一样。
4. 传递方法绑定 this，在`constructor`中`bind`，如果在传递时调用，则每次都生成新的方法。
5. 多个`props`时，将对象拆分成基本类型。
