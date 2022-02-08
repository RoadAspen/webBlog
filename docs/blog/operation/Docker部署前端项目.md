# Docker 部署前端项目

## 前言

Docker 是先进的轻量级虚拟化技术，拥有持续集成、版本控制、可移植性、隔离性和安全性等优势，替代了之前大型虚拟机的服务部署，节省很多的服务器资源。

该篇是用于 前端 SPA 应用 基于`docker`和`nginx`的环境部署。采用`多阶段构建` 和 sh 命令行工具。

## dockerignore

在项目中添加.dockerignore 文件。.dockerignore 是类似于 .gitignore 的功能，用来将某些文件不被 docker 捕获，如一些 ADD、COPY 的命令。

```
.idea/
.vscode/
.git/

vendor/

dist/

node_modules/

yarn-error.log
```

## nginx config

项目最终是以静态文件的方式部署，所以选择 nginx 作为静态服务器。

## 第一阶段

首先 创建 node 容器，并在容器内执行前端静态资源打包。

```Dockerfile
// 构建node镜像 ，重命名为frontend
FROM node:alpine as frontend;

// 拷贝package.json进入 app文件夹
COPY package.json /app/

// 开启日志输出， 进入 资源文件夹， 开始安装npm包
RUN set -x ; cd /app && npm install --registry=https://registry.npm.taobao.org

// 拷贝 webpack配置文件
COPY webpack.mix.js webpack.config.js /app/

// 拷贝所有前端代码文件
COPY src/ /app/src/

// 执行代码

RUN npm run build

```

## 第二阶段

创建 nginx 容器， 将第一阶段 node 容器 中打包成功的静态资源 copy 到 nginx 对应的目录中，copy nginx 配置文件到 nginx 的 config 目录，启动 nginx。

```Dockerfile
FROM nginx as nginx;

COPY --from=frontend /app/dist/

COPY package.json /usr/src/app/package.json

```
