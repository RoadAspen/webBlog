const getFileExtension = require("@tezign/commons.js/functions/getFileExtension");
import COS from "cos-js-sdk-v5";
import { createCOS } from "../create";
import mime from "mime";
import {
  IFile,
  IFileStack,
  ICheckpoint,
  EUploadStatus,
  EUploadSource,
  MultiUploadBase,
  IFeedConfig,
} from "../types";
import { CheckPoint } from "../file-checkpoint";
import {
  sendTrackEventCancel,
  sendTrackEventError,
  sendTrackEventErrorAPI,
  sendTrackEventErrorPart,
  sendTrackEventNetWork,
} from "../../tools";
import { fileAdd } from "src/services/service";
export default class TencentUploader extends MultiUploadBase {
  /**创建上传实例 */
  create = (file: IFile, keystring?: string) => {
    const extensionName = getFileExtension(file.name);
    return createCOS(extensionName, keystring ?? undefined);
  };
  /**
   * @description 分块上传处理
   * @param creor {key} 通过相同key 实现 暂停重新上传
   * @param file
   * @param checkpoint 记录断点 key，腾讯云续传需要相同key
   */
  _multipartUpload = async (
    creor: {
      key: string;
      cloud: COS;
      config: IFeedConfig;
    },
    file: IFile,
    checkpoint?: ICheckpoint
  ) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(file.unique);
    if (!stackInfo) return Promise;

    checkpoint && (stackInfo.checkpoint = checkpoint);
    creor.config && (stackInfo.config = creor.config);

