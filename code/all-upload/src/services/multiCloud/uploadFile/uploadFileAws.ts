import awsOSS from "aws-sdk/clients/s3";
import tenantConfig, { ERRORS } from "../../../config/config";
import getFileExtension from "@tezign/commons.js/functions/getFileExtension";
import UploadDelegate from "@tezign/commons.js/functions/uploadDelegate";
import { isNull, isNumber } from "../../utils";
import { fileAdd, getUploadFeedConfig } from "src/services/service";
import { IFeedConfig, IUploadedFile, IUploadedFileOptions } from "../types";
import AwsSingleFileUpload from "../aws-upload";
const mime = require("mime"); // ⇨ 'text/plain'

const FileMap: { [str: string]: any } = {};

function cancelUploadAws(file: any) {
  console.log("file", file);
  const res = FileMap[file._key];
  if (!res) return false;
  if (res && res.uploadDelegate) {
    res.uploadDelegate.cancelUpload();
  }
  if (res) {
    res.awsUploadObj?.stopUpload();
  }
  return true;
}

function resumeUploadAws(file: any) {
  console.log("file", file);
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
    partSize = 10 * 1024 * 1024,
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
        let key: string;
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
        const client = new awsOSS({
          accessKeyId: feed.accessKeyId,
          secretAccessKey: feed.accessKeySecret,
          region: feed.region,
          sessionToken: feed.securityToken,
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
        FileMap[file._key].awsUploadObj = new AwsSingleFileUpload({
          creor: { cloud: client, config: feed, key },
          uploadId: FileMap[file._key].checkpoint?.uploadId,
          file: file,
          partSize,
          onProgressFun: ((file: any) => {
            let prevTime = Date.now();
            let prevSize: number = 0;
            return (loaded: number) => {
              // 已上传大小
              if (prevSize === 0) {
                // 可能是resume，prevSize被重置
                prevSize = loaded;
              }
              var nextTime = Date.now();
              var speed =
                Math.max(
                  0,
                  Math.round(
                    ((loaded - prevSize) / ((nextTime - prevTime) / 1000)) * 100
                  ) / 100
                ) || 0;
              prevTime = nextTime;
              prevSize = loaded;
              var requestNetwork = Math.round((speed / 1024) * 100) / 100;
              console.log("------speed1", speed, requestNetwork, file);

              var percent =
                loaded / file.size >= 0.99 ? 0.99 : loaded / file.size;
              if (FileMap[file._key]) {
                FileMap[file._key].checkpoint = {
                  ...FileMap[file._key].checkpoint,
                  file: file,
                  fileSize: file.size,
                  name: file.name,
                  uploadId: FileMap[file._key].awsUploadObj.uploadId,
                };
              }
              upDelegate.updateUploadedFileSize(file.size);
              if (onUploadSpeed) {
                onUploadSpeed(speed);
              }

              progress?.({
                total: file.size,
                loaded: loaded,
                percent: percent * 100,
                requestNetwork,
              });
            };
          })(file),
          onUploadSuccess: () => {
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
          onUploadError: (err: any) => {
            console.error(err);
            if (err) {
              if (err.message === "Request aborted") {
                console.log("暂停上传");
                return;
              }
              upDelegate.sendTrackEvent({
                text1: { value: "error", desc: "上传类型" },
                text2: {
                  value: err ? JSON.stringify(err) : "",
                  desc: "aws-selector",
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
                resumeUploadAws(file);
              } else {
                reject(ERRORS.UPLOAD_FAILED);
              }
              return;
            }
          },
        });
        FileMap[file._key].checkpoint = checkpoint;
        FileMap[file._key].awsUploadObj.beginUpload();
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

export { cancelUploadAws, resumeUploadAws, ERRORS };
export default upload;
