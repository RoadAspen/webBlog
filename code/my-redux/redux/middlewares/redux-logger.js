/**
 * 这是一个打印 dispatch logger日志 的中间件
 */
function loggerMiddleware({ dispatch, getState }) {
  return (next) => {
    return (action) => {
      console.log("这里是 loggerMiddleware action", action);
      return next(action);
    };
  };
}

export default loggerMiddleware;
