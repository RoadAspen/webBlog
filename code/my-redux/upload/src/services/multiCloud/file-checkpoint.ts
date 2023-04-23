import { ICheckpoint, IFile, EUploadSource } from "./types";

const KEY = "upload_files_status";
/**
 * 判定同一个文件逻辑（name、path、size、lastModified, directory.name）
 *
 */
class CheckPoint {
  static get(): { source:IFile; ckPoint: ICheckpoint }[] {
    const upload_files = localStorage.getItem(KEY);
    return upload_files ? JSON.parse(upload_files) : [];
  }
  static getSource(source: IFile) {
    return CheckPoint.get().find((item) => {
      return CheckPoint.sameFileHash(item.source, source);
    });
  }
  static async set(source: IFile, ckPoint: ICheckpoint) {
    const all_upload_files: { source: IFile; ckPoint: ICheckpoint }[] = CheckPoint.get();
    const sourcePoint = all_upload_files.find((item) => {
      return CheckPoint.sameFileHash(item.source, source);
    });
    if (sourcePoint) {
      sourcePoint.ckPoint = ckPoint;
      sourcePoint.source = source;
    } else {
      all_upload_files.push({ source, ckPoint });
    }
    localStorage.setItem(KEY, JSON.stringify(all_upload_files));
  }
  /**
   * 移除断点文件
   * 通过文件唯一性获取
   * @param sourceKey
   */
  static async remove(source: IFile) {
    const upload_files = CheckPoint.get().filter((item) => {
      return !CheckPoint.sameFileHash(source, item.source);
    });
    return localStorage.setItem(KEY, JSON.stringify(upload_files));
  }
  /**
   * 移除断点文件
   * 通过unique 获取
   * @param sourceKey
   */
  static removeByUnique(unique: string, up_source?: EUploadSource) {
    const upload_files = CheckPoint.get().filter((item) => {
      const has = item.source.unique === unique && (up_source ? up_source === item.source.uploadSource :true);
      return !has;
    });
    return localStorage.setItem(KEY, JSON.stringify(upload_files));
  }
  static clear() {
    localStorage.removeItem(KEY);
  }
  static getFilePath(name: string, path: string, webkitRelativePath: string) {
    const resPath = path || webkitRelativePath || name;
    if(resPath) {
      return resPath.indexOf("/") === 0 ? resPath: `/${resPath}`
    }
    return "";
  }
  /**
   * 
   * @param sourceFile 
   * @param compareFile 
   * @param isOmitupSource  默认需要判定来源
   */
  static sameFileHash(
    sourceFile: IFile,
    compareFile: IFile,
    isOmitupSource: boolean = false
  ): boolean {
    
    const has=  (
      sourceFile._name === compareFile._name &&
      sourceFile._path === compareFile._path &&
      sourceFile._lastModified === compareFile._lastModified &&
      sourceFile._size === compareFile._size &&
      (sourceFile.directory?.id ===  compareFile.directory?.id)
    );
    if(isOmitupSource) return has;
    return has && sourceFile.uploadSource === compareFile.uploadSource ;
  }
}

export { CheckPoint };
