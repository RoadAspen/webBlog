# node管理工具

> 在当前的前端发展中，SPA项目占了绝大多数，基于nodejs 和 webpack 的开发模式，赋予了前端工程化相关的能力，随着项目日益增大，又需要一些管理工具帮助我们管理项目依赖。如 多个项目依赖的 node版本， npm 源等。

## nvm

nvm 是一款管理node版本的工具，在使用nvm前。卸载本地安装的node。

使用
```js
// nvm install v14.12.0   安装

// nvm ls  查看已安装版本


// nvm use  v15.12.0   将当前node版本切换到 v15.12.0

//  sudo nvm uninstall 4.4.5  卸载制定node版本
```

## nrm

在日常使用中我们由于网络原因，或者是私有源等问题切换npm的源，来回切换很不方便。nrm 是一款管理npm源，可以方便切换的管理工具。

使用

```js
// npm install -g nrm  安装nrm

// nrm list  查看 本地 nrm源列表

// nrm add <name> <url> 添加本地的nrm源

// nrm use <name>   切换nrm 源

// npm config set registry   查看切换后的源地址
```