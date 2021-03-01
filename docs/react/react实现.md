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

### requestIdleCallwork

浏览器刷新一般是 60HZ，所以每一帧大概 16.6ms 内，要完成 js 执行 -> 浏览器渲染 。requestIdleCallwork 函数类似于 setTimeout，可以在浏览器每一帧有剩余时间时让出主线程，执行后台或一些低优先级工作。

**强烈建议使用 timeout 选项进行必要的工作，否则可能会在触发回调之前经过几秒钟。**

### 任务拆分

解决办法是将工作分成几个小单元，在完成每个单元后，如果需要执行其他任何高优先级的操作，我们就让浏览器中断渲染，使用 `requestIdleCallwork`做一个循环。

思路：将渲染工作分为多个小单元，每隔一段时间就暂定渲染工作，查看浏览器是否有操作存在，如果存在，则执行浏览器操作，没有则继续执行下一个渲染单元

```js
// 在这里我们可以利用setTimeout特性
// 储存下一个需要执行的任务单元
let nextUnitofwork = null;
// 工作循环,传入一个 截止日期
function workLoop(deadline){
	// shouldYield 是否需要停止
	let shouldYield = false；
	// 	如果存在下一个任务单元，且此时控制权还在渲染上，继续执行下一个任务单元
	while(nextUnitofwork && !shouldYield){
		// performUnitOfWork 函数，传入一个 任务单元，并返回下一个任务单元，该任务是同步的
		nextInitofwork = performUnitOfWork(nextInitofwork)

		// 截止时间，有一个方法，判断是否需要将控制权交给浏览器
		shouldYield = deadline.timeRemaining() < 1
	}
	// requestIdleCallwork 可以被视作为 setTimeout
	requestIdleCallwork(workLoop)
}

// 启动工作
requestIdleCallwork(workLoop)

// 执行工作单元。sync
function performUnitOfWork(nextUnitOfWork){
	// 函数内部执行 工作单元，并返回下一个工作单元
	// TODO
	return new_nextUnitOfWork
}
```

## Fibers

为了明白我们的工作单元，我们需要一个 fiber tree。 **为每一个 element 设置一个 fiber， 将每一个 fiber 当作是一个 unit of work**。

### 例子

接下来，我们看一个例子：

```js
// 假如我们想去渲染以下这个元素树。
Didact.render(
	<div>
		<h1>
			<p></p>
			<a></a>
		</h1>
		<h2 />
	</div>,
	container
);
```

在 render 方法中，主要工作是创建一个 root fiber ，并把 root fiber 设置为 第一个 nextUnitOfWork（工作单元）。 剩下的工作都是在 performUnitOfWork 函数中执行。
在 performUnitOfWork 函数中会对每一个传入 fiber 做以下三件事：

1. 首先，将 element 添加到 dom 里边。
2. 接着，为 element 的 children 创建新的 fiber。
3. 最后，指定下一个 nextUnitOfWork（下一个工作单元）

### fiber tree

![fiber tree](/react/fiber1.png)  
fiber tree 这个数据结构很方便的找到 next unit of work，每一个 fiber 都有链接分别指向 first child fiber、next sibling fiber 、parent fiber。

1. 当我们执行完一个 fiber 时，如果 fiber 有一个 child，那么 这个 child fiber 就会成为 nextUnitOfWork 传入到 performUnitOfWork 中。
    - 在这个例子中，如果我们完成了 div 这个 fiber，那么 h1 就会成为 nextUnitOfWork。
2. 如果当前 fiber 没有 child，那么就将 sibling fiber 作为 nextUnitOfWork。
    - 在这个例子中，如果我们完成了 p 这个 fiber，那么 a fiber 就会成为 nextUnitOfWork。
3. 如果当前 fiber 既没有 child，也没有 sibling，那么就会寻找 parent fiber 的 sibling fiber。
    - 在这个例子中，如果我们完成了 a 这饿个 fiber，那么 h2 就会成为 nextUnitOfWork。

根据这个规则，如果 parent 没有 sibling，那么就会继续向上继续寻找 parent 的 sibling，直到寻找到 root，这意味着我们完成了本次渲染的所有工作单元。

### 回到代码

改写 render 函数。

