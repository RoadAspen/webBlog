const initState = [
  {
    id: 1,
    name: "jack",
    age: 20,
  },
];
export default function userReducer(state = initState, action) {
  switch (action.type) {
    // 新增
    case "APPEND":
      return [...state, ...action.payload];
    // 重命名
    case "RENAME":
      return state.map((user) => {
        if (user.id === action.payload.id) {
          user.name = action.payload.name;
        }
        return user;
      });
    // 删除用户
    case "DELETE":
      state.pop();
      return [...state];
    // 如果不处理action，则返回原引用，不触发更新
    default:
      return state;
  }
}
