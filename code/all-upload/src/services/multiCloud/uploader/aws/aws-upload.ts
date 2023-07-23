/**
 * 亚马逊云 需要手动分块及所有分块完成之后手动合并并通知亚马逊云已上传完成
 */
import { IFeedConfig, IFile } from "../../types";
import awsOSS from "aws-sdk/clients/s3";
import { AWSError } from "aws-sdk";

/** 单个文件分块 */
export default class AwsSingleFileUpload {
  // 初始同时上传的分块数
  uploadIndex: number;
  // 当前文件的分片总数
  fileLimit: number;
  // 当前文件的大小
  fileSize: number;
  // 上传唯一id
  uploadId: string;
  // 当前文件的所有分块
  partFiles: File[];
  // 上传配置
  creor: {
    cloud: awsOSS;
    key: string;
    config: IFeedConfig;
  };
  // 暂停锁
  stopFlag: boolean;
  // 正在上传的part request 对象，可用于终止当前分块请求, loaded 已上传大小 ， objs 上传对象
  uploadIngArr: { [partNumber: number]: { loaded: number; objs: any } };
  /** 所有已上传分片的大小 */
  progressLoaded: number;
  // 已上传成功的分块信息
  complete_part: { ETag: string; PartNumber: number }[] = [];
  // 上传进度回调函数
  onProgressFun: (progressLoaded: number) => void;
  // 上传成功
  onUploadSuccess: () => void;
  // 上传失败
  onUploadError: (err: any) => void;
  /** 待上传的分块列表 */
  upload_limit_list: File[];
  /** partSize aws 必须大于5MB*/
  partSize: number;
  /** 并发请求数量 */
  concurrentRequest = 3;
  /** 文件的contentType */
  contentType = "";
  constructor(props: {
    creor: {
      cloud: awsOSS;
      key: string;
      config: IFeedConfig;
    };
    file: IFile;
    // 传入时说明是断点续传，否则为新上传
    uploadId: string;
    onProgressFun: (progressLoaded: number) => void;
    onUploadSuccess: () => void;
    /** 分块大小 默认 5 * 1024 * 1024*/
    partSize?: number;
    /** 并发请求数量, 默认 3 */
    concurrentRequest?: number;
    onUploadError?: (err: any) => void;
  }) {
    this.creor = props.creor;
    this.onProgressFun = props.onProgressFun;
    this.onUploadSuccess = props.onUploadSuccess;
    this.onUploadError = props.onUploadError;
    this.uploadId = props.uploadId;
    this.partSize = props.partSize || 5 * 1024 * 1024;
    this.concurrentRequest = props.concurrentRequest || 3;
    this.init(props.file);
  }
  init(file: IFile) {
    const { partFiles, fileLimit, fileSize } = this.fileSlice(
      file,
      this.partSize
    );
    this.contentType = file._type || file.type;
    // 当前正在上传的分块序号,初始为并发数
    this.uploadIndex = this.concurrentRequest;
    this.fileLimit = fileLimit;
    this.fileSize = fileSize;
    this.partFiles = partFiles;
    this.complete_part = [];
    this.uploadIngArr = {};
    this.progressLoaded = 0;
    this.stopFlag = false;
  }
  // 开始上传
  async beginUpload() {
    const that = this;
    if (that.uploadId) {
      try {
        const res = await that.getAlreadyUploadPartInfoList();
        console.log("beginUpload -> getAlreadyUploadPartInfoList", res);
        if (res?.length) {
          that.complete_part = res;
        }
      } catch (error) {
        console.log("获取 getAlreadyUploadPartInfoList 失败", error);
        that.complete_part = [];
      }
    } else {
      try {
        that.uploadId = await new Promise((resolve, reject) => {
          that.creor.cloud.createMultipartUpload(
            {
              Bucket: that.creor.config.bucketName,
              Key: that.creor.key,
              ContentType: that.contentType,
            },
            (err: AWSError, data: awsOSS.Types.CreateMultipartUploadOutput) => {
              if (err) {
                reject(err);
              } else {
                console.log("获取 uploadId 成功", data);
                resolve(data.UploadId);
              }
            }
          );
        });
      } catch (error) {
        console.log("获取 uploadId 失败", error);
      }
    }
    that.leavePartsLoad(that.complete_part);
  }
  /**
   * @description 文件手动分片， 同步操作
   * @param file  IFile 上传的文件
   * @param partSize Number 分片大小 ,aws规定分片必须大于 5MB，否则会报错
   * @returns  File[]  文件分块列表
   */
  fileSlice(file: IFile, partSize: number = 5 * 1024 * 1024) {
    if (partSize < 5 * 1024 * 1024) {
      partSize = 5 * 1024 * 1024;
    }
    const fileSize: number = file.size || file._size;
    if (!fileSize) {
      return { partFiles: [], fileLimit: 1, fileSize };
    }
    const arr: File[] = [];
    const fileLimit = Math.ceil(fileSize / partSize);
    for (var i = 1; i <= fileLimit; i++) {
      let partFile: IFile;
      if (i < fileLimit) {
        partFile = file.slice((i - 1) * partSize, i * partSize) as IFile;
      } else {
        partFile = file.slice((i - 1) * partSize) as IFile;
      }
      arr.push(partFile);
    }
    console.log("-----分片", arr);
    return { partFiles: arr, fileLimit, fileSize };
  }

