/**
 *
 * uploadFile 通用工具函数
 *
 */

/**
 * 是否null
 * @param value
 * @returns
 */
export function isNull(value: any) {
  return value === null;
}

/**
 * uuid
 * @returns uuid
 */
export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 是否数字
 * @param value
 * @returns
 */
export function isNumber(value: any) {
  return typeof value === "number" && !isNaN(value);
}

/**
 * 前端生成上传文件名逻辑
 * @param dir  租户根路径
 * @param extensionName 扩展名
 * @param cpKey 已上传文件已生成的文件名
 * @returns string 上传文件名
 */
export function getFileKeyName(
  dir: string = "",
  extensionName: string,
  cpKey?: string
): string {
  if (cpKey) {
    return cpKey;
  } else {
    return `${dir}${btoa(Date.now() + uuid())}.${extensionName}`;
  }
}
