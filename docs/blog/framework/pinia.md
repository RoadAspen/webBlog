# Pinia

Pinia 是 Vue 3 的状态管理库，它提供了简单易用的 API 和强大的功能，帮助开发者更好地管理应用的状态。以下是 Pinia 的一些主要特点和使用方法：

## 主要特点

- **简单易用**：Pinia 的 API 设计简洁明了，易于上手和使用。
- **模块化**：Pinia 支持模块化管理状态，便于大型应用的状态管理。
- **响应式**：Pinia 基于 Vue 3 的响应式系统，状态的变化会自动触发视图更新。
- **插件系统**：Pinia 提供了插件系统，可以方便地扩展其功能。
- **TypeScript 支持**：Pinia 完美支持 TypeScript，提供了类型推导和类型检查。
- **Devtools 支持**：Pinia 集成了 Vue Devtools，方便开发者调试和监控状态变化。

### 安装

你可以通过 npm 或 yarn 安装 Pinia：

```sh
yarn add pinia
# 或者
npm install pinia

```

### 使用

在 Vue 3 项目中使用 Pinia，首先需要在 main.js 或 main.ts 中创建并挂载 Pinia 实例：

main.ts

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
```

#### 定义 Store

counter.store.ts

```ts
import { defineStore } from 'pinia';
const useCounterStore = defineStore('counter', {
	state: () => ({ count: 0 }),
	actions: {
		increment() {
			this.count++;
		},
	},
});

export default useCounterStore;
```

#### 使用 Store

Counter.tsx

```tsx
import { useCounterStore } from './stores/counter.store';

export default defineComponent({
	name: 'Counter',
	setup() {
		const counterStore = useCounterStore();
		return () => {
			return (
				<button onClick={() => counterStore.increment()}>Increment</button>
			);
		};
	},
});
```
