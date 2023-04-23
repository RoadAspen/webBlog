import { CheckPoint } from "./multiCloud/file-checkpoint";
import {
  EUploadSource,
  EUploadStatus,
  IFile,
  IFileStack,
} from "./multiCloud/types";

const initResetFile = (
  file: IFile,
  key: number,
  uploadSource: EUploadSource,
  groupId?: number,
  groupName?: string
) => {
  file.unique = `${new Date().getTime()}_${key}`;
  file.uploadStatus = EUploadStatus.wait;
  file.uploadSource = uploadSource || EUploadSource.none;
  file._path = CheckPoint.getFilePath(
    file.name,
    file.path,
    file.webkitRelativePath
  );
  file._lastModified = file.lastModified;
  file._name = file.name;
  file._size = file.size;
  file.uploadTime = new Date().getTime();
  file.percentage = 0;
  file.directory = file.directory || { id: -1, name: "/" };
  file.key = "";
  file.isBreakpoint = file.isBreakpoint === false ? false : true;
  file.uploadStatus = EUploadStatus.wait;
  file.groupId = groupId;
  file.groupName = groupName || "";
};

/**
 * 上报上传速度
 * 减少不必要的请求，100%上传完成最多计算5次
 */
const sendTrackEventNetWork = (
  stackInfo: IFileStack,
  requestNetwork: number,
  requestId?: string
) => {
  if (!stackInfo.resource.percentage) return;

  if (stackInfo.netWorkStep / (stackInfo.resource.percentage * 100) < 1) {
    stackInfo.netWorkStep = stackInfo.netWorkStep + 20;
    stackInfo.upDelegate?.sendTrackEvent({
      text1: { value: "network", desc: "上传速度" },
      text2: { value: `${requestNetwork}`, desc: "分片上传大小网速KB/S" },
      text3: {
        value: requestId || stackInfo.resource?.requestId || "",
        desc: "requestId",
      },
    });
    window?.DATAFLUX_RUM?.addAction('upload', {
      uploadType: 'speed',
      speed: requestNetwork,
      filename: stackInfo.resource?.name,
      size: stackInfo.resource?.size,
      requestId: stackInfo.resource?.requestId
    });
  }
};
/**
 * 上报error
 *
 */
const sendTrackEventErrorPart = (stackInfo: IFileStack, ex: any) => {
  stackInfo.upDelegate?.sendTrackEvent({
    text1: { value: "error-part", desc: "上传类型" },
    text2: { value: ex ? JSON.stringify(ex) : "", desc: "error" },
    text3: { value: stackInfo.resource?.requestId || "", desc: "requestId" },
    text4: { value: ex || "", desc: "原始错误" },
  });
  window?.DATAFLUX_RUM?.addAction('upload', {
    uploadType: 'error',
    errorType: 'retry',
    message: ex ? JSON.stringify(ex) : "",
    filename: stackInfo.resource?.name,
    size: stackInfo.resource?.size,
    requestId: stackInfo.resource?.requestId
  });
};
const sendTrackEventError = (stackInfo: IFileStack, ex: any) => {
  stackInfo.upDelegate?.sendTrackEvent({
    text1: { value: "error", desc: "上传类型" },
    text2: { value: ex ? JSON.stringify(ex) : "", desc: "error" },
    text3: { value: stackInfo.resource?.requestId || "", desc: "requestId" },
    text4: { value: ex || "", desc: "原始错误" },
  });
  window?.DATAFLUX_RUM?.addAction('upload', {
    uploadType: 'error',
    errorType: 'file',
    message: ex ? JSON.stringify(ex) : "",
    filename: stackInfo.resource?.name,
    size: stackInfo.resource?.size,
    requestId: stackInfo.resource?.requestId
  });
};
const sendTrackEventErrorAPI = (stackInfo: IFileStack, ex: any) => {
  stackInfo?.upDelegate.sendTrackEvent({
    text1: { value: "error", desc: "error" },
    text2: {
      value: ex ? JSON.stringify(ex) : "",
      desc: "创建cloud实例或接口报错",
    },
    text4: { value: ex || "", desc: "原始错误" },
  });
  window?.DATAFLUX_RUM?.addAction('upload', {
    uploadType: 'error',
    errorType: 'api',
    message: ex ? JSON.stringify(ex) : "",
    filename: stackInfo.resource?.name,
    size: stackInfo.resource?.size,
    requestId: stackInfo.resource?.requestId
  });
};
const sendTrackEventCancel = (stackInfo: IFileStack) => {
  stackInfo?.upDelegate.sendTrackEvent({
    text1: { value: "cancel", desc: "cancel-取消上传" },
    text3: { value: stackInfo.resource?.requestId || "", desc: "requestId" },
    text6: { value: stackInfo.resource?.name || '', desc: "文件名" },
  });
};

const sendTrackEventPause = (stackInfo: IFileStack) => {
  stackInfo?.upDelegate.sendTrackEvent({
    text1: { value: "pause", desc: "pause-暂停上传" },
    text3: { value: stackInfo.resource?.requestId || "", desc: "requestId" },
    text6: { value: stackInfo.resource?.name || '', desc: "文件名" },
  });
};
const sendTrackEventResume = (stackInfo?: IFileStack) => {
  stackInfo?.upDelegate.sendTrackEvent({
    text1: { value: "resume", desc: "resume-恢复上传" },
    text3: { value: stackInfo?.resource?.requestId || "", desc: "requestId" },
    text6: { value: stackInfo?.resource?.name || '', desc: "文件名" },
  });
};

const sendTrackEventSuccess = (stackInfo: IFileStack, requestId: string) => {
  // stackInfo?.upDelegate.sendTrackEvent({
  //   text1: { value: "upload success", desc: "上传类型" },
  //   text3: {
  //     value: requestId || stackInfo.resource?.requestId || "",
  //     desc: "requestId",
  //   },
  //   text6: { value: stackInfo.resource.name, desc: "文件名" },
  // });
  window?.DATAFLUX_RUM?.addAction('upload', {
    uploadType: 'success',
    filename: stackInfo.resource?.name,
    size: stackInfo.resource?.size,
    requestId: stackInfo.resource?.requestId || requestId
  });
};

export {
  initResetFile,
  sendTrackEventNetWork,
  sendTrackEventErrorPart,
  sendTrackEventError,
  sendTrackEventErrorAPI,
  sendTrackEventCancel,
  sendTrackEventPause,
  sendTrackEventResume,
  sendTrackEventSuccess,
};
