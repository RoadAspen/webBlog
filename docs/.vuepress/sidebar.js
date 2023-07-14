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
    children: [
      "http/计算机网络",
      "http/http",
      "http/http版本",
      "http/http缓存",
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
      "engineering/commitlint",
      "engineering/git",
      "engineering/打造自己的脚手架",
      "engineering/Eslint插件开发",
      "engineering/前端代码开发规范",
      "engineering/rollup",
      "engineering/glup",
      "engineering/npm包的发布",
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
      "framework/koa",
      "framework/redux",
      "framework/react-redux",
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
    children: ["深度优先遍历/测试", "数组/加一"],
  },
];

const react = [
  {
    title: "基础",
    collapsable: true,
    children: [
      "基础/React常用API",
      "基础/ReactElement",
      "基础/JSX",
      "基础/ReactChildren",
      "基础/ReactFiber",
      "基础/requestAnimationFrame",
      "基础/requestIdleCallback",
    ],
  },
  {
    title: "创建更新",
    collapsable: true,
    children: [
      "创建更新/Render",
      "创建更新/updateQueue",
      "创建更新/Fiber",
      "创建更新/expirationTime计算",
    ],
  },
  {
    title: "任务调度",
    collapsable: true,
    children: [
      "任务调度/scheduleWork",
      "任务调度/双缓存fiber树",
      "任务调度/workLoopSync",
      "任务调度/beginWork",
      "任务调度/HostComponent",
      "任务调度/ClassComponent",
      "任务调度/completeUnitOfWork",
      "任务调度/DOM创建",
      "任务调度/finishSyncRender",
    ],
  },
  {
    title: "功能",
    collapsable: true,
    children: [
      "功能/单节点Diff",
      "功能/多节点Diff",
      "功能/Context",
      "功能/Ref",
      "功能/memo",
      "功能/setState",
      "功能/合成事件",
      "功能/SchedulerHostConfig.default",
    ],
  },
  {
    title: "Hooks",
    collapsable: true,
    children: [
      "Hooks/useState",
      "Hooks/useEffect",
      "Hooks/useMemo",
      "Hooks/useCallback",
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