  /**
   * @description 开始上传，初始并发控制
   * @param files
   */
  uploadController(partFiles: File[]) {
    const that = this;
    that.upload_limit_list = partFiles;
    console.log(
      "----uploadController partFiles",
      that.upload_limit_list,
      that.concurrentRequest
    );
    for (let index = 0; index < that.upload_limit_list.length; index++) {
      const item = that.upload_limit_list[index];
      const _index = index + 1;
      if (_index <= that.concurrentRequest) {
        console.log("----uploadController 初次并发", _index, item);
        that.uploadParts(_index, item);
      } else {
        break;
      }
    }
  }

  /**
   * @description 上传行为控制，判断是否还存在下一个未上传分块，如果存在，则上传下一个
   * @returns
   */
  uploadControllerLimit() {
    const that = this;
    that.uploadIndex++;
    if (that.stopFlag) {
      return false;
    } else if (that.upload_limit_list.length >= that.uploadIndex) {
      var item = that.upload_limit_list[that.uploadIndex - 1];
      that.uploadParts(that.uploadIndex, item);
    }
  }

  /**
   * @description  上传单个 part,
   * @param partNumber 当前分块序号
   * @param filePart 当前分块
   * @returns
   */
  uploadParts(partNumber: number, filePart: File) {
    const that = this;
    console.log(
      "-----uploadParts partNumber",
      partNumber,
      filePart,
      that.stopFlag
    );
    if (that.stopFlag) return false;
    // 如果当前分块为空，说明该分块已经上传,直接开始上传下一个
    if (!filePart) {
      console.log("filePart 已上传，直接跳过", that.uploadIndex);
      that.uploadControllerLimit();
      return false;
    }
    const config = that.creor.config;
    // 向正在上传的
    // 开始上传
    var objs = that.creor.cloud
      .uploadPart(
        {
          Bucket: config.bucketName,
          Key: that.creor.key,
          PartNumber: partNumber,
          UploadId: that.uploadId,
          Body: filePart,
        },
        async function(err, data) {
          if (err) {
            console.log(
              "该分块上传失败",
              err.message === "Request aborted",
              err.code,
              err.name
            );
            if (err.message !== "Request aborted") {
              that.onUploadError?.(err);
            }
          } else {
            var obj = {
              ETag: "tt",
              PartNumber: partNumber,
            };
            // 已完成的分块
            that.complete_part.push(obj);
            console.log("uploadPart 上传成功", data, that.complete_part);
            // 如果获取的上传数组相等，说明已经上传完成
            if (that.complete_part.length == that.fileLimit) {
              const complete_part = await that.getAlreadyUploadPartInfoList();
              that.completeUpload(complete_part);
            } else {
              that.uploadControllerLimit();
            }
          }
        }
      )
      .on("httpUploadProgress", function(evt: {
        loaded: number;
        total: number;
      }) {
        console.log("httpUploadProgress", evt);
        if (that.stopFlag) {
          that.stopUpload();
        }
        // 如果loaded === total ，说明该分块已经上传成功
        if (evt.loaded == evt.total) {
          that.progressLoaded += evt.loaded;
          // 直接删掉
          delete that.uploadIngArr[partNumber];
        } else {
          that.uploadIngArr[partNumber] = {
            loaded: evt.loaded,
            objs,
          };
        }
        console.log(
          "that.progressLoaded",
          that.progressLoaded,
          that.uploadIngArr
        );
        const loaded = that.progressLoaded + that.getUploadingPartSize();
        // 更新进度
        that.onProgressFun(loaded);
      });
    that.uploadIngArr[partNumber] = {
      loaded: 0,
      objs,
    };
  }

