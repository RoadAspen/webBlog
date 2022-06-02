const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const isDev = process.env.ENV === 'development';
module.exports = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'source-map' : 'nosources-source-map',
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
        // 打包文件存放的最外层文件夹，当前为 config文件同级目录下的dist文件夹
        path: path.resolve(__dirname, "dist"),
        // // 打包文件名称，单文件入口适用,多个入口文件使用会报错
        filename: "static/main.js",
        // 多文件入口适用，将 [name] 替换为多入口文件的key
        // filename: "[name].js",
        // 公共前缀，会在所有的url链接之前添加
        // publicPath: 'https://cdn-test.com'
    },
    // loader 用来将非js文件、css文件、ES6+ 编译为指定的格式文件
    module: {
        rules: [
            {
                test: /\.css/,
                // use 的loader执行顺序是从后往前，前一个loader的执行结果是下一个loader的入口文件
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.scss/,
                use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader']
            },
            {
                test: /\.(jpg|png|svg|gif)$/,
                use: [{
                    loader: 'url-loader', options: {
                        // name 原名 hash 随机数 ext 后缀
                        name: "[name].[hash].[ext]",
                        // 输出文件夹 output.path + outputPath
                        outputPath: "images/",
                        // 文件小于一定大小直接转为base64编码
                        limit: 5000  // 单位 B  1KB === 1024B
                    }
                }]
            },
            {
                test: /\.js$/,
                // 排除文件
                exclude: /node_modules/,
                use: [{
                    loader: "babel-loader", options: {
                        "plugins": [
                            [
                                "@babel/plugin-transform-runtime",
                                {
                                    "absoluteRuntime": false,
                                    "corejs": false,
                                    "helpers": true,
                                    "regenerator": true,
                                    "useESModules": false,
                                    "version": "7.0.0-beta.0"
                                }
                            ]
                        ]
                    }
                }],
            }
        ],
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    // 用来执行非文件处理操作
    plugins: [
        new HtmlWebpackPlugin({
            filename: "./index.html",
            // js文件插入的地方，body 和 head ，默认body
            inject: 'body'
        }),
        // 热更新
        ...isDev ? [new webpack.HotModuleReplacementPlugin()] : []
    ],
    // 开发服务器
    devServer: {
        // 打包后的入口文件所在的 资源文件夹
        contentBase: './dist',
        // 是否自动打开浏览器
        open: true,
        // 访问端口
        port: 8081,
        // 重定向，跨域操作
        proxy: {
            "/api": "http://www.baidu.com"
        },
        hot: true,
        hotOnly: true
    }
};