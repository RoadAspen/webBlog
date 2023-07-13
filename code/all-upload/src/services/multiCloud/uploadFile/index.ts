import { EMultiCloud } from "../types";
import uploadFileAli, {
  cancelUploadAli,
  resumeUploadAli,
} from "./uploadFileAli";
import uploadFileTencent, {
  cancelUploadTencent,
  resumeUploadTencent,
} from "./uploadFileTencent";

import uploadFileAws, {
  cancelUploadAws,
  resumeUploadAws,
} from "./uploadFileAws";
import { ERRORS } from "../../../config/config";
export function getMultiUploadFile(cloudCode: string) {
  switch (cloudCode) {
    case EMultiCloud.ALIYUN:
      return {
        uploadFile: uploadFileAli,
        resumeUpload: resumeUploadAli,
        cancelUpload: cancelUploadAli,
      };

    case EMultiCloud.TENCENT:
      return {
        uploadFile: uploadFileTencent,
        resumeUpload: resumeUploadTencent,
        cancelUpload: cancelUploadTencent,
      };
    case EMultiCloud.AWS:
      return {
        uploadFile: uploadFileAws,
        resumeUpload: resumeUploadAws,
        cancelUpload: cancelUploadAws,
      };
    default:
      return {
        uploadFile: uploadFileAli,
        resumeUpload: resumeUploadAli,
        cancelUpload: cancelUploadAli,
      };
  }
}

export { ERRORS };
export default getMultiUploadFile;
