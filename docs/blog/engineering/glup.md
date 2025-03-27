# Gulp

## 1. Gulp 概念

Gulp 是一个基于 Node.js 的前端自动化构建工具，主要用于自动执行常见的任务，如：

- 编译 Sass/Less
- 压缩 JavaScript 和 CSS
- 代码合并
- 监听文件变更并自动刷新浏览器
- 其他重复性任务

Gulp 使用 **流（Stream）** 方式处理文件，避免了频繁的 I/O 操作，提高了构建效率。

## 2. Gulp 语法

Gulp 采用 **任务（Task）** 方式定义构建流程。其核心 API 包括：

- `gulp.task(name, fn)`：定义任务
- `gulp.src(globs)`：指定源文件
- `gulp.dest(folder)`：指定目标目录
- `gulp.watch(globs, tasks)`：监听文件变化
- `gulp.series(tasks)`：串行执行任务
- `gulp.parallel(tasks)`：并行执行任务

## 3. Gulp 的优点

✅ 代码简洁，使用流式处理，速度快
✅ 基于 Node.js，生态丰富，插件多
✅ 适用于前端构建，支持自动化任务
✅ 配置灵活，易扩展

## 4. Gulp 的缺点

❌ 需要学习流（Stream）操作概念
❌ 需要 Node.js 环境，前期学习成本较高

## 5. Gulp 示例代码

### 5.1 安装 Gulp

```sh
npm install -g gulp-cli  # 安装全局 Gulp CLI
npm init -y  # 初始化 package.json
npm install --save-dev gulp  # 安装 Gulp 本地依赖
```

### 5.2 创建 `gulpfile.js`

```javascript
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

// 编译 SCSS
gulp.task('styles', function () {
	return gulp
		.src('src/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(cleanCSS())
		.pipe(gulp.dest('dist/css'));
});

// 压缩 JS
gulp.task('scripts', function () {
	return gulp
		.src('src/js/**/*.js')
		.pipe(concat('app.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
});

// 监听文件变化
gulp.task('watch', function () {
	gulp.watch('src/scss/**/*.scss', gulp.series('styles'));
	gulp.watch('src/js/**/*.js', gulp.series('scripts'));
});

// 默认任务
gulp.task('default', gulp.parallel('styles', 'scripts', 'watch'));
```

### 5.3 运行 Gulp 任务

```sh
gulp          # 运行默认任务
gulp styles   # 运行样式编译任务
gulp scripts  # 运行 JavaScript 压缩任务
gulp watch    # 监听文件变化
```

## 6. 结论

Gulp 作为一款高效的前端自动化工具，在前端开发中广泛应用。通过合理配置 Gulp 任务，可以极大提高开发效率，减少重复性操作。
