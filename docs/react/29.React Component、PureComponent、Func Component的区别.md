# Component 和 PureComponent 区别
> `React.PureComponent` 与 `React.Component` 几乎完全相同，但 `React.PureComponent` 通过`props`和`state`的浅对比来实现 `shouldComponentUpate()`。如果对象包含复杂的数据结构，它可能会因深层的数据不一致而产生错误的否定判断(表现为对象深层的数据已改变视图却没有更新）。

如果是PureComponent则不需要书写 shouldComponentUpdate这个生命周期。如果写了会被警告。⚠️  
Component却需要shouldComponentUpdate来优化性能。

### Component
##### 调用setState时是否更新
1. 当state且都是基础类型时，每次调用setState，都会更新，无论值是否发生变化。如：
```js
    changeage = () => {
	// 组建为class，无论值改不改变，只要执行setState，就会更新。
		this.setState({
			age: 3 || (this.state.age+1)
		})
	}
```
2. 当state子值为引用类型时，无论引用是否改变，次一级是否改变，都会更新。如：
```js
    // name的引用并未改变，但值改变。组件更新。
	this.state.name.first = this.state.name.first+1;
	// name的引用并未改变，且值未改变，组件更新。
	this.state.name.first = this.state.name.first;
	
	this.setState({
		name:this.state.name
	})
	
	
	// name的引用改变，但值改变。组件更新
	this.setState({
		name: { 
    		...this.state.name, 
    		first: this.state.name.first + 1 
		}
	})
	
	// name的引用改变，但值未改变。组件更新
	this.setState({
		name: { 
    		...this.state.name, 
    		first: this.state.name.first 
		}
	})
```
> 结论为 class extends React.Component时，只要调用setState，无论state是否改变，都会触发组件更新。

##### 传入props改变时，是否更新
1. 传入props为基础类型时。父组件更新，无论age是否改变，无论是否传入age，子组件也跟着更新。
```js
interface Props {
    age:number
}
let id = 0;
export default class Children2 extends React.Component<Props, any> {
    state = {}
    render() {
        console.log("子组件2更新");
        return (
            <div>
                <button>查看function是否更新</button>
                {this.props.age}
            </div>
        )
    }
}
```

2. 传入props为引用类型时。父组件更新，如果name的引用是否改变，子组件都会更新。
```js
// name引用不变
//父组件
this.setState({
	name:this.state.name
})

//子组件引用也不变
interface Props {
    name:{first:string}
}
interface State {
    
}
let id = 0;
export default class Children1 extends React.Component<Props, State> {
    state = {}
    render() {
        console.log("子组件1更新");
        return (
            <div>
                <button>查看function是否更新</button>
                {this.props.name.first}
            </div>
        )
    }
}

//引用改变
this.setState({
	name: { ...this.state.name, first: this.state.name.first}
})
// 子组件props的name引用也不变，子组件更新

```
> 综上所述，只要是继承于Component，调用SetState，无论state是否改变，组件都会更新，子组件继承Component，每次父组件更新，无论有无props，子组件都会更新。


### PureComponent
##### 调用setState时。
1. 当值为基础类型时，如age=3，当age改变时，组件更新，age不变时，组件不更新。
```js
    // age改变，组件会更新
    this.setState({
		age: this.state.age+1
	})
	
	// age不变，组件不会更新
    this.setState({
		age: this.state.age
	})
```

2. 当值为引用类型时，如name={first:string}。
```js
    // 引用不变，组件不更新
    this.state.name.first = this.state.name.first+1;
	this.setState({
		name:this.state.name
	})
	
	// 引用改变，组件更新，无论first是否改变
	this.setState({
		name: { ...this.state.name, first: this.state.name.first}
	})
```
> 调用setState时，基础类型值改变，引用类型指针改变时，组件更新。基础类型值不变时，引用类型指针不变时，组件不更新。

##### 传入props时。
1.当值为基础类型时，如age=3，当age改变时，组件更新，当age不变时，组件不更新。
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

2. 当值为引用类型时，如name={first:string}。
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

> 综上所诉，当`class extends PureComponent`时，如果props为基础类型，当props改变时，组件更新，否则不更新。当props为引用类型时，如果引用指针不变，即使引用的内部值改变了，也不更新。引用值改变时，即使引用的内部值不变，也会更新。

### Func COmponent函数组件，无hooks
> 函数组件，只接收props。 由于没有生命周期，所以每次父组件更新，函数组件都要更新

### 区别
 |更改数据方式|数据类型|改变|Component | PureComponent|Func Component|
---|---|---|---|---|---
setState |基础类型|值更改|更新|更新|更新
setState |基础类型|值不变|更新|不更新|不更新
setState |引用类型|指针更改|更新|更新|更新
setState |引用类型|指针不变|更新|不更新|不更新
props |基础类型|值更改|更新|更新|更新
props |基础类型|值不变|更新|不更新|更新
props |引用类型|指针更改|更新|更新|更新
props |引用类型|指针不变|更新|不更新|更新

>由此可见，`component`和`PureComponent`主要差异在于`component`需要使用`shouldComponentUpdate`来决定是否更新组件，如引用改变，但是引用内部并没有改变的情况下，组件不需要更新。  
>`Function Component` 组件只要父组件更新，那么函数组件就会更新。使用useState时，如果引用不变，则不更新，更类似 purement，所以每次都返回一个新的对象引用才会更新。 

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

> `PureComponent`已经默认在shouldComponentUpdate中使用Object.is 来比较前后两次的变化。Object.is是一种浅比较，基本类型比较值，引用类型比较指针的指向。

> `function Component`的useState，也是使用Object.is是一种浅比较，基本类型比较值，引用类型比较指针的指向。

## 优化
> react中的性能开销主要在于 `diff（vdom diff）` 和 `reconciliation(vdom->true dom) ` ，所以在这两个方面下手来优化react性能。

1. 慎重分配state，避免不必要的render调用。
2. 合并状态更新，减少render调用。
3. 使用`PureComponent` 和 `React.memo` 减少render调用，React.memo作用于函数组件，只对props有效，将函数组件接收props时的标签变得和PureComponent一样。
4. 传递方法绑定this，在`constructor`中`bind`，如果在传递时调用，则每次都生成新的方法。
5. 多个`props`时，将对象拆分成基本类型。
6. `shouldComponentUpdate`