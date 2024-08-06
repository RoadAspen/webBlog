# websocket

## 前言

WebSocket 是和 http 同等重要的前端技术

## 什么是 WebSocket

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。WebSocket 使得客户端和服务端之间的数据交换变得更加简单，允许服务端主动向客户端推送数据。

在 WebSocket API 中，浏览器和服务器只需要一次握手，两者之间就能建立持久性的链接，并进行双向数据传输。

### 本质

WebSocket 本质上是一种 计算机网络应用层的协议，用来弥补 HTTP 协议在持久通信上的不足。最大的特点就是 服务器可以主动向客户端推送信息，客户端也可以主动向服务器发送信息，是真正的双向平等对话，属于服务器推送技术的一种，与之类似的还有 `SSE`

### 特点

1. 建立在 HTTP 之上，握手时使用 HTTP 协议。
2. 数据格式比较轻量，性能开销小，通信高效。
3. 可以发送文本，也可以发送二进制数据。
4. 没有同源限制，可以与任意服务器通信。
5. 协议标识符是 ws，如果加密则是 wss。

## 为什么需要 WebSocket

在日常开发中，我们需要 http 就可以了，为什么会需要 websocket。

因为 http 有一个最大的缺点就是只能由客户端向服务器发送请求，服务器返回查询结果，尽管 http2.0 也具备了服务器推送的功能，但是只能推送静态资源，无法推送指定的信息。所以，当服务器的信息需要有连续的数据变化时，客户端获知这些信息就只能通过`轮 询`,每隔一段时间就发出一个询问（HTTP 请求）。

### 轮询的缺点

1. 每隔一段时间就需要由客户端发起一次请求。
2. 当客户端的访问量上升时，请求的增加是成倍的，增加了服务器的压力。
3. 大量的轮询会占用带宽，每次请求都会携带相同的 header 信息。

说到底就是，http 不具有持久通信的能力，而在实际的应用中，我们很需要这种能力。

## WebSocket 协议的原理

websocket 的建立是基于一次 http 的握手，之后就和 http 无关了。
在第一次的握手的消息体中会包含两种

```js
Upgrade: websocket;
Connection: Upgrade;
```

这个就是告诉服务器，我发起的请求要用 WebSocket 协议，而不是 HTTP 协议。
服务器收到后会返回对应的 response。

### websocket 连接流程

1. 客户端发起请求，三次握手，建立 TCP 连接，请求头存放需要的 websocket 相关信息。
2. 服务器收到客户端的握手请求后，采用 http 协议回馈数据,状态码是 101。
3. 客户端接收到连接成功的消息后，开始基于 TCP 传输信道进行全双工通信。

## websocket 的优缺点

### 优点：

- WebSocket 建立以后，互相沟通所消耗的请求头很小。
- 服务器可以向客户端通信。

### 缺点：

- websocket 在某些低版本的浏览器不支持，部分的浏览器支持的方式有区别（IE10）

## websocket 的使用场景

- 即时聊天通信
- 对玩家游戏
- 在线协同编辑
- 实时数据流的拉取和推送
- 体育/游戏实况
- 实时地图位置
- 游戏应用程序

具有实时性和高交互性的场景。

## 断线重连

nginx 代理的 websocket 转发，在无消息连接时会出现超时断开的问题。网上资料提到的解决方案有两种。

1. 修改 nginx 信息
2. 心跳包

主动触发包括主动断开连接，客户端主动发送信息给后端。

1. 主动断开连接

```js
ws.close();
```

2. 主动发送消息

```js
ws.send("message");
```

这时候我们就需要知道服务端设置的超时时长是多少，在小于超时时间内发送心跳包，有 2 中方案:一种是客户端主动发送上行心跳包，另一种方案是服务端主动发送下行心跳包。  
首先了解一下心跳包机制，之所以叫心跳包是因为：它像心跳一样每隔固定时间发一次，以此来告诉服务器，这个客户端还活着。事实上这是为了保持长连接，至于这个包的内容，是没有什么特别规定的，不过一般都是很小的包，或者只包含包头的一个空包。
在 TCP 的机制里面，本身是存在有心跳包的机制的，也就是 TCP 的选项：SO_KEEPALIVE。系统默认是设置的 `2 小时的心跳频率`。但是它检查不到机器断电、网线拔出、防火墙这些断线。而且逻辑层处理断线可能也不是那么好处理。一般，如果只是用于保活还是可以的。
心跳包一般来说都是在逻辑层发送空的 echo 包来实现的。下一个定时器，在一定时间间隔下发送一个空包给客户端，然后客户端反馈一个同样的空包回来，服务器如果在一定时间内收不到客户端发送过来的反馈包，那就只有认定说掉线了。
在长连接下，有可能很长一段时间都没有数据往来。理论上说，这个连接是一直保持连接的，但是实际情况中，如果中间节点出现什么故障是难以知道的。更要命的是，有的节点(防火墙)会自动把一定时间之内没有数据交互的连接给断掉。在这个时候，就需要我们的心跳包了，用于维持长连接，保活。

心跳检测步骤：

1. 客户端每隔一个时间间隔发生一个探测包给服务器
2. 客户端发包时启动一个超时定时器
3. 服务器端接收到检测包，应该回应一个包
4. 如果客户机收到服务器的应答包，则说明服务器正常，删除超时定时器
5. 如果客户端的超时定时器超时，依然没有收到应答包，则说明服务器挂了

