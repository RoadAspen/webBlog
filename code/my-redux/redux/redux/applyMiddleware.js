import { compose } from "./compose.js";
/**
 * 将传入的中间件一起合并做处理
 * @param  {...any} middlewares
 * @returns
 */
export function applyMiddleware(...middlewares) {
  // 返回一个接收createStore入参的函数
  return (oldCreateStore) => {
    // 返回一个和 createStore 相似作用的函数，只是缺少了 rewriteCreateStoreFunc
    return (reducer, initState) => {
      const store = oldCreateStore(reducer, initState);
      // 创建一个只有getState方法的 store
      const simpleStore = { getState: store.getState };
      // chain 同样是一个函数集合，mid(simpleStore) 返回一个 接受下一个middleware 入参的函数。
      const chain = middlewares.map((mid) => mid(simpleStore));
      // chain 中的每一个函数都值接收一个 dispatch。dispatch 最终接受的参数是 action
      // compose 返回了 （...rest）=> a(b(...rest))
      console.log("compose(...chain)", compose(...chain));
      const composeFunc = compose(...chain);
      console.log("composeFunc", composeFunc);
      store.dispatch = composeFunc(store.dispatch);
      console.log("store.dispatch", store.dispatch);
      return store;
    };
  };
}
