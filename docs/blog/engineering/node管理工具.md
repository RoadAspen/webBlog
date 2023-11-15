# node 管理工具

> 在当前的前端发展中，SPA 项目占了绝大多数，基于 nodejs 和 webpack 的开发模式，赋予了前端工程化相关的能力，随着项目日益增大，又需要一些管理工具帮助我们管理项目依赖。如 多个项目依赖的 node 版本， npm 源等。

## node 版本管理

### nvm

nvm 是一款管理 node 版本的工具，在使用 nvm 前。卸载本地安装的 node，在 MacOS 上使用非常方便，windows 上有 nvm-windows。
安装

```sh
brew install nvm
```

使用

```js
// nvm install v14.12.0   安装

// nvm ls  查看已安装版本

// nvm use  v15.12.0   将当前node版本切换到 v15.12.0

//  sudo nvm uninstall 4.4.5  卸载制定node版本
//  sudo nvm remove 4  卸载当前node版本
```

**注意：nvm 不兼容 npm set prefix 的写法**

### fnm

fnm 是一款 node 版本的管理工具， 和 nvm 的作用一样，同时兼容 npm set prefix

安装

```sh
brew install fnm
```

## npm 源管理工具

### nrm

在日常使用中我们由于网络原因，或者是私有源等问题切换 npm 的源，来回切换很不方便。nrm 是一款管理 npm 源，可以方便切换的管理工具。

使用

```js
// npm install -g nrm  安装nrm

// nrm list  查看 本地 nrm源列表

// nrm add <name> <url> 添加本地的nrm源

// nrm use <name>   切换nrm 源

// nrm del <name>   删除nrm 源

// npm config get registry   查看切换后的源地址
```

### yrm

在日常使用中我们由于网络原因，或者是私有源等问题切换 yarn 的源，来回切换很不方便。yrm 是一款管理 yarn 源，可以方便切换的管理工具。

使用

```js
// npm install -g yrm  安装yrm

// yrm list  查看 本地 yarn源列表

// yrm add <name> <url> 添加本地的yarn源

// yrm use <name>   切换yarn 源

// yrm del <name>   删除yarn 源

// yarn config get registry   查看切换后的源地址
```

### cgr

在日常使用中我们由于网络原因，或者是私有源等问题切换 npm 或者 yarn 的源，来回切换很不方便。cgr 是一款同时管理 npm 和 yarn 源，可以方便切换的管理工具。

使用

```js
// npm install -g cgr  安装 cgr

// cgr ls  查看 本地 cgr 的源列表

// cgr add <name> <url> 添加本地的源

// cgr use <name>   切换cgr 源, 同时切换 yarn 和 npm 的源

// npm config get registry   查看切换后的源地址
// yarn config get registry   查看切换后的源地址
```
