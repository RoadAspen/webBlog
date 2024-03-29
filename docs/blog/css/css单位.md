# CSS 单位及应用

## css 单位

css 中有很多单位， `px`、`rem`、`em`、`vh`、`vw`、`%` 。

## css 应用单位的属性

css 应用这些单位的属性有：`font-size`、`width`、`height`、`line-height`、`margin`、`padding`、`left`、`top`、`bottom`、`right`、`border-width`。

## 属性配合单位

### px

px 是 css 像素单位，是一个固定的值。**所有属性都可以使用 px**。

```css
div {
  font-size: 30px;
  width: 30px;
  height: 60px;
  margin-left: 30px;
  padding-left: 30px;
}
```

### rem

rem 是一个基于根 font-size 大小的一个倍数关系,**所有属性都可以使用 rem**。如

```css
body {
  font-size: 10px;
}

div {
  font-size: 2rem; /*这里是 20px*/
}

div p {
  font-size: 1rem; /*这里是 10px*/
  line-height: 1rem; /*这里的line-height 10px*/
}
```

### em

em 和 rem 类似，但是 em 是基于父元素的 font-size 的大小计算的，**所有属性都可以使用 em**。

```css
body {
  font-size: 10px;
}

div {
  font-size: 2em; /*这里是 20px*/
}

div p {
  width: 10em; /*这里是200px*/
  font-size: 1.5em; /*这里是 30px,  div font-size 的 1.5倍*/
  line-height: 1em; /*这里的line-height 20px*/
}
```

### vh

vh 是基于当前屏幕的显示高度， 100 vh 就是当前的设备的最大可视高度， **所有属性都可以使用 vh**。

```css
body {
  font-size: 10vh; /*这里是 屏幕高度的10%*/
}

div {
  font-size: 2vh; /*这里是 2%*/
}

div p {
  width: 10vh; /*这里是200px*/
  font-size: 1.5vh; /*这里是 30px,  div font-size 的 1.5倍*/
  line-height: 1vh; /*这里的line-height 20px*/
}
```

### vw

vh 是基于当前屏幕的显示宽度， 100 vw 就是当前的设备的最大可视宽度。

```css
body {
  font-size: 10vw; /*这里是 屏幕高度的10%*/
}

div {
  font-size: 2vw; /*这里是 2%*/
}

div p {
  width: 10vw; /*这里是200px*/
  font-size: 1.5vw; /*这里是 30px,  div font-size 的 1.5倍*/
  line-height: 1vw; /*这里的line-height 20px*/
}
```

### % 百分比

**百分比** 比较特殊，它起到的作用和所使用的属性有关系。

**width、height、top、bottom、left、right**
当前元素的宽高百分比的基数分别基于父元素的宽高

```css
div1 {
  height: 200px;
  width: 500px;
}

div1 div2 {
  height: 10%; /*这里基于父元素的height， 200*10% = 20px*/
  width: 20%; /* 这里基于父元素的width， 500*20% = 100px*/
}
```

**margin、padding**

margin 和 padding 的水平和垂直方向的百分比都是相对于父元素的宽度计算的。

```css
div {
  width: 500px;
  height: 300px;
}

div div {
  margin-top: 20%; /*这里是基于 width 计算的，500*20% = 100px*/

  margin-left: 20%; /*这里是基于 width 计算的，500*20% = 100px*/

  margin-bottom: 20%; /*这里是基于 width 计算的，500*20% = 100px*/

  padding-top: 10%; /*这里是基于 width 计算的，500*10% = 50px*/

  padding-left: 10%; /*这里是基于 width 计算的，500*10% = 50px*/
}
```

margin, padding 的所有方向上的百分比都是基于父元素的宽度

css 中一个元素的`width`和`height`，如果是**百分比**，则分别对应父元素的`width`和`height`。
**如果是行内元素嵌套块级元素，由于行内元素没有宽高，所以块元素的百分比是基于父级最近的一个块元素**。
