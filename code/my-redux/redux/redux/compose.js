/**
 * 高阶函数，接收函数数组，输出一个  a(b(c(...rest)))
 * @param  {...any} funcs
 * @returns
 */
export function compose(...funcs) {
  if (funcs.length === 0) return (arg) => arg;
  if (funcs.length === 1) return funcs[0];
  return funcs.reduce((a, b) => (...rest) => a(b(...rest)));
}
