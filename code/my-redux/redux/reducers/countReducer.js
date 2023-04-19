const initState = 1;
export default function countReducer(state = initState, action) {
  switch (action.type) {
    // 新增
    case "ADD":
      return state + 1;
    // 重命名
    case "MINUS":
      return state - 1;
    default:
      return state;
  }
}
