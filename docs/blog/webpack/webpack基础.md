# Webpack 基础

本质上，webpack 是一个现代 JavaScript 应用程序的静态模块打包工具。当 webpack 处理应用程序时，它会在内部构建一个 依赖图(dependency graph)，此依赖图会映射项目所需的每个模块，并生成一个或多个 bundle。

本文基于 webpack4.x ，相关 loader 和 plugin 的版本都以贴出。

## webpack-cli 是什么？

webpack-cli 可以让我们以命令的形式执行 webpack 命令。

## 基本使用

### 安装 webpack

```sh
yarn add webpack webpack-cli -D
```

### 初步打包文件

- 在项目文件夹下新建`src`文件夹，并在 src 里边新建`index.js`文件。webpack 默认将 src/index.js 作为入口文件。
- 在根目录创建 dist 文件夹，并在其中创建一个 index.html 文件。

在 index.js 文件中随便创建一些代码

```js
function component() {
  let element = document.createElement("div");

  element.innerHTML = "Hello Webpack";

  document.body.appendChild(element);
}
component();
```

在 index.html 中引入将要打包生成的 main.js 文件。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Webpack基础</title>
  </head>
  <body>
    <script src="./main.js"></script>
  </body>
</html>
```

## 执行打包

```sh
npx webpack
```

执行`npx webpack`，以 src/index.js 作为入口起点，然后输出为 `main.js` 。 npx 可以运行初始化安装的 node_modules/.bin/webpack 二进制文件。

此时在 dist 文件夹中会出现一个 main.js 文件，在浏览器中打开 index html 文件，将会在页面上看到 **Hello Webpack**

### 配置文件

> webpack 会根据项目的配置文件作出相应的打包功能。

在根目录新建一个 `webpack.config.js`文件。

```js
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
```

通过指定 config 文件的方式重新构建：

```sh
// --config 是webpack用来指定config文件的参数
npx webpack --config webpack.config.js
```

## NPM 脚本

我们一直是使用 webpack cli 的方式使用 webpack 打包，如果后期需要加入一些其他配置，会导致命令越来月复杂，所以我们可以采用另外一种方式。 package.json 中存在可以预设命令的方式,即 scripts 命令。

package.json

```js
...
"scripts": {
"test": "echo \"Error: no test specified\" && exit 1",
"start": "cross-env  webpack-dev-server --progress --hot --color",
"build": "webpack --config webpack.config.js --progress --color"
}
...
```

这样我们就可以使用很简洁的命令去执行打包构建：

```sh
npm run build
```

构建结果和直接使用 webpack 命令是一致的。

## Loader 是什么

> 官方解释： loader 用于对模块的源代码进行转换。loader 可以使你在 `import`或加载模块时预处理文件。因此，loader 类似于其他构建工具中的 “任务（task）”，并提供了前端构建步骤的强大方法。loader 可以将文件从不同的语言（如 typescript）转换为 javascript 或将内联图像转换为 data URL。 loader 甚至允许你直接在 javascript 模块中 import css 文件。

webpack 默认只打包 js 文件， 如果我们需要打包其他文件，如 ts、css、sass、jsx、vue、图片等，就需要借助相应的 loader。 需要在 webpack.config.j 的 module.rule 中去添加相关的 loader 及配置。同一个文件类型有多个 loader，那么执行顺序是从右到左、从下到上。前一个 loader 执行的输出会作为下一个 loader 的输入。

### 打包 CSS 文件

如果我们想在 js 文件中引入 css 文件，那么就要添加 css 文件对应的 loader。

```sh
yarn add style-loader css-loader -D
```

webpack.config.js

```js
module.exports = {
    ...
    module: {
        rules: [
        {
            test: /\.css/,
            use: ["style-loader", "css-loader"],
        },
        ],
    },
    ...
}
```

**webpack 根据正则表达式去匹配文件名称，并将其提供给指定的 loader，文件名符合 /\.css/ 规则的文件，都会被提供给 style-loader 和 css-loader。**

这样你就可以在 js 文件中 import 你的 css 文件。当构建代码时，你的 css 文件会被 loader 执行输出 style 标签的字符串，最后插入到 html 中的 head 标签中。

在 src 文件夹内新增 index.css 文件。

```css
body {
  color: red;
}
```

在 index.js 中引入

```js
import "./index.css";
```

现在运行构建命令：

```sh
npm run build
```

刷新浏览器，就会看到 Hello World 的颜色变成了红色。查看页面的 head 中也添加了 style 元素。  
**style-loaders**的作用
style-loader 它的原理其实就是通过一个 JS 脚本创建一个 style 标签，里面会包含一些样式。并且它是不能单独使用的，因为它并不负责解析 css 之前的依赖关系。

- 单独使用 css-loader 只能保证我们能把 css 模块加载进来，但是没有效果。
- style-loader 会创建一个 style 标签，并把 css-loader 解析出的 css 样式放在 style 标签中。
- 每当多引入一个 css 模块，就会多生成一个 style 标签。

新建一个 index2.css 文件,在 js 文件引入

```css
body {
  color: blue;
}
```

重新 npm run build 并刷新页面。

head 中生成了两个 style 标签，且插入的顺序和 js 中导入的顺序一致。页面的文字呈现 蓝色。

### 使用 sass

SASS（英文全称：Syntactically Awesome Stylesheets）Sass 诞生于 2007 年，使用 Ruby 编写，是一种对 css 的一种扩展提升，增加了规则、变量、混入、选择器、继承等等特性。可以理解为用 js 的方式去书写，然后编译成 css。比如说，sass 中可以把反复使用的 css 属性值定义成变量，然后通过变量名来引用它们，而无需重复书写这一属性值。

首先安装插件

```sh
yarn add sass-loader sass -D
```

这里不使用 node-sass ，而使用 Dart Sass 的原因，[官方推荐 Dart Sass](https://webpack.docschina.org/loaders/sass-loader/)：

1. 在国内使用 node-sass， 在 npm 安装的时候大概率会遇到安装出错、下载时间过长等问题。
2. node-sass 已经停止更新。
3. dart-sass 被 sass 官方指定为未来主要的开发方向，已经被编译为纯 js，极大的减少了安装成本。

在 webpack.config.js 中添加 sass 配置

```js
module.exports={
    ...
    module: {
        rules: [
        {
            test: /\.css/,
            use: ["style-loader", "css-loader"],
        },
        {
            test: /\.scss/,
            use: ["style-loader", "css-loader", "sass-loader"],
        },
        ],
    },
    ...
}
```

新增 index.scss

```scss
body {
  div {
    color: aquamarine;
  }
}
```

在 index.js 中引入 index.scss 文件，然后重新构建，刷新浏览器之后，head 中出现第三个 style 文件，并且文字颜色变为 aquamarine 色。

### 使用 postcss-loader

postcss-loader 中的 **autoprefix**插件，可以帮助我们自动给 css 属性添加兼容前缀（如： -webkit-，-ms-，-o-）;

安装 postcss-loader,由于 postcss-loader 需要 autoprefixer 插件，因此我们还需要安装 autoprefixer 插件：

```sh
yarn add postcss-loader autoprefixer -D
```

webpack.config.js

```js
module.exports = {
  ...
  module: {
    rules: [
      {
        test: /\.css/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.scss/,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
      },
    ],
  },
  ...
};
```

在根目录下新增 postcss.config.js

```js
module.exports = {
  plugins: [require("autoprefixer")],
};
```

在 package.json 中新增一下配置

```js
"browserslist": [
    "defaults",
    "not ie <= 8",
    "last 2 versions",
    "> 1%",
    "iOS >= 7",
    "Android >= 4.0"
  ]
