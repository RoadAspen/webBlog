import { EMultiCloud, IUploader } from "../types";
import AliUpload from "./ali-oss";
import TencentUpload from "./tencent-cos";
import AwsUploader from "./aws";

/**
 * 获取上传对象
 * @param {string} code 云配置
 * */
export function getMultiCloudUploader(
  code: string,
  observerKey?: string,
  concurrentNum?: number
): IUploader {
  if (code === EMultiCloud.ALIYUN)
    return new AliUpload(observerKey, concurrentNum);
  if (code === EMultiCloud.TENCENT) return new TencentUpload(observerKey);
  if (code === EMultiCloud.AWS) return new AwsUploader(observerKey);
  return new AliUpload(observerKey, concurrentNum);
}

export { AliUpload, TencentUpload, AwsUploader };
