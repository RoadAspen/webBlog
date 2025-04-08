# React 性能优化方案总结

React 提供了多种优化组件渲染性能的手段，以下是常用的几种：`shouldComponentUpdate`、`PureComponent`、`React.memo` 和 `keys`。

---

## 1. `shouldComponentUpdate`

### 简介

类组件生命周期方法，可用于手动控制组件是否重新渲染。

### 示例代码

```tsx
class MyComponent extends React.Component {
	shouldComponentUpdate(nextProps, nextState) {
		// 只有当 props 变化时才重新渲染
		return nextProps.value !== this.props.value;
	}

	render() {
		console.log('Rendering MyComponent');
		return <div>{this.props.value}</div>;
	}
}
```

### 优点

- 精细控制组件更新逻辑，适用于复杂比较。
- 可配合第三方库（如 Immutable.js）实现高性能更新。

### 缺点

- 写法繁琐，需要手动比较每个 prop。
- 易出错，增加维护成本。

### 使用场景

- 类组件中，性能瓶颈明显时。
- 需要复杂或自定义的 props 对比逻辑。

---

## 2. `PureComponent`

### 简介

React 提供的优化型类组件，内部实现了浅比较的 `shouldComponentUpdate`。

### 示例代码

```tsx
class MyPureComponent extends React.PureComponent {
	render() {
		console.log('Rendering MyPureComponent');
		return <div>{this.props.value}</div>;
	}
}
```

### 优点

- 自动实现浅比较，简化代码。
- 减少不必要的渲染。

### 缺点

- 使用浅比较，对于复杂嵌套对象无法检测深层变化。
- 如果 props 是频繁变化的引用类型，可能导致误判。

### 使用场景

- 类组件且 props/state 简单或不可变。
- 希望避免手动写 `shouldComponentUpdate`。

---

## 3. `React.memo`

### 简介

用于函数组件的高阶组件，提供浅比较的 props 优化功能。

### 示例代码

```tsx
const MyComponent = ({ value }) => {
	console.log('Rendering MyComponent');
	return <div>{value}</div>;
};

const MemoizedComponent = React.memo(MyComponent);
```

### 自定义比较函数

```tsx
const MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {
	return prevProps.value === nextProps.value;
});
```

### 优点

- 对函数组件优化简单直接。
- 支持自定义 props 比较逻辑。

### 缺点

- 同样是浅比较，复杂对象易误判。
- 对于内部状态或副作用频繁的组件作用有限。

### 使用场景

- 函数组件频繁被父组件重新渲染，但自身 props 未变。
- 配合不可变数据结构效果最佳。

---

## 4. `keys`

### 简介

React 用 `key` 来标识组件，使得列表更新更高效准确。

### 示例代码

```tsx
const List = ({ items }) => (
	<ul>
		{items.map((item) => (
			<li key={item.id}>{item.name}</li>
		))}
	</ul>
);
```

### 优点

- 帮助 React 精确识别哪些元素变化。
- 减少 DOM 操作，提高渲染性能。

### 缺点

- 使用 index 作为 key 会导致重渲染和状态错乱。
- 如果 key 不唯一，会造成性能问题或渲染 bug。

### 使用场景

- 渲染列表时，务必添加唯一的 key。
- 尽量使用稳定且唯一的业务 ID 作为 key。

---

## 5. `useMemo`

### 简介

用于缓存计算结果，避免组件每次渲染都重复执行开销大的运算。

### 示例代码

```tsx
import React, { useMemo } from 'react';

const ExpensiveComponent = ({ num }) => {
	const computed = useMemo(() => {
		console.log('Calculating...');
		return num * 2; // 模拟开销大的计算
	}, [num]);

	return <div>Result: {computed}</div>;
};
```

### 优点

- 避免重复计算，提高性能。
- 适合计算过程复杂、依赖不频繁变动的场景。

### 缺点

- 滥用可能反而降低性能（缓存开销 > 计算开销）。
- 依赖项传错可能导致缓存无效或错误。

### 使用场景

- 函数组件中包含复杂计算逻辑。
- 计算值与渲染解耦，结果可缓存。

---

## 6. `useCallback`

### 简介

缓存函数引用，防止因函数引用变化导致子组件不必要的重新渲染。

### 示例代码

```tsx
import React, { useCallback } from 'react';

const Child = React.memo(({ onClick }) => {
	console.log('Rendering Child');
	return <button onClick={onClick}>Click me</button>;
});

const Parent = () => {
	const handleClick = useCallback(() => {
		console.log('Clicked!');
	}, []);

	return <Child onClick={handleClick} />;
};
```

### 优点

- 避免子组件不必要的渲染。
- 配合 `React.memo` 效果更佳。

### 缺点

- 与 `useMemo` 类似，滥用可能适得其反。
- 若依赖频繁变化，效果有限。

### 使用场景

- 子组件使用 `React.memo` 时，传入的是函数 props。
- 函数组件中函数作为依赖项时需要稳定引用。

---

## 7. `useTransition`

### 简介

将更新标记为“可中断的低优先级任务”，优化响应性能，常用于输入框、搜索、分页等场景。

### 示例代码

```tsx
import React, { useState, useTransition } from 'react';

const Search = () => {
	const [query, setQuery] = useState('');
	const [list, setList] = useState([]);
	const [isPending, startTransition] = useTransition();

	const handleChange = (e) => {
		const value = e.target.value;
		setQuery(value);

		startTransition(() => {
			// 模拟筛选数据
			const filtered = Array(10000)
				.fill(0)
				.map((_, i) => `Item ${i}`)
				.filter((item) => item.includes(value));
			setList(filtered);
		});
	};

	return (
		<div>
			<input value={query} onChange={handleChange} />
			{isPending && <p>Loading...</p>}
			<ul>
				{list.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>
		</div>
	);
};
```

### 优点

- 不阻塞高优先级任务（如输入响应）。
- 提高用户体验，常用于大数据处理或页面切换时。

### 缺点

- 适用于并发模式，需 React 18+。
- 对 SEO 或 SSR 支持较差。

### 使用场景

- 搜索、分页、大型表格加载等交互。
- 输入框联动渲染列表场景，避免卡顿。

---

## Hooks 优化对比总结

| 优化方式                | 类型             | 适用场景                                          | 推荐级别   |
| ----------------------- | ---------------- | ------------------------------------------------- | ---------- |
| `shouldComponentUpdate` | 类组件           | 需要精细手动控制更新逻辑时，性能关键组件          | ⭐⭐⭐     |
| `PureComponent`         | 类组件           | props/state 简单，使用不可变数据结构              | ⭐⭐⭐⭐   |
| `React.memo`            | 函数组件         | props 简单、不经常变化，频繁 re-render 的函数组件 | ⭐⭐⭐⭐   |
| `keys`                  | 所有组件         | 渲染列表时的必要手段，影响 React diff 算法准确性  | ⭐⭐⭐⭐⭐ |
| `useMemo`               | Hook             | 复杂计算、避免重复运算                            | ⭐⭐⭐     |
| `useCallback`           | Hook             | 稳定函数引用、配合 React.memo 使用                | ⭐⭐⭐⭐   |
| `useTransition`         | Hook (React 18+) | 输入延迟处理、大数据渲染                          | ⭐⭐⭐⭐   |

> 💡 **最佳实践建议**：  
> 配合使用不可变数据结构（如 `immer`、`immutable.js`）+ `React.memo` 或 `PureComponent`，能显著提升组件性能。
> Hooks 优化并非越多越好，应结合性能瓶颈分析合理使用，尤其避免过度优化导致“微性能损失”反而加重负担。
