import aliOSS from "ali-oss";
import tencentCOS from "cos-js-sdk-v5";
import awsS3 from "aws-sdk/clients/s3";
import { message } from "tezign-ui";
import { initResetFile } from "../tools";
import { CheckPoint } from "./file-checkpoint";
import UploadDelegate from "@tezign/commons.js/functions/uploadDelegate";
import {
  subscriptionCustomProcessOss,
  subscriptionCustomSuccessOss,
  subscriptiondraftOss,
  subscriptionOss,
  subscriptionUpSucessOss,
} from "./observer";
import { fileAdd } from "src/services/service";

interface IUploadedFile {
  description?: string;
  downloadUrl: string;
  id: number;
  md5?: string;
  name: string;
  path: string;
  pdf2pic: boolean;
  portfolioId?: string;
  size: number;
  sort?: string;
  thumbnail?: string;
  thunder?: string;
  thunderUrl?: string;
  type: string;
  url: string;
}

enum EUploadStatus {
  wait = "wait",
  cancel = "cancel",
  abort = "abort",
  success = "success",
  error = "error",
  ing = "ing",
  breakLink = "breakLink", //断开上传了如：上传到一半时强制刷新页面了，当用户再次选择相同的文件可以继续接着上次的断点处上传
}

enum EUploadSource {
  metadata = "metadata",
  draft = "draft",
  none = "none",
  combined_content = "combined_content",
}
/**
 * 选择的文件
 */
interface IFile extends File {
  path: string;
  name: string;
  type: string;
  lastModified: number;
  webkitRelativePath: string;
  isBreakpoint: boolean /**是否支持断点续传 */;
  unique: string;
  uploadStatus: EUploadStatus;
  uploadSource: EUploadSource; //上传来源
  replaceStatus: number; //替换1，保存两者2, 默认0
  /**上传时所处的目录 */
  directory?: {
    name: string;
    id: number;
  };
  key: string;
  percentage: number;
  assetId?: number;
  /**_ 序列化 */
  _path: string;
  _type: string;
  _name: string;
  _lastModified: number;
  _size: number;
  requestId: string;
  requestNetwork: number; //上传速度 KB/S
  groupId?: number;
  groupName?: string;
  uploadTime: number;
  /** 业务线 */
  businessCode?: string;
  /** 产品模块 */
  productCode?: string;
  /** 拓展码 */
  extCode?: string;
}

/**
 * 上传保存服务器成功后的资源信息
 */
interface IUploadRes extends IFile {
  resourceList: IUploadedFile[];
}

/**OSS文件处理进度 */
interface IFileStack {
  resource: IFile;
  checkpoint?: ICheckpoint;
  taskId?: string;
  /** 阿里云 oss */
  OSS?: aliOSS;
  /** 腾讯云cos */
  COS?: tencentCOS;
  /** 亚马逊云 */
  AWS?: awsS3;
  config?: IFeedConfig;
  fileEvent?: IFileEvent;
  retryTimes?: number;
  netWorkStep: number;
  upDelegate: {
    startUpload: () => void;
    endUpload: () => void;
    sendTrackEvent: (params: {
      [key: string]: { value: string; desc: string };
    }) => void;
    updateUploadedFileSize: (params: number) => void;
  };
  option?: IUploadOption;
  /** 亚马逊 */
  awsUploadObj?: any;
}
interface ICheckpoint {
  doneParts: { number: number; etag: string }[];
  file: IFile;
  fileSize: number;
  name: string;
  partSize: number;
  // 上传Id
  uploadId: string;
}

