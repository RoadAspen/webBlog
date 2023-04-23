const getFileExtension = require("@tezign/commons.js/functions/getFileExtension");
import aliOSS from "ali-oss";
import { debounce } from 'lodash';
import { createOSS } from "../create";
import mime from "mime";
import {
  IFile,
  ICheckpoint,
  IUploadProgress,
  EUploadStatus,
  EUploadSource,
  MultiUploadBase,
  IFeedConfig,
  ICacheFeedConfig,
} from "../types";
import { CheckPoint } from "../file-checkpoint";
import {
  sendTrackEventCancel,
  sendTrackEventError,
  sendTrackEventErrorAPI,
  sendTrackEventErrorPart,
  sendTrackEventNetWork,
  sendTrackEventPause,
  sendTrackEventResume,
  sendTrackEventSuccess,
} from "../../tools";
import { getFileKeyName } from "../../utils";
import { abortMultiCloud } from "src/services/service";

export default class AliUploader extends MultiUploadBase {
  // 缓存的token信息
  private policyConfig: ICacheFeedConfig;

  // 前端设置的token有效时间(50min,后端写死了60min)
  protected LIFE_SPAN = 50 * 60 * 1000;

  // 默认上传分片个数
  protected DEFAULT_PARALLEL = 5;

  // 默认分片上传的最大限制
  protected DEFAULT_PART_SIZE = 1024 * 1024;

  /**
   * 创建OSS实例
   * @param file 文件实例
   * @param keystring 文件已生成的oss文件名
   * @returns
   */
  create = async (file: IFile, keyString?: string) => {
    // 未获取token || token 过期 重新获取token
    if (
      !this.policyConfig ||
      this.policyConfig.createTime < Date.now() - this.LIFE_SPAN
    ) {
      const { cloud, config } = await createOSS();
      this.policyConfig = {
        config,
        cloud,
        createTime: Date.now(),
      };
    }
    const extensionName = getFileExtension(file.name);
    const { config, cloud } = this.policyConfig;
    const key = getFileKeyName(
      config.dir,
      extensionName,
      keyString ?? undefined
    );
    return {
      cloud,
      config,
      key,
    };
  };

