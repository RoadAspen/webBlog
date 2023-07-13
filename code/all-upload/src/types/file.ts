// 上传状态
export enum EUploadState {
  waiting,
  uploading,
  success,
  failed,
}

export interface DraftFileInfo {
  name: string;
  type: "file" | "folder";
  extension?: string;
  size: number;
  state: EUploadState;
  progress?: number;
  uploadAt: Date;
}

export type UploadingFileInfo = Partial<DraftFileInfo> & {
  speed?: number;
  image: string;
};