```js
// 前端解决方案：心跳检测
var heartCheck = {
  timeout: 30000, //30秒发一次心跳
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function() {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function() {
    var self = this;
    this.timeoutObj = setTimeout(function() {
      //这里发送一个心跳，后端收到后，返回一个心跳消息，
      //onmessage拿到返回的心跳就说明连接正常
      ws.send("ping");
      console.log("ping!");

      self.serverTimeoutObj = setTimeout(function() {
        //如果超过一定时间还没重置，说明后端主动断开了
        ws.close(); //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
      }, self.timeout);
    }, this.timeout);
  },
};
```

## 同个浏览器多页面共享 WebSocket 连接

使用 ShadowWorker，多页面共享 worker。

```ts
export class EventDispatcher {
  private listeners: { [type: string]: Function[] } = {};

  protected addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    if (this.listeners[type].indexOf(listener) === -1) {
      this.listeners[type].push(listener);
    }
  }

  protected removeEventListener(type: string) {
    this.listeners[type] = [];
  }

  protected dispatchEvent(type: string, data: any) {
    const listenerArray = this.listeners[type] || [];
    if (listenerArray.length === 0) return;
    listenerArray.forEach((listener) => {
      listener.call(this, data);
    });
  }
}

export class WebSocketClient extends EventDispatcher {
  // #socket链接
  private url = "";
  // #socket实例
  private socket: WebSocket | null = null;
  // #重连次数
  private reconnectAttempts = 0;
  // #最大重连数
  private maxReconnectAttempts = 5;
  // #重连间隔
  private reconnectInterval = 10000; // 10 seconds
  // #发送心跳数据间隔
  private heartbeatInterval = 1000 * 30;
  // #计时器id
  private heartbeatTimer?: NodeJS.Timeout;
  // #彻底终止ws
  private stopWs = false;
  // *构造函数
  constructor(url: string) {
    super();
    this.url = url;
  }
  // >生命周期钩子
  onopen(callBack: Function) {
    this.addEventListener("open", callBack);
  }
  onmessage(callBack: Function) {
    this.addEventListener("message", callBack);
  }
  onclose(callBack: Function) {
    this.addEventListener("close", callBack);
  }
  onerror(callBack: Function) {
    this.addEventListener("error", callBack);
  }
  // >消息发送
  public send(message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error("[WebSocket] 未连接");
    }
  }

  // !初始化连接
  public connect(): void {
    if (this.reconnectAttempts === 0) {
      this.log("WebSocket", `初始化连接中...          ${this.url}`);
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    this.socket = new WebSocket(this.url);

    // !websocket连接成功
    this.socket.onopen = (event) => {
      this.stopWs = false;
      // 重置重连尝试成功连接
      this.reconnectAttempts = 0;
      // 在连接成功时停止当前的心跳检测并重新启动
      this.startHeartbeat();
      this.log(
        "WebSocket",
        `连接成功,等待服务端数据推送[onopen]...     ${this.url}`
      );
      this.dispatchEvent("open", event);
    };

    this.socket.onmessage = (event) => {
      this.dispatchEvent("message", event);
      this.startHeartbeat();
    };

    this.socket.onclose = (event) => {
      if (this.reconnectAttempts === 0) {
        this.log("WebSocket", `连接断开[onclose]...    ${this.url}`);
      }
      if (!this.stopWs) {
        this.handleReconnect();
      }
      this.dispatchEvent("close", event);
    };

    this.socket.onerror = (event) => {
      if (this.reconnectAttempts === 0) {
        this.log("WebSocket", `连接异常[onerror]...    ${this.url}`);
      }
      this.closeHeartbeat();
      this.dispatchEvent("error", event);
    };
  }

  // > 断网重连逻辑
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.log(
        "WebSocket",
        `尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})       ${this.url}`
      );
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      this.closeHeartbeat();
      this.log("WebSocket", `最大重连失败，终止重连: ${this.url}`);
    }
  }

  // >关闭连接
  public close(): void {
    if (this.socket) {
      this.stopWs = true;
      this.socket.close();
      this.socket = null;
      this.removeEventListener("open");
      this.removeEventListener("message");
      this.removeEventListener("close");
      this.removeEventListener("error");
    }
    this.closeHeartbeat();
  }

  // >开始心跳检测 -> 定时发送心跳消息
  private startHeartbeat(): void {
    if (this.stopWs) return;
    if (this.heartbeatTimer) {
      this.closeHeartbeat();
    }
    this.heartbeatTimer = setInterval(() => {
      if (this.socket) {
        this.socket.send(JSON.stringify({ type: "heartBeat", data: {} }));
        this.log("WebSocket", "送心跳数据...");
      } else {
        console.error("[WebSocket] 未连接");
      }
    }, this.heartbeatInterval);
  }

  // >关闭心跳
  private closeHeartbeat(): void {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }
}
```

## 总结

- WebSocket 是为了在 web 应用上进行双通道通信而产生的协议，相比于轮询 HTTP 请求的方式，WebSocket 有节省服务器资源，效率高等优点。
- WebSocket 中的掩码是为了防止早期版本中存在中间缓存污染攻击等问题而设置的，客户端向服务端发送数据需要掩码，服务端向客户端发送数据不需要掩码。
- WebSocket 中 Sec-WebSocket-Key 的生成算法是拼接服务端和客户端生成的字符串，进行 SHA1 哈希算法，再用 base64 编码。
- WebSocket 协议握手是依靠 HTTP 协议的，依靠于 HTTP 响应 101 进行协议升级转换。
