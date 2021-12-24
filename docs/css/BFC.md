# BFC
> BFC(块格式化上下文): 是Web页面可视化渲染CSS的一部分, 是布局过程中生成块级盒子的区域。也是浮动元素与其他元素的交互限定区域。  
> 简单理解就是具备BFC特性的元素,就像被一个容器所包裹,容器内的元素在布局上不会影响外面的元素。

#### BFC布局规则
1. 内部的Box会在垂直方向，一个接一个地放置。
2. Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠.
3. 每个元素的margin box的左边， 与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
4. BFC的区域不会与float box重叠。
5. BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。
6. 计算BFC的高度时，浮动元素也参与计算


#### 如何确认或者促使一个元素是BFC
1. 根元素，如body。
2. float属性不为none。
3. position为absolute或fixed。
4. display为inline-block、table-cell、table-caption、flex、inline-flex。
5. overflo不为visiable。
+ 使用场景
  - 解决处置方向上的外边距折叠问题。
  - 清除子元素浮动导致父元素的高度问题。
  - 禁止外部浮动元素位于当前元素之上。
  - 自适应两边布局。