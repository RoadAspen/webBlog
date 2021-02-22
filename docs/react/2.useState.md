# useState
> useState 是 react 中最常用的一个初始化状态的hook，调用useState会传入一个默认的初始值，当第一次初始化的时候会使用该值，之后就和这个值没关系了。函数会返回两个参数，分别是 状态值和修改状态值的函数，使用数组解构获取。返回的修改状态值的函数和class组件中的setState的作用原理是一样的。

1. 使用 useState创建一个计数器

```javascript
    import React,{useState} from 'react';
    
    function App(){
        const [count,setCount] = useState(0);
        const [name,setName] = useState('张三');
        return (
            <>
                <div>{count}</div>
                <button onClick={()=>{setCount(count+1)}}>点击+1</button>
                <button onClick={()=>{setName("李四")}}>点击+1</button>
            </>
        )
    } 
``` 

2. 使用 class component创建一个计数器.

```javascript
    import React from 'react';
    
    class App extends React.Component{
        constructor(props){
            super(props);
            this.state={
                count:1,
                name:'张三'
            }
            this.handleClick = this.handleClick.bind(this);
            this.changeName = this.changeName.bind(this);
        }
        handleClick{
            this.setState({
                count:this.state.count+1
            })
        }
        changeName(){
            this.setState({
                name:"李四"
            })
        }
        render(){
            return (
                <>
                    <div>{count}</div>
                    <button onClick={this.handleClick}>点击+1</button>
                    <button onClick={this.changeName}}>切换名字</button>
                </>
            )
        }
    }
```


>由此看出，hooks 写法确实比class component写法代码行数减少了很多，而且还不用考虑this的指向问题。
当需要多个状态时，只需要多次调用useState。  
但是有一个缺点就是假如state是一个对象，而如果需要修改其中一个值，则需要用...将state中其他的属性一起返回。class中setState却可以智能合并，而hooks中需要全量替换。

1. useState hooks 类似redux中reducer的写法。
```javascript
    setObject({
        ...object,
        name:"新名字"
    })
```

2. class setState
```javascript
    this.setState({
        name:"新名字"
    })
```