# Virtual DOM

## `关于virtual dom`
> 因为在浏览器中操作真实的`dom`的代价是昂贵的，即使是查找dom节点的操作都是昂贵的，所以在`react`和`vue`中都使用了 `virtual dom` 来代替真实的dom结构。vdom的优点在于，它是一个javascript对象，是真实dom树的一个映射，如果直接操作dom，则会造成很多不必要的节点更新，那么使用vdom就可以在每次需要更新时，计算出需要更新的节点的最小个数，虽然 计算最优解也需要时间，但是相对于dom更新所节省的时间来说还是值得的。

要得到最优解，就要依靠 新旧vdom的diff来计算。dom元素之间的差异一般不外乎三种。
1. 标签名差异。`tag`
2. 标签属性差异。`attribute`
3. 子节点差异（子节点差异包含子节点的标签名差异和标签属性差异）。`childnode`

使用一个vdom来表示一个元素。
```js
    const vnode = {
        type:"div",
        props:{class:"div ele",data:"123"},
        children:[
            "你好我是div",
            {
                type:"p",
                props:{style:"color:red;"},
                children:["你好我是p标签"]
            },
            {
                type:"span",
                props:null,
                children:["你好我是span标签"]
            },
            {
                type:"input",
                props:{value:"123",oninput:a,placeholder:"请输入"},
                children:[]
            }
        ]
    };
    function a(e){console.log(e)}
```
以上这个vdom表示了以下这个真实dom
```html
    <div class="div ele" data="123">
        你好我是div
        <p style="color:red;">你好我是p标签</p>
        <span>你好我是span标签</span>
        <input value="123" placeholder="请输入"/>
    </div>
```
### 简单实现 虚拟dom->真实dom
如何根据vdom生成真实的dom，做了一个简单的实现
```js
    // 将vnodetree 转换为 true Element
    function _createElement(vNode){
        if(typeof vNode === "string"){
            // 如果是文本，则创建文本节点，文本节点没有子元素也没有属性，不再向下执行
            const text = document.createTextNode(vNode);
            return text
        }
        if(typeof vNode === "object"){
            // 如果是对象，先根据type创建节点。
            const el = document.createElement(vNode.type);
            // 根据 传入的属性对象循环加入属性。
            for (const key in vNode.props) {
                if (vNode.props.hasOwnProperty(key)) {
                    // 如果是属性以on开头，则属于事件绑定
                    if(key.indexOf("on") === 0){
                        // 截取属性的on之后的值
                      el.addEventListener(key.substr(2),vNode.props[key])  
                    }else{
                        el.setAttribute(key,vNode.props[key])
                    }
                }
            }
            // 对子节点递归遍历执行。
            for (const child of vNode.children) {
                el.appendChild(_createElement(child))
            }
            // vNode.children.map(_createElement); // 这样也可以同样循环
            return el
        }
    }
    root.appendChild(_createElement(vnode));
```

# Diff
> 传统的diff算法是通过循环递归节点进行一次对比，效率低下，算法复杂度达到了O(n^3),其中n是树中节点的总数。

> react中的diff从 O(n^3) 直接变成了 O(n),极大的提高了diff的效率。遵循**先序深度优先遍历**,先遍历根节点，再遍历左边的子节点，然后是右边的子节点。  

+ React的diff策略
    - DOM节点跨层级的移动操作特别少，可以忽略不计，只比较同级（tree diff）,如果出现跨层级，则会直接删除当前，然后create最新的，这样导致性能问题，所以官方不建议进行DOM节点跨层级操作，因为react没有跨层级的移动操作。
    - 拥有相同类的两个组件将会生成相似的树形结构，拥有不同类的两个组件将会生成不同的树形结构。（component diff），当两个组件是同一个class组件时，如果可以提前知道这两个组件是否需要更新，就不需要再执行diff算法，这就是shouldComponentUpdate的原理，手动提示什么情况下需要diff并更新。
    - 对于同一层的一组子节点，它们可以通过唯一id进行区分。(element diff)

+ diff流程
    - 先比较节点类型，如果相同则继续深层次比较，不同则直接REPLACE或DELETE
    - 如果节点相同，则比较属性，新增，更新或者删除。
    - 如果节点相同，比较子元素，重复步骤1,2,3。

