export function appendOne() {
  return {
    type: "APPEND",
    payload: [
      {
        id: 2,
        name: "张三",
        age: 24,
      },
    ],
  };
}

export function renameOne() {
  return {
    type: "RENAME",
    payload: {
      id: 2,
      name: "张三重命名",
    },
  };
}
// 删除最后一个
export function deleteLatest() {
  return {
    type: "DELETE",
  };
}

export default { appendOne, renameOne, deleteLatest };
