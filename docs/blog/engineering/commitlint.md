# CommitLint

## commitLint 是什么

在多人协作的背景下，git 仓库和 workflow 的作用很重要，对于 git commit message 的信息说明就要有一定的规范，否则每个人一个写法，就会显得特别的混乱。commitlint 作为一个 git 提交时用于检测 message 格式的 git hooks 插件，配合 husky 一起使用。

## 安装

### 安装 husky

husky 是一个 git hook 的管理工具。可以在 git 操作时触发相应的配置。

```js
npm install --save-dev husky
```

### 安装 commitLint

[commitlint](https://github.com/conventional-changelog/commitlint) 文档有很详细的说明。

```js
// 安装 commitlint
npm install --save-dev @commitlint/config-conventional @commitlint/cli
```

## 配置

1. 项目根目录创建 commitlint.config.js

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

这里表示继承了 `@commitlint/config-conventional` 的默认配置。

2. 在 package.json 中配置 husky

```js
 "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
```

通过 HUSKY_GIT_PARAMS 传递参数。在 commit-msg 阶段执行。

## 规则

### commit message

由三个部分组成， header，body，footer。
其中 header 必选， body，footer 是可选的。

```js
header;
--空一行;
body;
--空一行;
footer;
```

### header

header 的组成规则是：

```js
<type>:<subject>
```

type 表示本次操作的标识， subject 则是本次操作的具体描述,不能超过 50 个字符，且结尾不加英文句号

### type

1. `feat`：新功能（feature）提交
2. `fix`：修补 bug， 专门为了修改 bug
3. `docs`：文档（documentation）相关更改
4. `style`： 格式方面的优化， css 更改
5. `refactor`：重构代码，并没有新增新功能
6. `test`：新增测试文件
7. `chore`：构建过程或辅助工具的变化
