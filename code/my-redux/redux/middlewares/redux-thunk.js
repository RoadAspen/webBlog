/**
 * 这是一个异步返回action的middleware
 */
function thunkMiddleware({ dispatch, getState }) {
  return (next) => {
    return (action) => {
      if (typeof action === "function") {
        return action(dispatch, getState, next);
      }
      console.log("这里是 thunkMiddleware action", action, getState());
      return next(action);
    };
  };
}

export default thunkMiddleware;
