# vertical-align 不生效
> vertical-align 的作用是为了让元素在父元素的区域内的垂直高度上能处于不同的位置。

今天遇到一个问题，一个p标签，字体大小为20px，父元素为 li，height 为70px，我想让这个 p标签在 li 中垂直方向上显示在不同的位置，设置了 vertical-align:middle ,但是不生效,查询了资料之后发现原来 vertical-align对块元素不生效。当 display为 block，box的时候都不会生效。

## 解决方法：

> 1. 首先给 li 添加一个 `line-height`，这里的line-height 就是为了给 vertical-align提供一个可以显示位置的空间。
> 2. 将 `p`的`display`的值设置为 `inline`或者`inline-block`。然后设置 p的vertical-align为 bottom，top，middle，baseline 等值就能将p显示在不同的位置上了。

```css
    li{
        line-height:60px;
    }
    li p{
        display:inline-block;
        vertical-align:bottom;
    }
```

### 以下是vertical-align的值的定义

|值|描述|
|------|---|
长度	   | 通过距离升高（正值）或降低（负值）元素。'0cm'等同于'baseline'
百分值%    |	通过距离（相对于1line-height1值的百分大小）升高（正值）或降低（负值）元素。'0%'等同于'baseline'
baseline   |	默认。元素的基线与父元素的基线对齐。
sub        |	降低元素的基线到父元素合适的下标位置。
super	   |    升高元素的基线到父元素合适的上标位置。
top        |	把对齐的子元素的顶端与line box顶端对齐。
text-top   |	把元素的顶端与父元素内容区域的顶端对齐。
middle     |	元素的中垂点与 父元素的基线加1/2父元素中字母x的高度 对齐。
bottom     |	把对齐的子元素的底端与line box底端对齐。
text-bottom|	把元素的底端与父元素内容区域的底端对齐。
inherit    |	采用父元素相关属性的相同的指定值。