```js
// 添加 createDom函数,只负责处理 create dom node 这一件事，返回处理后的dom。
function createDom(fiber) {
	// 区分文本节点
	const dom =
		fiber.type === "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(fiber.type);
	// 判断是否是dom属性
	const isProperty = (key) => key !== "children";

	// 遍历props，如果是props，则给dom添加属性
	Object.keys(fiber.props)
		.filter(isProperty)
		.forEach((name) => {
			dom[name] = fiber.props[name];
		});
	return dom;
}
function render(element, container) {
	// TODO create root fiber and set it as nextUnitOfWork
	const nextUnitOfWork = {
		dom: container, // 指定root 节点
		props: {
			children: [element],
		},
	};
}
```

### performUnitOfWork

在这个函数中做三件事。

1. add dom node。
2. create children fiber
3. find nextUnitOfWork。

```js
function performUnitOfWork(fiber) {
	// ========== add dom node ===============
	if (!fiber.dom) {
		// 如果fiber.dom 存在，则不用再创建，（可能是root fiber）
		fiber.dom = createDom(fiber);
	}
	if (fiber.parent) {
		// 	如果这个 fiber 的parent存在，将当前 节点插入到DOM中
		fiber.parent.dom.appendChild(fiber.dom);
	}

	// ============== create child fiber =============
	const elements = fiber.props.children;
	let index = 0;
	let prevSibling = null; // 上一个兄弟节点

	while (index < elements.length) {
		const element = elements[index];
		// 创建新的fiber
		const newFiber = {
			parent: fiber,
			type: element.type,
			props: element.props,
			dom: null,
		};
		if (index === 0) {
			fiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}
		// 将prevSibling 设置为当前newFiber，
		prevSibling = newFiber;
		index++;
	}
	// ============= find nextUnitOfWork ==================
	// 如果当前的fiber 有 child fiber，那么就指定这个fiber 为 nextUnitOfWork
	if (fiber.child) {
		return fiber.child;
	}

	// 否则就查看当前fiber的 sibling fiber
	let nextFiber = fiber;

	while (nextFiber) {
		// 如果当前fiber 的sibling存在，则直接将 sibling fiber 指定为 nextUnitOfWork
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		// 否则寻找当前节点的父节点的sibling，直到 nextFiber 为 undefined，跳出循环
		nextFiber = nextFiber.parent;
	}
}
```

## render and commit

每次处理元素时我们都会插入一个新的节点。但是，在完成渲染整个树之前，浏览器可能中断我们的工作。在这种情况下，用户将看不到完整的 UI。

### 修改 performUnitOfWork

因此我们需要在 performUnitOfWork 函数中删去 插入 DOM 的操作。只创建 DOM，而不插入更新 DOM。

```js
function performUnitOfWork(fiber) {
	// ========== add dom node ===============
	if (!fiber.dom) {
		// 如果fiber.dom 存在，则不用再创建，（可能是root fiber）
		fiber.dom = createDom(fiber);
	}
	// ==========删去更新DOM操作=========
	//   if (fiber.parent) {
	//     // 	如果这个 fiber 的parent存在，将当前 节点插入到DOM中
	//     fiber.parent.dom.appendChild(fiber.dom);
	//   }

	// TODO
}
```

### 添加 commitRoot

只有当我们执行完所有的工作单元，这时我们将 fiber tree 整个的提交给 commitRoot，在 commitRoot 中我们将所有的节点递归附加到 DOM。

```js
function commitRoot() {
	// TODO add nodes to dom
}
```

### 修改 render

```js
function render(element, container) {
	wipRoot = {
		dom: container,
		props: {
			children: [element],
		},
	};
	nextUnitOfWork = wipRoot;
}
let nextUnitOfWork = null;
let wipRoot = null;
```

### 修改 workLoop

```js
function workLoop(deadline){
	// shouldYield 是否需要停止
	let shouldYield = false；
	// 	如果存在下一个任务单元，且此时控制权还在渲染上，继续执行下一个任务单元
	while(nextUnitofwork && !shouldYield){
		// performUnitOfWork 函数，传入一个 任务单元，并返回下一个任务单元，该任务是同步的
		nextInitofwork = performUnitOfWork(nextInitofwork)

		// 截止日期有一个方法，判断是否需要将控制权交给浏览器
		shouldYield = deadline.timeRemaining() < 1
	}
	// =============== 当所有的工作单元执行完之后再统一挂载到dom上 ===================
	if(!nextUnitofwork && wipRoot){
		commitRoot()
	}
	// requestIdleCallwork 可以被视作为 setTimeout
	requestIdleCallwork(workLoop)
}
```

### 递归挂载 dom