interface IUploadProgress {
  progress: (percentage: number, checkpoint: ICheckpoint, res: any) => void;
  checkpoint?: ICheckpoint;
  timeout: number;
  callback?: {
    /** After a file is uploaded successfully, the OSS sends a callback request to this URL. */
    url: string;
    /** The host header value for initiating callback requests. */
    host?: string;
    /** The value of the request body when a callback is initiated, for example, key=$(key)&etag=$(etag)&my_var=$(x:my_var). */
    body: string;
    /** The Content-Type of the callback requests initiatiated, It supports application/x-www-form-urlencoded and application/json, and the former is the default value. */
    contentType?: string;
    customValue?: object;
    /** extra headers, detail see RFC 2616 */
    headers?: object;
  };
  /** 切片大小 */
  partSize: number;
  /** 切片上传并发 */
  parallel: number;
}
interface IFileEvent {
  onProcess: (process: number, source: IFile) => void;
  onUploadBucketSuccess: (stackInfo: IFileStack) => Promise<any>;
  onCreateResourceSuccess: (res: IUploadRes) => void;
  onError?: (ex: Error, source: IFile) => void;
  // toNextFile:() => void;
}

interface IUploaderProps {
  /** actionUpload */
  onUploadBefore?: (
    files: IFile[]
  ) =>
    | Promise<{ result: boolean; files?: IFile[] }>
    | { result: boolean; files?: IFile[] };
  onUploadReady?: () => void;
  onUploadProcess?: (percent: number, source: IFile) => void;
  onUploadSuccess?: (res: IUploadRes) => void;
  onUploadError?: (error: Error | string, file?: IFile) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  option?: IUploadOption;
  fileAdd?: (stackInfo: IFileStack) => Promise<any>;
}

interface IUploadOption {
  maximum?: number;
  maximumTip?: string;
  directory?: boolean;
  className?: string;
  childComponentnoBubbling?: boolean;
  activeClassName?: string;
  uploadSource?: EUploadSource;
  groupId?: number;
  groupName?: string;
  /** 业务线 */
  businessCode?: string;
  /** 产品模块 */
  productCode?: string;
  /** 拓展码 */
  extCode?: string;
  /**是否长效token */
  longTermUrl?: boolean;
  /** 上传的文件类型 */
  accept?: string;
  /** 分片大小 默认1M */
  partSize?: number;
  /** 分片上传并发 默认5 */
  parallel?: number;
}
/**
 * 上传组件 对外暴露的方法
 */
interface IUploader {
  /**
   *  创建上传实例
   */
  create(
    file: IFile,
    keyString?: string
  ): Promise<{
    cloud: any;
    key: string;
    config: IFeedConfig;
  }>;
  /**
   *  如果是metadata 允许文件重名哦
   * @param {IFile} file 文件
   */
  compareFileHash(file: IFile): boolean;
  /**
   * 上传前校验，校验成功开始上传
   */
  actionUpload(files: IFile[], uploaderProps: IUploaderProps): void;
  /**
   * 获取上传队列与本地local(即断点续传)
   */
  getSource(uploadSource: EUploadSource): IFile[];
  /**
   * 设置上传来源与状态
   * 如:素材列表上传需转到草稿队列去上传
   */
  setFileInfo(params: {
    unique: string;
    isBreakpoint?: boolean;
    replaceStatus: number;
    uploadSource: EUploadSource;
  }): void;
  /**
   * 暂停上传（可继续）
   */
  cancelUpload(unique: string, status?: EUploadStatus): void;
  /**
   * 单个重新上传
   */
  resumeUpload(unique: string): void;
  /**
   * 终止上传（丢弃）
   */
  abortMultipartUpload(unique: string): void;
  /**
   * 全部暂停 所有文件，包括上传中的和等待上传的
   */
  cancelUploadAll(): void;
  /**
   * 全部继续，将所有cancel的文件改为wait，并且开始上传第一个wait的文件
   * @param {EUploadSource} uploadSource 资源来源
   */
  resumeUploadAll(uploadSource: EUploadSource): void;
  /**
   * 清除除上传成功success以外的所有的文件
   */
  removeUnsuccessAll(): void;
  /**
   * 全部重试失败项
   * @param {EUploadSource} uploadSource 资源来源
   */
  resumeUploadErrorAll(uploadSource: EUploadSource): void;
  /**
   * 清除全部失败项（从上传列表中删除）
   */
  removeErrorAll(): void;
  /**
   * 从本地队列删除单个资源
   */
  clearFilestackByUnique(unique: string): void;
  /**
   * 清空断点资源
   */
  clearPointSource(unique: string, up_source?: EUploadSource): void;
  /**
   * 批量清除成功项
   * @param {number[]} ids 上传资源列表id
   */
  clearByUniques(ids: number[]): void;
  /**
   *获取进度信息
   *
   */
  processInfo(fileList: IFile[]): {
    total: IFile[];
    wait: IFile[];
    cancel: IFile[];
    abort: IFile[];
    success: IFile[];
    error: IFile[];
    ing: IFile[];
    breakLink: IFile[];
    uploadSize: {
      finished: number;
      unfinished: number;
      rate: number;
    };
  };

