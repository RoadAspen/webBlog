export function add1() {
  return {
    type: "ADD",
  };
}

export function minus1() {
  return {
    type: "MINUS",
  };
}

export function asyncMinus1() {
  return (dispatch) => {
    setTimeout(() => {
      console.log("3秒后执行减1操作");
      dispatch({
        type: "MINUS",
      });
    }, 3000);
  };
}

export default { add1, minus1 };