```js
function commitRoot() {
	// wipRoot 整个fiber 树
	commitwork(wipRoot.child);
	// 内存回收
	wipRoot = null;
}

function commitWork(fiber) {
	if (!fiber) return;

	const domParent = fiber.parent.dom;

	//
	domParent.appendChild(fiber.dom);
	// 深度优先
	commitWork(fiber.child);
	commitWork(fiber.sibling);
}
```

## Reconciliation

Reconciliation 协调，执行 diff 操作。

现在是实现了向 DOM 添加了内容，如果是 更新或者是删除呢？我们需要将 render 函数中收到的元素与我们提交的最后一颗 fiber tree 进行比较 。

### 修改 commitRoot

保留最后一次提交的 fiber tree

```js
function commitRoot() {
	// wipRoot 整个fiber 树
	commitwork(wipRoot.child);

	// =========保留最后一次提交的wipRoot=============
	currentRoot = wipRoot;
	// 内存回收
	wipRoot = null;
}
let currentRoot = null;
```

### 修改 wipRoot

在 wipRoot 中添加上一次提交的 wipRoot

```js
function render(element, container) {
	wipRoot = {
		dom: container,
		props: {
			children: [element],
		},
		// alternate 指向上一版本的 fiber tree
		alternate: currentRoot,
	};
}
```

### reconcileChildren

将 performUnitOfWork 中创建新 fiber 的代码提取出来

```js
function performUnitOfWork(fiber) {
	// xxx
	const elements = fiber.props.children;
	reconcileChildren(fiber, elements);
	// xxx
}

function reconcileChildren(wipFiber, elements) {
	let index = 0;
	let prevSibling = null; // 上一个兄弟节点

	while (index < elements.length) {
		const element = elements[index];
		// 创建新的fiber
		const newFiber = {
			parent: wipFiber,
			type: element.type,
			props: element.props,
			dom: null,
		};
		if (index === 0) {
			wipFiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}
		// 将prevSibling 设置为当前newFiber，
		prevSibling = newFiber;
		index++;
	}
}
```

### diff

const oldFiber = wipFiber.alternate;
在 react 中将 diff 称为 reconciler 。 reconcileChildren 中，我们将对 wipFiber 和 alternate.child 进行 diff

```js
function reconcileChildren(wipFiber, elements) {
	let index = 0;
	let prevSibling = null; // 上一个兄弟节点

	const oldFiber = wipFiber.alternate && wipFiber.alternate.child;

	while (index < elements.length || oldFiber != null) {
		const element = elements[index];

		let newFiber = null;

		// 	在这里做compare oldFiber to new Fiber

		// while 函数本身就是为了遍历elements，找到element 的所有兄弟元素
		const sameType = oldFiber && element && element.type === oldFiber.type;
		if (sameType) {
			// 	如果是相同类型，执行 update操作
			newFiber = {
				type: oldFiber.type,
				props: element.props,
				dom: oldFiber.dom,
				parent: wipFiber,
				alternate: oldFiber, // 将当前oldFiber向下传递，继续深层次 diff
				effectTag: "UPDATE",
			};
		}
		if (!sameType && element) {
			// 	如果不是相同类型，且新的dom存在，则为新增，执行add 操作
			newFiber = {
				type: element.type,
				props: element.props,
				dom: null,
				parent: wipFiber,
				alternate: null,
				effectTag: "PLACEMENT",
			};
		}
		if (!sameType && oldFiber) {
			// 如果不是相同类型，且oldFiber存在，则为删除，执行 delete操作
			// 由于新的 fiber tree 没有这个 节点，所以只能将 操作标签存在旧的fiber上边。
			// 但是将我们的 fiber 提交到 render时 ，是根据 新的fiber tree工作的，上边没有 旧的fiber
			oldFiber.effectTag = "DELETE";

			//新建一个数组，用来跟踪要删除的节点
			deletions.push(oldFiber);
		}
		if (oldFiber) {
			oldFiber = oldFiber.sibling;
		}
		if (index === 0) {
			wipFiber.child = newFiber;
		} else if (element) {
			prevSibling.sibling = newFiber;
		}
		// 将prevSibling 设置为当前newFiber，
		prevSibling = newFiber;
		index++;
	}
}
```

### deletions

如果不是相同类型，且 oldFiber 存在，则为删除，执行 delete 操作
由于新的 fiber tree 没有这个 节点，所以只能将 操作标签存在旧的 fiber 上边。
但是将我们的 fiber 提交到 render 时 ，是根据 新的 fiber tree 工作的，上边没有 旧的 fiber

