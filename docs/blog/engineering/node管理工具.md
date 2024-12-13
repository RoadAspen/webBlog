# node 管理工具

> 在当前的前端发展中，SPA 项目占了绝大多数，基于 nodejs 和 webpack 的开发模式，赋予了前端工程化相关的能力，随着项目日益增大，又需要一些管理工具帮助我们管理项目依赖。如 多个项目依赖的 node 版本， npm 源等。

## node 版本管理

### nvm

nvm 是一款管理 node 版本的工具，在使用 nvm 前。卸载本地安装的 node，在 MacOS 上使用非常方便，windows 上有 nvm-windows。
安装

```sh
brew install nvm
```
1. 强大而灵活，支持 Node.js 的多版本安装、卸载和切换。
2. 允许为不同的项目设置不同的 Node.js 版本。
3. 支持 .nvmrc 文件，用于定义项目所需的 Node.js 版本。
4. 不同版本的 Node.js 隔离，避免全局模块冲突。

```js
// nvm install v14.12.0   安装

// nvm ls  查看已安装版本

// nvm use  v15.12.0   将当前node版本切换到 v15.12.0

//  sudo nvm uninstall 4.4.5  卸载制定node版本
//  sudo nvm remove 4  卸载当前node版本
```

**注意：nvm 不兼容 npm set prefix 的写法**

### fnm

fnm 是一款 node 版本的管理工具， 和 nvm 的作用一样，同时兼容 npm set prefix。
一个现代化、高性能的 Node.js 版本管理工具。使用 Rust 编写，比 nvm 更快。

安装

```sh
brew install fnm
```

#### 優點
1. 速度非常快，尤其是在安装和切换 Node.js 版本时。
2. 跨平台支持（macOS、Linux 和 Windows）。
3. 提供与 nvm 类似的功能，例如 .nvmrc 支持。
4. 内存占用更少，特别适合需要频繁切换版本的场景。

### n
是一个极简的 Node.js 版本管理工具。使用全局安装方式通过 npm 提供。

#### 特点：
1. 简单易用，直接通过命令管理 Node.js 版本。
2. 安装速度快，直接下载并覆盖现有版本。
3. 支持直接安装指定版本（如 n 16.20.0）或选择最新的版本（如 n latest）。
#### 适用场景：
用户需要一个快速切换和管理 Node.js 版本的工具，不需要复杂功能。
```sh
npm install -g n
```
## 對比
|特性|n |	nvm| fnm|
|--|--|--|--|
|实现语言	|JavaScript|	Shell|	Rust|
|跨平台支持|	macOS, Linux, Windows|	macOS, Linux (nvm-windows 限制较多)|	macOS, Linux, Windows|
|切换速度|	快|	慢（重新加载环境）	|快（Rust 的高效实现）|
|功能复杂度|	简单|	功能全面|	高效且功能全面|
| 安装方式|	npm	|脚本	|脚本|


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
**注意，當我們在使用yrm設置新的鏡像源時，npm 的鏡像源會同步更改。**

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
目前來說，直接使用yrm就滿足需求
