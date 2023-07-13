import { compose } from "./compose.js";
/**
 * 将传入的中间件一起合并做处理
 * @param  {...any} middlewares
 * @returns {function} createStore
 * 
 * 
 * let dispatch=(action)=>{console.log('dispatch',action);}
  let arr=[
      next=>(value)=>{console.log('a',value);  next(value);},
      next=>(value)=>{console.log('b',value);  next(value);},
      next=>(value)=>{console.log('c',value);  next(value)},
  ];
  dispatch=arr.reduce((a,b)=>(...args)=>a(b(...args)))(dispatch);
  dispatch('this is action');
  //结果
  a this is action
  b this is action
  c this is action
  dispatch this is action

  执行顺序：  a->b->c->dispatch->c->b->a
 */
export function applyMiddleware(...middlewares) {
  // 返回一个接收createStore入参的函数
  return (createStore) => {
    // 返回一个和 createStore 相似作用的函数，只是缺少了 rewriteCreateStoreFunc
    return (reducer, initState) => {
      // 在这里创建一个store，保持原有的功能
      const store = createStore(reducer, initState);
      // 先创建一个dispatch
      let dispatch = (action, ...args) => {
        // 这里的dispatch 相当于一个闭包，保存了 dispatch 的引用。
        // 如果直接赋值，则相当于拷贝，不能跟随转变。
        throw new Error("此时禁止使用dispatch");
      };
      // 创建一个只有getState方法的 store，中间件中只能使用getState方法，不能做修改。
      const simpleStore = {
        getState: store.getState,
        dispatch: (action, ...args) => {
          // 这里的dispatch 相当于一个闭包，保存了 dispatch 的引用。
          // 如果直接赋值，则相当于拷贝，不能跟随转变。
          return dispatch(action, ...args);
        },
      };
      // chain 同样是一个函数集合，mid(simpleStore) 返回一个 接受下一个middleware 入参的函数。
      const chain = middlewares.map((mid) => mid(simpleStore));
      // chain 中的每一个函数的输入输出都是一样的，接收dispatch，然后输出一个dispatch
      // compose 返回了 （...rest）=> a(b(...rest))
      // 加强版的dispatch
      dispatch = compose(...chain)(store.dispatch);
      console.log("store.dispatch", store.dispatch);
      const newStore = { ...store, dispatch };
      console.log(newStore.dispatch === store.dispatch);
      return newStore;
    };
  };
}
