/**
 *
 * @param {单个 action} actionCreator
 * @param { 订阅发布 } dispatch
 * @returns func
 */
function bindActionCreator(actionCreator, dispatch) {
  return function(...rest) {
    return dispatch(actionCreator(rest));
  };
}
/**
 *  接受一个 key value 的函数集合，将函数与dispatch绑定，输出新的函数
 * @param {action 创建函数集合} actionCreators
 * @param { 订阅发布 } dispatch
 */
export function bindActionCreators(actionCreators, dispatch) {
  const boundActionCreators = {};
  Object.keys(actionCreators).forEach((key) => {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  });
  return boundActionCreators;
}