**解决方法**
新建一个 deletions 数组，用来跟踪删除的节点，并在提交时使用

```js
let deletions = null;
function render() {
	deletions = [];
}
function commitRoot() {
	deletions.forEach(commitWork);
}
```

### 更改 commitWork

更改 commitWork ，支持 effectTag

```js
function commitWork(fiber) {
	if (!fiber) {
		return;
	}
	const domParent = fiber.parent.dom;
	if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
		// 新增
		domParent.appendChild(fiber.dom);
	} else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
		// 更新， 关系到属性复用，所以逻辑提出来，在 updateDom中执行
		updateDom(fiber.dom, fiber.alternate.props, fiber.props);
	} else if (fiber.effectTag === "DELETION") {
		// 删除
		domParent.removeChild(fiber.dom);
	}
	commitWork(fiber.child);
	commitWork(fiber.sibling);
}
```

### updateDom

在 updateDom 中，我们根据 props 的新增，修改与删除，事件的新增、更改、删除做处理。

```js
function createDom(fiber) {
  // 区分文本节点
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(fiber.dom, {}, fiber.props);
  return dom;
}

// 是否是事件
const isEvent = （key）=> key.startsWith('on');
// 判断是否是dom属性
const isProperty = (key) => key !== "children" && !isEvent(key) ;
const isNew = (prevProps，nextProps) => (key) => prevProps[key] !== nextProps[key];
const isGone = (prevProps，nextProps) => (key) => !(key in nextProps);
function updateDom(dom, prevProps, nextProps) {
	// 遍历props，如果是props，则给dom添加属性
	prevProps = Object.keys(prevProps).filter(isProperty);
	nextProps = Object.keys(nextProps).filter(isProperty);
	// 遍历events
	prevEvents = Object.keys(prevEvents).filter(isEvent);
	nextEvents = Object.keys(nextEvents).filter(isEvent);

	// 新增或者更新属性
	nextProps.filter(isNew(prevProps,nextProps)).forEach((name) => {
		dom[name] = nextProps[name];
	});

	// 删除属性
		prevProps.filter(isGone(prevProps,nextProps)).forEach((name) => {
		dom[name] = '';
	});

	// 新增
	nextEvents.filter(isNew(prevEvents,nextEvents)).forEach((name) => {
		const eventType = name.substr(2).toLowercase();
		dom.addEventListener(eventType,nextEvents[name])
	});

	// 删除或者更新方法
	prevEvents.filter((key)=> isNew(prevEvents,nextEvents)(key) || isGone(prevEvents,nextEvents)(key)).forEach((name) => {
		const eventType = name.substr(2).toLowercase();
		dom.removeEventListener(eventType,prevEvents[name])
	});
}
```

### 完整代码

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

// 在这里我们可以利用setTimeout特性
// 储存下一个需要执行的任务单元
let nextUnitofwork = null;
// 工作循环,传入一个 截止日期
function workLoop(deadline){
	// shouldYield 是否需要停止
	let shouldYield = false；
	// 	如果存在下一个任务单元，且此时控制权还在渲染上，继续执行下一个任务单元
	while(nextUnitofwork && !shouldYield){
		// performUnitOfWork 函数，传入一个 任务单元，并返回下一个任务单元，该任务是同步的
		nextInitofwork = performUnitOfWork(nextInitofwork)

		// 截止日期有一个方法，判断是否需要将控制权交给浏览器
		shouldYield = deadline.timeRemaining() < 1
	}
	// =============== 当所有的工作单元执行完之后再统一挂载到dom上 ===================
	if(!nextUnitofwork && wipRoot){
		commitRoot()
	}
	// requestIdleCallwork 可以被视作为 setTimeout
	requestIdleCallwork(workLoop)
}

// 启动工作
requestIdleCallwork(workLoop)

