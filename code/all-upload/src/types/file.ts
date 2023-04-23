export enum EUploadState {
    waiting, uploading, success, failed
}

export interface DrafFileInfo{
    name: string,
    type: 'file'|'folder',
    extension?: string,
    size: number,
    state: EUploadState,
    progress?: number,
    uploadAt: Date,
}

export type UploadingFileInfo = Partial<DrafFileInfo> & {
    speed?: number,
    image: string,
}

