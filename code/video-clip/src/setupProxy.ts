const proxy = require("http-proxy-middleware");

module.exports = function(app: any) {
  app.use(
    proxy("/static", {
      target: "http://127.0.0.1:3002",
      changeOrigin: true,
    })
  );
};
