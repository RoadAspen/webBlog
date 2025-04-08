// 博客内容
const blogContent = [
	{
		title: 'JS',
		collapsable: true,
		children: [
			'js/手写系列',
			'js/promise',
			'js/hash',
			'js/history',
			'js/预编译',
			'js/this',
			'js/原型和原型链',
			'js/作用域',
			'js/箭头函数',
			'js/闭包',
			'js/内存管理',
			'js/元编程',
			'js/跨域',
			'js/迭代器',
			'js/EventLoop',
			'js/window',
			'js/位运算及权限设计',
			'js/自定义事件',
			'js/拖拽',
			'js/获取图片宽高',
			'js/composition使用',
		],
	},
	{
		title: 'HTTP',
		collapsable: true,
		children: [
			'http/计算机网络',
			'http/http',
			'http/httpcode',
			'http/http缓存',
			'http/sse',
			'http/websocket',
		],
	},
	{
		title: 'Node',
		collapsable: true,
		children: [
			'node/koa',
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
		title: '前端工程化',
		collapsable: true,
		children: [
			'engineering/前端代码开发规范',
			'engineering/node管理工具',
			'engineering/Mock方案',
			'engineering/git',
			'engineering/commitlint',
			'engineering/打造自己的脚手架',
			'engineering/Eslint插件开发',
			'engineering/rollup',
			'engineering/glup',
			'engineering/monorepo',
			'engineering/pnpm',
			'engineering/pageage.json配置',
			'engineering/基于Typescript + Eslint + prettier + vscode 搭建前端开发环境',
			'engineering/前端技术栈',
			'engineering/前端项目的目录结构',
		],
	},
	{
		title: '性能优化',
		collapsable: true,
		children: [
			'optimization/浏览器输入网址',
			'optimization/浏览器解析html',
			'optimization/资源加载优先级',
			'optimization/浏览器缓存策略',
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
		title: 'webpack',
		collapsable: true,
		children: [
			'webpack/webpack基础',
			'webpack/代码分割',
			'webpack/happyPack',
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
		title: 'TS',
		collapsable: true,
		children: [
			'ts/基础知识',
			'ts/进阶',
			'ts/类与接口',
			'ts/装饰器',
			'ts/声明文件',
			'ts/interface和class的区别',
			'ts/interface和type的区别',
			'ts/TS类型体操',
		],
	},
	{
		title: 'ReactNative',
		collapsable: true,
		children: ['reactnative/基础'],
	},
	{
		title: '前端库工具库',
		collapsable: true,
		children: [
			'framework/react-redux',
			'framework/redux',
			'framework/immer',
			'framework/recoil',
			'framework/mobx',
			'framework/常用前端库',
		],
	},
	{
		title: '前端安全',
		collapsable: true,
		children: ['safety/安全', 'safety/Sentry'],
	},
	{
		title: '运维相关',
		collapsable: true,
		children: ['operation/Docker部署前端项目', 'operation/README'],
	},
	{
		title: '微前端',
		collapsable: true,
		children: ['microfrontends/qiankun'],
	},
	{
		title: '设计模式',
		collapsable: true,
		children: ['设计模式/单例模式', '设计模式/工厂模式', '设计模式/观察者模式'],
	},
	{
		title: 'CSS',
		collapsable: true,
		children: [
			'css/1px边界问题',
			'css/BFC',
			'css/css单位',
			'css/Grid和Flex',
			'css/vertical-align 不生效',
			'css/一键换肤',
			'css/伪类和伪元素',
			'css/圣杯布局和双飞燕布局',
		],
	},
	{
		title: '技术对比',
		collapsable: true,
		children: [
			'libraryDiff/css-in-js',
			'libraryDiff/css原子化',
			'libraryDiff/css预处理',
			'libraryDiff/form',
			'libraryDiff/hooks',
			'libraryDiff/http请求',
			'libraryDiff/ReactOrVue',
			'libraryDiff/react状态管理',
			'libraryDiff/UI-Library',
			'libraryDiff/图像处理',
			'libraryDiff/本地存储',
			'libraryDiff/生成随机字符串',
			'libraryDiff/视频编辑',
		],
	},
];

// 算法内容
const arithmeticContent = [
	{
		title: '算法图解',
		collapsable: true,
		children: [
			'algorithmDiagram/二分查找',
			'algorithmDiagram/排序',
			'algorithmDiagram/递归',
			'algorithmDiagram/广度优先遍历',
			'algorithmDiagram/深度优先遍历',
		],
	},
	{
		title: 'leetCode',
		collapsable: true,
		children: [
			'leetCode/deepForeach/二叉树的中序遍历',
			'leetCode/array/合并两个有序数组',
			'leetCode/array/两数之和',
			'leetCode/array/删除有序数组中的重复项',
			'leetCode/array/搜索插入位置',
			'leetCode/array/移除元素',
			'leetCode/array/最大子数组和',
			'leetCode/array/加一',
		],
	},
];

// React内容
const reactContent = [
	{
		title: '基础',
		collapsable: true,
		children: [
			'base/React常用API',
			'base/ReactElement',
			'base/JSX',
			'base/ReactChildren',
			'base/ReactFiber',
			'base/requestAnimationFrame',
			'base/requestIdleCallback',
		],
	},
	{
		title: '创建更新',
		collapsable: true,
		children: [
			'update/Render',
			'update/updateQueue',
			'update/模拟UpdateQueue',
			'update/Fiber数据结构',
			'update/expirationTime计算',
		],
	},
	{
		title: '任务调度',
		collapsable: true,
		children: [
			'schedulework/scheduleWork',
			'schedulework/双缓存fiber树',
			'schedulework/workLoopSync',
			'schedulework/beginWork',
			'schedulework/HostComponent',
			'schedulework/ClassComponent',
			'schedulework/completeUnitOfWork',
			'schedulework/DOM创建',
			'schedulework/finishSyncRender',
		],
	},
	{
		title: '功能',
		collapsable: true,
		children: [
			'function/单节点Diff',
			'function/多节点Diff',
			'function/Context',
			'function/Ref',
			'function/memo',
			'function/setState',
			'function/合成事件',
			'function/React中requestIdleCallback的实现',
		],
	},
	{
		title: 'Hooks',
		collapsable: true,
		children: [
			'hooks/useState',
			'hooks/useEffect',
			'hooks/useLayoutEffect',
			'hooks/useMemo',
			'hooks/useCallback',
			'hooks/useRef',
			'hooks/useContext',
			'hooks/useReducer',
			'hooks/useDebugValue',
			'hooks/useTransition',
			'hooks/useImperativeHandle',
			'hooks/useInsertionEffect',
			'hooks/useSyncExternalStore',
			'hooks/useId',
			'hooks/useDeferredValue',
		],
	},
	{
		title: '优化',
		collapsable: true,
		children: [
			'react/优化/react优化',
			'react/优化/react合成事件机制',
			'react/优化/react实现',
		],
	},
];
// Vue内容
const vueContent = [
	{
		title: '基础',
		collapsable: true,
		children: ['vue/什么是vue'],
	},
];

// 阅读内容
const bookContent = [
	{
		title: '国内',
		collapsable: true,
		children: [
			'book/国内/浮生六记',
			'book/国内/活着',
			'book/国内/平凡的世界',
			'book/国内/围城',
			'book/国内/许三观卖血记',
		],
	},
	{
		title: '国外',
		collapsable: true,
		children: [
			'book/国外/百年孤独',
			'book/国外/当我谈跑步时我谈些什么',
			'book/国外/1984',
			'book/国外/动物庄园',
			'book/国外/美丽新世界',
			'book/国外/人类简史',
			'book/国外/宿命',
		],
	},
	{
		title: '心经',
		collapsable: false,
		children: ['book/心经'],
	},
];

// Java内容
const javaContent = [
	{
		title: 'java基础',
		collapsable: true,
		children: [
			'java/Java介绍及搭建开发环境',
			'java/Java程序基本结构',
			'java/Java类型',
			'java/Java多线程',
		],
	},
	{
		title: '框架与工具',
		collapsable: true,
		children: ['java/spring', 'java/Maven', 'java/Servlet入门'],
	},
];

// 笔记内容
const notepadContent = [
	{
		title: '随笔',
		collapsable: true,
		children: [
			'notepad/从零学习英语计划',
			'notepad/什么是数字孪生',
			'notepad/芯片原理',
		],
	},
	{
		title: '年度总结',
		collapsable: true,
		children: ['notepad/年度总结/婚礼记录'],
	},
];
// 数据库
const dataBaseContent = [
	{
		title: 'Mongo',
		collapsable: true,
		children: ['database/mongo/基础'],
	},
	{
		title: 'Mysql',
		collapsable: true,
		children: ['database/mysql/基础'],
	},
	{
		title: 'PgSQL',
		collapsable: true,
		children: ['database/pgsql/基础'],
	},
];

module.exports = {
	'/blog/': blogContent,
	'/arithmetic/': arithmeticContent,
	'/react/': reactContent,
	'/vue/': vueContent,
	'/book/': bookContent,
	'/java/': javaContent,
	'/database/': dataBaseContent,
	'/notepad/': notepadContent,
};
