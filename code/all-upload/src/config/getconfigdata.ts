import tenantConfig from '@tezign/tenant-config';

const constants = {
  /** 上传成功 回调的url */
  UPLOAD_RESOURCE_URL: `${tenantConfig.value(
    "API_ORIGIN"
  )}/resource-center/resBaseInfo/createResource`,
  /** 多云上传所需 config、token 的url */
  GET_UPLOAD_FEED_URL:
    tenantConfig.value("GET_UPLOAD_FEED_URL") ||
    `${tenantConfig.value(
      "API_ORIGIN"
    )}/resource-center/osService/public/policy`,
  /** 多云服务商的url */
  TENANT_MULTI_CLOUD_URL:
    tenantConfig.value("GET_TENANT_CLOUD_SERVICE_PROVIDE_URL") ||
    `${tenantConfig.value(
      "API_ORIGIN"
    )}/resource-center/osService/public/getOsBasicInfo`,
    ABORT_UPLOAD:
    `${tenantConfig.value(
      "API_ORIGIN"
    )}/resource-center/osService/public/abortUpload`,
  /** 阿里云sdk cdn地址 */
  OSS_SDK_CDN_SRC: tenantConfig.value("ALIYUN_SDK_URL") as string,
  /** 腾讯云sdk cdn地址 */
  COS_SDK_CDN_SRC: tenantConfig.value("TENCENT_SDK_URL") as string,
  /** script id */
  CLOUD_SDK_SCRIPT_ID: "cloud_sdk",
  /** 租户多云配置 存储locastorage key*/
  MULTI_CLOUD_KEY: "multi_cloud_key",
};

/** uploadFile 相关 */
export const ERRORS = {
  GET_TOKEN_FAILED: "GET_TOKEN_FAILED",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  ADD_RESOURCE_FAILED: "ADD_RESOURCE_FAILED",
};

export default constants;
