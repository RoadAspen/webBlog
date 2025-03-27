# CSS-in-JS 方案对比：Styled-Components、Emotion、Styled-JSX

在现代前端开发中，**CSS-in-JS**（CSS 即 JavaScript）是一种流行的样式管理方案，它允许开发者在 JavaScript 代码中编写和管理样式，提供更好的可维护性和组件化支持。

本文将对主流的 **CSS-in-JS** 方案 —— **Styled-Components**、**Emotion** 和 **Styled-JSX** 进行对比。

## 1. CSS-in-JS 的优势

- **组件化**：样式与组件绑定，避免全局样式污染。
- **动态样式**：可以基于 `props`、`state` 动态计算样式。
- **提升可维护性**：移除不必要的 CSS 代码，提高代码组织性。
- **支持服务器端渲染（SSR）**：减少 FOUC（闪烁效果），提升页面加载体验。

## 2. 方案介绍

### **1) Styled-Components**

**特点**：

- 通过 ES6 模板字符串编写 CSS。
- 组件级别的样式，自动生成唯一的 className，避免冲突。
- 提供 `ThemeProvider` 方便全局主题管理。

**安装**：

```sh
npm install styled-components
```

**示例代码**：

```javascript
import styled from 'styled-components';

const Button = styled.button`
	background: ${(props) => (props.primary ? 'blue' : 'gray')};
	color: white;
	padding: 10px;
	border: none;
	border-radius: 5px;
`;

export default function App() {
	return <Button primary>Styled Button</Button>;
}
```

---

### **2) Emotion**

**特点**：

- 语法类似 Styled-Components，同时支持 `css` 函数方式。
- 更轻量，性能优化更好。
- 内置 `cx` 结合多个 className，提高灵活性。

**安装**：

```sh
npm install @emotion/react @emotion/styled
```

**示例代码（Styled Components 方式）**：

```javascript
import styled from '@emotion/styled';

const Button = styled.button`
	background: ${(props) => (props.primary ? 'blue' : 'gray')};
	color: white;
	padding: 10px;
	border: none;
	border-radius: 5px;
`;

export default function App() {
	return <Button primary>Emotion Styled Button</Button>;
}
```

**示例代码（css 方式）**：

```javascript
import { css } from '@emotion/react';

const buttonStyle = css`
	background: blue;
	color: white;
	padding: 10px;
	border-radius: 5px;
`;

export default function App() {
	return <button css={buttonStyle}>Emotion Button</button>;
}
```

---

### **3) Styled-JSX**

**特点**：

- 由 Next.js 团队开发，默认集成于 Next.js。
- 通过 `<style jsx>` 方式编写组件内联样式。
- 仅作用于当前组件，不会影响全局样式。

**安装**（如果使用 Next.js，可省略）：

```sh
npm install styled-jsx
```

**示例代码**：

```javascript
export default function App() {
	return (
		<div>
			<button className="btn">Styled JSX Button</button>
			<style jsx>{`
				.btn {
					background: blue;
					color: white;
					padding: 10px;
					border-radius: 5px;
				}
			`}</style>
		</div>
	);
}
```

---

## 3. CSS-in-JS 方案对比

| 方案                  | 组件级样式 | 动态样式 | 主题支持           | 适用场景                 |
| --------------------- | ---------- | -------- | ------------------ | ------------------------ |
| **Styled-Components** | ✅         | ✅       | ✅ `ThemeProvider` | 适用于 React 组件化开发  |
| **Emotion**           | ✅         | ✅       | ✅ `ThemeProvider` | 适用于需要性能优化的应用 |
| **Styled-JSX**        | ✅         | ✅       | ❌                 | 适用于 Next.js 开发      |

## 4. 选择建议

- **如果在 React 项目中使用，推荐 `Styled-Components` 或 `Emotion`。**
- **如果使用 Next.js，推荐 `Styled-JSX`（无需额外安装）。**
- **如果追求极致性能和灵活性，选择 `Emotion`。**

## 5. 结论

**CSS-in-JS** 提供了更好的组件化样式管理方式，每种方案都有其适用场景。选择时需要根据团队技术栈、项目需求和性能考虑进行取舍。
