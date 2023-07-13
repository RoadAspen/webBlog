const tenantConfig = {
  API_ORIGIN: "http://xxxx.co:8999",
};
const config = {
  /** 上传成功 回调的url */
  UPLOAD_RESOURCE_URL: `${tenantConfig["API_ORIGIN"]}/resource-center/resBaseInfo/createResource`,
  /** 获取多云上传所需 config、token、key 的url */
  GET_UPLOAD_FEED_URL: `${tenantConfig["API_ORIGIN"]}/resource-center/osService/public/policy`,
  /** 获取租户的多云服务商的url */
  TENANT_MULTI_CLOUD_URL: `${tenantConfig["API_ORIGIN"]}/resource-center/osService/public/getOsBasicInfo`,
  /** 阿里云sdk cdn地址 */
  OSS_SDK_CDN_SRC: tenantConfig["ALIYUN_SDK_URL"],
  /** 腾讯云sdk cdn地址 */
  COS_SDK_CDN_SRC: tenantConfig["TENCENT_SDK_URL"],
  /** script id */
  CLOUD_SDK_SCRIPT_ID: "cloud_sdk",
  /** 租户多云配置 存储 localeStorage key*/
  MULTI_CLOUD_KEY: "multi_cloud_key",
};

export default config;
