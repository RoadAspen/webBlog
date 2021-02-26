# 从头重写 react

我们从头开始重写一个 React，基于 React 16.8 版本，可以使用 hooks

## 步骤

1. `createElement` function
2. `render` function
3. Concurrent Mode（并发）
4. Fibers
5. Render 和 Commit
6. Reconciliation (协调)
7. Function Components
8. Hooks

## 去除 react

```js
// JSX
const element = <h1 title="foo">Hello</h1>;
const container = document.gtElementById("root");

ReactDOM.render(element, container);
```

这是一段 react 代码，首先我们把 react 代码要完成的事情，简单的用原生 javascript 来实现一遍。

### React.createElement

我们平时写 react 时，主要使用的`JSX`语法，而 JSX 是 React.createElement 的语法糖。使用 createElement 替换 JSX

```js
// createElement,根据参数创建一个对象。
const element = React.createElement("h1", { title: "foo" }, "Hello");
const container = document.gtElementById("root");

ReactDOM.render(element, container);
```

### 元素对象

react 中的 createElement 方法实际上是创建了一个对象

```js
// type 是一个字符串
// props 是另一个对象，具有JSX中所有的键和值，还有一个特殊的属性：children
// children 可以是字符串，也可以是一个包含更多element的数组。 这就是组成元素树的基础。
const element = {
	type: "h1",
	props: {
		title: "foo",
		children: "Hello",
	},
};
const container = document.gtElementById("root");

ReactDOM.render(element, container);
```

### render

使用 原生 js 代替 react

```js
const element = {
	type: "h1",
	props: {
		title: "foo",
		children: "Hello",
	},
};
const container = document.gtElementById("root");

const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode("");
text["nodeValue"] = element.props.children;

node.appendChild(text);

container.appendChild(node);
```

此时在这段代码中已经没有了一丝 react 的踪迹

## React.createElement 实现

回到开头，我们已经使用原生 js 完全替代了 react，现在我们开始着手实现一个 createElement

```js
const element = (
	<div id="foo">
		<a>bar</a>
		<b />
	</div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

### 转换 JSX

```js
// 对象嵌套对象
const element = React.createElement("div", { id: "foo" }, [
	React.createElement("a", null, "bar"),
	React.createElement("b"),
]);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

### createElement

由于 createElement 最终是为了导出一个对象，那么我们便实现一个 createElement

```js
function creatElement(type, props, ...children) {
	return {
		type,
		props: {
			...props,
			children,
		},
	};
}
const element = React.createElement("div", { id: "foo" }, [
	React.createElement("a", null, "bar"),
	React.createElement("b"),
]);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

### createTextElement

如果一个节点不是对象，是一个文本节点，那么还需要一个创建文本节点的函数 createTextElement

```js
function creatElement(type, props, ...children) {
	return {
		type,
		props: {
			...props,
			children: children.map((child) => typeof child === "object"
					? child
					: createTextElement(child);
			),
		},
	};
}
function createTextElement(text) {
	// 该函数只能创建文本节点，文本节点只有一个 nodeValue属性，且没有children
	return {
		type: "TEXT_ELEMENT",
		props: {
			nodeValue: text,
			children: [],
		},
	};
}
const element = React.createElement("div", { id: "foo" }, [
	React.createElement("a", null, "bar"),
	React.createElement("b"),
]);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

### 封装一个 react

建一个 Didact 库，用来代替 React

```js
const Didact = {
    creatElement
}
function creatElement(type, props, ...children) {
	return {
		type,
		props: {
			...props,
			children: children.map((child) => typeof child === "object"
					? child
					: createTextElement(child);
			),
		},
	};
}
function createTextElement(text) {
	// 该函数只能创建文本节点，文本节点只有一个 nodeValue属性，且没有children
	return {
		type: "TEXT_ELEMENT",
		props: {
			nodeValue: text,
			children: [],
		},
	};
}
const element = Didact.createElement("div", { id: "foo" }, [
	Didact.createElement("a", null, "bar"),
	Didact.createElement("b"),
]);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

### 使用 babel

在 jsx 上方添加 `/** @jsx Didact.createElement */` 这段注释,就可以让 babel 将 jsx 转化为 Didact.createElement。

```js