```

设置支持哪些浏览器，必须设置支持的浏览器才会自动添加浏览器兼容。再次执行打包 发现有的样式前面加入了前缀。

### @import

有时候我们会用@import 在 css 文件中引入其他的 css 文件。

```css
@import "./index.css";
```

css-loader 配置 @import 的文件在 css-loader 之前有多少个 loader。

```js
{
    test: /\.scss$/,
    use: [
        'style-loader',
        {
            loader: 'css-loader',
            options: {
                importLoaders: 2
            }
        },
        'sass-loader',
        'postcss-loader'
    ]
},
```

不配置的话可能会导致 @import 的资源不会被正确的加载,默认为 0

### file-loader 和 url-loader

#### file-loader

使用 file-loader 可以让我们在 js 和 css 中引入一些静态资源，如图片、字体文件等。
打包完之后会把资源放在 dist 目录下并返回**打包完后的名称以及文件地址**。  
在 index.css 中添加：

```css
body {
  background: url("./image/my-image.jpg");
  color: blue;
}
```

安装 file-loader

```sh
yarn add file-loader -D
```

webpack.config.js

```js
module.exports={
  ...
  module: {
    rules: [
      ...
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: ["file-loader"],
      },
      ...
    ]
  }
  ...
}
```

重新打包之后，刷新页面会发现图片已经加载进来，且路径被重新更改成打包后的路径, 打包后的文件名是**MD5 哈希值**。

```css
background: url("a345e481a5b4c985c2cd621fdb44a2f8.jpg");
```

我们也可以使用 import ImgSrc from './image/my-image.jpg' 来引入

```js
import ImgSrc from "./image/my-image.jpg";
const myImage = new Image();
myImage.src = ImgSrc;
element.appendChild(myImage);
```

重新打包、刷新页面，在 html 中出现标签。

```html
<img src="a345e481a5b4c985c2cd621fdb44a2f8.jpg" />
```

现在我们打包之后的图片和 js 文件都在一个文件夹下，后期随着图片数量增加会越来越难以管理，所以 file-loader 可以通过配置将所有的图片打包到统一的文件夹下。
webpack.config.js

```js
module.exports = {
  ...
  module:{
    rule:[
      ...
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              // name 图片原始名字， hash 值， ext 后缀
              name: "[name].[hash].[ext]",
              // 全部存在 images 文件夹
              outputPath: "images/",
            },
          },
        ],
      },
      ...
    ]
  }
  ...
}
```

再打包，dist 文件夹里会多出一个 images 文件夹，且图片名称也会变成我们定义的样子。

#### url-loader

url-loader 是基于 file-loader 封装的更高一层的 loader，它不仅可以实现 file-loader 的功能，还可以将一些大小很小的图片转换为 base64 编码，从而减少文件体积。

```sh
yarn add url-loader -D
```

webpack.config.js

```js
module.exports={
  ...
  module: {
    rules: [
      ...
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: [
          {
            loader:"url-loader",
            options: {
              // name 图片原始名字， hash 值， ext 后缀
              name: "[name].[hash].[ext]",
              // 全部存在 images 文件夹
              outputPath: "images/",
              // 文件大小小于8192字节的图片会被编译为bash64编码。
              // <img src="data:image/jpeg;base64,/....."/>
              limit: 8192
            }
          }
        ],
      },
      ...
    ]
  }
  ...
}
```

照一张大小小于 8192 B 的图片，打包之后会发现，在 images 文件夹里没有打包后的图片，css 和 html 中的图片地址都变成了 base64 格式的图片,直接嵌入到了 html 中，不会从外部加载。

#### 加载字体

加载字体和加载图片一样，使用 file-loader。

```js
{
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    use: [
        {loader:'file-loader',options:{outputPath:"fonts/"}}
    ]
}
```

我们可以就可以通过 @font-face 来加载字体。

## 管理输出

webpack 的 **entry** 和 **output** 允许你有多个输入和输出。

### entry

默认入口是`main.js`,也可以是一个对象，引入多个文件：

```js
entry:{
  app:'/src/app.js',
  sub:'./src/sub.js'
}
```

### output

output 是定义编译出口的文件规则。
默认打包名称是`main.js`, 可以通过[name].js 对应的名称规则

```js
output: {
  // 文件名称增加 hash 值。
  filename: "[name].[hash].js",
  // path 是编译文件输出的目录,打包是绝对路径。
  path:path.resolve(__dirname,'dist/static/'),
  // 如果我们想在静态资源CDN上访问，那么可以设置 publicPath， publicPath + path + filename 会作为文件路径添加到html中。
  publicPath:"https:// xxx-cdn/"
}
```

### 基本配置

在 src 文件夹下新增 print.js,并在 index.js 中引入。
webpack.config.js

```js
module.exports = {
  entry: {
    app: "./src/index.js",
    print: "./src/print.js",
  },
  output: {
    // 输出的跟文件夹
    path: path.resolve(__dirname, "dist"),
    // 子文件夹
    filename: "static/[name].js",
    // 生成链接的前缀， 开发模式一般设置为当前文件夹， 生产模式可以设置为cdn路径
    publicPath: "./",
  },
};
```

两个入口就会打包出两个 js 文件。

**output**

1. path 是存放所有打包文件的基础文件夹。
2. filename 是基于 path 之后的子路径。
3. publicPath 是在文件链接到 html 文件时的路径之前添加的。

## SourceMap

### 问题

现在大部分的源码都需要打包压缩之后才能投入生产环境，而当源码转换之后，使得生产环境的代码和开发代码在视觉感官上有很大的不同，在 debug 的时候变得完全无法看懂，函数名、变量名等会完全修改为其他的字母而失去了原来的语义化。

### 解决 debug 问题

SourceMap 文件就是用来解决这个问题的， 用官方的话来说，就是**保存源代码映射关系的文件**。简单来说就是一个信息文件，一个独立的 map 文件，里边存储着位置信息，转换后的代码的每一个位置，所对应的转换前的位置。有了 sourcemap，在 debug 的时候，显示的就不是转换后的代码，而是转换前的代码。
**如何使用 sourcemap**

1. 生成 sourcemap 文件（这个网上有很多的工具）。
2. 在转换后的代码尾部，加上一行代码。

```js
//# sourceMappingURL=index.js.map
```

3. **在 chrome 的 F12 中点击设置，把 Enable JavaScript source maps 钩上就完事了**。

### webpack 配置 sourcemap

webpack 提供 sourceMap 的支持。指定 devtool 时，要和 mode 配合使用。
webpack.config.js

```js
module.exports = {
  ...
  mode:'development',
  devtool:'source-map'
  ...
}
```

devtool 有很多种配置，和构建速度、源码类型、代码环境有关，这个具体[可以参考](https://juejin.cn/post/6844904201311485966)。  
**开发环境推荐：eval-cheap-module-source-map**  
**生产环境推荐：nosources-source-map**

## Plugin

### plugin 是什么

在 webpack 运行时有许多的生命周期，运行到这些生命周期时，webpack 会发出通知，plugin 可以监听这些事件，在合适的时机通过 webpack 的 api 改变输出的结果。它并不直接操作文件，而是基于事件机制工作，监听 webpack 节点，执行相应的任务。

### HtmlWebpackPlugin

html-webpack-plugin 默认将会在 output.path 的目录下创建一个 index.html 文件， 并在这个文件中插入一个 script 标签，标签的 src 为 output.filename。

```sh
yarn add html-webpack-plugin -D
```

webpack.config.js

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports={
  ...
 plugins: [
    new HtmlWebpackPlugin({
      filename: "./index.html",
    }),
  ],
  ...
}
```

