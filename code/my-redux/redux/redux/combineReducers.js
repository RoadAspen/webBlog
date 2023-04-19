/**
 *  将所有的reducer合并成为一个新的reducer， 使用闭包
 * @param {[key:string]:func} reducers
 */
export function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const newState = {};
  let hasChange = false;

  return (state = {}, action) => {
    reducerKeys.forEach((key) => {
      // 当前reducer
      const reducer = reducers[key];
      // 当前state
      const currentState = state[key];
      // 存储执行结果
      newState[key] = reducer(currentState, action);
      // 判断是否出现引用修改
      if (currentState !== newState[key]) {
        hasChange = true;
      }
    });
    return hasChange ? newState : state;
  };
}
