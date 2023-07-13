/**
 * 流程
 */
import React, { FC, Component, ReactNode } from "react";
import { useDropzone } from "react-dropzone";
import {
  IFile,
  IUploaderProps,
  EUploadStatus,
  EUploadSource,
  IUploader,
  EMultiCloud,
  EObserverKey,
} from "./services/multiCloud/types";
import { getMultiCloudUploader } from "./services/multiCloud/uploader";
import {
  observerOss,
  observerOffOss,
  observerUpSuccessOss,
  observerUpSuccessOffOss,
  observerDraftOss,
  observerDraftOffOss,
  observerCustomProcessOss,
  observerCustomProcessOffOss,
  observerCustomSuccessOss,
  observerCustomSuccessOffOss,
} from "./services/multiCloud/observer";
import { setEnv, constants } from "./config/constants";
import { CheckPoint } from "./services/multiCloud/file-checkpoint";
import "./index.scss";
import getMultiUploadFile from "./services/multiCloud/uploadFile";
const cloudCode = localStorage.getItem("CLOUD_KEY") || "";
/** class 实例 */
const Uploader = getMultiCloudUploader(cloudCode);
const CombinedContentUploader = getMultiCloudUploader(
  cloudCode,
  EObserverKey.COMBINED_CONTENT
);
const getUpload = (key?: EObserverKey) => {
  if (key === EObserverKey.COMBINED_CONTENT) {
    return CombinedContentUploader;
  }
  return Uploader;
};
/** common 迁移 uploadFile 单个上传 */
const { cancelUpload, resumeUpload, uploadFile } = getMultiUploadFile(
  cloudCode
);
/**
 * 拖拽上传
 * @param param0
 * @returns
 */
const Dropzone: FC<{
  fileEvent: IUploaderProps;
  observerKey?: EObserverKey;
}> = ({ fileEvent, children, observerKey }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files: IFile[]) => {
      getUpload(observerKey).actionUpload(files, fileEvent);
    },
    onDragEnter: fileEvent.onDragEnter,
    onDragLeave: fileEvent.onDragLeave,
    noDragEventsBubbling: fileEvent.option.childComponentnoBubbling || false,
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone-box ${
        isDragActive
          ? fileEvent.option.activeClassName || "dropzone-box-active"
          : ""
      } ${fileEvent.option.className || ""}`}
    >
      <input
        {...getInputProps({
          webkitdirectory: fileEvent.option?.directory ? "true" : undefined,
          accept: fileEvent.option?.accept,
        })}
      />
      {children || <></>}
    </div>
  );
};

/**组件的方式引用 */
class Upload extends Component<{
  fileEvent: IUploaderProps;
  children?: ReactNode;
  observerKey?: EObserverKey;
}> {
  static cancelUpload = Uploader.cancelUpload;
  static resumeUpload = Uploader.resumeUpload;
  static abortMultipartUpload = Uploader.abortMultipartUpload;
  static setFileInfo = Uploader.setFileInfo;
  static getSource = Uploader.getSource;
  static clearPointSource = Uploader.clearPointSource;
  static toUpload = Uploader.actionUpload;
  static clearAllSource = (uniqueIds: string[]) => {
    uniqueIds.forEach((unique) => {
      Uploader.abortMultipartUpload(unique);
    });
  };
  static cancelUploadAll = Uploader.cancelUploadAll;
  static resumeUploadAll = Uploader.resumeUploadAll;
  static removeUnsuccessAll = Uploader.removeUnsuccessAll;
  static processInfo = Uploader.processInfo;
  static removeErrorAll = Uploader.removeErrorAll;
  static resumeUploadErrorAll = Uploader.resumeUploadErrorAll;
  static clearByUniques = Uploader.clearByUniques;
  /**
   * 对比files  compareFiles 两个文件是否相同，过滤掉相同的文件列表
   */
  static getNotEqualFiles(
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
  render() {
    // const { fileEvent, children, observerKey } = this.props;
    return <Dropzone {...this.props} />;
  }
}

/** 方法方式引用*/
const showSelectFile = (params: {
  fileEvent: IUploaderProps;
  observerKey?: EObserverKey;
}) => {
  selectFiles({
    webkitdirectory: params.fileEvent.option.directory,
    accept: params.fileEvent.option.accept,
  })
    .then((res: IFile[]) => {
      getUpload(params.observerKey).actionUpload(res, params.fileEvent);
      // @TODO: 临时添加监控埋点观察
      res?.map((file) => {
        // @ts-ignore
        window?.TezignTracer?.track({
          eid: "46f1b3af32ba45b3817fd896e488314e",
          extra: {
            text1: { value: JSON.stringify(file) },
            text9: { value: window.location.href, desc: "current url" },
            text8: { value: window.navigator.userAgent, desc: "userAgent" },
          },
        });
      });
    })
    .catch((err: any) => {
      params.fileEvent.onUploadError && params.fileEvent.onUploadError(err);
    });
};

type TObserverParams<T> = { handler: (arg: T) => void; key?: EObserverKey };
type TOffParams<T> = { handler?: (arg: T) => void; key?: EObserverKey };

const observerProcessOss: <T>(params: TObserverParams<T>) => void = ({
  handler,
  key,
}) => {
  if (key === EObserverKey.COMBINED_CONTENT) {
    observerCustomProcessOss(key, handler);
    return;
  }
  observerDraftOss(handler);
};

const offProcessOss: <T>(params: TOffParams<T>) => void = ({
  handler,
  key,
}) => {
  if (key === EObserverKey.COMBINED_CONTENT) {
    observerCustomProcessOffOss(key, handler);
    return;
  }
  observerDraftOffOss(handler);
};

const observerSuccessOss: <T>(params: TObserverParams<T>) => void = ({
  handler,
  key,
}) => {
  if (key === EObserverKey.COMBINED_CONTENT) {
    observerCustomSuccessOss(key, handler);
    return;
  }
  observerUpSuccessOss(handler);
};

const offSuccessOss: <T>(params: TOffParams<T>) => void = ({
  handler,
  key,
}) => {
  if (key === EObserverKey.COMBINED_CONTENT) {
    observerCustomSuccessOffOss(key, handler);
    return;
  }
  observerUpSuccessOffOss(handler);
};

export {
  Upload,
  getMultiCloudUploader,
  EUploadStatus,
  EUploadSource,
  setEnv,
  showSelectFile,
  observerOss,
  observerOffOss,
  observerUpSuccessOss,
  observerUpSuccessOffOss,
  observerDraftOss,
  observerDraftOffOss,
  getUpload,
  observerProcessOss,
  offProcessOss,
  observerSuccessOss,
  offSuccessOss,
  EObserverKey,
};
// 原 common 包 uploadFile
export { uploadFile, resumeUpload, cancelUpload, getMultiUploadFile, ERRORS };
