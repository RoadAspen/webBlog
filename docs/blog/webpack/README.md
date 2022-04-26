package.json

```js
{
  "name": "webpack",
  "version": "1.0.0",
  "description": "为webpack学习提供代码code",
  "main": "index.js",
  "license": "MIT",
  "scripts": {
    "start": "cross-env  webpack-dev-server --progress --hot --color",
    "build": "webpack --config webpack.config.js --progress --color"
  },
  "devDependencies": {
    "file-loader": "^3.0.1",
    "html-webpack-plugin": "^4.0.1",
    "sass": "^1.51.0",
    "sass-loader": "^12.6.0",
    "url-loader": "2.1.0",
    "webpack": "^4.30.0",
    "webpack-bundle-analyzer": "^3.6.0",
    "webpack-cli": "^3.3.2",
    "webpack-dev-middleware": "^3.6.2",
    "webpack-dev-server": "^3.3.1",
    "webpack-merge": "^4.2.1",
    "style-loader": "^0.23.1",
    "css-loader": "^2.1.1"
  }
}
```
