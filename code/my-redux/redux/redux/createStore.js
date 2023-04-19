/**
 *
 * @param {reducer 纯函数} reducer   func
 * @param {初始值} initState    any 默认值 {}
 * @param {覆盖 createStore 方法} rewriteCreateStoreFunc  func
 */
export function createStore(reducer, initState, rewriteCreateStoreFunc) {
  // 如果不想传入initState，又想传入rewriteCreateStoreFunc。
  if (initState && typeof initState === "function") {
    rewriteCreateStoreFunc = initState;
    initState = {};
  }
  //如果需要覆盖\改造 原始的createStore，传入新的func，并将createStore传入
  if (rewriteCreateStoreFunc) {
    const newCreateStore = rewriteCreateStoreFunc(createStore);
    return newCreateStore(reducer, initState);
  }
  // 初始化值
  let state = initState;
  // 监听
  let listeners = [];
  // 获取 state 树
  function getState() {
    return state;
  }

  // 添加监听
  function subscribe(listener) {
    listeners.push(listener);
  }

  // dispatch
  function dispatch(action) {
    // 通过reducer，返回新的 state
    state = reducer(state, action);
    // 通知所有的订阅者
    listeners.forEach((fun) => fun(state));
  }

  // 直接触发一次,获取每个reducer 的默认值，组合成原始的 state。
  dispatch({ type: Symbol() });

  // 修改全局的reducer
  function replaceReducer(nextReducer) {
    reducer = nextReducer;
    dispatch({ type: Symbol() });
  }

  return {
    getState,
    dispatch,
    subscribe,
    replaceReducer,
  };
}
