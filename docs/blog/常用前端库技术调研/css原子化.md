# 原子 CSS 方案对比：Tailwind CSS vs UnoCSS

## 1. 什么是原子 CSS？

**原子 CSS**（Atomic CSS）是一种 CSS 组织方式，它将样式拆分成最小的单一职责类（utility classes），可以通过组合这些类来构建 UI，而无需编写传统的 CSS 代码。

**优势**：

- 减少 CSS 代码编写量
- 组件样式隔离，避免全局污染
- 提供一致的设计规范
- 运行时 CSS 生成，提高性能

主流的原子 CSS 方案有 **Tailwind CSS** 和 **UnoCSS**。

## 2. Tailwind CSS

**特点**：

- 提供丰富的预定义 utility 类
- 可定制化主题配置（Tailwind Config）
- 内置 JIT（Just-In-Time）编译，减少不必要的 CSS 生成
- 适用于大型项目，有成熟的生态

**安装**：

```sh
npm install -D tailwindcss
npx tailwindcss init
```

**示例代码**：

```html
<button
	class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
	Tailwind Button
</button>
```

**优缺点**：

✅ **优点**：

- 提供丰富的默认样式
- 强大的主题配置能力
- 生态成熟，社区支持广泛

❌ **缺点**：

- 初学者需要适应 utility-first 思维
- 生成的 class 名称较长，影响可读性

## 3. UnoCSS

**特点**：

- 轻量化、按需生成 CSS
- 兼容 Tailwind 语法，并支持 Windi CSS、Attributify Mode 等
- 适用于 Vite / Vue / React / Svelte / Nuxt 等现代前端框架
- 高度可扩展，支持插件机制

**安装**（以 Vite 为例）：

```sh
npm install -D unocss
```

**配置**（`vite.config.js`）：

```javascript
import UnoCSS from 'unocss/vite';
export default {
	plugins: [UnoCSS()],
};
```

**示例代码**：

```html
<button
	class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
	UnoCSS Button
</button>
```

**优缺点**：

✅ **优点**：

- 轻量高效，按需生成 CSS
- 兼容性强，可结合不同 CSS 方案
- 支持动态规则扩展

❌ **缺点**：

- 生态相对较新，部分插件支持有限
- 需要手动配置才能充分发挥能力

## 4. 原子 CSS 方案对比

| 方案             | 体积 | 语法     | 生态     | JIT 编译 | 适用场景                     |
| ---------------- | ---- | -------- | -------- | -------- | ---------------------------- |
| **Tailwind CSS** | 大   | 类似 CSS | 成熟     | ✅       | 适用于大型项目               |
| **UnoCSS**       | 轻量 | 灵活     | 生态较新 | ✅       | 适用于高性能、按需生成的项目 |

## 5. 选择建议

- **如果希望使用成熟方案，推荐 Tailwind CSS**（生态丰富、文档完善）。
- **如果追求极致性能和灵活性，推荐 UnoCSS**（更轻量、按需生成）。

## 6. 结论

原子 CSS 方案提供了高效的 UI 设计方式，Tailwind CSS 和 UnoCSS 各有优势，选择时需根据项目需求权衡。