  /**
   * @description 获取亚马逊云已上传完成的列表， length为0，则从未上传
   * @returns list  { ETag: string;PartNumber: number;}[]
   *  */
  getAlreadyUploadPartInfoList(): Promise<
    {
      ETag: string;
      PartNumber: number;
    }[]
  > {
    const that = this;
    return new Promise((resolve) => {
      that.creor.cloud.listParts(
        {
          Bucket: that.creor.config.bucketName,
          Key: that.creor.key,
          UploadId: that.uploadId,
          MaxParts: 10000,
        },
        function(err: any, data: { Parts: any }) {
          let complete_part;
          if (err) {
            console.log("-----获取已上传的列表失败", err);
            complete_part = [];
          } else {
            complete_part = data.Parts?.map((item: any) => ({
              ETag: item.ETag,
              PartNumber: item.PartNumber,
            }));
            console.log("-----获取已上传的列表成功", data);
          }
          resolve(complete_part);
        }
      );
    });
  }

  /**
   * 剩余未上传分块列表
   * @param arr  已上传的分块
   */
  leavePartsLoad(arr: any[]) {
    console.log("剩余未上传分块列表", arr);
    const that = this;
    const alreadyUploadPartNumberList: number[] = arr.map(
      (item) => item.PartNumber
    );
    console.log(
      "剩余未上传分块列表 alreadyUploadPartNumberList",
      alreadyUploadPartNumberList
    );
    const rea: any[] = [];
    that.partFiles.forEach(function(item, index) {
      const _index = index + 1;
      // 如果还未上传
      if (!alreadyUploadPartNumberList.includes(_index)) {
        rea.push(item);
        // 如果已经上传
      } else {
        rea.push("");
        that.progressLoaded += item.size;
      }
    });
    that.uploadController(rea);
  }
  /**
   * @description 获取正在上传分块的大小
   * @returns number
   */
  getUploadingPartSize() {
    const that = this;
    return Object.values(that.uploadIngArr).reduce((prev, item) => {
      return item ? prev + item.loaded || 0 : prev;
    }, 0);
  }
  /**
   * @description 将正在上传的分块暂停
   */
  stopUpload() {
    const that = this;
    that.stopFlag = true;
    Object.values(that.uploadIngArr).forEach((item) => {
      item ? item.objs?.abort?.() : "";
    });
  }

  /**
   * @description 上传结束，发送结束请求
   * @returns boolean 是否上传完成
   *  */
  completeUpload(partInfoList: { ETag: any; PartNumber: any }[]) {
    const that = this;
    that.creor.cloud.completeMultipartUpload(
      {
        Bucket: that.creor.config.bucketName,
        Key: that.creor.key,
        UploadId: that.uploadId,
        MultipartUpload: {
          Parts: partInfoList,
        },
      },
      function(err: any, data: any) {
        if (err) {
          console.log("--------completeUploaderror", err);
        } else {
          console.log("--------上传成功", data);
          that.onUploadSuccess();
        }
      }
    );
  }

  /**
   * @description 终止当前分块上传,释放云端空间, 因分块暂停执行时机原因，可能需要多次执行
   */
  abortMultipartUpload(): Promise<boolean> {
    const that = this;
    that.stopUpload();
    return new Promise((resolve, reject) => {
      that.creor.cloud.abortMultipartUpload(
        {
          Bucket: that.creor.config.bucketName,
          Key: that.creor.key,
          UploadId: that.uploadId,
        },
        function(err) {
          if (err) console.error("终止请求", that.uploadId, err, err.stack);
          // an error occurred
          else {
            console.log("删除成功");
            resolve(true); // successful response
          }
        }
      );
    });
  }
}
