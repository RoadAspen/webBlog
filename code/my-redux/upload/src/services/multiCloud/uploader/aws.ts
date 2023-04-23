const getFileExtension = require("@tezign/commons.js/functions/getFileExtension");
import awsOSS from "aws-sdk/clients/s3";
import { createAWS } from "../create";
import mime from "mime";
import {
  IFile,
  ICheckpoint,
  IUploadProgress,
  EUploadStatus,
  EUploadSource,
  MultiUploadBase,
  IFeedConfig,
  IFileStack,
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
import { fileAdd } from "src/services/service";
import AwsSingleFileUpload from "../aws-upload";

interface Creor {
  key: string;
  cloud: awsOSS;
  config: IFeedConfig;
}

/** AWS 分片上传 */
export default class AwsUploader extends MultiUploadBase {
  /**创建AWS实例 */
  create = (file: IFile, keyString?: string) => {
    const extensionName = getFileExtension(file.name);
    return createAWS(extensionName, keyString ?? undefined);
  };
  // 上传进度
  onProgress = (file: IFile) => {
    let prevTime = Date.now();
    let prevSize: number = 0;
    // 已上传大小
    return (progressLoaded: number = 0) => {
      const stack = this.getOssClientByUnique(file.unique);
      var nextTime = Date.now();
      /** progress 触发间隔 0.5s  */
      if (nextTime - prevTime < 500 && progressLoaded !== file._size) {
        return;
      }
      var speed =
        Math.max(
          0,
          Math.round(
            ((progressLoaded - prevSize) / ((nextTime - prevTime) / 1000)) * 100
          ) / 100
        ) || 0;
      prevTime = nextTime;
      prevSize = progressLoaded;
      var requestNetwork = Math.round((speed / 1024) * 100) / 100;

      var percentage =
        progressLoaded / file._size >= 0.99
          ? 0.99
          : progressLoaded / file._size;
      console.log(
        "网速" + speed + " bit/s",
        requestNetwork + " KB/s",
        "进度" + (percentage * 100).toFixed(2) + "%"
      );

      if (
        stack &&
        stack.resource.uploadStatus === EUploadStatus.ing &&
        percentage > stack.resource.percentage
      ) {
        stack.checkpoint = {
          ...stack.checkpoint,
          file: stack.resource,
          fileSize: stack.resource.size,
          name: stack.resource.name,
          uploadId: stack.awsUploadObj.uploadId,
        };
        stack.resource.requestNetwork = requestNetwork; // KB/S
        stack.resource.percentage = percentage;
        if (stack.resource.uploadSource != EUploadSource.none) {
          CheckPoint.set(stack.resource, stack.checkpoint);
        }
        sendTrackEventNetWork(stack, stack.resource.requestNetwork);
        stack.fileEvent?.onProcess(percentage, stack.resource);
        console.log("进度1：", stack);
      }
    };
  };

  /**
   * 多文件上传处理
   * @param creor
   * @param file
   * @param checkpoint
   */
  _multipartUpload = async (
    creor: Creor,
    file: IFile,
    checkpoint?: ICheckpoint
  ) => {
    const that = this;
    // 上传列表
    const stackInfo = that.getOssClientByUnique(file.unique);
    if (!stackInfo) return Promise;

    creor.config && (stackInfo.config = creor.config);
    try {
      // 文件大小为了0的，直接提示错误
      // @TODO: tencent 逻辑不一致
      if (file?._size === 0) {
        stackInfo.upDelegate.sendTrackEvent({
          text1: { value: "error-file", desc: "上传大小" },
          text3: { value: JSON.stringify(file), desc: "file" },
        });
        throw "文件不能为空";
      }
      if (stackInfo.retryTimes === that.RETRYTIMES) {
        stackInfo.upDelegate?.startUpload();
      }
      // 重置上传对象，重新请求已上传分块
      stackInfo.awsUploadObj = new AwsSingleFileUpload({
        creor: creor,
        uploadId: checkpoint?.uploadId,
        file: file,
        onProgressFun: that.onProgress(file),
        onUploadSuccess: async () => {
          console.log("上传成功，onUploadSuccess 开始执行 fileAdd");
          // 开始下个文件的上传
          const res = await stackInfo.fileEvent?.onUploadBucketSuccess(
            stackInfo
          );
          that.uploadSuccess(
            stackInfo.resource,
            res,
            stackInfo.fileEvent?.onCreateResourceSuccess
          );
          stackInfo.upDelegate?.endUpload();
          sendTrackEventSuccess(stackInfo, stackInfo.awsUploadObj.uploadId);
        },
        onUploadError: (err: any) => {
          if (stackInfo) {
            if (stackInfo.retryTimes > 0) {
              //重试上传机制
              sendTrackEventErrorPart(stackInfo, err);
              stackInfo.retryTimes = stackInfo.retryTimes - 1;
              stackInfo.resource.uploadStatus = EUploadStatus.wait;
              that.toUpload(stackInfo.resource);
            } else {
              sendTrackEventError(stackInfo, err);
              if (stackInfo.resource.uploadStatus === EUploadStatus.ing)
                stackInfo.resource.uploadStatus = EUploadStatus.error;
              stackInfo.fileEvent?.onError &&
                stackInfo.fileEvent.onError(err, stackInfo.resource);
              // 上传失败，会上传下一个
              that.uploadNextFile(stackInfo.resource.uploadSource);
            }
          }
        },
      });
      console.log("开始上传", stackInfo.awsUploadObj);
      await stackInfo.awsUploadObj.beginUpload();
    } catch (ex: any) {
      if (stackInfo) {
        if (stackInfo.retryTimes > 0) {
          //重试上传机制
          sendTrackEventErrorPart(stackInfo, ex);
          stackInfo.retryTimes = stackInfo.retryTimes - 1;
          stackInfo.resource.uploadStatus = EUploadStatus.wait;
          that.toUpload(stackInfo.resource);
        } else {
          sendTrackEventError(stackInfo, ex);
          if (stackInfo.resource.uploadStatus === EUploadStatus.ing)
            stackInfo.resource.uploadStatus = EUploadStatus.error;
          stackInfo.fileEvent?.onError &&
            stackInfo.fileEvent.onError(ex, stackInfo.resource);
          // 上传失败，会上传下一个
          that.uploadNextFile(stackInfo.resource.uploadSource);
        }
      }
    }
  };
  /** 开始上传 */
  toUpload = (file: IFile) => {
    const that = this;
    const stackFile = that.getOssClientByUnique(file.unique);
    if (!stackFile || stackFile.resource.uploadStatus === EUploadStatus.ing)
      return;
    stackFile.resource.uploadStatus = EUploadStatus.ing;
    const checkPointFileInfo = CheckPoint.getSource(file);
    /** 如果是 metadata 或者 草稿箱， 则首先考虑采用断点的key */
    const key =
      stackFile.resource.uploadSource !== EUploadSource.none
        ? checkPointFileInfo?.source.key
        : stackFile.resource.key;
    that
      .create(file, key || null)
      .then((creor) => {
        const extensionName = getFileExtension(file.name);
        file.key = creor.key;

        if (mime.getType(extensionName)) {
          file._type = mime.getType(extensionName);
        }
        //设置AWS
        if (stackFile) {
          stackFile.AWS = creor.cloud;
          stackFile.config = creor.config;
          if (stackFile.resource.uploadSource !== EUploadSource.none) {
            stackFile.checkpoint =
              stackFile.checkpoint || checkPointFileInfo?.ckPoint || null;
          }
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
  uploadNextFile = (uploadSource: EUploadSource) => {
    const that = this;
    const fileIng = that.fileProcessStack.filter(
      (file) =>
        file.resource.uploadStatus === EUploadStatus.ing &&
        file.resource.uploadSource === uploadSource
    );
    if (!fileIng.length) {
      const fileWait = that.fileProcessStack.find(
        (file) =>
          file.resource.uploadStatus === EUploadStatus.wait &&
          file.resource.uploadSource === uploadSource
      );
      if (fileWait) that.toUpload(fileWait.resource);
    }
  };
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
        stackInfo.awsUploadObj.stopUpload();
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
      const fileIng = that.fileProcessStack.find(
        (file) => file.resource.uploadStatus === EUploadStatus.ing
      );
      if (!fileIng) {
        stackInfo.resource.uploadStatus = EUploadStatus.ing;
        that._multipartUpload(
          {
            cloud: stackInfo.AWS,
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

        await stackInfo.awsUploadObj?.abortMultipartUpload?.();
        sendTrackEventCancel(stackInfo);
        // stackInfo.resource.uploadStatus = EUploadStatus.abort;
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
          stackInfo.awsUploadObj.abort();
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