### 简易diff实现
#### 准备数据
```js
    // olddom
    const oldTree = {
        type: "div",
        props: {
            class: "div eles",
            data: "olddom"
        },
        children: [
            "你好我是olddom",
            {
                type: "p",
                props: {
                    style: "color:red;"
                },
                children: ["你好我是p标签"]
            },
            {
                type: "span",
                props: null,
                children: ["你好我是span标签"]
            },
            {
                type: "input",
                props: {
                    value: "123",
                    oninput: a,
                    placeholder: "请输入"
                },
                children: []
            }
        ]
    };
    // newdom
    const newTree = {
        type: "div",
        props: {
            class: "div ele",
            data: "newdom"
        },
        children: [
            "你好我是newdom",
            {
                type: "div",
                props: {
                    style: "color:red;"
                },
                children: [
                    "你好我是div标签",
                    {
                        type: "img",
                        props: {src:"https://user-gold-cdn.xitu.io/2019/1/17/16859f41c260b5f3?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"},
                        children: []
                    }
                ]
            },
            {
                type: "span",
                props: {
                    style: "font-size:12px;"
                },
                children: ["你好我是span标签"]
            }
        ]
    }
```
#### 准备diff 算法。

```js
    // tree diff
    function _treediff(oldTree, newTree, index) {
        if (!newTree) { // 如果newTree不存在，则删除当前节点的整个tree
            patchs[index] = {
                type: REMOVE
            }
        }
        // 当节点都存在，且节点名称不同，则执行 create 和 delete操作
        else if (newTree.type !== oldTree.type) {
            // 替换当前节点
            patchs[index] = {
                type: REPLACE,
                newTree
            }

        }

        // 文本节点
        else if (typeof newTree === "string" && typeof oldTree === "string") {
            if (newTree !== oldTree) {
                patchs[index] = {
                    type: UPDATE,
                    newTree
                }

            }
        }

        // 相同节点 element diff
        else if (newTree.type === oldTree.type) {
            _elementdiff(oldTree, newTree, index)
        }

        // 当执行一遍之后
    }

    // 节点diff，多用于 列表结构
    function _elementdiff(oldNode, newNode, index) {
        // 接收属性的diff patch
        const patchAttr = _attrdiff(oldNode.props, newNode.props);
        if (patchAttr.length > 0) {
            patchs[index] = {
                type: UPDATE,
                patchAttr
            }
        }
        // children diff
        _childrendiff(oldNode.children, newNode.children, index)
    }

    // 属性diff，首先需要 知道是哪个层级上哪个节点的改变
    function _attrdiff(oldProps, newProps) {
        // 存放 attrpatch
        let patchAttr = [];
        // 先查看oldNode中是否存在newNode的props
        for (const key in newProps) {
            if (newProps.hasOwnProperty(key)) {
                if (oldProps[key] && oldProps[key] !== newProps[key]) {
                    patchAttr.push({ //更新
                        type: UPDATE,
                        attrName: key,
                        attrValue: newProps[key],
                    })
                }
                if (!oldProps[key]) { // 新增
                    patchAttr.push({
                        type: CREATE,
                        attrName: key,
                        attrValue: newProps[key],
                    })
                }

            }
        }
        // 查看
        for (const key in oldProps) {
            if (oldProps.hasOwnProperty(key)) {
                // 旧dom存在属性，新dom不存在属性，删除操作
                if (oldProps[key] && !newProps[key]) {
                    patchAttr.push({
                        type: REMOVE,
                        attrName: key
                    })
                }

            }
        }
        return patchAttr
    }

    function _childrendiff(oldChildren, newChildren,index) {
        const len = Math.max(oldChildren.length, newChildren.length); // 获取最大长度
        for (let i = 0; i < len; i++) {
            index = index + i + 1;
            _treediff(oldChildren[i], newChildren[i], index);
        }
    }

    _treediff(oldTree, newTree, 0);
```

##### 计算出的节点。
```js
    {
        0:{
            patchAttr: (2) [{…}, {…}]
            type: Symbol(UPDATE)
        },
        1:{
            newTree: "你好我是newdom"
            type: Symbol(UPDATE)
        },
        3:{
            newTree: {type: "div", props: {…}, children: Array(2)}
            type: Symbol(REPLACE)
        },
        6:{
             patchAttr: [{…}]
            type: Symbol(UPDATE)
        },
        10:{
            type: Symbol(REMOVE)
        }
    }
```