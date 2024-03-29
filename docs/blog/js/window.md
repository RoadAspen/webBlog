# Window 对象模型

> 浏览器 Window 对象代表而页面在浏览器中所具有的所有属性，主要包含以下属性。

| 属性           | 介绍                    | 用途                           |
| -------------- | ----------------------- | ------------------------------ |
| history        | 当前页面的历史记录      | 查看或修改用户浏览路径         |
| location       | 当前页面的 url          | 用于解析当前 url               |
| navigator      | 浏览器的属性            | 用于检测浏览器与操作系统的版本 |
| document       | 当前页面的 DOM 文档属性 | 操作 dom                       |
| screen         | 当前屏幕信息            | 获取用户屏幕可视区域及分辨率   |
| localStorage   | 本地存储，永久存储      | 存储验证及登录信息             |
| sessionStorage | 本地存储，会话存储      | 存储仅限当前页面的信息         |

## History

> Window.history 返回一个浏览器历史记录的引用。

| 属性    | 作用                                                        |
| ------- | ----------------------------------------------------------- |
| length  | 历史列表的长度                                              |
| back    | 后退一步                                                    |
| forword | 前进一步                                                    |
| go(n)   | n>0 前进 n 步，n<0,后退 n 步，n=0,false,null,undefiend 刷新 |
| state   | h5 新增，BrowserHistory APi                                 |

> state h5 新增，BrowserHistory APi

    1. pushState(data,title,url) 给浏览器历史记录添加一条新的历史记录，相同的历史记录也可以添加，这点和hash不同，添加之后浏览器并不会发生跳转，只是url地址发生了变化。url的主域名必须是当前
    2. replaceState(data,title,url) ，将浏览器当前记录替换为url，同样的，url地址会变化，但是页面不会发生跳转。
    3.当url地址改变时，不会触发propstate,也不会触发hashchange

## Location

> Window.location 返回当前 url 属性

| 属性     | 作用                                      |
| -------- | ----------------------------------------- |
| origin   | 完整的域名 协议+域名+端口                 |
| protocol | http 协议，http 或者 https                |
| host     | 域名+端口                                 |
| hostname | 域名                                      |
| port     | 端口名                                    |
| pathname | 当前路径                                  |
| search   | 参数，跟在?后边                           |
| hash     | hash 地址，跟在#后边，hash 路由的根本     |
| href     | url 全部 origin+port+pathname+hash+search |
| reload   | 刷新页面，参数(true)，绕过缓存刷新        |

> 1、可以直接修改 location.href 来改变当前 url，如果 origin 改变，name 页面也跟着改变，如果只是改变了 hash，其他不变，则页面不会改变。  
>  2、可以直接修改 location.hash 可以触发 hashchange。

## Navigator

> 浏览器的一些信息，如版本，语言，网络状态等。主要使用的有以下属性。

| 属性      | 作用                                                                   |
| --------- | ---------------------------------------------------------------------- |
| userAgent | 返回浏览器信息，包括系统标识符，处理器位数，呈现引擎，浏览器版本       |
| language  | 浏览器语言                                                             |
| languages | 浏览器支持的语言                                                       |
| onLine    | 浏览器的联网状态，使用 window.onOnLine 和 onOffLine 来监听联网状态改变 |

> 主要通过 userAgent 来判断浏览器版本，onLine 判断是否在线。

## document

> 当前文档文本对象，DOM 结构，操作 DOM，提供众多 DOM api。

## Screen

> 返回当前渲染窗口中和屏幕有关的属性。

| 属性        | 作用                                                 |
| ----------- | ---------------------------------------------------- |
| availWidth  | 当前设备的屏幕可用宽度，px                           |
| availHeight | 当前设备的屏幕可用高度，px                           |
| width       | 当前设备的屏幕实际宽度，px                           |
| height      | 当前设备的屏幕实际高度,px                            |
| pixelDepth  | 像素分辨率                                           |
| colorDepth  | 颜色分辨率（兼容性好于 pixelDepth），代替 pixelDepth |

## LocalStorage 和 SessionStorage

> 提供本地存储，相比于 cookie 的 4kb，storage 的大小为 5MB 以上，每个浏览器的实际大小不等，主要用于储存比较大一点的数据。

|          | Cookie                | LocalStorage           | SessionStorage       |
| -------- | --------------------- | ---------------------- | -------------------- |
| 大小     | 4kb                   | ≥5MB                   | ≥5MB                 |
| 有效时间 | 过期时间之前一直有效  | 除非主动删除，一直有效 | 关闭窗口后失效       |
| 更改     | 前后端都可写入 cookie | 前端 setItem 写入      | 前端 setItem 写入    |
| 后端交互 | 请求自动携带 cookie   | 前端主动添加           | 前端主动添加         |
| 作用域   | 设置 domain 路径      | 不同浏览器不能访问     | 不同页面不能访问     |
| 清除     | document.cookie = ""  | localStorage.clear     | sessionStorage.clear |
| 获取     | document.cookie       | getItem                | getItem              |
