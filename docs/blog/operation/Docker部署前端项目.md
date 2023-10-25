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

## Dockerfile

项目最终是以静态文件的方式部署，需要先进行静态资源打包，再选择 nginx 作为静态服务器。分阶段执行。

### 第一阶段

首先 创建 node 容器，并在容器内执行前端静态资源打包。

```Dockerfile
# ==================== 第一阶段 =======================

# 指定基础镜像
FROM node:lts as frontend

# 设置工作目录
WORKDIR /workspace

# 将package.json 拷贝进工作目录
COPY package.json /workspace

# 将 yarn.lock 拷贝进工作目录
COPY yarn.lock  /workspace

# 1、安装 yarn ，2 设置 yarn 的 源为淘宝源
RUN npm install -g yarn  && yarn config set registry https://registry.npm.taobao.org

# 拉取依赖
RUN yarn

# 将除了.dockerignore中的指定文件外的 打包所需的文件全部拷贝进工作目录
COPY . /workspace

# 打包, 生成 dist 文件夹，包含所有打包后的资源  html css js img iconFont 等
RUN yarn build

```

### 第二阶段

创建 nginx 容器， 将第一阶段 node 容器 中打包成功的静态资源 copy 到 nginx 对应的目录中，copy nginx 配置文件到 nginx 的 config 目录，启动 nginx。

```Dockerfile
# ================== 第二阶段 =======================

# 指定基础镜像
FROM nginx:latest as nginx

# 将 copy 静态文件到 nginx 的 静态文件夹中
COPY --from=frontend /workspace/dist/ /usr/share/nginx/html

# copy nginx.conf 到 nginx 配置文件夹,并替换掉初始的 nginx.conf 文件
COPY --from=frontend /workspace/nginx.conf /etc/nginx/nginx.conf

# copy sh 文件到 nginx 可执行文件路径
COPY --from=frontend /workspace/entrypoint.sh /usr/local/bin/entrypoint.sh

# 赋予 文件可执行权限
RUN chmod +x /usr/local/bin/entrypoint.sh

# linux 系统使用 \n 作为 回车加换行，windows 使用 \r\n 作为回车加换行，所以需要去掉\r
RUN sed -i 's/\r//' /usr/local/bin/entrypoint.sh

# 执行 在镜像实例化为容器时执行的 命令
# 由于 新版 nginx 镜像的某些原因，这里推荐使用 CMD xxx xxx 的方式
CMD /bin/bash /usr/local/bin/entrypoint.sh

```

## sh 自动化

可以通过编写 sh 文件命令将一些步骤自动化。

**entrypoint.sh**

```sh
#! /bin/bash
# 这里主要做的是给 nginx 的 proxy_pass 配置 ，通过环境变量传入，这里通过拿到环境变量，然后替换文件
# 由于 代理地址中 存在 / ，所以我们这里使用 % 做为分割符
# 由于我们这里需要 对url重写，所以传入的 PROXY_PORT 链接必须以 / 结尾

sed -i 's%PROXY_PORT%'${PROXY_PORT}'%' /etc/nginx/nginx.conf

# 手动启动 nginx
nginx -g "daemon off;"
```

**build.sh**

> 打包镜像并推送至服务器

```sh
#! /bin/bash

# 开始构建镜像
sudo docker build -t react .

# 推镜像
# sudo docker push react-hook-ts

# 不推镜像或者直接本地 启动容器，因为 nginx 内部配的是 8080端口，这里暴露8080端口给外网

sudo docker run -it -d --name react -p 8080:8080 react bash
```

**nginx.conf**

```js

#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       8080; # 监听端口
        server_name  localhost; # 监听域名

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        # 站点目录,作用于 server ，覆盖 location.root


        location / {
            # try_files $uri $uri/ /kong 先尝试 $uri 地址 文件存在 ，再尝试 $uri/ 文件夹存在，都不存在，则加载 location /
            # 不在意 $uri/ 文件夹是否存在，可以删除 $uri/  eg: try_files $uri /，这里删除会报错
            # 否则 定义到 /kong
            root   /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            index  index.html;
        }

        location  /static/ {
            # 将 静态文件 static 开头的页面直接重定向到静态资源文件夹
           alias  /usr/share/nginx/html/static/;
        }

        location /api/ {
        # 将 api 开头的都 代理到另一个 地址， 去除前缀有两种方式，
        # 第一种即是 在 proxy_pass 地址后边加上 / ，即 http://myserver/ 这样就会直接将api后边的路径直接拼接到proxy_pass 之后
        # 第二种 使用 rewrite
            # rewrite ^/api/(.*)$ /$1 break;
            # 请求转向 myserver 定义的服务器列表
            proxy_set_header Host $http_host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header REMOTE-HOST $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_pass PROXY_PORT;
        }
        # error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        # error_page  404 500 502 503 504  /50x.html;
        # location = /50x.html {
        #     root   frontend/dist;
        #     index  index.html index.htm; # 指定index,可以提到 http中
        # }


        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }


    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}


    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

}
```
