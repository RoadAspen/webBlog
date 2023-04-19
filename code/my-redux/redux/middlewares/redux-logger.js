/**
 * 这是一个打印 dispatch logger日志 的中间件
 */
function loggerMiddleware(store) {
  return (next) => {
    return (action) => {
      console.log("store.getState", store.getState());
      console.log("loggerMiddleware action", action);
      next(action);
    };
  };
}

export default loggerMiddleware;
