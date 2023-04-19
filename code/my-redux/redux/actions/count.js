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

export default { add1, minus1 };
