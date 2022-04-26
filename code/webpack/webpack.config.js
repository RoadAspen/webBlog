const path = require("path");

module.exports = {
    // 单文件入口
    entry: "./src/index.js",
    // 多文件入口
    // entry: {
    //     index: './src/index.js',
    //     lodash: './src/lodash.js'
    // },
    // 打包模式， development 为 开发模式， production 为生产环境
    mode: "development",
    // 编码出口
    output: {
        // // 打包文件名称，单文件入口适用,多个入口文件使用会报错
        filename: "main.js",
        // 多文件入口适用，将 [name] 替换为多入口文件的key
        // filename: "[name].js",
        // 打包文件存放的最外层文件夹，当前为 config文件同级目录下的dist文件夹
        path: path.resolve(__dirname, "dist"),
    },
    // loader 用来将非js文件、css文件、ES6+ 编译为指定的格式文件
    module: {
        rules: [
            {
                test: /\.css/,
                // use 的loader执行顺序是从后往前，前一个loader的执行结果是下一个loader的入口文件
                use: ["style-loader", "css-loader"],
            },
        ],
    },
};