  uploadSource?: EUploadSource;
}
/** 多云上传base类 */
abstract class MultiUploadBase implements IUploader {
  /**失败后重试次数 */
  RETRYTIMES = 5;
  /**
   * 上传队列
   */
  fileProcessStack: IFileStack[] = [];
  /**
   * 文件 assetId -> unique 映射，上传成功后添加
   */
  assetIdWithUnique: any = {};
  /**
   *  创建上传实例,区分云
   */
  uploadSource?: EUploadSource;
  observerKey: string | undefined;
  /**
   * 控制上传并发数量开关
   */
  concurrentNum?: number;

  constructor(key?: string, concurrentNum: number = 1) {
    this.observerKey = key;
    this.concurrentNum = concurrentNum;
  }
  abstract create(
    file: IFile,
    keyString?: string
  ): Promise<{
    cloud: any;
    key: string;
    config: IFeedConfig;
  }>;
  /**
   * private 方法
   * 根据unique获取上传的文件对象
   * */
  getOssClientByUnique = (unique: string) => {
    return this.fileProcessStack.find(
      (stack) => stack.resource.unique === unique
    );
  };
  // abstract getOssClientByUnique(unique: string): IFileStack;
  /**
   * private 方法
   * 执行订阅
   */
  // abstract mitt(): void;
  mitt = () => {
    if (this.observerKey) {
      // subscriptionOss<IFile[]>(this.getSource(EUploadSource.draft));
      subscriptionCustomProcessOss<IFile[]>(
        this.observerKey,
        this.getSource(EUploadSource.draft)
      );
      return;
    }
    subscriptionOss<IFile[]>(this.getSource(EUploadSource.draft));
    subscriptiondraftOss<IFile[]>(this.getSource(EUploadSource.draft));
  };