删除 dist 的 html 文件重新打包，发现重新生成了 index.html,并把 app.js 和 print.js 引入进去。

## webpack-dev-server

webpack-dev-server 是 基于 express 开发的一款用于本地开发调试的一款工具，可以直接在 webpack config 中配置，支持 重定向、热更新等。

安装 webpack-dev-server

```sh
yarn add webpack-dev-server -D
```

webpack.config.js

```js
module.exports = {
  ...
  devServer:{
    // 静态资源文件夹
    contentBase: './dist',
    // 是否自动打开浏览器
    open:true,
    // 监听端口
    port:8080,
    // 允许跨域访问，重定向
    proxy:{
      '/api':"http://localhost:8080"
    }
  }
  ...
}
```

package.json

```
scripts:{
  ...
  start: webpack-dev-server --config webpack.config.js
  ...
}
```

启动开发环境

```sh
yarn start
```

会自动打开浏览器并访问 localhost:8080 端口，此时我们就能看到和之前一样的页面了。

### 热更新

启动热更新之后，它允许在运行时替换、添加、删除各种模块，而无需刷新整个页面。

1. 保留在完全重新加载页面时丢失的应用程序的状态。
2. 只更新改变的内容，以节省开发时间。
3. 调整样式更加快速，几乎等同于就在浏览器调试器中更改样式

