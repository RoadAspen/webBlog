# Eslint 插件开发

## Eslint 是什么

是用来代码中识别和报告模式匹配的工具，它的目标是保证代码的一致性和避免错误，特别是多人开发时，每个人的开发习惯都不一样，为了保持代码的统一性，使用 eslint 就变得很重要。

## Eslint 提供什么

- 提供编码规范
- 提供自动检验代码的程序，并打印结果-告诉你哪一个文件、哪一行代码不符合规范。

## Eslint 使用

Eslint 是根据项目中的.eslint.js 或者 .eslintrc 文件配置去 检测代码。

```js
// 安装Eslint
npm install eslint -g
//初始化
eslint --init
```

** Eslint 配置**

```js
module.exports = {
  extends: ["alloy", "alloy/react", "alloy/typescript"],
  plugins: ["react-hooks", "import", "prefer-arrow"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "max-lines": ["warn", 140],
    "max-lines-per-function": ["warn", 120],
    "import/no-default-export": "error",
    "import/no-extraneous-dependencies": "error",
    "prefer-arrow/prefer-arrow-functions": [
      "warn",
      {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false,
      },
    ],
    "max-params": "warn",
    "no-unreachable": "warn",
    "no-console": "warn",
  },
  settings: { react: { version: "detect" } },
};
```

## ESLint 的运行原理

1. ESLint 使用 JavaScript 解析器 `Espree` 把 JS 代码解析成 AST。
   解析器：是将代码解析成 AST 的工具，ES6、react、vue 都开发了对应的解析器。
2. 深度遍历 AST，监听匹配过程。 AST 解析
3. 触发监听选择器的 `rule` 回调。
4. ESLint 是完全插件化的。每一个规则都是一个插件并且你可以在运行时添加更多的规则。

## Eslint 插件开发

1. ESLint 官方为了方便开发者开发插件，提供了使用 `Yeoman` 模板(`generator-eslint`)。`Yeoman` 是一个脚手架工具，它可以迅速的搭建一个新项目，并且能够简化了现有项目的维护。 `generator-eslint` 是 eslint 官方出产的脚手架，用于快速构建 eslint 的相关文件。

```js
npm install -g yo generator-eslint
```

2. 本地初始化 eslint 插件。

```js
// 创建文件夹
mkdir eslint-plugin-tezign && cd eslint-plugin-tezign

// 搭建一个初始化的目录结构,标识这是一个插件
yo eslint:plugin

// 根据提示
? What is your name? niuziyang
? What is the plugin ID? eslint-plugin-tezign // 这个插件的 ID 是什么
? Type a short description of this plugin: XX 公司的定制 ESLint rule // 输入这个插件的描述
? Does this plugin contain custom ESLint rules? Yes // 这个插件包含自定义 ESLint 规则吗?
? Does this plugin contain one or more processors? No // 这个插件包含一个或多个处理器吗
// 处理器用于处理 js 以外的文件 比如.vue 文件
create package.json
create lib/index.js
create README.md

yarn // 安装依赖包
```

此时的项目目录

```js
├── README.md
├── lib // 规则
│ ├── index.js
│ └── rules
├── package.json
└── tests // 测试
└── lib
└── rules
```

3. 创建规则

```js
yo eslint:rule // 生成默认 eslint rule 模版文件

? What is your name? niuizyang
? Where will this rule be published? (Use arrow keys) // 这个规则将在哪里发布？
❯ ESLint Core // 官方核心规则 (目前有 200 多个规则)
ESLint Plugin // 选择 ESLint 插件
? What is the rule ID? no-hardcode-domain // 规则的 ID
? Type a short description of this rule: 不允许出现域名相关 // 输入该规则的描述
? Type a short example of the code that will fail: 占位 // 输入一个失败例子的代码
create docs/rules/no-hardcode-domain.md
create lib/rules/no-hardcode-domain.js
create tests/lib/rules/no-hardcode-domain.js
```

此时的项目目录

## 编写规则

eslint-plugin-tezign/lib/rules/no-hardcode-domain.js

```js
/**
 * @owner niuziyang
 * @team M1
 * @fileoverview 不允许硬编码业务域名
 */
"use strict";

module.exports = {
  meta: {
    // 告警类型
    type: "suggestion", // `problem`, `suggestion`, or `layout`
    // 文档
    docs: {
      description: "不允许硬编码业务域名",
    },
    // 修复代码
    fixable: null,
  },
  // core， 提示规则
  create(context) {
    function checkDomain(node) {
      // 匹配硬编码的业务域名的正则
      const Reg = /((ht|f)tp(s?):\/\/)[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-.?,'/\\+&amp;%$#_]*)?/;
      const content =
        (node.type === "Literal" && node.value) ||
        (node.type === "TemplateLiteral" && node.quasis[0].value.cooked);

      if (Reg.test(content)) {
        context.report({
          node,
          // 错误/警告提示信息
          message: "不允许硬编码业务域名",
        });
      }
    }

    return {
      // 返回事件勾子
      Literal: checkDomain,
      // 模版字符串
      TemplateLiteral: checkDomain,
    };
  },
};
```

## 编写测试规则

```js
/**
 * @owner niuziyang
 * @team M1
 * @fileoverview 不允许硬编码业务域名
 */
"use strict";

const rule = require("../../../lib/rules/no-hardcode-domain"),
  RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();
ruleTester.run("no-hardcode-domain", rule, {
  valid: [
    "bar",
    "baz",
    `
    var s = {
      x: "zcygov"
    };
    `,
    "console.log(ssadada)",
  ],
  invalid: [
    {
      code: `
                var s = "http://tezign.com"
              `,
      errors: [
        {
          message: "不允许硬编码业务域名",
        },
      ],
    },
    {
      code: `
              var s = {
                x: "http://bidding.zcygov.cn"
              };
              `,
      errors: [
        {
          message: "不允许硬编码业务域名",
        },
      ],
    },
    {
      code: 'console.log("https://baidu.com")',
      errors: [
        {
          message: "不允许硬编码业务域名",
        },
      ],
    },
  ],
});
```

## 开始规则

```js
npm run test
```

只有等待 test 测试用例全部通过后才能发布。

## 插件发布

先登录自己的 npm 账号，使用 npm publish 发布

```js
npm publish
```

**引入 eslint-plugin-tezign**

```js
npm install eslint-plugin-tezign
```

添加到 Eslint 配置
