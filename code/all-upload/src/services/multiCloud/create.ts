import OSS from "ali-oss";
import COS from "cos-js-sdk-v5";
import AWS from "aws-sdk/clients/s3";
import { IFeedConfig } from "./types";
import { getUploadFeedConfig } from "../service";

/**
 * 阿里云创建oss
 */
const createOSS = async () => {
  const config: IFeedConfig = await getUploadFeedConfig();
  const cloud = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    stsToken: config.securityToken,
    bucket: config.bucketName,
    endpoint: config.endpoint || "oss-cn-beijing.aliyuncs.com",
    timeout: "600s",
    secure: true,
    refreshSTSToken: async () => {
      const res = await getUploadFeedConfig();
      return {
        accessKeyId: res.accessKeyId,
        accessKeySecret: res.accessKeySecret,
        stsToken: res.securityToken,
      };
    },
    refreshSTSTokenInterval: 55 * 60 * 1000, // 这里多设置5分钟,做二次容错
  });
  return {
    cloud,
    config,
  };
};

/** 腾讯云
 * @param {string} extensionName 文件后缀
 * @param {string} cpKey  key 文件key标识
 */
const createCOS = async (extensionName: string, cpKey?: string) => {
  const feed = await getUploadFeedConfig(extensionName);
  const cos = new COS({
    // 必选参数
    getAuthorization: async function (options, callback) {
      callback({
        TmpSecretId: feed.accessKeyId,
        TmpSecretKey: feed.accessKeySecret,
        SecurityToken: feed.securityToken,
        StartTime: Math.round(new Date().getTime() / 1000),
        ExpiredTime: Math.round(new Date().getTime() / 1000) + 600, // 600秒
        ScopeLimit: true,
      });
    },
    ProgressInterval: 1000, // ms   Progress 触发间隔 ， 默认 1000 ms
    Timeout: 600 * 1000, // 单位 ms
  });

  return {
    cloud: cos,
    key: cpKey || `${feed.dir || ""}${feed.keyName}.${extensionName}`,
    config: feed,
  };
};

/** 亚马逊云
 * @param {string} extensionName 文件后缀
 * @param {string} cpKey  key 文件key标识
 */
const createAWS = async (extensionName: string, cpKey?: string) => {
  const feed = await getUploadFeedConfig(extensionName);
  const aws = new AWS({
    accessKeyId: feed.accessKeyId,
    secretAccessKey: feed.accessKeySecret,
    region: feed.region,
    sessionToken: feed.securityToken,
  });

  return {
    cloud: aws,
    key: cpKey || `${feed.dir || ""}${feed.keyName}.${extensionName}`,
    config: feed,
  };
};

export { createOSS, createCOS, createAWS };
