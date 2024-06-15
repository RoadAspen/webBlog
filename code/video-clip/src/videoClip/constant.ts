import { FontFamily, FontSize, FontStyle } from "./define";

/** 示例视频url */
export const video1Url = "./加油站.mp4";

export const fontFamilyList: FontFamily[] = [
  "宋体-简",
  "行楷-繁",
  "雅痞-繁",
  "报隶-简",
  "凌慧体-繁",
];

export const fontStyleList: FontStyle[] = [
  {
    id: 1,
    name: "花字一",
    style: {
      stroke: "red",
      "stroke-width": 5,
      fill: "red",
    },
  },
  {
    id: 2,
    name: "花字二",
    style: {
      stroke: "blue",
      "stroke-width": 5,
      fill: "blue",
    },
  },
];

export const lightFontStyleList: FontStyle[] = [
  {
    id: 1,
    name: "高亮花字一",
    style: {
      stroke: "red",
      "stroke-width": 5,
      fill: "red",
    },
  },
  {
    id: 2,
    name: "高亮花字二",
    style: {
      stroke: "blue",
      "stroke-width": 5,
      fill: "blue",
    },
  },
];

export const fontSizeList: FontSize[] = [12, 14, 16, 18, 24, 28, 36, 48];
