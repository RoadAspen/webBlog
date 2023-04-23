import COS from "cos-js-sdk-v5";
import tenantConfig, { ERRORS } from "../../../config/getconfigdata";
import getFileExtension from "@tezign/commons.js/functions/getFileExtension";
import UploadDelegate from "@tezign/commons.js/functions/uploadDelegate";
import { isNull, isNumber } from "../../utils";
import { fileAdd, getUploadFeedConfig } from "src/services/service";
import { IFeedConfig, IUploadedFile, IUploadedFileOptions } from "../types";
const mime = require("mime"); // ⇨ 'text/plain'

const FileMap: { [str: string]: any } = {};

/** 暂停 */
function cancelUploadTencent(file: any) {
  const res = FileMap[file._key];
  if (!res) return false;
  if (res.uploadDelegate) {
    res.uploadDelegate.cancelUpload();
  }
  file.taskId && res.cloud?.pauseTask(file.taskId);
  delete FileMap[file._key];
  return true;
}
/** 重试 */
function resumeUploadTencent(file: any) {
  const res = FileMap[file._key];
  if (!res) return false;
  if (res.uploadDelegate) {
    res.uploadDelegate.resumeUpload();
  }
  return res.taskId && res.cloud?.restartTask(res.taskId);
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
  upDelegate.startUpload?.();
  // 导出上传代理实例
  options.getUploadDelegate?.(upDelegate);

  // decrement retrytimes
  if (!isNull(retryTimes) && isNumber(retryTimes)) {
    retryTimes = Number(retryTimes) - 1;
  }

  let {
    partSize = 1024 * 1024 * 1,
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

        const client = new COS({
          ChunkSize: partSize,
          SliceSize: partSize,
          // 必选参数
          getAuthorization: async function (option, callback) {
            callback({
              TmpSecretId: feed.accessKeyId,
              TmpSecretKey: feed.accessKeySecret,
              SecurityToken: feed.securityToken,
              StartTime: Math.round(new Date().getTime() / 1000),
              ExpiredTime: Math.round(new Date().getTime() / 1000) + 900, // 900秒
              ScopeLimit: true,
            });
          },
          ProgressInterval: 1000, // ms   Progress 触发间隔 ， 默认 1000 ms
          Timeout: 600 * 1000, // 单位 ms
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
        const checkpoint = resume ? res.checkpoint : null;
        FileMap[file._key].checkpoint = checkpoint;
        client
          .uploadFile({
            Region: feed.region,
            Bucket: feed.bucketName,
            Body: file,
            Key: key,
            onTaskReady: function (taskId) {
              FileMap[file._key].taskId = taskId;
            },
            onProgress({ percent, speed, total, loaded }) {
              if (FileMap[file._key]) {
                FileMap[file._key].checkpoint = {
                  ...FileMap[file._key].checkpoint,
                  file: file,
                  fileSize: file.size,
                  name: file.name,
                };
              }
              let requestNetwork = Math.round((speed / 1024) * 100) / 100; // KB/S
              upDelegate.updateUploadedFileSize(total);
              if (onUploadSpeed) {
                onUploadSpeed(speed);
              }

              progress?.({
                total: total,
                loaded: loaded,
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
                  businessCode: options?.businessCode,
                  /** 产品模块 */
                  productCode: options?.productCode,
                  /** 拓展码 */
                  extCode: options?.extCode,
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
                  desc: "tencent-cos-selector",
                },
                text3: {
                  value: FileMap[file._key]?.requestId || "",
                  desc: "requestId",
                },
              });
              if (!isNull(retryTimes) && Number(retryTimes) >= 0) {
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
                resumeUploadTencent(file);
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

export { cancelUploadTencent, resumeUploadTencent, ERRORS };
export default upload;
