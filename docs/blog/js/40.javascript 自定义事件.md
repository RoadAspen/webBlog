# 自定义事件
> 区别与日常使用的click，hover,input 等事件，自定义事件是基于浏览器的Event构造函数来实现的，优点在于自定义事件是可以自定义触发的，可以在任何时间任何地点去触发，调用监听元素的dispatchEvent方法，监听该事件的元素则作为e.target 传入监听方法的回调函数中。

### 定义简单的一个事件

```js
const evt2 = new CustomEvent("sf");

btn.addEventListener("sf", function (e) {
	console.log(e.target) // btn 
	console.log("触发了自定义事件")
})

// 触发自定义事件
btn2.addEventListener("click", function () {
	btn.dispatchEvent(evt2)
}, false)
```

### 传递更多参数
> 如果传递更多的参数，则需要初始化事件的参数。

##### 传统的传递参数的方法
```html
    <button id="btn">绑定了自定义事件</button>
	<button id="btn2">触发自定义事件</button>
	<script type="text/javascript">
		const btn = document.getElementById('btn');
		const btn2 = document.getElementById('btn2');

		// 创建了自定义事件，使用createEvent方法创建的事件，必须初始化才能被使用，传入参数为 事件类型  CustomEvent是自定义事件类型
		const evt = document.createEvent("CustomEvent");

		// 初始化事件类型，不建议再使用此方法
		evt.initCustomEvent('build',true /*冒泡*/,true /*捕获*/,{message:1});

		// 监听自定义事件
		btn.addEventListener("build",function(e){

			console.log(e) // e.detail === {message:1}
			console.log("触发了自定义事件")
		})

		// 触发自定义事件
		btn2.addEventListener("click",function(){
			btn.dispatchEvent(evt)
		},false)
		
	</script>
```
> 这种方法已经过时了，可以使用新型的方法。
##### 新的传递参数的方法
```js
const evt3 = new CustomEvent("sfs",{
	detail:{
		hazcheeseburger: true
	}
});

btn.addEventListener("sfs", function (e) {
	// 创建事件时绑定的数据
	console.log(e.detail) // btn 
	console.log("触发了自定义事件")
})

// 触发自定义事件
btn2.addEventListener("click", function () {
	btn.dispatchEvent(evt3)
}, false)
```