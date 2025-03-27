# CSS 预处理

在现代 Web 开发中，CSS 预处理器为开发者提供了更强大的样式编写能力，提高了代码的可维护性和复用性。本文将对主流的 CSS 预处理器 **LESS**、**SCSS** 和 **Stylus** 进行对比，帮助开发者选择合适的方案。

## 1. CSS 预处理器概述

CSS 预处理器是一种扩展 CSS 功能的工具，它们允许使用变量、嵌套规则、函数（Mixin）、继承等特性，从而提高 CSS 的开发效率。

目前主流的 CSS 预处理器包括：

- **LESS**：由 [Less.js](https://lesscss.org/) 提供支持，语法接近 CSS。
- **SCSS**（Sass 的一种语法）：由 [Sass](https://sass-lang.com/) 提供支持，功能强大。
- **Stylus**：灵活性极高，语法自由。

## 2. LESS、SCSS 和 Stylus 对比

### **1) 变量**

| 预处理器 | 变量声明方式         |
| -------- | -------------------- |
| LESS     | `@primary: #ff6600;` |
| SCSS     | `$primary: #ff6600;` |
| Stylus   | `primary = #ff6600`  |

### **2) 嵌套（Nesting）**

```less
/* LESS */
.container {
	.header {
		color: red;
	}
}
```

```scss
/* SCSS */
.container {
	.header {
		color: red;
	}
}
```

```stylus
/* Stylus */
.container
  .header
    color: red
```

### **3) Mixin（代码复用）**

```less
/* LESS */
.rounded(@radius) {
	border-radius: @radius;
}
.box {
	.rounded(10px);
}
```

```scss
/* SCSS */
@mixin rounded($radius) {
	border-radius: $radius;
}
.box {
	@include rounded(10px);
}
```

```stylus
/* Stylus */
rounded(radius)
  border-radius: radius
.box
  rounded(10px)
```

### **4) 继承**

```less
/* LESS */
.button {
	color: white;
}
.primary {
	&:extend(.button);
	background: blue;
}
```

```scss
/* SCSS */
.button {
	color: white;
}
.primary {
	@extend .button;
	background: blue;
}
```

```stylus
/* Stylus */
.button
  color white
.primary
  @extend .button
  background blue
```

### **5) 计算**

```less
/* LESS */
.box {
	width: (100% / 3);
}
```

```scss
/* SCSS */
.box {
	width: (100% / 3);
}
```

```stylus
/* Stylus */
.box
  width: (100% / 3)
```

## 3. LESS vs SCSS vs Stylus 总结

| 特性       | LESS               | SCSS                  | Stylus           |
| ---------- | ------------------ | --------------------- | ---------------- |
| 语法风格   | 接近 CSS           | 接近 CSS              | 自由，简洁       |
| 变量支持   | `@var`             | `$var`                | `var`            |
| 代码复用   | `mixin`            | `@mixin` + `@include` | `mixin` 直接调用 |
| 继承       | `&:extend(.class)` | `@extend`             | `@extend`        |
| 计算支持   | 是                 | 是                    | 是               |
| 语法简洁度 | 一般               | 一般                  | 高               |
| 可读性     | 高                 | 高                    | 适应成本较高     |
| 生态系统   | 中等               | 最强                  | 较小             |

## 4. 选择建议

- **LESS**：适合初学者，语法接近 CSS，简单易用。
- **SCSS**：功能最丰富，生态成熟，适用于大型项目。
- **Stylus**：语法自由度高，适合喜欢极简风格的开发者。

## 5. 结论

CSS 预处理器提供了强大的样式管理能力，选择哪种方案取决于团队习惯和项目需求。如果项目较大，建议使用 **SCSS**，如果希望快速上手，可以选择 **LESS**，而 **Stylus** 适合喜欢灵活语法的开发者。
