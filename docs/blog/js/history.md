# Html5 History 路由原理及实现

> 1. history.pushState 比 hash 更符合前端路由的访问方式，更加优雅（无#）。
> 2. pushState 可以新增相同的 url 记录，hash 不能。
> 3. pushState 添加一个 url 之后，需要使用 history.go(url)来进行调转。
> 4. pushState 只能添加相同 hostname 的 url 地址或者无 hostname 的地址。
> 5. pushState,replaceState 和 hash 一样，可以改变浏览器 url 而不引起页面自动跳转。
> 6. hash 改变可以触发 hashchange，也可以触发 popstate，但是 pushState 和 replaceState 却不能触发 popState 和 hashchange。
> 7. pushState、replaceState 主要是为了更新 history，方便后续交互行为发生做准备。
> 8. pushState 和 replaceState 会将 hostname 之后的部分全部替换，而 hash 只会修改 hash 中#后边的部分

### 流程

1. 创建一个对象，存储订阅者订阅的路径及方法。
2. 创建订阅者添加订阅的方法。
3. 创建发布者发布路径的方法。
4. 用户点击 a 标签发布路径，解除 a 的默认动作，改为执行发布路径的方法。
5. 创建浏览器监听 popstate 并发布路径，作为用户交互行为的补充，点击后退前进、代码执行`history.go、back、forward`、浏览器刷新等行为会触发 popstate。
6. 每次点击 a 标签时，pushState、replaceState 向 history 中添加或者替换一条历史记录，方便浏览器后退或者前进时可以触发 popstate 并且 pathname 可以预知到。

```js
    class BrowserRouter {
    	routes: any;
    	constructor() {
    		// 订阅池
            this.routes = {};
            this.getState = this.getState.bind(this);
            this.popState = this.popState.bind(this);
            // 监听 popState
            window.addEventListener("popstate",this.popState);
            // 每次页面加载时执行
            window.addEventListener("load",this.popState);
        }
        // 浏览器交互监听，history.back history.forward history.go 浏览器刷新等行为触发popState
        popState(){
            console.log("触发了popState");
            const path = this.getState();
            // 如果订阅了这个路径，则执行
            this.routes[path] && this.routes[path]();
        }
    	// 获取路由路径
    	getState() {
    		// 获取path
            const path = location.pathname || "/";
            return path
    	}
    	// 订阅
    	route(pathname: string, callback: any) {
            if( typeof pathname !== "string") return;
    		this.routes[pathname] = callback;
        }
        // 初始化一个路径
        init(path:string){
            history.pushState(null,"",path);
            this.routes[path] && this.routes[path]();
        }
        // 发布路径
        go(path:string){
            history.pushState(null,"",path);
            this.routes[path] && this.routes[path]();
        }
    }

    const router = new BrowserRouter();
    const root = document.querySelector("#root") as HTMLElement;
    function go(color:string){
        root.style.background = color
    }
    //订阅
    router.route("/red",()=>go("red"))
    router.route("/gray",()=>go("gray"))
    router.route("/orange",()=>go("orange"));

    // router.init("/red"); // 初始化会出现问题，即会在刷新时将当前路径重定向到初始化的路径。所以不应该初始化，而是应该在 window的onLoad中去读取pathname，并执行。

    document.addEventListener("click",function(ev:MouseEvent){
        const element = ev.target as HTMLElement;
        if(element.tagName === "A"){
            ev.preventDefault();
            router.go(element.getAttribute("href") as string)
        }
    })
    export default router;


```

以上这个方法通过 a 标签绑定事件来触发 pushState 和执行路径对应的 js。
还有一个方法是劫持 pushState 并改写浏览器的 pushState 方法，每次当执行 pushState 的时候，同时执行路径对应的 js。

```js
interface Historys extends History {
	onPushState?: any;
}
(function(history: Historys) {
	const pushState = history.pushState;
	history.pushState = function(
		data: any,
		title: string,
		url?: string | null | undefined
	) {
		if (typeof history.onPushState === "function") {
			// 此处执行响应的js操作
			history.onPushState();
		}
		return pushState.apply(history, [data, title, url]);
	};
})(window.history);
```

> history api 由于是真实的 url 路径，前端通过监听 url 的变化用 js 做出相应的页面处理，url 改变不和后台做交互，所以当浏览器在不刷新的情况下是可以正常工作的。如果出现了刷新，则当前的 url 会作为请求路径向服务器发出请求，这时，由于路由是前端配置的，后端并不知道这个路由是干什么的，没有做处理，就会报 404。

> 解决办法
>
> > 1. 在没有修改 output 的 publicPath 的情况下，在 webpack-dev-server 的配置中添加 historyApiFallback:true.
> > 2. 如果修改了 publicPath，则需要在 proxy 中"/"路径设置 bypass，如果 req 中的 accept 字段包含了 text/html，就将返回/index.html 跳过代理,随后就将 index.html 返回给浏览器，这样对 API 的代理转发就不会受到影响。
