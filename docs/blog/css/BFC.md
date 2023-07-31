# BFC

> BFC(块格式化上下文): 是 Web 页面可视化渲染 CSS 的一部分, 是布局过程中生成块级盒子的区域。也是浮动元素与其他元素的交互限定区域。  
> 简单理解就是具备 BFC 特性的元素,就像被一个容器所包裹,容器内的元素在布局上不会影响外面的元素。

## BFC 布局规则

1. 内部的 Box 会在垂直方向，一个接一个地放置。
2. Box 垂直方向的距离由 margin 决定。属于同一个 BFC 的两个相邻 Box 的 margin 会发生重叠.
3. 每个元素的 margin box 的左边， 与包含块 border box 的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
4. BFC 的区域不会与 float box 重叠。
5. BFC 就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。
6. 计算 BFC 的高度时，浮动元素也参与计算

## 如何确认或者促使一个元素是 BFC

1. 根元素，如 body。
2. float 属性不为 none。
3. position 为 absolute 或 fixed。
4. display 为 inline-block、table-cell、table-caption、flex、inline-flex。
5. overflow 不为 visible。

- 使用场景
  - 解决处置方向上的外边距折叠问题。
  - 清除子元素浮动导致父元素的高度问题。
  - 禁止外部浮动元素位于当前元素之上。
  - 自适应两边布局。