```js
devServer:{
    hot:true,
    hotOnly:true
}
```

添加插件

```sh
plugins:[
    ...
    new webpack.HotModuleReplacementPlugin()
]
```

在 js 入口文件中添加更改。

```js
if (module.hot) {
  module.hot.accept("./sub", (sub) => {
    sub();
  });
}
```

### 页面刷新 404

#### 问题

当前我们用的最多的就是 history 路由，和 hash 路由相比，没有了#限制，就像是后端路由一样使用，但是刷新的时候也会当做真实的后端路由去访问导致返回了 404。

#### 解决方法

新增 historyApiFallback 配置，指定 url 返回哪些内容。

```js
devServer: {
  // 默认全部返回 index.html
  historyApiFallback: true,
  // 更加细粒度的控制
  historyApiFallback:{
    rewrites: [
      { from: /^\/$/, to: '/views/landing.html' },
      { from: /^\/subpage/, to: '/views/subpage.html' },
      { from: /./, to: '/views/404.html' }
    ]
  }
}
```

## Babel

Babel 是当前前端开发中必不可少的一个工具，有了它，我们可以在项目中任意的使用 js 新语法新技术。

安装 babel

```sh
yarn add babel-loader @babel/core @babel/preset-env -D
```

安装 babel-polyfill, 兼容低版本浏览器语法

