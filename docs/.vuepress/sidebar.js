const blog = [
  {
    title: "JS",
    collapsable: true,
    children: [
      "js/手写系列",
      "js/promise",
      "js/hash",
      "js/history",
      "js/预编译",
      "js/this",
      "js/原型和原型链",
      "js/作用域",
      "js/箭头函数",
      "js/闭包",
      "js/内存管理",
      "js/元编程",
      "js/跨域",
      "js/迭代器",
      "js/EventLoop",
      "js/window",
      "js/位运算及权限设计",
      "js/自定义事件",
      "js/拖拽",
    ],
  },
  {
    title: "HTTP",
    collapsable: true,
    children: ["http/计算机网络", "http/http", "http/http缓存"],
  },
  {
    title: "Node",
    collapsable: true,
    children: [
      "node/koa",
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
      "engineering/前端代码开发规范",
      "engineering/node管理工具",
      "engineering/Mock方案",
      "engineering/git",
      "engineering/commitlint",
      "engineering/打造自己的脚手架",
      "engineering/Eslint插件开发",
      "engineering/rollup",
      "engineering/glup",
      "engineering/monorepo",
      "engineering/pnpm",
    ],
  },
  {
    title: "性能优化",
    collapsable: true,
    children: [
      "optimization/浏览器输入网址",
      "optimization/浏览器解析html",
      "optimization/资源加载优先级",
      "optimization/浏览器缓存策略",
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
      "webpack/webpack基础",
      "webpack/代码分割",
      "webpack/happyPack",
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
      "ts/interface和class的区别",
      "ts/interface和type的区别",
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
      "framework/react-redux",
      "framework/redux",
      "framework/immer",
      "framework/recoil",
      "framework/mobx",
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
  {
    title: "设计模式",
    collapsable: true,
    children: ["设计模式/单例模式", "设计模式/工厂模式"],
  },
];
// 算法
const arithmetic = [
  {
    title: "算法图解",
    collapsable: true,
    children: [
      "algorithmDiagram/二分查找",
      "algorithmDiagram/排序",
      "algorithmDiagram/递归",
      "algorithmDiagram/广度优先遍历",
    ],
  },
  {
    title: "leetCode",
    collapsable: true,
    children: [
      "/leetCode/deepforeach/二叉树的中序遍历",
      "/leetCode/array/合并两个有序数组",
      "/leetCode/array/两数之和",
      "/leetCode/array/删除有序数组中的重复项",
      "/leetCode/array/搜索插入位置",
      "/leetCode/array/移除元素",
      "/leetCode/array/最大子数组和",
      "/leetCode/array/加一",
    ],
  },
];

const react = [
  {
    title: "基础",
    collapsable: true,
    children: [
      "base/React常用API",
      "base/ReactElement",
      "base/JSX",
      "base/ReactChildren",
      "base/ReactFiber",
      "base/requestAnimationFrame",
      "base/requestIdleCallback",
    ],
  },
  {
    title: "创建更新",
    collapsable: true,
    children: [
      "update/Render",
      "update/updateQueue",
      "update/模拟UpdateQueue",
      "update/Fiber数据结构",
      "update/expirationTime计算",
    ],
  },
  {
    title: "任务调度",
    collapsable: true,
    children: [
      "schedulework/scheduleWork",
      "schedulework/双缓存fiber树",
      "schedulework/workLoopSync",
      "schedulework/beginWork",
      "schedulework/HostComponent",
      "schedulework/ClassComponent",
      "schedulework/completeUnitOfWork",
      "schedulework/DOM创建",
      "schedulework/finishSyncRender",
    ],
  },
  {
    title: "功能",
    collapsable: true,
    children: [
      "function/单节点Diff",
      "function/多节点Diff",
      "function/Context",
      "function/Ref",
      "function/memo",
      "function/setState",
      "function/合成事件",
      "function/React中requestIdleCallback的实现",
    ],
  },
  {
    title: "Hooks",
    collapsable: true,
    children: [
      "hooks/useState",
      "hooks/useEffect",
      "hooks/useLayoutEffect",
      "hooks/useMemo",
      "hooks/useCallback",
      "hooks/useRef",
      "hooks/useContext",
      "hooks/useReducer",
      "hooks/useDebugValue",
      "hooks/useTransition",
      "hooks/useImperativeHandle",
    ],
  },
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
  "/arithmetic/": arithmetic,
  "/react/": react,
  "/book/": book,
  "/cookbook/": cookbook,
};
