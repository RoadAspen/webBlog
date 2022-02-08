const blog = [
  {
    title: "JS",
    collapsable: true,
    children: [
      "js/手写系列",
      "js/promise",
      "js/hash",
      "js/history",
      "js/作用域",
      "js/预编译",
      "js/箭头函数",
      "js/闭包",
      "js/元编程",
      "js/原型",
      "js/迭代器",
      "js/EventLoop",
      "js/window",
      "js/位运算及权限设计",
      "js/内存管理",
    ],
  },
  {
    title: "HTTP",
    collapsable: true,
    children: [
      "http/计算机网络",
      "http/http",
      "http/http版本",
      "http/HTTP缓存",
    ],
  },
  {
    title: "Node",
    collapsable: true,
    children: [
      // 'node/自动加载全局路由',
      // 'node/全局异常处理',
      // 'node/使用Sequelize操作mySql',
      // 'node/集成jwt',
      // 'node/SSR',
      // 'node/BFF架构初探',
      // 'node/MPA架构初探',
      // 'node/PM2'
    ],
  },
  {
    title: "前端工程化",
    collapsable: true,
    children: [
      "engineering/node管理工具",
      "engineering/Mock方案",
      "engineering/commitLint",
      "engineering/git",
      "engineering/打造自己的脚手架",
      // 'engineering/脚手架的可视化操作',
      // 'engineering/Jenkins安装',
      // 'engineering/sonar简单使用'
    ],
  },
  {
    title: "性能优化",
    collapsable: true,
    children: [
      "optimization/浏览器输入网址",
      "optimization/html解析",
      "optimization/资源加载优先级",
      // 'optimization/网速检测',
      // 'optimization/资源阻塞',
      // 'optimization/渲染流程',
      // 'optimization/指标',
      // 'optimization/Chrome性能分析',
      // 'optimization/资源优化',
      // 'optimization/传输加载优化',
      // 'optimization/性能优化启示录',
      // 'optimization/Node性能调优',
      // 'optimization/MPA性能优化小试',
    ],
  },
  {
    title: "webpack",
    collapsable: true,
    children: [
      // 'webpack/webpack基础',
      // 'webpack/代码分割',
      // 'webpack/webpack打包',
      // 'webpack/源码解析一',
      // 'webpack/源码解析二',
      // 'webpack/源码解析三',
      // 'webpack/源码解析四',
      // 'webpack/源码解析五',
      // 'webpack/源码解析六',
      // 'webpack/源码分析总结',
      // 'webpack/手写Webpack',
      // 'webpack/webpack优化',
      // 'webpack/webpack5'
    ],
  },
  {
    title: "TS",
    collapsable: true,
    children: [
      "ts/基础知识",
      "ts/进阶",
      "ts/类与接口",
      "ts/装饰器",
      "ts/声明文件",
    ],
  },
  {
    title: "ReactNative",
    collapsable: true,
    children: ["reactnative/基础"],
  },
  {
    title: "Framework",
    collapsable: true,
    children: [
      "framework/redux",
      "framework/koa",
      // "framework/react-redux",
      // "framework/react-router",
      // "framework/hooks-redux",
    ],
  },
  {
    title: "前端安全",
    collapsable: true,
    children: ["safety/安全"],
  },
  {
    title: "运维相关",
    collapsable: true,
    children: ["operation/Docker部署前端项目"],
  },
  {
    title: "微前端",
    collapsable: true,
    children: ["microfrontends/qiankun"],
  },
  // {
  // 	title: "小程序原理",
  // 	collapsable: true,
  // },
];

// 算法
// const arithmetic = [
//   {
//     titie: "原理",
//     collapsable: true,
//     children: ["principle/skill"],
//   },
//   {
//     title: "递归",
//     collapsable: true,
//     children: ["recursion/递归"],
//   },
//   {
//     title: "栈",
//     collapsable: true,
//     children: ["stack/栈", "stack/进制转换", "stack/有效的括号"],
//   },
//   {
//     title: "队列",
//     collapsable: true,
//     children: ["queue/队列", "queue/练习"],
//   },
//   {
//     title: "链表",
//     collapsable: true,
//     children: ["linkedList/链表", "linkedList/套路"],
//   },
//   {
//     title: "字典和散列表",
//     collapsable: true,
//     children: ["dictionary/字典和散列表"],
//   },
//   {
//     title: "集合",
//     collapsable: true,
//     children: ["set/集合"],
//   },
//   {
//     title: "排序",
//     collapsable: true,
//     children: ["sort/排序和搜索"],
//   },
// ];

const react = [
  {
    title: "react实现",
    collapsable: true,
    children: [
      "react实现",
      "react优化",
      // 'ReactElement',
      // 'JSX',
      // 'ReactChildren',
      // "react-fiber",
      // "requestAnimationFrame",
      // "requestIdleCallback",
    ],
  },
  {
    title: "基础",
    collapsable: true,
    children: [
      "API",
      // 'ReactElement',
      // 'JSX',
      // 'ReactChildren',
      // "react-fiber",
      // "requestAnimationFrame",
      // "requestIdleCallback",
    ],
  },
  // {
  //     title: '创建更新',
  //     collapsable: true,
  //     children: [
  //         "Render",
  //         "update",
  //         "Fiber",
  //         "expirationTime",
  //         "updateQueue"
  //     ]
  // },
  // {
  //     title: '任务调度',
  //     collapsable: true,
  //     children: [
  //         'scheduleWork',
  //         '双缓存fiber树',
  //         'workLoopSync',
  //         'beginWork',
  //         'HostComponent',
  //         'ClassComponent',
  //         'completeUnitOfWork',
  //         'DOM创建',
  //         'finishSyncRender'
  //     ]
  // },
  // {
  //     title: '功能',
  //     collapsable: true,
  //     children: [
  //         "单节点Diff",
  //         "多节点Diff",
  //         "Context",
  //         "Ref",
  //         "memo",
  //         "setState",
  //         "合成事件",
  //         "SchedulerHostConfig.default",
  //     ]
  // },
  // {
  //     title: 'Hooks',
  //     collapsable: true,
  //     children: [
  //         "useState"
  //         "useEffect",
  //         "useMemo",
  //         "useCallback",
  //     ]
  // }
];
// 阅读
const book = [
  {
    title: "国内",
    collapsable: true,
    children: ["domestic/活着", "domestic/许三观卖血记", "domestic/平凡的世界"],
  },
  {
    title: "国外",
    collapsable: true,
    children: ["foreign/百年孤独", "foreign/当我谈跑步时我谈些什么"],
  },
];

// 菜谱
const cookbook = [
  {
    title: "热菜",
    collapsable: true,
    children: [
      "hot/大盘鸡",
      "hot/蚝油生菜",
      "hot/清炒油麦菜",
      "hot/西葫芦炒蛋",
    ],
  },
  {
    title: "煎炸",
    collapsable: true,
    children: ["frying/香煎多春鱼"],
  },
  {
    title: "凉菜",
    collapsable: true,
    children: ["cool/凉拌黄瓜"],
  },
  {
    title: "汤",
    collapsable: true,
    children: [
      "soup/排骨汤",
      "soup/西红柿鸡蛋汤",
      "soup/鲫鱼豆腐汤",
      "soup/酒酿圆子",
      "soup/南瓜粥",
      "soup/小米南瓜粥",
    ],
  },
];

module.exports = {
  "/blog/": blog,
  // "/arithmetic/": arithmetic,
  "/react/": react,
  "/book/": book,
  "/cookbook/": cookbook,
};
