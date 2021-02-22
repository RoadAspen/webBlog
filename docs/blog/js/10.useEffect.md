# useEffect
>`useEffect` 是react中执行副作用操作的一个hooks，相当于class组件中`componentDidmount`、`componentDidUpdate`、`componentWillUnmount`这三个生命周期的聚合，即组件初次挂载后，每次更新后，卸载之前需要执行的操作。

1. 更新页面的title。

```js
    import React,{useState,useEffect} from 'react';
    
    function App(){
        const [count,setCount] = useState(0);
        const [name,setName] = useState('张三');
        // 不能将useEffect放入if条件语句中.
        //因为每次更新后，旧的effect会被新的effect函数代替，
        //如添加条件，则会导致下次更新找不到上次的effect而无法代替。
        //如果需要条件判断，可以将if语句放进effect中，这样可以选择性的代替，而不会丢失。
        useEffect(()=>{
            document.title = name;
            console.log("现在");
            const timer = setInterval(()=>{
                console.log("4秒后显示出来")
            },4000)
            // 返回一个函数，这个函数将在组件卸载的时候调用
            return ()=>{
                clearInterval(timer)
            }
        },[count])
        // useEffect 的第二个参数为一个数组，指定来当哪些state发生变化时才会执行。
        // 使用Object.is比较。请确保数组中包含了所有外部作用域中会随时间变化
        //在 effect 中使用的变量，否则你的代码会引用到先前渲染中的旧变量。
        return (
            <>
                <div>{count}</div>
                <button onClick={()=>{setCount(count+1)}}>点击+1</button>
                <button onClick={()=>{setName("李四")}}>点击+1</button>
            </>
        )
    } 
```