  /**
   * 多文件上传处理
   * @param creor
   * @param file
   * @param checkpoint
   */
  _multipartUpload = async (
    creor: { key: string; cloud: aliOSS; config: IFeedConfig },
    file: IFile,
    checkpoint?: ICheckpoint
  ) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(file.unique);
    const {
      option: { parallel = this.DEFAULT_PARALLEL, partSize = this.DEFAULT_PART_SIZE },
    } = stackInfo;
    if (!stackInfo) return Promise;
    creor.config && (stackInfo.config = creor.config);
    try {
      const uploadProgress: IUploadProgress = {
        progress: (percentage: number, checkpoint: ICheckpoint, res: any) => {
          // console.log("分片上传progress返回数据:", percentage, checkpoint, res);
          // 小于100KB 的文件,获取 checkpoint ,res ;时间只能忽略;
          const stack = that.getOssClientByUnique(file.unique);
          if (
            stack &&
            stack.resource.uploadStatus === EUploadStatus.ing &&
            percentage > stack.resource.percentage
          ) {
            stack.checkpoint = checkpoint;
            stack.resource.percentage = percentage;
            if (res) stack.resource.requestId = res.headers["x-oss-request-id"];
            CheckPoint.set(stack.resource, checkpoint);
            if (checkpoint) {
              // 计算文件剩余分片数量 , 加上保底数量1;
              const { fileSize, doneParts, partSize } = checkpoint;
              const total = partSize * doneParts.length;
              const surplusParts = Math.max(
                Math.ceil((fileSize - total) / partSize),
                1
              );
              // 进行中的并行上传分片数量: 取剩余分片与分片参数最小值
              // 存在多文件并发上传时,取最大并发值;
              const networkComputedTimes =
                this.concurrentNum === 1
                  ? Math.min(surplusParts, parallel)
                  : parallel;
              stack.resource.requestNetwork =
                (Math.min(fileSize, partSize) / 1024 / res.rt) *
                networkComputedTimes *
                1000; // KB/S
              sendTrackEventNetWork(
                stackInfo,
                stack.resource.requestNetwork,
                res.headers?.["x-oss-request-id"]
              );
            }
            stack.fileEvent?.onProcess(percentage, stack.resource);
          }
        },
        timeout: 600000,
        parallel,
        partSize,
      };
      // 文件大小为了0的，直接提示错误
      // @TODO: tencent 逻辑不一致
      if (file?._size === 0) {
        stackInfo.upDelegate.sendTrackEvent({
          text1: { value: "error-file", desc: "上传大小" },
          text3: { value: JSON.stringify(file), desc: "file" },
        });
        // @TODO: 观察埋点，临时注销
        // throw "文件不能为空";
      }
      // if (stackInfo.retryTimes === that.RETRYTIMES) {
      //   stackInfo.upDelegate?.startUpload();
      // }
      checkpoint && (uploadProgress.checkpoint = checkpoint);
      const uploadRes = await creor.cloud.multipartUpload(
        creor.key,
        file,
        uploadProgress
      );
      // console.log("multipartUpload-完成后的返回值：", uploadRes);
      // 开始下个文件的上传
      const res = await stackInfo.fileEvent?.onUploadBucketSuccess(stackInfo);
      that.uploadSuccess(
        stackInfo.resource,
        res,
        stackInfo.fileEvent?.onCreateResourceSuccess
      );
      // stackInfo.upDelegate?.endUpload();
      const requestId = (uploadRes?.res?.headers as { [key: string]: string })[
        "x-oss-request-id"
      ];
      sendTrackEventSuccess(stackInfo, requestId);
    } catch (ex: any) {
      if (stackInfo) {
        if (ex && ex.name === "cancel") {
          return;
        } else if (stackInfo.retryTimes > 0) {
          //重试上传机制
          if (ex && ex.code === "NoSuchUpload") {
            CheckPoint.remove(stackInfo.resource);
            stackInfo.resource.percentage = 0;
            stackInfo.checkpoint = null;
          } else {
            sendTrackEventErrorPart(stackInfo, ex);
          }
          stackInfo.retryTimes = stackInfo.retryTimes - 1;
          stackInfo.resource.uploadStatus = EUploadStatus.wait;
          that.toUpload(stackInfo.resource);
        } else {
          sendTrackEventError(stackInfo, ex);
          if (stackInfo.resource.uploadStatus === EUploadStatus.ing) {
            stackInfo.resource.uploadStatus = EUploadStatus.error;
            stackInfo.fileEvent?.onError &&
              stackInfo.fileEvent.onError(ex, stackInfo.resource);
          }
          // 上传下一个
          that.uploadNextFile(stackInfo.resource.uploadSource);
        }
      }
    }
  };
  /**
   * OSS上传
   * @param file 文件实例
   * @returns
   */
  toUpload = (file: IFile) => {
    const that = this;
    // 中断后继续上传时,去队列里获取信息;
    const stackFile = that.getOssClientByUnique(file.unique);
    if (!stackFile || stackFile.resource.uploadStatus === EUploadStatus.ing)
      return;
    stackFile.resource.uploadStatus = EUploadStatus.ing;
    const checkPointFileInfo = CheckPoint.getSource(file);
    /** 如果是 metadata 或者 草稿箱， 则首先考虑采用断点的key */
    const key = checkPointFileInfo?.source.key || stackFile.resource.key;
    that
      .create(file, key || null)
      .then((creor) => {
        const extensionName = getFileExtension(file.name);
        file.key = creor.key;

        if (mime.getType(extensionName)) {
          file._type = mime.getType(extensionName);
        }
        //设置OSS
        if (stackFile) {
          stackFile.OSS = creor.cloud;
          stackFile.config = creor.config;
          stackFile.checkpoint =
            stackFile.checkpoint || checkPointFileInfo?.ckPoint || null;
          that._multipartUpload(creor, file, stackFile.checkpoint);
        }
      })
      .catch((err) => {
        // 断网的情况下createOss失败会在此被捕获，不会重试上传
        const stackFile = that.getOssClientByUnique(file.unique);
        stackFile.resource.uploadStatus = EUploadStatus.error;
        stackFile.fileEvent?.onError &&
          stackFile.fileEvent.onError(err, stackFile.resource);
        sendTrackEventErrorAPI(stackFile, err);
        that.uploadNextFile(stackFile.resource.uploadSource);
      });
  };
  /**
   * 自动开启队列中wait状态中的文件进行上传
   */
  uploadNextFile =  debounce((uploadSource: EUploadSource) => {
    const that = this;

    // 当前上传中的文件总大小 
    let totalSize = 0;

    // 当前上传中的文件大小的最大限制
    let MaxSize = this.DEFAULT_PARALLEL * this.DEFAULT_PART_SIZE;

    const fileIng = that.fileProcessStack.filter(
      (file) => {
        const flag = file.resource.uploadStatus === EUploadStatus.ing &&
        file.resource.uploadSource === uploadSource;
        if(flag) {
          totalSize = totalSize + file.resource.size;
        }
        return flag;
      }
        
    );

    // 正在上传的文件数量
    let fileIngNumber = fileIng.length;
    if (fileIngNumber < this.concurrentNum && totalSize < MaxSize) {
      for(let i = 0; i < that.fileProcessStack.length; i++) {
        // 维持正在上传的文件个数和总大小在一个限度内，超过就不继续新增2
        if(fileIngNumber >= this.concurrentNum || totalSize >= MaxSize) {
          break;
        };

        const item = that.fileProcessStack[i];
        if(item.resource.uploadStatus === EUploadStatus.wait &&
          item.resource.uploadSource === uploadSource) {
            fileIngNumber = fileIngNumber + 1;
            totalSize = totalSize + item.resource.size;
            // 这里把等待队列的文件放入上传队列中
            that.toUpload(item.resource);
          }
      }
    }
  }, 50)
  /**
   * 暂停上传(可恢复上传)
   * @param key 资源唯一KEY
   */
  cancelUpload = (unique: string, status?: EUploadStatus) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    if (stackInfo) {
      stackInfo.resource.uploadStatus = status || EUploadStatus.cancel;
      try {
        //@ts-ignore
        stackInfo.OSS?.cancel();
        sendTrackEventPause(stackInfo);
      } catch (ex) {}
      that.uploadNextFile(stackInfo.resource.uploadSource);
    }
  };
  /**
   * 恢复上传取消上传的文件
   */
  resumeUpload = (unique: string) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    sendTrackEventResume(stackInfo);
    if (stackInfo) {
      //如果有正在上传中的文件，需要排队等待
      const fileing = that.fileProcessStack.find(
        (file) => file.resource.uploadStatus === EUploadStatus.ing
      );
      if (!fileing) {
        stackInfo.resource.uploadStatus = EUploadStatus.ing;
        that._multipartUpload(
          {
            cloud: stackInfo.OSS,
            key: stackInfo.resource.key,
            config: stackInfo.config,
          },
          stackInfo.resource,
          stackInfo.checkpoint
        );
      } else if (stackInfo.resource.uploadStatus !== EUploadStatus.ing) {
        stackInfo.resource.uploadStatus = EUploadStatus.wait;
      }
    }
  };
  /**
   * 终止上传(不可恢复上传)
   */
  abortMultipartUpload = async (unique: string) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    try {
      if (
        stackInfo &&
        stackInfo.resource.uploadStatus !== EUploadStatus.success
      ) {
        stackInfo.resource.uploadStatus = EUploadStatus.abort;
        //@ts-ignore
        stackInfo.OSS?.cancel();
        sendTrackEventCancel(stackInfo);
        // stackInfo.resource.uploadStatus = EUploadStatus.abort;
        if (stackInfo.checkpoint) {
          await abortMultiCloud(
            stackInfo.checkpoint.name,
            stackInfo.checkpoint.uploadId
          );
        }
      }
    } catch (ex) {
      console.error(ex);
    }
    that.clearFilestackByUnique(unique);
    if (stackInfo) that.uploadNextFile(stackInfo.resource.uploadSource);
  };

  /**
   * 暂停所有文件和，包括上传中的和等待上传的
   */
  cancelUploadAll = () => {
    const that = this;
    that.fileProcessStack.forEach((stackInfo) => {
      if (stackInfo) {
        if (stackInfo.resource.uploadStatus === EUploadStatus.ing) {
          stackInfo.resource.uploadStatus = EUploadStatus.cancel;
          //@ts-ignore
          stackInfo.OSS?.cancel();
        } else if (stackInfo.resource.uploadStatus === EUploadStatus.wait) {
          stackInfo.resource.uploadStatus = EUploadStatus.cancel;
        }
      }
    });
    that.mitt();
  };

  /** 全部重试失败项 */
  resumeUploadErrorAll = (uploadSource: EUploadSource) => {
    const that = this;
    that.fileProcessStack.forEach((stackInfo) => {
      if (stackInfo) {
        if (stackInfo.resource.uploadStatus === EUploadStatus.error) {
          stackInfo.resource.uploadStatus = EUploadStatus.wait;
        }
      }
    });
    that.uploadNextFile(uploadSource);
    that.mitt();
  };

  /**清除断点资源 */
  clearPointSource = (unique: string, up_source?: EUploadSource) => {
    CheckPoint.removeByUnique(unique, up_source);
  };
}

/**
 * 上传中
 *  暂停： cancelUpload
 *  取消： abortMultipartUpload
 *
 * 排队中
 *  取消： clearFilestackByUnique
 *
 * 上传失败
 *  取消： clearFilestackByUnique
 *  重试： resumeUpload
 *
 * 上传完成
 *  删除： clearFilestackByUnique‘
 *
 * 全部暂停： cancelUploadAll
 *
 * 全部取消： removeUnsuccessAll
 *
 * 全部继续： resumeUploadAll
 *
 * 获取进度信息： processInfo
 *
 * 清除全部失败项: removeErrorAll
 *
 * 全部重试失败项: resumeUploadErrorAll
 *
 * 批量清除: clearByUniques
 */
