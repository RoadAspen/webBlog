/**
 * 高阶函数，接收函数数组，输出一个一次执行函数
 * @param  {...any} funcs
 * @returns
 */

/**
 * eg:
 * const arr = ['a','b','c','d','e'];
 *
 *
 * arr.reduce((a,b)=>`(...rest)=>${a}(${b}(...rest))`)
 *
 *
 *'(...rest)=>(...rest)=>(...rest)=>(...rest)=>a(b(...rest))(c(...rest))(d(...rest))(e(...rest))'
 *
 * function niMing(...rest) {
    return (function(...rest) {
      return (function(...rest) {
        return (function(...rest) {
          return a(b(...rest));
        })(c(...rest));
      })(d(...rest));
    })(e(...rest));
  }
 * 
 */
export function compose(...funcs) {
  if (funcs.length === 0) return (arg) => arg;
  if (funcs.length === 1) return funcs[0];
  return funcs.reduce((a, b) => (...rest) => a(b(...rest)));
}
