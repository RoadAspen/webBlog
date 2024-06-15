export interface FontStyle {
  id: number;
  name: string;
  style: { fill?: string; stroke?: string; "stroke-width"?: number };
}

export type FontFamily = string;
export type FontSize = number;

export interface TextItem {
  text: string;
  isLight: boolean;
}

export interface SingleText {
  /** id */
  id: string;
  /** 开始时间 秒*/
  start: number;
  /** 结束时间 秒*/
  end: number;
  /** 文件列表 */
  textList: TextItem[];
}
