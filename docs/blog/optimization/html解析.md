# 浏览器解析渲染页面

一个 html 文件由很多种文件组成， 内链 css，javascript 外链 css，javascript ，还有 image、iframe 等。渲染流程就是指浏览器从最初接收请求来的 HTML、CSS、javascript 等资源，然后解析、构建树、渲染布局、绘制，最后呈现给客户能看到的界面这整个过程。

浏览器渲染引擎目前主要为 `webkit(chrome,safri)`、`gecko(firefox)`,`blink` 是 `webkit`的一个分支。

## 浏览器的解析渲染流程主要包括以下几步：

1. 解析 HTML 生成 DOM tree。
2. 解析 css 生成 CSSOM tree。
3. 将 DOM tree 与 CSSOM tree 合并在一起生成 render tree。
4. 遍历渲染树开始布局，计算每个节点的位置大小信息。
5. 将渲染树每个节点绘制到屏幕。

## 构建 DOM tree

当浏览器接收到服务器的 HTML 文档时，会遍历文档节点，生成 DOM 树  
DOM tree 的构建过程可能被 css 加载和 js 的加载执行阻塞。

## 构建 CSSOM tree

浏览器解析 css 文件并生成 css tree,

#### @import

css 文件内 引入的 css 一定要先于除了@charset 之外的所有 css 规则，否则不会引入，也可以根据媒体查询应用，但是会下载所有的文件，只是分情况生效。  
**避免使用，因为缺点较多。** 1、影响浏览器的并行下载。2、多个@import 导致下载顺序混乱

## 渲染阻塞

> js 的下载（async 和 defer 除外）、执行会阻塞 HTML tree 的构建 或者 css（在某种情况下） 会阻塞 HTML tree

当浏览器遇到 script 时，DOM 构建暂停，浏览器会加载和执行 javascript，知道脚本执行完毕之后，才继续构建 DOM， 如果 javascript 还操作了 CSSOM ， 而 CSSOM 还没有构建完成，浏览器甚至会延迟脚本执行和构建 DOM，知道 CSSOM 完成之后，再执行脚本，之后继续 DOM 的构建。 defer 会在 DOMContentLoad 触发之前执行，阻塞事件触发，且无法保证顺序。 async 则下载完成之后立即执行。

> 优化措施：·、把 css 放到 header 中。 2、javascript 文件放到页面底部。

## 构建渲染树

通过 DOM tree 和 CSSOM tree 结合，浏览器会先从 DOM 的根节点开始遍历每个**可见**节点，渲染树构建完成之后，每个节点都有其独立的 css 规则，渲染树用于显示，不可见的元素不会出现在这棵树中，如 display 为 none 的元素， visibility 等于 hidden 的元素，只是本身不显示，但是所占的位置还在，相当于此元素变成透明，不影响子元素，collapse 则主要用于 teble，和 display：none 的效果相当，用于 非 table 元素，则和 hidden 相同， collapse 兼容性不好。

## 渲染树布局

布局阶段会确定每个节点对象再页面上的确切大小和位置，布局输出的是一个盒子模型。

## 渲染树绘制

在绘制阶段，遍历渲染树，调用渲染器的 paint（）方法在屏幕上显示其内容。渲染树的绘制工作是由浏览器的 UI 渲染功能完成的。

## 渲染时的重排和重绘

> 重绘不一定重排，但重排一定重绘。
> HTML 是流式布局，css 和 js 会打破这种布局，导致页面重新渲染。重新渲染分两种 `reflow` 和 `replaint`.

##### replaint 重绘

重绘-屏幕的一部分重画，不影响整体布局。eg: 一个 div 的背景色和字体颜色变了，但是元素的几何尺寸并没有发生变化，此时就只触发重绘

##### reflow 重排（回流）

回流-屏幕重新排版，计算元素位置和尺寸，并重新绘制元素。eg：改变元素的尺寸，或者脱离文档流。
有些情况下，如果修改多个元素的尺寸，浏览器会把多个操作积攒一起，做一次 reflow，是浏览器的优化措施，叫异步 reflow 或者增量异步 reflow。
而 resize 窗口，改变页面默认的字体时，浏览器会马上进行 reflow

> 代码优化措施：

`dispaly:none` 会触发回流和重绘，因为元素不存在与文档流中。
`visibility：hidden` 因为相当于透明，但是位置还存在，所以只会触发重绘，不会触发回流。
