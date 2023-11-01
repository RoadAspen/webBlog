# pnpm

## 前言

最近听到的关于新型 node 包管理器 pnpm 的讨论声音很多，在这里去了解了一下 pnpm 有哪些优缺点 以及和 npm、yarn 之间的区别

## npm

npm 是 node 自带的包管理器，跟随 node 版本一起升级至今，主要经历了几个时期：

### npm 2.x

npm 2.x 版本的时候，假如我安装了 express，使用 npm install，就会将 express 包和它的依赖都会被下载到 node_modules 中，而 express 包的 node_modules 又包含了 express 的依赖，同理，每个依赖又都有自己的 node_modules，这就说明 npm2 的 node_modules 是嵌套的，这就有很多问题：

1. 多个包之间的公共依赖会被复制很多次，占据比较大的磁盘空间
2. 多层嵌套会导致很长的引用路径，在 windows 的文件路径最长的是 260 个字符，超出限制。于是社区就出来了新的处理方案`yarn`

## yarn

yarn 的出现就是为了解决 npm 的依赖重复、嵌套路经过长的问题。用的方法是**铺平**， 通过 yarn 安装 express，会将所有的公共依赖全部铺平到项目当前的 node_modules 目录，但还是存在部分的嵌套。

**为什么还是有嵌套？**
因为一个依赖包可能同时有多个被依赖版本，yarn 只是把第一个依赖的版本提升到顶层 node_modules 了，后边的不同版本还是会用嵌套的方式， npm 在升级到 3 版本的时候，也采用了 铺平的方案，和 yarn 类似。

**增加了 lock 文件**
yarn 还实现了 `yarn.lock` 文件来锁定依赖版本，后来 npm 也实现了。

**扁平化有什么问题？**
npm 和 yarn 都采用了扁平化的方案，那这种方案解决了依赖重复 copy 的问题，它有什么缺点吗？答案是有，**幽灵依赖**

**幽灵依赖**

什么是幽灵依赖？扁平化方案带来了一个问题，明明我的项目里没有引用到的 xx 包，没有在 dependencies 引入，但是我在项目中却可以引用到。这个很好理解，因为你的依赖 a 包里依赖了 xx 包，而扁平化又将 xx 包提升到了和你的依赖 a 同级，这样你就可以从项目中引用到。这样就存在一个问题，因为你并没有显式的引入 xx 依赖包（package.json 中不存在），那么如果有一天 依赖包 a 不再依赖 xx 的时候，你项目中依赖的 xx 包就不会再被 yarn 安装了，就会报错。这就是`幽灵依赖`.

## pnpm

yarn 和 npm 采用扁平化方案的原因都是为了解决依赖包复制多次的问题，但是也引出了新的问题。那如果我们不复制，比如设置 link？

### link

link 是什么 ，就是软硬链接，这是操作系统提供的机制，**硬连接**就是同一个文件的不同引用，**软连接**就是新建一个文件，文件内容指向另一个文件，删除软连接不会影响到源文件。在使用方面二者没有区别。

### 新思路

如果不复制文件，只在全部保存一个 npm 包，其他的地方都 link 过去呢？
这样就不会有复制多次的磁盘空间浪费，而且也不会有路径过长的问题，因为路径过长的限制本质是不能有太深的目录层级，现在都是各个位置的目录的 link，并不是同一个目录，所以也不会有长度限制。这就是 pnpm 的思路

```sh
pnpm install
```

安装后的 node_modules 中新增了一个 `.pnpm`的文件夹，里边是铺平的依赖，同一个包的不同的版本会采用不同的`@version`，node_modules 中的其他依赖包里的 node_modules 都是指向`.pnpm` 的硬连接，所有的依赖都是从全局 store 硬连接到了 node_modules/.pnpm 下，然后之间通过软链接来相互依赖。

## 总结

- npm2 是通过嵌套的方式管理 node_modules 的，会有同样的依赖复制多次的问题。
- npm3+ 和 yarn 是通过铺平的扁平化的方式来管理 node_modules，解决了嵌套方式的部分问题，但是引入了幽灵依赖的问题，并且同名的包只会提升一个版本的，其余的版本依然会复制多次。
- pnpm 则是用了另一种方式，不再是复制了，而是都从全局 store 硬连接到 node_modules/.pnpm，然后之间通过软链接来组织依赖关系。这样不但节省磁盘空间，也没有幽灵依赖问题，安装速度还快，从机制上来说完胜 npm 和 yarn。

## 扩展

利用 pnpm + learn，可以快速创建一个 Monorepo 代码管理方案。