  /**
   *  如果是metadata 允许文件重名哦
   * @param {IFile} file 文件
   */
  // abstract compareFileHash(file: IFile): boolean;
  compareFileHash = (file: IFile) => {
    if (file.uploadSource === EUploadSource.metadata) return false;
    return true;
  };
  /**
   * 上传前校验，校验成功开始上传
   */
  // abstract actionUpload(files: IFile[], uploaderProps: IUploaderProps): void;
  actionUpload = (files: IFile[], uploaderProps: IUploaderProps) => {
    const that = this;
    const { onUploadBefore, onUploadReady, option } = uploaderProps;
    const { maximum, maximumTip, uploadSource, groupId, groupName } = option;
    const uniqueFiles: IFile[] = [];

    if (files.length > maximum) {
      message.error(maximumTip ? maximumTip : `一次只能上传 ${maximum} 个文件`);
      return;
    }
    files.forEach((file, index) => {
      /** 初始化文件的file参数 */
      initResetFile(file, index, uploadSource, groupId, groupName);
      /** 过滤掉系统文件 */
      const res = file._path.split("/").find((item) => item.indexOf(".") === 0);
      if (!res) uniqueFiles.push(file);

      // @TODO: 临时添加监控埋点观察
      // window?.TezignTracer?.track({
      //   eid: "46f1b3af32ba45b3817fd896e488314e",
      //   extra: {
      //     text1: { value: "info", desc: "file info" },
      //     text3: { value: JSON.stringify(file) },
      //   },
      // });
    });

    if (onUploadBefore) {
      Promise.resolve(onUploadBefore(uniqueFiles))
        .then((res) => {
          if (res.result !== false && res.files) {
            that.addFiles(res.files, uploaderProps);
            that.uploadNextFile(res.files[0].uploadSource);
            that.mitt();
            onUploadReady?.();
          }
        })
        .catch((ex) => {
          console.error(ex);
        });
    } else {
      that.addFiles(uniqueFiles, uploaderProps);
      that.uploadNextFile(uniqueFiles[0].uploadSource);
      onUploadReady?.();
    }
  };
  /**
   *  private 方法
   *  添加上传文件到上传队列
   */
  // abstract addFiles(files: IFile[], uploaderProps: IUploaderProps): void;
  addFiles = (files: IFile[], uploaderProps: IUploaderProps) => {
    const that = this;
    const {
      onUploadSuccess,
      fileAdd: fileAddCustom,
      onUploadProcess,
      onUploadError,
      option,
    } = uploaderProps;
    const add = (file: IFile, index: number) => {
      const event = {
        onProcess: (process: number, source: IFile) => {
          that.mitt();
          onUploadProcess && onUploadProcess(process, source);
        },
        onUploadBucketSuccess: async (stackInfo: IFileStack) => {
          that.uploadNextFile(file.uploadSource); // 上传成功后，执行下一次上传
          // 存在自定义上传完成回调
          if (fileAddCustom) {
            return await fileAddCustom?.(stackInfo);
          } else {
            return await fileAdd?.(stackInfo.resource, stackInfo.option);
          }
        },
        onCreateResourceSuccess: (res: IUploadRes) => {
          that.uploadNextFile(file.uploadSource);
          onUploadSuccess && onUploadSuccess(res);
          if (that.observerKey) {
            subscriptionCustomSuccessOss<IUploadRes>(that.observerKey, res);
          } else {
            subscriptionUpSucessOss<IUploadRes>(res);
          }
          that.mitt();
        },
        onError: (error: Error, file: IFile) => {
          onUploadError && onUploadError?.(error, file);
          that.getOssClientByUnique(file.unique).upDelegate?.sendTrackEvent({
            text1: { value: "error", desc: "上传错误" },
            text2: { value: error ? JSON.stringify(error) : "", desc: "error" },
            text3: { value: JSON.stringify(file), desc: "file" },
          });
          that.mitt();
        },
      };
      const upDelegate = new UploadDelegate({
        file: {
          name: file.name,
          size: file._size,
        },
      });
      if (index > -1) {
        that.fileProcessStack[index].resource = file;
        that.fileProcessStack[index].fileEvent = event;
        that.fileProcessStack[index].retryTimes = that.RETRYTIMES;
        that.fileProcessStack[index].upDelegate = upDelegate;
        that.fileProcessStack[index].netWorkStep = 0;
        that.fileProcessStack[index].option = option;
      } else {
        that.fileProcessStack.push({
          resource: file,
          fileEvent: event,
          retryTimes: that.RETRYTIMES,
          upDelegate,
          netWorkStep: 0,
          option: option,
        });
      }
    };
    files.forEach((file) => {
      if (that.compareFileHash(file)) {
        let num = -1;
        const resFile = that.fileProcessStack.find((item, index) => {
          //若有断点记录-需重设
          if (CheckPoint.sameFileHash(item.resource, file)) {
            num = index;
            return true;
          }
          return false;
        });
        if (!resFile) {
          add(file, -1);
        } else {
          if (resFile.resource.uploadStatus === EUploadStatus.breakLink) {
            const unique = resFile.resource.unique;
            const percentage = resFile.resource.percentage;
            resFile.resource = file;
            resFile.resource.unique = unique;
            resFile.resource.percentage = percentage;
            add(resFile.resource, num);
          }
        }
      } else {
        add(file, -1);
      }
    });
  };
  /**
   * 获取上传队列与本地local(即断点续传)
   */
  // abstract getSource(uploadSource: EUploadSource): IFile[];
  getSource = (uploadSource: EUploadSource) => {
    const that = this;
    const resources = that.fileProcessStack.map((item) => item.resource);
    //获取本地local 临时文件
    CheckPoint.get().forEach((item) => {
      const has = resources.find((source) => {
        const rest = CheckPoint.sameFileHash(item.source, source);
        return !!rest;
      });
      if (!has && item.source.uploadStatus !== EUploadStatus.abort) {
        //断点重新放回上传列表中
        that.fileProcessStack.push({
          resource: {
            ...item.source,
            uploadStatus: EUploadStatus.breakLink,
          } as IFile,
          retryTimes: that.RETRYTIMES,
          netWorkStep: 0,
          upDelegate: new UploadDelegate({
            file: {
              name: item.source._name,
              size: item.source._size,
            },
          }),
        });
        that
          .getOssClientByUnique(item.source.unique)
          .upDelegate?.sendTrackEvent({
            text1: { value: "process", desc: "断点续传" },
            text3: { value: JSON.stringify(item.source), desc: "file" },
          });
      }
    });
    return that.fileProcessStack
      .filter(
        (stack) =>
          stack.resource.uploadStatus != EUploadStatus.abort &&
          stack.resource.uploadSource === uploadSource
      )
      .map((item) => item.resource);
  };
  /**
   * private 方法
   * 分块上传处理
   * @param creor {key} 通过相同key 实现 暂停重新上传
   * @param file 文件
   * @param checkpoint 记录断点 key，腾讯云续传需要相同key
   */
  abstract _multipartUpload(
    creor: {
      key: string;
      cloud: any;
      config: IFeedConfig;
    },
    file: IFile,
    checkpoint?: ICheckpoint
  ): void;
  /**
   * private 方法
   * 开始COS上传
   */
  abstract toUpload(file: IFile): void;
  /**
   * private 方法
   * 1、先上传 处于正在 ing 状态的文件，如果没有则执行第二步。
   * 2、自动开启队列中wait状态中的文件进行上传
   */
  abstract uploadNextFile(uploadSource: EUploadSource): void;
  /**
   * 设置上传来源与状态
   * 如:素材列表上传需转到草稿队列去上传
   */
  // abstract setFileInfo(params: {
  //   unique: string;
  //   isBreakpoint?: boolean;
  //   replaceStatus: number;
  //   uploadSource: EUploadSource;
  // }): void;
  setFileInfo = (params: {
    unique: string;
    isBreakpoint?: boolean;
    replaceStatus: number;
    uploadSource: EUploadSource;
  }) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(params.unique);
    if (stackInfo) {
      stackInfo.resource.isBreakpoint = params.isBreakpoint;
      stackInfo.resource.replaceStatus = params.replaceStatus;
      stackInfo.resource.uploadSource = params.uploadSource;
      if (stackInfo.resource.uploadStatus !== EUploadStatus.ing) {
        stackInfo.resource.uploadStatus = EUploadStatus.wait;
      }
    }
    const imgStack = that.fileProcessStack.filter(
      (stack) =>
        stack.resource.uploadStatus === EUploadStatus.ing &&
        stack.resource.uploadSource === params.uploadSource
    );
    if (imgStack.length > 1) {
      const info = imgStack[imgStack.length - 1];
      that.cancelUpload(info.resource.unique, EUploadStatus.wait);
    }
  };
  /**
   * 暂停上传（可继续）
   */
  abstract cancelUpload(unique: string, status?: EUploadStatus): void;
  /**
   * 单个重新上传
   */
  abstract resumeUpload(unique: string): void;
  /**
   * 终止上传（丢弃）
   */
  abstract abortMultipartUpload(unique: string): void;
  /**
   * 全部暂停 所有文件，包括上传中的和等待上传的
   */
  abstract cancelUploadAll(): void;
  /**
   * 全部继续，将所有cancel的文件改为wait，并且开始上传第一个wait的文件
   * @param {EUploadSource} uploadSource 资源来源
   */
  // abstract resumeUploadAll(uploadSource: EUploadSource): void;
  resumeUploadAll = (uploadSource: EUploadSource) => {
    const that = this;

    that.fileProcessStack.forEach((stackInfo) => {
      if (stackInfo) {
        if (stackInfo.resource.uploadStatus === EUploadStatus.cancel) {
          stackInfo.resource.uploadStatus = EUploadStatus.wait;
        }
      }
    });
    that.uploadNextFile(uploadSource);
    that.mitt();
  };
  /**
   * 清除除上传成功success以外的所有的文件
   */
  // abstract removeUnsuccessAll(): void;
  removeUnsuccessAll = () => {
    const that = this;
    that.fileProcessStack.forEach((stackInfo) => {
      const canRemove =
        stackInfo && stackInfo.resource.uploadStatus !== EUploadStatus.success;
      if (canRemove) {
        that.clearFilestackByUnique(stackInfo.resource.unique);
      }
    });
    that.mitt();
  };
  /**
   * 全部重试失败项
   * @param {EUploadSource} uploadSource 资源来源
   */
  abstract resumeUploadErrorAll(uploadSource: EUploadSource): void;
  /**
   * 清除全部失败项（从上传列表中删除）
   */
  // abstract removeErrorAll(): void;
  removeErrorAll = () => {
    const that = this;
    that.fileProcessStack.forEach((stackInfo) => {
      const canRemove =
        stackInfo && stackInfo.resource.uploadStatus === EUploadStatus.error;
      if (canRemove) {
        that.clearFilestackByUnique(stackInfo.resource.unique);
      }
    });
    that.mitt();
  };
  /**
   * 从本地队列删除单个资源
   */
  // abstract clearFilestackByUnique(unique: string): void;
  clearFilestackByUnique = (unique: string) => {
    const that = this;
    const stackInfo = that.getOssClientByUnique(unique);
    if (stackInfo) {
      that.fileProcessStack = that.fileProcessStack.filter(
        (file) => file.resource.unique !== unique
      );
      CheckPoint.remove(stackInfo.resource);
    }
    CheckPoint.removeByUnique(unique);
  };
  /**
   * 清空断点资源
   */
  abstract clearPointSource(unique: string, up_source?: EUploadSource): void;
  /**
   * 上传成功
   */
  uploadSuccess = (
    resource: IFile,
    result: IUploadRes,
    onSuccess: (res: IUploadRes) => void
  ) => {
    const that = this;
    resource.uploadStatus = EUploadStatus.success;
    CheckPoint.removeByUnique(resource.unique);
    onSuccess && onSuccess({ ...result, ...resource } as IUploadRes);

    that.assetIdWithUnique[resource.unique] = result?.resourceList[0]?.id;
  };

  /**
   * 批量清除成功项
   * @param {number[]} ids 上传资源列表id
   */
  // abstract clearByUniques(ids: number[]): void;
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
  /**
   *获取进度信息
   */
  // abstract processInfo(fileList: IFile[]): {
  //   total: IFile[];
  //   wait: IFile[];
  //   cancel: IFile[];
  //   abort: IFile[];
  //   success: IFile[];
  //   error: IFile[];
  //   ing: IFile[];
  //   breakLink: IFile[];
  //   uploadSize: { finished: number; unfinished: number; rate: number };
  // };
  processInfo = (fileList: IFile[]) => {
    const filesByStatus = (uploadStatus: EUploadStatus) => {
      return fileList.filter((file) => file.uploadStatus === uploadStatus);
    };
    const getSize = (uploadStatus: EUploadStatus) => {
      const files = filesByStatus(uploadStatus);
      const size = files.reduce((pre, file) => {
        return pre + file.size;
      }, 0);
      return size;
    };
    const uploadSize = () => {
      const finishedSize = getSize(EUploadStatus.success);
      const unfinishedSize =
        getSize(EUploadStatus.wait) +
        getSize(EUploadStatus.cancel) +
        getSize(EUploadStatus.abort) +
        getSize(EUploadStatus.error);
      const ingFinishedSize = filesByStatus(EUploadStatus.ing).reduce(
        (pre, fileInfo) => {
          return pre + fileInfo.percentage * fileInfo.size;
        },
        0
      );
      const ingUnfinishedSize = filesByStatus(EUploadStatus.ing).reduce(
        (pre, fileInfo) => {
          return pre + (1 - fileInfo.percentage) * fileInfo.size;
        },
        0
      );
      const rate = filesByStatus(EUploadStatus.ing)?.[0]?.requestNetwork; //KB/S
      return {
        finished: finishedSize + ingFinishedSize,
        unfinished: unfinishedSize + ingUnfinishedSize,
        rate,
      };
    };
    return {
      total: fileList,
      wait: filesByStatus(EUploadStatus.wait),
      cancel: filesByStatus(EUploadStatus.cancel),
      abort: filesByStatus(EUploadStatus.abort),
      success: filesByStatus(EUploadStatus.success),
      error: filesByStatus(EUploadStatus.error),
      ing: filesByStatus(EUploadStatus.ing),
      breakLink: filesByStatus(EUploadStatus.breakLink),
      uploadSize: uploadSize(),
    };
  };

  clearAllSource = (uniqueIds: string[]) => {
    const that = this;
    uniqueIds.forEach((unique) => {
      that.abortMultipartUpload(unique);
    });
  };

  /**
   * 对比files  comnpareFiles 两个文件是否相同，过滤掉相同的文件列表
   */
  getNotEqualFiles(
    files: IFile[],
    comnpareFiles: IFile[],
    isOmitupSource: boolean = false
  ) {
    const resFiles: IFile[] = [];
    files.forEach((file) => {
      if (
        !comnpareFiles.find((comnpareFile) =>
          CheckPoint.sameFileHash(file, comnpareFile, isOmitupSource)
        )
      ) {
        resFiles.push(file);
      }
    });
    return resFiles;
  }
}