function commitRoot() {
	deletions.forEach(commitWork);
  // wipRoot 整个fiber 树
  commitwork(wipRoot.child);

  // =========保留最后一次提交的wipRoot=============
  currentRoot = wipRoot;
  // 内存回收
  wipRoot = null;
}
let currentRoot = null;

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    // 新增
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    // 更新， 关系到属性复用，所以逻辑提出来，在 updateDom中执行
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    // 删除
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null; // 上一个兄弟节点

  const oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];

    let newFiber = null;

    // 	在这里做compare oldFiber to new Fiber

    // while 函数本身就是为了遍历elements，找到element 的所有兄弟元素
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      // 	如果是相同类型，执行 update操作
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber, // 将当前oldFiber向下传递，继续深层次 diff
        effectTag: "UPDATE",
      };
    }
    if (!sameType && element) {
      // 	如果不是相同类型，且新的dom存在，则为新增，执行add 操作
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (!sameType && oldFiber) {
      // 如果不是相同类型，且oldFiber存在，则为删除，执行 delete操作
      // 由于新的 fiber tree 没有这个 节点，所以只能将 操作标签存在旧的fiber上边。
      // 但是将我们的 fiber 提交到 render时 ，是根据 新的fiber tree工作的，上边没有 旧的fiber
      oldFiber.effectTag = "DELETE";

      //新建一个数组，用来跟踪要删除的节点
      deletions.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    // 将prevSibling 设置为当前newFiber，
    prevSibling = newFiber;
    index++;
  }
}
// 执行工作单元。sync
function performUnitOfWork(fiber) {
  // ========== add dom node ===============
  if (!fiber.dom) {
    // 如果fiber.dom 存在，则不用再创建，（可能是root fiber）
    fiber.dom = createDom(fiber);
  }

  // ============== create child fiber =============
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
  // ============= find nextUnitOfWork ==================
  // 如果当前的fiber 有 child fiber，那么就指定这个fiber 为 nextUnitOfWork
  if (fiber.child) {
    return fiber.child;
  }

  // 否则就查看当前fiber的 sibling fiber
  let nextFiber = fiber;

  while (nextFiber) {
    // 如果当前fiber 的sibling存在，则直接将 sibling fiber 指定为 nextUnitOfWork
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 否则寻找当前节点的父节点的sibling，直到 nextFiber 为 undefined，跳出循环
    nextFiber = nextFiber.parent;
  }
}
// 是否是事件
const isEvent = （key）=> key.startsWith('on');
// 判断是否是dom属性
const isProperty = (key) => key !== "children" && !isEvent(key) ;
const isNew = (prevProps，nextProps) => (key) => prevProps[key] !== nextProps[key];
const isGone = (prevProps，nextProps) => (key) => !(key in nextProps);
function updateDom(dom, prevProps, nextProps) {
	// 遍历props，如果是props，则给dom添加属性
	prevProps = Object.keys(prevProps).filter(isProperty);
	nextProps = Object.keys(nextProps).filter(isProperty);
	// 遍历events
	prevEvents = Object.keys(prevEvents).filter(isEvent);
	nextEvents = Object.keys(nextEvents).filter(isEvent);

	// 新增或者更新属性
	nextProps.filter(isNew(prevProps,nextProps)).forEach((name) => {
		dom[name] = nextProps[name];
	});

	// 删除属性
		prevProps.filter(isGone(prevProps,nextProps)).forEach((name) => {
		dom[name] = '';
	});

	// 新增
	nextEvents.filter(isNew(prevEvents,nextEvents)).forEach((name) => {
		const eventType = name.substr(2).toLowercase();
		dom.addEventListener(eventType,nextEvents[name])
	});

	// 删除或者更新方法
	prevEvents.filter((key)=> isNew(prevEvents,nextEvents)(key) || isGone(prevEvents,nextEvents)(key)).forEach((name) => {
		const eventType = name.substr(2).toLowercase();
		dom.removeEventListener(eventType,prevEvents[name])
	});
}
// 添加 createDom函数,只负责处理 create dom node 这一件事，返回处理后的dom。
function createDom(fiber) {
  // 区分文本节点
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(fiber.dom, {}, fiber.props);
  return dom;
}
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // alternate 指向上一版本的 fiber tree
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot
}
let nextUnitOfWork = null;
let wipRoot = null;
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

## function Component

接下来，我们要支持函数组件，函数组件和之前的组件有两个方向不同。

1. 功能组件中的 fiber 没有 dom 节点。
2. children 不是来自 props，而是运行该函数组建得来。

在执行工作单元时，我们需要检查 fiber 的类型是否是函数，并根据 结果转到相应的处理函数中去。

```js
function performUnitOfWork(fiber) {
	const isFunctionComponent = fiber.type instanceof Function;
	if (isFunctionComponent) {
		updateFunctionComponent(fiber);
	} else {
		updateHostComponent(fiber);
	}
	// xxxxxx
}
```

### updateHostComponent

添加执行普通组件,基本不用改变

