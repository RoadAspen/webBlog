/**
 *  将接收到的reducer合并成为一个大的reducer， 使用闭包
 * 每次传递一个action，就会通过所有的reducer检验，是否要更改state。
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
