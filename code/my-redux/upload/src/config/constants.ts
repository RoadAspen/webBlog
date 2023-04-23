import constants from "./getconfigdata";

let _env: "dev" | "stage" | "prod" | "test";

const setEnv = (env: typeof _env) => {
  _env = env;
};
const conStants = {
  COOKIE_X_USER_ID: "vmsxuid",
  COOKIE_X_TOKEN: "vmsxtoken",
  C_XTENANTID: "xtenantid",
  X_LANG: "x-lang",
  X_USER_ID: "X-User-Id",
  X_TOKEN: "X-Token",
};

export { conStants, setEnv };