    try {
      if (stackInfo.retryTimes === that.RETRYTIMES) {
        stackInfo.upDelegate?.startUpload();
      }
      const onProgress = function (params: {
        speed: number;
        percent: number;
        loaded: number;
        total: number;
      }) {
        const { speed, percent } = params;
        const percentage = percent;
        const requestNetwork = Math.round((speed / 1024) * 100) / 100;
        const stack = that.getOssClientByUnique(file.unique);
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
          };
          stack.resource.percentage = percentage;
          CheckPoint.set(stack.resource, stack.checkpoint);
          stack.resource.requestNetwork = requestNetwork; // KB/S
          sendTrackEventNetWork(stackInfo, stack.resource.requestNetwork);
          stack.fileEvent?.onProcess(percentage, stack.resource);
          // console.log(
          //   "进度：" + percentage + "%; 速度：" + requestNetwork + "KB/s;"
          // );
        }
      };
      await creor.cloud.uploadFile({
        /* 存储桶所在地域，必须 */
        Bucket: creor.config?.bucketName,
        /* 存储桶所在地域，必须字段 */
        Region: creor.config?.region,
        /** 如果是断点续传，则需要传之前已经存在的key */
        Key: creor.key,
        Body: file,
        onTaskReady: function (taskId) {
          stackInfo.taskId = taskId;
        },
        onProgress: onProgress,
      });
      // 开始下个文件的上传
      const res = await stackInfo.fileEvent?.onUploadBucketSuccess(stackInfo);
      /** 上传成功 */
      that.uploadSuccess(
        stackInfo.resource,
        res,
        stackInfo.fileEvent?.onCreateResourceSuccess
      );
      stackInfo.upDelegate?.endUpload();
    } catch (ex: any) {
      if (stackInfo) {
        if (ex && ex.name === "cancel") {
          return;
        } else if (stackInfo.retryTimes > 0) {
          //重试上传机制
          sendTrackEventErrorPart(stackInfo, ex);
          // 重置进度条
          that.resetErrorFileInfo(stackInfo);
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
  /**
   * @description 开始COS上传
   */
  toUpload = (file: IFile) => {
    const that = this;
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
          stackFile.COS = creor.cloud;
          stackFile.config = creor.config;
          stackFile.checkpoint = stackFile.checkpoint || checkPointFileInfo?.ckPoint || null;
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
   * 1、先上传 处于正在 ing 状态的文件，如果没有则执行第二步。
   * 2、自动开启队列中wait状态中的文件进行上传
   */
  uploadNextFile = (uploadSource: EUploadSource) => {
    const that = this;
    const fileing = that.fileProcessStack.filter(
      (file) =>
        file.resource.uploadStatus === EUploadStatus.ing &&
        file.resource.uploadSource === uploadSource
    );
    // 没有正在上传时的文件
    if (!fileing.length) {
      // 是否存在等待中的文件
      const filewait = that.fileProcessStack.find(
        (file) =>
          file.resource.uploadStatus === EUploadStatus.wait &&
          file.resource.uploadSource === uploadSource
      );
      if (filewait) {
        if (filewait.taskId) {
          // 重启
          filewait.resource.uploadStatus = EUploadStatus.ing;
          filewait.COS?.restartTask(filewait.taskId);
        } else {
          that.toUpload(filewait.resource);
        }
      }
    }
  };

  /**
   * @description 上传失败，且超过重试次数，重置部分属性
   */
  resetErrorFileInfo = (stackInfo: IFileStack) => {
    stackInfo.fileEvent?.onProcess(0, stackInfo.resource);
    CheckPoint.remove(stackInfo.resource);
    stackInfo.COS?.cancelTask(stackInfo.taskId);
    stackInfo.taskId = undefined;
    stackInfo.resource.percentage = 0;
    stackInfo.checkpoint = null;
  };

  /**
   * 暂停上传(可恢复上传)
   */
  cancelUpload = (unique: string, status?: EUploadStatus) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    if (stackInfo) {
      stackInfo.resource.uploadStatus = status || EUploadStatus.cancel;
      // 暂停
      stackInfo.taskId && stackInfo.COS?.pauseTask(stackInfo.taskId);
      // 取消当前上传， 执行下一个等待中的上传任务
      that.uploadNextFile(stackInfo.resource.uploadSource);
    }
  };
  /**
   * 恢复上传 (暂停上传) cancelUpload 的文件
   * 腾讯提供 restartTask ，重启 pauseTask 暂停的文件
   */
  resumeUpload = (unique: string) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    if (stackInfo) {
      // 如果是error，则需要还原相关属性，重新上传时使用 toUpload
      if (stackInfo.resource.uploadStatus === EUploadStatus.error) {
        that.resetErrorFileInfo(stackInfo);
      }
      //如果有正在上传中的文件，需要排队等待
      const fileing = that.fileProcessStack.find(
        (file) => file.resource.uploadStatus === EUploadStatus.ing
      );
      if (!fileing) {
        if (stackInfo.resource.uploadStatus === EUploadStatus.error) {
          stackInfo.resource.uploadStatus = EUploadStatus.wait;
          // error 失败， 使用toUpload重新上传
          that.toUpload(stackInfo.resource);
        } else {
          // 根据taskId 重启
          if (stackInfo.taskId) {
            stackInfo.resource.uploadStatus = EUploadStatus.ing;
            stackInfo.COS?.restartTask(stackInfo.taskId);
          } else {
            // 如果没有，则执行上传
            that.toUpload(stackInfo.resource);
          }
        }
      } else if (stackInfo.resource.uploadStatus !== EUploadStatus.ing) {
        // 如果是error，则调用 toUpload，不使用restart， 重新上传
        stackInfo.resource.uploadStatus = EUploadStatus.wait;
      }
    }
  };
  /**
   * 终止上传(不可恢复上传)，重新上传会从新开始
   */
  abortMultipartUpload = async (unique: string) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    try {
      if (
        stackInfo &&
        stackInfo.COS &&
        stackInfo.checkpoint &&
        stackInfo.resource.uploadStatus !== EUploadStatus.success
      ) {
        stackInfo.resource.uploadStatus = EUploadStatus.abort;
        if (stackInfo.COS) {
          sendTrackEventCancel(stackInfo);
          if (stackInfo.checkpoint) {
            // 终止上传，默认删除腾讯云本地断点cache
            await stackInfo.COS.cancelTask(stackInfo.taskId);
            // 删除本地断点
            CheckPoint.remove(stackInfo.resource);
            // 删除远端文件碎片,建议腾讯云设置定期清理碎片
            // await stackInfo.COS.abortUploadTask({
            //   Bucket: stackInfo.config.bucketName,
            //   Region: stackInfo.config.region,
            //   Key: stackInfo.resource.key,
            //   Level: "file",
            // });
          }
        }
      }
    } catch (ex) {
      console.log("终止上传(不可恢复上传) error", ex);
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
          stackInfo.taskId && stackInfo.COS?.pauseTask(stackInfo.taskId);
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
          that.resetErrorFileInfo(stackInfo);
          stackInfo.resource.uploadStatus = EUploadStatus.wait;
        }
      }
    });
    that.uploadNextFile(uploadSource);
    that.mitt();
  };

  /**清除断点资源 */
  clearPointSource = (unique: string, up_source?: EUploadSource) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);

    if (
      stackInfo &&
      (up_source ? up_source === stackInfo.resource.uploadSource : true)
    ) {
      stackInfo.taskId && stackInfo.COS?.cancelTask(stackInfo.taskId);
    }
    CheckPoint.removeByUnique(unique, up_source);
  };

  /**批量清除成功项 */
  clearByUniques = (ids: number[]) => {
    const that = this;
    that.fileProcessStack.forEach((stackInfo) => {
      const canRemove =
        stackInfo &&
        ids.find(
          (id) => id === that.assetIdWithUnique[stackInfo.resource.unique]
        );
      if (canRemove) {
        that.clearFilestackByUnique(stackInfo.resource.unique);
      }
    });
    that.mitt();
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
 *  删除： clearFilestackByUnique
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
