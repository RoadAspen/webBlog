# Mock 方案

> 在我们日常的开发中，由于前后端是并行开发的，所以在前期是没有后端接口供我们使用的。所以学会自己的 Mock 数据的方法就非常的重要。

## 常见的 Mock 方案

在我们日常的 mock 方案中，有 `自定义json文件`、`Mockjs`、`swagger`、`node本地服务`等多种模拟数据方案。

## 代码侵入

### 什么是代码侵入

**代码侵入**，通过`请求本地的自定义json文件`或者`直接在代码中写死Mock数据`的方式来模拟后端输入。

### 例子

```js
const apiData = {
  data: [1, 2, 3],
  code: 200,
  message: "ok",
};

function getAPIData() {
  return apiData;
}
```

### 优点

1. 只有在项目非常小，或者单独一个接口时，可以比较直观的使用。

### 缺点

1. 数据是定死的，每次请求返回的数据都是相同的。
2. 代码耦合比较严重，和真实环境切换很麻烦。
3. 如果需要大量测试数据，则耗费很长时间去造数据，更改数据时非常耗费时间。

一般不推荐使用

## 请求拦截

### 什么是请求拦截

**请求拦截** 就是拦截前端的 ajax 请求，在前端发起 ajax 请求时，直接重定向到 MocJS 中。这个比较常用。

**代表**：[MockJS](http://mockjs.com/)

### 例子

```js
// npm install mockjs

var Mock = require("mockjs");

Mock.mock("/api/getData", "get", {
  code: 200,
  msg: "ok",
  data: {
    "number|1-10": 1,
    color: Math.Random.color(),
  },
});
```

### 优点

1. 和前端代码分离。
2. 生成代码随机。
3. 新增数据/删除数据方便。

### 缺点

1. 数据都是生成的随机数据，无法模拟真实的增删改查。
2. 后端接口改变时，需要跟随文档手动更改返回数据格式。
3. MockJS 的原理是重写 HTTPRequest 请求， 只支持 ajax，不支持 fetch（浏览器新增 http 请求方式）

一般情况下，这种方式就可以满足大部分的使用场景，除非使用 window.fetch。

## 接口管理工具

### 什么是接口管理工具

主要是后端工程师，根据一定的配置，生成相应的数据接口返回给前端。

**代表：** [rap](https://github.com/thx/rap2-delos),[swagger](https://swagger.io/),[moco](https://github.com/dreamhead/moco/blob/master/moco-doc/apis.md),[yapi](https://github.com/YMFE/yapi)

### 优点

1. 配置功能强大，接口与 Mock 一体，后端修改接口，Mock 也跟着改，前端只需要关心代码逻辑。

### 缺点

1. 配置繁琐，依赖后端配置，如果后端比较忙，可能就没有时间去配置。
2. 一般作为大团队的基础设施建设而存在，小团队不建议使用。

大团队建议使用，而且极度依赖后端。

## 本地 node 服务器

### 什么是本地 node 服务器

简单来说，就是在本地起一个 node 服务器，用来模拟后端服务器，所有指向后端的 url 地址都会重定向到 node 服务器。

**代表**：[json-server](https://github.com/typicode/json-server)

### 例子

安装

```js
// npm install -g json-server
```

创建 json，类似于数据库, 每一个 key，都对应一个 url 地址，对 url 地址，会基于 RestAPI 的格式做 get、post、put、patch、delete 等方法的映射

```json
//db.json
{
  "posts": [{ "id": 1, "title": "json-server", "author": "typicode" }],
  "comments": [{ "id": 1, "body": "some comment", "postId": 1 }],
  "profile": { "name": "typicode" }
}
```

启动

```js
// json-server --watch db.json
```

使用

```js
axios.get('http://localhost:3000/posts/1')

// 返回
{"id": 1,"title": "json-server", "author": "typicode" }
```

### 优点

1. 配置简单，json-server 可以 0 代码启动一个 REST API Server。
2. 自定义程度高，一切尽在掌控中。
3. 增删改查真实模拟。

### 缺点

1. 无法自动同步后端 api 。

推荐使用，此方法可以真实模拟前后端交互效果。

## REST API

一句话总结： URI 代表 资源对象，METHOD 代表行为：

```js
"GET /posts"; // 列表
"GET /posts/1"; // 详情
"POST /posts"; // 新增
"put /posts/1"; // 替换（全量更新）
"PATCH /posts/1"; // 修改
"DELETE /posts/1"; // 删除

```
