var nav = require('./nav');
var sidebar = require('./sidebar');
module.exports = {
	title: 'roadaspen\'s blog',
	description: '前进的脚步永不停歇，成长的路途一往无前',
	head: [
		['link', {
			rel: 'icon',
			href: '/logo.png'
		}]
	],
	markdown: {
		lineNumbers: false, // 代码块显示行号
	},
	extraWatchFiles: [ // 监听文件修改，触发vuepress重新构建
		'./nav.js',
		'./sidebar.js'
	],
	base: '/', // 这是部署到github相关的配置
	themeConfig: {
		nav,
		sidebar,
		// logo: '/assets/img/logo.png',
		sidebarDepth: 5, // 显示链接的深度，默认为1,最深为2
		displayAllHeaders: true, //显示所有页面的标题链接 
		lastUpdated: '最后更新时间',
		docsDir: 'docs', // 文档根路径
		smoothScroll: true,
	},
	plugins: ['@vuepress/back-to-top']
}