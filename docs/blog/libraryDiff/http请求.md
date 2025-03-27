# HTTP 请求

在前端开发中，我们常用 `XMLHttpRequest (XHR)`、`Fetch API` 和 `Axios` 进行 HTTP 请求。本文对比它们的特性、使用方式、优缺点以及适用场景。

## 1. XMLHttpRequest (XHR)

**特点**：

- 传统的 AJAX 请求方式
- 需要手动监听 `onreadystatechange` 事件
- 支持同步和异步请求
- 兼容性好，支持所有现代浏览器

**示例代码**：

```javascript
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/data', true);
xhr.onreadystatechange = function () {
	if (xhr.readyState === 4 && xhr.status === 200) {
		console.log(JSON.parse(xhr.responseText));
	}
};
xhr.send();
```

**优缺点**：

✅ **优点**：

- 兼容性好，支持旧版浏览器
- 可用于文件上传（`FormData` 支持）

❌ **缺点**：

- 语法复杂，需要手动处理 `onreadystatechange`
- 不支持 Promise，需要使用回调处理异步操作

## 2. Fetch API

**特点**：

- 基于 Promise 的现代 API
- 语法简洁，支持 `async/await`
- 默认不发送 cookie（需手动配置 `credentials: 'include'`）
- 不支持超时控制（需要手动实现）

**示例代码**：

```javascript
fetch('https://api.example.com/data')
	.then((response) => response.json())
	.then((data) => console.log(data))
	.catch((error) => console.error('Error:', error));
```

**优缺点**：

✅ **优点**：

- 语法简洁，基于 Promise
- 支持 `async/await`，提高可读性
- 适用于现代浏览器

❌ **缺点**：

- 默认不支持超时处理
- 需要手动解析 `response.json()`
- 不自动处理 HTTP 错误（需要 `response.ok` 检测）

## 3. Axios

**特点**：

- 基于 Promise，简化 HTTP 请求
- 自动解析 JSON 响应
- 支持请求/响应拦截器
- 支持超时控制
- 适用于 Node.js 和浏览器端

**示例代码**：

```javascript
import axios from 'axios';

axios
	.get('https://api.example.com/data')
	.then((response) => console.log(response.data))
	.catch((error) => console.error('Error:', error));
```

**优缺点**：

✅ **优点**：

- 语法简洁，自动解析 JSON
- 内置超时处理
- 提供拦截器，便于处理请求和响应
- 兼容浏览器和 Node.js

❌ **缺点**：

- 需要额外安装（`npm install axios`）
- 相比 Fetch API，体积稍大

## 4. 对比总结

| 特性          | XHR            | Fetch API               | Axios                |
| ------------- | -------------- | ----------------------- | -------------------- |
| **语法风格**  | 回调           | Promise                 | Promise              |
| **兼容性**    | 旧版浏览器支持 | 现代浏览器              | 现代浏览器 & Node.js |
| **JSON 解析** | 需要手动解析   | 需要 `response.json()`  | 自动解析             |
| **错误处理**  | 需要手动实现   | 需要 `response.ok` 检测 | 内置支持             |
| **超时控制**  | 需要手动实现   | 需要手动实现            | 内置支持             |
| **拦截器**    | 不支持         | 不支持                  | 内置支持             |
| **安装方式**  | 无需安装       | 无需安装                | 需安装 `axios`       |

---

## 5. 适用场景

- **需要兼容旧版浏览器** → `XMLHttpRequest`
- **现代 Web 开发，语法简洁** → `Fetch API`
- **需要自动处理 JSON、超时、拦截器** → `Axios`

## 6. 结论

在现代 Web 开发中，`Fetch API` 和 `Axios` 是更好的选择，`Axios` 适用于需要更多功能的场景，而 `Fetch API` 适合轻量级应用。如果需要兼容旧浏览器，`XMLHttpRequest` 仍然是一个可选方案。
