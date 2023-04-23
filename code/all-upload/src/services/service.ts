import {
  IUploadRes,
  IFile,
  EMultiCloud,
  IFeedConfig,
  IUploadOption,
} from "./multiCloud/types";
import constants from "../config/getconfigdata";
const http = require("@tezign/commons.js/http");

/**
 * 获取 token,
 * @param extensionName 文件后缀
 * @param url 自定义url
 */
const getUploadFeedConfig = (
  extensionName?: string,
  url?: string
): Promise<IFeedConfig> => {
  return http.get(
    `${url || constants.GET_UPLOAD_FEED_URL}?extension=${extensionName}`
  );
};
/**
 * 文件上传成功后的回调
 * @param resource 文件
 * @param option 上传信息
 */
const fileAdd = (
  resource: IFile,
  option?: IUploadOption,
  url?: string
): Promise<IUploadRes> => {
  return http.post(`${url || constants.UPLOAD_RESOURCE_URL}`, {
    resourceList: [
      {
        path: resource.key,
        name: resource.name,
        type: resource._type || resource.type,
        size: resource.size,
      },
    ],
    /** 业务线 */
    businessCode: option?.businessCode || "",
    /** 产品模块 */
    productCode: option?.productCode || "",
    /** 拓展码 */
    extCode: option?.extCode || "",
    longTermUrl: option?.longTermUrl || false,
  });
};

/**
 * 获取用户云配置
 */
const getTenantMultiCloud = (): Promise<EMultiCloud> => {
  return http.get(`${constants.TENANT_MULTI_CLOUD_URL}`);
};

/**
 * ali-oss 中止上传
 */
const abortMultiCloud = (
  path: string,
  uploadId: string,
): Promise<any> => {
  return http.get(`${constants.ABORT_UPLOAD}?path=${path}&uploadId=${uploadId}`);
};

export { getUploadFeedConfig, fileAdd, getTenantMultiCloud, abortMultiCloud };
