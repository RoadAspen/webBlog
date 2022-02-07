# 前端 Docker 部署

该篇是用于 前端 spa 应用 基于`docker`和`nginx`的环境部署。采用`多阶段构建` 和 sh 命令行工具。

## 第一阶段

创建 node 容器，并在容器内执行打包程序。

```Dockerfile

```

## 第二阶段

创建 nginx 容器， 将第一阶段 node 容器 中打包成功的静态资源 copy 到 nginx 对应的目录中，copy nginx 配置文件到 nginx 的 config 目录，启动 nginx。
