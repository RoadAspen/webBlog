# Webpack 优化

## 问题

webpack 的大包构建过程中，有两个地方非常的好时间，一个是代码编译，二是
文件的分类打包构建。相较之下文件的编译更为耗时，而且在 Node 环境下文件只能一个一个去处理，因此这块的优化需要解决。

## 解决方案

这里引入的`HappyPack` 这样一个插件，在 webpack 构建过程中，我们需要使用 Loader 对 js，css，图片，字体等文件做转换操作，并且转换的文件数据量也是非常大的，且这些转换操作不能并发处理文件，而是需要一个个文件进行处理，HappyPack 的基本原理是将这部分任务分解到多个子进程中去并行处理，子进程处理完成后把结果发送到主进程中，从而减少总的构建时间。

## HappyPack

HappyPack 是让 webpack 对 loader 的执行过程，从单一进程形式扩展为多进程模式，也就是将任务分解给多个子进程去并发的执行，子进程处理完后再把结果发送给主进程。从而加速代码构建 与 DLL 动态链接库结合来使用更佳。

**使用规则：**

```js
const HappyPack = require("happypack");
const os = require("os");
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        // 将.js文件交给id为happyBabel的happypack实例来执行
        loader: "happypack/loader?id=jsusehappypack",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HappyPack({
      // id标识happypack处理那一类文件
      id: "jsusehappypack",
      // 配置loader
      loaders: [
        {
          loader: "babel-loader?cacheDirectory=true",
        },
      ],
      // 共享进程池
      threadPool: happyThreadPool,
      // 日志输出
      verbose: true,
    }),
  ],
};
```

## 总结

在基于 webpack 的配置构建中，构建流程上会先走到插件部分，HappyPack 插件会先因为 webpack 的 run 执行一系列的初始化，为后续的多线程执行做准备，这里的初始化包括：基础配置、线程初始化和编译缓存初始化。接下来走到 webpack 流程上的文件编译，此时会调用基础配置里的 happy/loader，此 loader 会通过参数的 id 遍历真实的插件数组，找到对应的 happyPlugin，通过 happyPlugin 的配置获取真实的 Loader 并通过之前初始化完成的多线程进行编译，将编译结果传递给主线程。编译完成后，插件还会针对编译的结果缓存，以及新编译的文件进行缓存的设置。

## 注意

webpack4 已经融合了多线程机制，因此 happypack 的作用不是很明显。如果你使用的版本是<4，那么还是可以继续使用 HappyPack。