```js
function updateHostComponent(fiber) {
	// ========== add dom node ===============
	if (!fiber.dom) {
		// 如果fiber.dom 存在，则不用再创建，（可能是root fiber）
		fiber.dom = createDom(fiber);
	}

	// ============== create child fiber =============
	const elements = fiber.props.children;
	reconcileChildren(fiber, elements);
}
```

### updateFunctionComponent

添加处理函组件的函数

```js
function updateFunctionComponent(fiber) {
	const children = [fiber.type(fiber.props)];
	reconcileChildren(fiber, children);
}
```

### 更改 commitWork

由于函数组件没有 dom 节点，所以首先我们要找到是 DOM 节点的父节点，沿着 fiber 树向上，一直找到有 dom 节点的 fiber，

```js
function commitWork(fiber) {
	// const domParent = fiber.parent.dom  	去掉
	// 新增
	let domParentFiber = fiber.parent;
	while (!domParentFiber.dom) {
		domParentFiber = domParentFiber.parent;
	}
	const domParent = domParentFiber.dom;
}

// 删除子节点时，还要找到具有DOM节点的子节点为止。
function commitDeletion(fiber, domParent) {
	if (fiber.dom) {
		domParent.removeChild(fiber.dom);
	} else {
		commitDeletion(fiber.child, domParent);
	}
}
```

## Hooks

hooks 是 react 16.8 版本带来的新特性，可能让函数组件也具有自己的状态。

### 例子

```js
function Count() {
	const [count, setCount] = useState(0);
	return <h1 onClick={() => setCount((c) => c + 1)}>Count:{count}</h1>;
}
```

### 更改 updateFunctionComponent

```js
let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
	wipFiber = fober;
	hookIndex = 0;
	wipFiber.hooks = [];
	const children = [fiber.type(fiber.props)];
	reconcileChildren(fiber, children);
}
```

### useState

useState 可以多次调用，当更新时，如果有旧的钩子，则将状态从旧的 hooks 复制到新的 hooks 中

```js
function useState(initial) {
	const oldHook =
		wipFiber.alternate &&
		wipFiber.alternate.hooks &&
		wipFiber.alternate.hooks[hookIndex];

	const hook = {
		state: oldHook ? oldHook.state : initial,
		queue: [],
	};
	const actions = oldHook ? oldHook.queue : [];
	actions.forEach((action) => {
		hook.state = action(hook.state);
	});
	const setState = (action) => {
		// 调用这个函数会触发更新
		hook.queue.push(action);
		wipRoot = {
			dom: currentRoot.dom,
			props: currentRoot.props,
			alternate: currentRoot,
		};
		nextUnitOfWork = wipRoot;
		deletion = [];
	};
	wipFiber.hooks.push(hook);
	hookIndex++;
	return [hook.state, setState];
}
```

## 总结

React 实现的流程如下：

1. 创建 React.createElement 用于返回 特定的 react element, 在函数内部根据 tag 类型区分 tag 和 text node。
2. react element 为 {type:'tagname',parops:{...props,children:[react element]}} 结构。
3. 使用 /\*_@jsx React.createElement_/ 来让 babel/jsx 将 jsx 解析为指定的 createElement 函数。
4. 创建 render， 用于将 react element tree 递归 添加到 container 中。
5. render 如果元素树很大，递归比较耗时间，所以采用拆分工作单元，创建 workloop ，使用 settimeout 执行 的方式，区分优先级。
6. 在 workloop 根据任务优先级执行 performUnitOfWork 或者中断执行，将主线程交还给浏览器。
7. 为了拆分工作单元，我们需要加入 fiber 架构， fiber 架构 = fiber 数据结构 + sheduler(调度) 。
8. fiber， 每一个 fiber 都有一个 link 指向 parent fiber，一个 child fiber ， 一个 sibling fiber。
9. 将每一个 fiber 当作是一个 unitOfWork，并在 render 中确定 root fiber，并作为第一个 unitOfwork 传入 performUnitOfWork 函数。
10. performUnitOfWork 函数 负责根据传入的 unitOfwork 创建对应的 fiber，并确定 下个 unitOfWork，继续传入 performUnitOfWork。
11. 调度完成后会返回一个 fiber tree ， 将 fiber tree 传递给 reconciler, 进行 diff，给每一个 fiber 打上 effectTag。
12. 当 reconciler 完成之后会触发 commit， 进行浏览器绘制。 浏览器会根据 effectTag 的类型，去做相应的更改。
13. function component 函数组件。
14. hooks

## 鸣谢

感谢 https://pomb.us/build-your-own-react/ 作者提供的这个平台
