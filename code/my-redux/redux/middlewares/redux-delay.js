/**
 * 这是一个模拟程序delay时间的中间件
 */
function delayMiddleware(store) {
  console.log("这里指行了 delayMiddleware", store);
  // next 下一个 middleware
  return (next) => {
    console.log("next", next);
    return (action) => {
      next(action);
      console.log("delayMiddleware", store.getState());
      console.log("delayMiddleware action", action);
      setTimeout(() => {
        console.log("2s后执行");
      }, 2000);
    };
  };
}

export default delayMiddleware;
