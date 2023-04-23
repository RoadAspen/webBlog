import OSS from "ali-oss";
import tenantConfig, { ERRORS } from "../../../config/getconfigdata";
import getFileExtension from "@tezign/commons.js/functions/getFileExtension";
import UploadDelegate from "@tezign/commons.js/functions/uploadDelegate";
import { isNull, isNumber } from "../../utils";
import { fileAdd, getUploadFeedConfig } from "src/services/service";
import { IFeedConfig, IUploadedFile, IUploadedFileOptions } from "../types";
const mime = require("mime"); // ⇨ 'text/plain'

const FileMap: { [str: string]: any } = {};

function cancelUploadAli(file: any) {
  const res = FileMap[file._key];
  if (!res) return false;
  if (res && res.uploadDelegate) {
    res.uploadDelegate.cancelUpload();
  }
  if (res && res.cloud && res.cloud.cancel) {
    res.cloud.cancel();
  }
  delete FileMap[file._key];
  return true;
}

function resumeUploadAli(file: any) {
  const res = FileMap[file._key];
  if (!res) return false;
  if (res && res.uploadDelegate) {
    res.uploadDelegate.resumeUpload();
  }
  return upload(file, res.options, true);
}

function upload(
  file: any,
  options: IUploadedFileOptions = {},
  resume: any,
  retryTimes: number | null = null
): Promise<IUploadedFile> {
  if (!file._key) file._key = file.name + Date.now();
  let upDelegate: any;
  let res = FileMap[file._key];
  if (res && res.uploadDelegate) {
    upDelegate = res.uploadDelegate;
  } else {
    upDelegate = new UploadDelegate({
      file: {
        name: file.name,
        size: file.size,
      },
      lowNetworkSpeed: 40 * 1024,
      networkSpeedInterval: 10 * 1000,
    });
  }
  upDelegate.startUpload();
  // 导出上传代理实例
  options.getUploadDelegate?.(upDelegate);

  // decrement retrytimes
  if (!isNull(retryTimes) && isNumber(retryTimes)) {
    retryTimes = retryTimes - 1;
  }

  let {
    partSize = 1024 * 1024,
    onUploadSpeed,
    getUploadFeedUrl = tenantConfig.GET_UPLOAD_FEED_URL,
    uploadResourceUrl = tenantConfig.UPLOAD_RESOURCE_URL,
    progress,
    longTermUrl /** true表示URL的token长时间有效 */,
  } = options;
  return new Promise((resolve, reject) => {
    const extensionName = getFileExtension(file.name);
    getUploadFeedConfig(extensionName, getUploadFeedUrl).then(
      (feed: IFeedConfig) => {
        let key;
        let resource: any;
        if (!res) resume = false;
        if (resume) {
          key = res.key;
          resource = res.resource;
        } else {
          const str = (feed.dir || "") + feed.keyName;
          key = `${str}.${extensionName}`;
          file.key = key;
          resource = {
            name: file.name,
            type: mime.getType(extensionName) || file.type,
            size: file.size,
            path: key,
          };
        }

        const checkpoint = resume ? res.checkpoint : null;
        const client = new OSS({
          accessKeyId: feed.accessKeyId,
          accessKeySecret: feed.accessKeySecret,
          stsToken: feed.securityToken,
          bucket: feed.bucketName,
          endpoint: feed.endpoint || "oss-cn-beijing.aliyuncs.com",
          timeout: "600s",
          // instruct OSS client to use HTTPS (secure: true) or HTTP (secure: false) protocol.
          secure: true,
        });
        // 保存
        if (resume) {
          res.cloud = client;
        } else {
          FileMap[file._key] = {
            cloud: client,
            options,
            key,
            resource,
            uploadDelegate: upDelegate,
          };
        }
        client
          .multipartUpload(key, file, {
            checkpoint,
            partSize,
            timeout: 600000, // 设置超时时间
            progress(percent: any, checkpoint: any, res: any) {
              if (FileMap[file._key]) {
                FileMap[file._key].checkpoint = checkpoint;
              }
              if (res) {
                FileMap[file._key].requestId = res.headers["x-oss-request-id"];
              }
              let requestNetwork = 0;
              if (checkpoint) {
                const { partSize, doneParts } = checkpoint;
                const total = partSize * doneParts.length;
                upDelegate.updateUploadedFileSize(total);
                const speed =
                  (total * 1000) /
                  (Date.now() - upDelegate.getUploadStartTime());
                if (onUploadSpeed) {
                  onUploadSpeed(speed);
                }
                requestNetwork =
                  (Math.min(checkpoint.fileSize, partSize) / 1024 / res.rt) *
                  1000; // KB/S
              }
              if (!progress) return;
              progress({
                total: file.size,
                loaded: file.size * percent,
                percent: percent * 100,
                requestNetwork,
              });
            },
          })
          .then(
            (res: any) => {
              upDelegate.endUpload();
              fileAdd(
                file,
                {
                  longTermUrl: !!longTermUrl,
                  /** 业务线 */
                  businessCode: options.businessCode,
                  /** 产品模块 */
                  productCode: options.productCode,
                  /** 拓展码 */
                  extCode: options.extCode,
                },
                uploadResourceUrl
              ).then(
                ({ resourceList }: any) => {
                  delete FileMap[file._key];
                  resolve(resourceList[0]);
                },
                (err: Error) => {
                  // upDelegate.sendSentryEvent(err);
                  upDelegate.sendTrackEvent({
                    text1: { value: "error", desc: "上传类型" },
                    text2: {
                      value: err ? JSON.stringify(err) : "",
                      desc: "fileadd-selector",
                    },
                  });
                  reject(ERRORS.ADD_RESOURCE_FAILED);
                }
              );
            },
            (err: any) => {
              // upDelegate.sendSentryEvent(err);
              upDelegate.sendTrackEvent({
                text1: { value: "error", desc: "上传类型" },
                text2: {
                  value: err ? JSON.stringify(err) : "",
                  desc: "alioss-selector",
                },
                text3: {
                  value: FileMap[file._key]?.requestId || "",
                  desc: "requestId",
                },
              });
              if (!isNull(retryTimes) && retryTimes >= 0) {
                upDelegate.sendTrackEvent({
                  text1: { value: "resume", desc: "上传类型" },
                  text6: {
                    value: {
                      start: Date.now(),
                      end: null,
                      usedTimeReTime:
                        Date.now() - upDelegate.getUploadStartTime(),
                    },
                    desc: "上传时间",
                  },
                });
                resumeUploadAli(file);
              } else {
                reject(ERRORS.UPLOAD_FAILED);
              }
            }
          );
      },
      (err: Error) => {
        // upDelegate.sendSentryEvent(err);
        upDelegate.sendTrackEvent({
          text1: { value: "error", desc: "上传类型" },
          text2: {
            value: err ? JSON.stringify(err) : "",
            desc: "getUploadToken-selector",
          },
        });
        reject(ERRORS.GET_TOKEN_FAILED);
      }
    );
  });
}

export { cancelUploadAli, resumeUploadAli, ERRORS };
export default upload;
