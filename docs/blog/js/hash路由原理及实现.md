# 前端路由
> 一直以来都在使用react-router来实现前端路由，基于hash路由实现，最近忽然想了解一下hash路由的实现原理，然后实现了简化版的hash路由。

浏览器hash路由主要是基于监听 window.location.hash的值发生变化。基于观察者模式，来模拟前端路由。

### 流程
1. 先创建一个对象，用来存储订阅者订阅的路径。
2. 创建订阅者添加订阅的方法。
3. 创建发布者发布路径方法，需要发布者执行这个方法。
4. 页面通过触发hashchange的两个方法触发hashchange，通知浏览器。
5. 浏览器负责监听hashchange，由hashchange作为发布者统一发布，执行方法。


### 触发hashchange的方法有两种：  
1. `<a href="#/qwe"></a>`
2. localtion.hash = "#/qwe"

> ### 面向对象写法

```javascript
    export class HashRouter {
        routes: any;
        currentHash:string;
    	constructor() {
            this.routes = {};// 当前所有的hash监听
            this.currentHash = ""; // 当前hash
            const hashChange = this.hashChange.bind(this);
            // 页面加载
            window.addEventListener("load",hashChange);
            // 监听 hashchange
            window.addEventListener("hashchange",hashChange);
        }
        route(path:string,callback:any){// 添加监听，订阅者
            this.routes[path] = callback || function(){}
        }
        hashChange(){ // 执行监听，发布者
            // 获取当前hash值 
            this.currentHash = location.hash.slice(1) || '/';
            this.routes[this.currentHash] && this.routes[this.currentHash]();
        }
    }


    // 初始化
    const Router = new HashRouter();
    const body = document.querySelector("#root") as HTMLElement;
    const changeColor = function(color:string){
        body.style.background = color
    }
    Router.route("/",function(){ //订阅
        changeColor("red");
    })
    Router.route("/a",function(){
        changeColor("green");
    })
    Router.route("/b",function(){
        changeColor("blue");
    })
```