export interface FontStyle {
  /** id */
  id: number;
  /** 名称 */
  name: string;
  /** svg字符串 */
  svgText: string;
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

/** 单个成片 */
export interface AIGCClip {
  /** id */
  id: string;
  /** 成片时长 s*/
  duration: number;
  /**  */
  pointNum: number;
  /** group num */
  groupNum: number;
  /**  */
  description: string;
  /** 片段列表 */
  info: {
    id: string;
    /** 卖点 */
    point: string;
    /** 句子组 */
    group: string;
    /** 片段时长 */
    duration: number;
    /** 片段高清url */
    hdVideoUrl: string;
    /** 片段低分辨率url */
    sdVideoUrl: "";
    /** 句子组 */
    sens: {
      /** 是否选中 */
      select: 0 | 1;
      /** 文案 */
      text: string;
      /** 字幕高亮 */
      textList: { id: string; text: string; isLight: boolean }[];
      /** 句子时长 */
      duration: number;
      /** 句子开始时间、结束时间 */
      timestamp: number[];
      /** 前端拼接的 字幕svgText */
      svgText: string;
      /** 图片url */
      imgUrl: string;
    }[];
  }[];
}
