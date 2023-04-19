/**
 * 这是一个模拟程序delay时间的中间件
 */
function delayMiddleware(store) {
  return (next) => {
    return (action) => {
      console.log("delayMiddleware", store.getState());
      console.log("delayMiddleware action", action);
      next(action);
    };
  };
}

export default delayMiddleware;