```sh
yarn add @babel/polyfill
```

在项目入口文件引入 polyfill

```js
import "@babel/polyfill";
```

webpack.config.js

```js
rule:[
  ...
  {
    test:/\.js$/,
    // 排除文件
    exclude:/node_modules/,
    use: [{ loader: "babel-loader" }],
  }
  ...
]
```

此时打包出来的 app.js 的体积是 92kB，但是我们明显只写了几行代码，为什么会这么大的体积呢？是因为我们把@babel/polyfill 这个包的所有代码都打包进去了。

### polyfill 优化

webpack.config.js

```js
rule:[
  ...
  {
    test:/\.js$/,
    // 排除文件
    exclude:/node_modules/,
    use:[
      {
        loader: "babel-loader",
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                useBuiltIns: "usage",
                 "targets": {
                    "edge": "17",
                    "firefox": "60",
                    "chrome": "67",
                    "safari": "11.1",
                  }
              },
            ],
          ],
        },
      },
    ],
  }
  ...
]
```

此时再打包，发现 app.js 就只有 6KB，体积缩小了 90%。这种配置方法只会加载使用到的 polyfill。还可以设置浏览器的兼容版本。

```js
{
  ...
  loader: "babel-loader",
  options: {
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: "usage",
            "targets": {
              "edge": "17",
              "firefox": "60",
              "chrome": "67",
              "safari": "11.1",
            }
        },
      ],
    ],
  },
  ...
}
```

@babel-polyfill 的引入会对我们的全局环境污染，对我们开发组件库或者第三方库有影响，因此我们可以换一种方式实现。

### babel polyfill 的三种实现

#### babel-runtime

将 es6 编译成 es5 去运行，前端可以使用 es6 的语法来写，最终浏览器上运行的是 es5, 不会污染全局对象和内置的对象原型。比如当前运行环境不支持 promise，可以通过引入 babel-runtime/core-js/promise 来获取 promise，或者通过 babel-plugin-transform-runtime 自动重写你的 promise

#### babel-plugin-transform-runtime

自动添加 babel-runtime/core-js 并且映射 ES6 静态方法和内置方法,不会污染全局，对于库来说很实用。 一定要把 babel-runtime 作为依赖引入!

### babel-polyfill

通过向全局对象和内置对象的 prototype 上添加方法来实现,他的原理是当运行环境中并没有实现的一些方法，babel-polyfill 中会给做兼容

安装

```sh
yarn add -D @babel/plugin-transform-runtime
yarn add @babel/runtime
yarn add @babel/runtime-corejs2
```

webpack.config.js

```js
{
  test: /\.js$/,
  exclude: /node_modules/,
  loader: "babel-loader",
  options: {
      "plugins": [
          [
              "@babel/plugin-transform-runtime",
              {
                  "absoluteRuntime": false,
                  "corejs": false,
                  "helpers": true,
                  "regenerator": true,
                  "useESModules": false,
                  "version": "7.0.0-beta.0"
              }
          ]
      ]
  }
}
```

### 总结

- 项目业务代码直接 使用 @babel/preset-env 和 useBuiltIns
- 写组件库或者第三方组件 polyfill 会影响全局,因此使用@babel/plugin-transform-runtime
- 配置中 corejs 设置为 2 使用最新 API

## Tree Shaking

如果我们引入一个 JS 文件,但是只用了里面某些方法,但是打包依旧会把整个文件打包,因此 webpack 引入了 Tree Shaking,只会打包我们使用到的 文件。  
Tree Shaking 只支持 ES Module,也就是 import 静态引入方式,不支持 CommonJS 动态引入方式

### development 配置

```js
optimization: {
  usedExports: true;
}
```

### side-effect-free

通过 设置 pack.json 的 sideEffects 可以告诉 webpack 那些需要 进行 tree-shaking

```json
sideEffects: true;
```

- true 所有文件都有副作用,全部不可 tree-shaking
- false 文件没有副作用,全都可以 tree-shaking

也可以设置那些文件需要 如下:

```json
sideEffects: ["../src/index.js", "*.css"];
```

意思就是我们 src.index.js 和所有 important 引入的 CSS 都不用 tree-shaking.

在 `production` 中 webpack 自动进行 `Tree-Shaking`.
