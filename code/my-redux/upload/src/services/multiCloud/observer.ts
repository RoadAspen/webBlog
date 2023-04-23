import mitt from "@tezign/commons.js/mitt";
const MITT_TYPE = "observer_oss_file_process";
const MITT_TYPE_SUCESS = "observer_oss_file_sucess";
const MITT_DRAFT_TYPE = "observer_oss_file_draft_process";

const observerOss: { <T>(handler: (data: T) => void): void } = (handler) => {
  mitt.on(MITT_TYPE, handler);
};
const observerOffOss: { <T>(handler?: (data: T) => void): void } = (
  handler
) => {
  mitt.off(MITT_TYPE, handler);
};

const subscriptionOss: { <T>(arg: T): void } = (data) => {
  mitt.emit(MITT_TYPE, data);
};

const observerUpSucessOss: { <T>(handler: (data: T) => void): void } = (
  handler
) => {
  mitt.on(MITT_TYPE_SUCESS, handler);
};
const observerUpSucessOffOss: { <T>(handler?: (data: T) => void): void } = (
  handler
) => {
  mitt.off(MITT_TYPE_SUCESS, handler);
};

const subscriptionUpSucessOss: { <T>(arg: T): void } = (data) => {
  mitt.emit(MITT_TYPE_SUCESS, data);
};

const observerdraftOss: { <T>(handler: (data: T) => void): void } = (
  handler
) => {
  mitt.on(MITT_DRAFT_TYPE, handler);
};
const observerdraftOffOss: { <T>(handler?: (data: T) => void): void } = (
  handler
) => {
  mitt.off(MITT_DRAFT_TYPE, handler);
};

const subscriptiondraftOss: { <T>(arg: T): void } = (data) => {
  mitt.emit(MITT_DRAFT_TYPE, data);
};

const observerCustomProcessOss: {
  <T>(key: string, handler: (data: T) => void): void;
} = (key, handler) => {
  mitt.on(`observer_oss_file_${key}_process`, handler);
};
const observerCustomProcessOffOss: {
  <T>(key: string, handler?: (data: T) => void): void;
} = (key, handler) => {
  mitt.off(`observer_oss_file_${key}_process`, handler);
};

const subscriptionCustomProcessOss: {
  <T>(key: string, arg: T): void;
} = (key, data) => {
  mitt.emit(`observer_oss_file_${key}_process`, data);
};

const observerCustomSuccessOss: {
  <T>(key: string, handler: (data: T) => void): void;
} = (key, handler) => {
  mitt.on(`observer_oss_file_${key}_success`, handler);
};
const observerCustomSuccessOffOss: {
  <T>(key: string, handler?: (data: T) => void): void;
} = (key, handler) => {
  mitt.off(`observer_oss_file_${key}_success`, handler);
};

const subscriptionCustomSuccessOss: {
  <T>(key: string, arg: T): void;
} = (key, data) => {
  mitt.emit(`observer_oss_file_${key}_success`, data);
};

export {
  subscriptionOss,
  observerOss,
  observerOffOss,
  observerUpSucessOss,
  observerUpSucessOffOss,
  subscriptionUpSucessOss,
  observerdraftOss,
  observerdraftOffOss,
  subscriptiondraftOss,
  observerCustomProcessOss,
  observerCustomProcessOffOss,
  subscriptionCustomProcessOss,
  observerCustomSuccessOss,
  observerCustomSuccessOffOss,
  subscriptionCustomSuccessOss,
};
