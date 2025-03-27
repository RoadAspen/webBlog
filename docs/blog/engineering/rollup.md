# Rollup

## 1. Rollup 概念

Rollup 是一个 JavaScript 模块打包工具，主要用于构建 ES 模块化的应用程序。它支持 **Tree Shaking** 和 **ES Module**，生成高效、简洁的代码。

主要特性：

- **ES 模块支持**：Rollup 以 ES6 模块为基础，适用于现代 JavaScript 项目。
- **Tree Shaking**：自动移除未使用的代码，优化打包体积。
- **插件机制**：通过插件扩展功能，如 Babel、TypeScript、CommonJS 支持等。

## 2. Rollup 语法

Rollup 通过 **配置文件** 或 **命令行** 进行打包，核心 API 包括：

- `input`：指定入口文件
- `output`：配置输出格式（ESM、CJS、UMD）
- `plugins`：使用插件扩展功能
- `external`：指定外部依赖，不进行打包

## 3. Rollup 的优点

✅ 代码结构清晰，基于 ES 模块
✅ 体积小，支持 Tree Shaking
✅ 适用于库和工具类的打包
✅ 插件生态丰富，灵活扩展

## 4. Rollup 的缺点

❌ 默认不支持 CommonJS，需要额外插件
❌ 配置相对 Webpack 更简单，但缺少复杂场景的支持
❌ 生态相较 Webpack 较小

## 5. Rollup 示例代码

### 5.1 安装 Rollup

```sh
npm install -g rollup  # 安装全局 Rollup
npm init -y  # 初始化 package.json
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-babel
```

### 5.2 创建 `rollup.config.js`

```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default {
	input: 'src/index.js', // 入口文件
	output: [
		{
			file: 'dist/bundle.cjs.js',
			format: 'cjs', // CommonJS 规范
		},
		{
			file: 'dist/bundle.esm.js',
			format: 'esm', // ES Module 规范
		},
	],
	plugins: [
		resolve(), // 解析 node_modules
		commonjs(), // 转换 CommonJS 模块
		babel({ babelHelpers: 'bundled' }),
	],
};
```

### 5.3 运行 Rollup 构建

```sh
rollup -c  # 使用配置文件打包
```

### 5.4 直接使用命令行打包

```sh
rollup src/index.js --file dist/bundle.js --format esm
```

## 6. 结论

Rollup 适用于构建 **库** 和 **工具类** 代码，因其轻量、Tree Shaking 友好，在现代前端开发中广泛应用。如果需要处理更复杂的应用（如 Web 应用），可以考虑 Webpack。