enum EMultiCloud {
  /** 阿里云 */
  ALIYUN = "ALIYUN",
  /**腾讯云 */
  TENCENT = "TENCENT",
  /** 亚马逊云 */
  AWS = "AWS",
}

/** 多云返回值 */
interface IFeedConfig {
  /** id */
  accessKeyId: string;
  /** 密钥 */
  accessKeySecret: string;
  /** token */
  securityToken: string;
  /** 桶配置 */
  region: string;
  /** 桶配置 */
  bucketName: string;
  /** 阿里云 endpoint */
  endpoint: string;
  /** 文件夹 */
  dir: string;
  /** 回调url， 阿里云 */
  callback: string;
  /** 用户云服务商 */
  osBasicInfo: string;
  /** key 唯一 */
  keyName: string;
}

/** 缓存令牌数据 */
interface ICacheFeedConfig {
  config: IFeedConfig;
  createTime: number;
  cloud: any;
}

/** uploadFile 参数 option*/
interface IUploadedFileOptions {
  getUploadDelegate?: any;
  partSize?: number;
  parallel?: number;
  onUploadSpeed?: any;
  getUploadFeedUrl?: any;
  uploadResourceUrl?: any;
  progress?: any;
  longTermUrl?: any;
  /** 业务线 */
  businessCode?: string;
  /** 产品模块 */
  productCode?: string;
  /** 拓展码 */
  extCode?: string;
  [key: string]: any;
}
enum EObserverKey {
  COMBINED_CONTENT = "combined_content",
}

export {
  IUploadRes,
  IUploadedFile,
  IFileStack,
  IFileEvent,
  IFile,
  IUploaderProps,
  IUploadOption,
  ICheckpoint,
  IUploadProgress,
  EUploadStatus,
  EUploadSource,
  MultiUploadBase,
  IUploader,
  EMultiCloud,
  IFeedConfig,
  ICacheFeedConfig,
  IUploadedFileOptions,
  EObserverKey,
};
