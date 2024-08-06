# HTTP 常用状态码

## 1xx 信息响应

### 100

表示客户端应当继续发送请求的剩余部分

### 101

服务端正在切换协议，常见于 websocket 使用 http 握手连接时

## 2xx 成功

### 200 ok

请求已经成功处理

### 201 created

请求已经实现，并且创建了一个新的资源

### 202 Accepted

请求已被接受，但未完成

### 204 No Content

请求已成功处理，但是没有内容

## 3xx 重定向

### 301

请求的资源已永久移动

### 301 Found

### 303 See Other

### 304 Not Modified

get 请求已被缓存，文件未过期，使用缓存

## 4xx 客户端错误

### 400 Bad Request

服务器无法理解或者拒绝执行客户端的请求

### 401 Unauthorized

需要权限认证

### 403 Forbidden

服务器拒绝了这个请求

### 404 Not Found

未找到资源

## 5xx 服务端错误

### 500 Internal Server Error

服务器错误

### 501 不支持

### 502 Bad Gateway

网管错误

### 503

服务器过载

### 504

网关超时
