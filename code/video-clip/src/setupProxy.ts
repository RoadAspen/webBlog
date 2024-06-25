const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function(app: any) {
  app.use(
    "/static",
    createProxyMiddleware({
      target: "http://localhost:3002",
      changeOrigin: true,
    })
  );
};
