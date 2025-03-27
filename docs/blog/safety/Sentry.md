# Sentry

这是一个 Sentry 学习安装部署使用文档

## 前言

什么是 Sentry？Sentry 是一个开源的错误追踪系统，它可以帮助你跟踪和修复错误。无论是前端的 JavaScript 应用，还是后端的 Python、Java 等服务，Sentry 都能捕获并详细记录错误信息，让开发者能快速定位和解决问题。以下将详细介绍 Sentry 的安装、部署和使用方法。

## 一、安装 Sentry

### 前提条件

- **操作系统**：推荐使用 Linux 系统，如 Ubuntu 18.04 及以上版本。
- **硬件资源**：至少 2GB 内存，10GB 可用磁盘空间。
- **软件依赖**：需要安装 Docker 和 Docker Compose。

#### 安装 Docker

以 Ubuntu 系统为例，执行以下命令：

```bash
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install docker-ce
```

验证 Docker 是否安装成功：

```bash
sudo docker run hello-world
```

#### 安装 Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

验证 Docker Compose 是否安装成功：

```bash
docker-compose --version
```

### 安装 Sentry

1. 创建一个目录用于存放 Sentry 配置文件：

```bash
mkdir sentry && cd sentry
```

2. 下载 Sentry 的 Docker Compose 文件：

```bash
curl -sSL https://raw.githubusercontent.com/getsentry/self-hosted/master/docker-compose.yml -o docker-compose.yml
```

3. 生成 Sentry 的配置文件：

```bash
docker-compose run --rm web config generate-secret-key
```

将生成的密钥复制下来，后续配置会用到。

4. 创建 `.env` 文件并配置环境变量：

```bash
touch .env
```

打开 `.env` 文件，添加以下内容：

```plaintext
SENTRY_SECRET_KEY='your_secret_key'
```

将 `your_secret_key` 替换为上一步生成的密钥。

## 二、部署 Sentry

1. 初始化 Sentry 数据库：

```bash
docker-compose run --rm web upgrade
```

按照提示完成数据库初始化操作。

2. 启动 Sentry 服务：

```bash
docker-compose up -d
```

这将启动 Sentry 的所有服务，包括 Web 界面、工作进程、Redis、PostgreSQL 等。

3. 验证部署是否成功：
   打开浏览器，访问 `http://your_server_ip:9000`，如果看到 Sentry 的登录页面，则说明部署成功。

## 三、使用 Sentry

### 前端（JavaScript）集成

1. 在项目中安装 Sentry SDK：

```bash
npm install @sentry/browser
```

2. 在项目入口文件中初始化 Sentry：

```javascript
import * as Sentry from '@sentry/browser';

Sentry.init({
	dsn: 'your_dsn',
});
```

将 `your_dsn` 替换为 Sentry 项目中生成的 DSN（数据来源名称）。

3. 触发一个错误进行测试：

```javascript
function throwError() {
	throw new Error('This is a test error');
}

throwError();
```

此时，Sentry 会捕获到该错误并在控制台显示错误信息。

### 后端（Python）集成

1. 在项目中安装 Sentry SDK：

```bash
pip install sentry-sdk
```

2. 在 Python 代码中初始化 Sentry：

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your_dsn",
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0
)
```

同样，将 `your_dsn` 替换为 Sentry 项目的 DSN。

3. 触发一个错误进行测试：

```python
@app.route('/error')
def trigger_error():
    division_by_zero = 1 / 0
    return 'This will never be returned'
```

当访问 `/error` 路由时，Sentry 会捕获到除零错误并记录相关信息。

## 四、常见问题及解决方法

### 服务启动失败

检查 Docker 和 Docker Compose 是否正确安装，查看 `docker-compose.yml` 文件是否有语法错误，使用 `docker-compose logs` 命令查看服务日志以定位问题。

### 无法访问 Sentry 界面

检查服务器防火墙是否开放了 9000 端口，确保服务器 IP 地址和端口配置正确。

### 错误未被捕获

检查 Sentry SDK 是否正确初始化，DSN 是否配置正确，确保项目中引入了相应的 SDK。

## 五、总结

通过以上步骤，你已经完成了 Sentry 的安装、部署和集成使用。Sentry 能为你的项目提供强大的错误追踪功能，帮助你快速定位和解决问题，提高开发效率和应用的稳定性。在实际使用过程中，可根据项目需求进一步配置 Sentry 的各种功能，如设置告警规则、自定义标签等。