/** @jsx Didact.createElement */
const element = (
    <div id="foo">
        <a>bar<a/>
        <b/>
    </div>
)
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

## render 实现

render 负责将传入的元素依次创建并挂载到 container 中

```js
const Didact = {
	creatElement,
	render,
};
function render(element, container) {
	// 在这里创建dom元素，并添加进container中
}

const element = Didact.createElement("div", { id: "foo" }, [
	Didact.createElement("a", null, "bar"),
	Didact.createElement("b"),
]);
const container = document.getElementById("root");
render(element, container);
```

### 创建元素并添加

```js
// 我们知道以上的 Didact.createElement 最终返回了这样一个对象
const element = {
	type: "div",
	props: {
		id: "foo",
		children: [
			{
				type:'a',
				props:{
					children:[
						{
							type: "TEXT_ELEMENT",
							props: {
								nodeValue: 'bar',
								children: [],
							},
						}
					],
				},
			},
			{
				type: "br",
				props:null
			};
		]
	},
};
// 根据element的props 依次递归
function render(element, container) {
	const dom = document.createElement(element.type)
	element.props.forEach((child)=>{
		render(child,dom)
	})
	container.appendChild(dom)
}
```

### 处理文本节点

```js
function render(element, container) {
	// 区分文本节点
	const dom =
		element.type === "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(element.type);
	element.props.forEach((child) => {
		render(child, dom);
	});
	container.appendChild(dom);
}
```

### 处理 props

将 props 添加到元素上

```js
function render(element, container) {
	// 区分文本节点
	const dom =
		element.type === "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(element.type);
	// 判断是否是dom属性
	const isProperty = (key) => key !== "children";

	// 遍历props，如果是props，则给dom添加属性
	Object.keys(element.props)
		.filter(isProperty)
		.forEach((name) => {
			dom[name] = element.props[name];
		});
	element.props.children.forEach((child) => {
		render(child, dom);
	});
	container.appendChild(dom);
}
```

### 初步完成

现在我们运行一下现在的代码，是否可以在[codesandbox](https://codesandbox.io/s/elastic-shaw-x41tn?file=/src/index.js)中执行。

```js
function creatElement(type, props, ...children) {
	return {
		type,
		props: {
			...props,
			children: children.map((child) =>
				typeof child === "object" ? child : createTextElement(child)
			),
		},
	};
}
function createTextElement(text) {
	// 该函数只能创建文本节点，文本节点只有一个 nodeValue属性，且没有children
	return {
		type: "TEXT_ELEMENT",
		props: {
			nodeValue: text,
			children: [],
		},
	};
}
function render(element, container) {
	// 区分文本节点
	const dom =
		element.type === "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(element.type);
	// 判断是否是dom属性
	const isProperty = (key) => key !== "children";

	// 遍历props，如果是props，则给dom添加属性
	Object.keys(element.props)
		.filter(isProperty)
		.forEach((name) => {
			dom[name] = element.props[name];
		});
	element.props.children.forEach((child) => {
		render(child, dom);
	});
	container.appendChild(dom);
}
const Didact = {
	creatElement,
	render,
};
/** @jsx Didact.createElement */
const element = (
	<div id="app">
		<a type="button" href="www.baidu.com" target="_blank">
			前往百度
		</a>
		<p style={{ fontSize: 30, background: "green" }}>嘿嘿</p>
		<br />
	</div>
);
const container = document.getElementById("root");
Didact.render(element, container);
```

## Concurrent Mode(并发模式)

```js
element.props.children.forEach((child) => {
	render(child);
});
```

**这个递归 render 存在问题**，一旦开始渲染，就不会停止，直到我们渲染了整个 element dom tree。如果元素树很大，则它可能会阻塞主线程很长时间。而且，如果浏览器需要执行高优先级的操作，（处理用户输入或者保持动画流畅）则它必须等到渲染完成为止，这就造成了**卡顿**。

### 任务拆分

解决办法是将工作分成几个小单元，在完成每个单元后，如果需要执行其他任何高优先级的操作，我们就让浏览器中断渲染。

## 鸣谢

感谢 https://pomb.us/build-your-own-react/ 作者提供的这个平台
