/**
 * 这是一个模拟程序delay时间的中间件
 */
function delayMiddleware({ dispatch, getState }) {
  // 这个阶段不能使用dispatch
  return (next) => {
    // 这个阶段也不能使用dispatch
    return (action) => {
      // 这个阶段可以使用dispatch，此时dispatch已经被加强。
      console.log("这里是 delayMiddleware action", action, getState());
      return next(action);
    };
  };
}

export default delayMiddleware;
