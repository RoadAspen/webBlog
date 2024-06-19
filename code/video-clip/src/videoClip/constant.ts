import { AIGCClipItem, FontFamily, FontSize, FontStyle } from "./define";

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
    svgText: `<svg xmlns="http://www.w3.org/2000/svg" id="图层_1" data-name="图层 1" viewBox="0 0 75.84 40.55"><defs><style>.cls-1,.cls-2,.cls-3,.cls-4,.cls-5{font-size:36px;font-family:SourceHanSansCN-Bold-GBpc-EUC-H, Source Han Sans CN;}.cls-1,.cls-5{fill:#e20026;}.cls-1{stroke:#e20026;}.cls-1,.cls-2,.cls-3{stroke-linecap:round;stroke-linejoin:round;}.cls-1,.cls-2{stroke-width:3px;}.cls-2{fill:#fff;stroke:#fff;}.cls-3{stroke:#000;stroke-width:2px;}.cls-4{fill:#a9e8ff;}</style></defs><title>16</title><text class="cls-1" transform="translate(2.34 34.35)">花字</text><text class="cls-2" transform="translate(1.74 33.85)">花字</text><text class="cls-3" transform="translate(1.74 33.85)">花字</text><text class="cls-4" transform="translate(1.74 33.85)">花字</text><text class="cls-5" transform="translate(1.74 33.85)">花字</text></svg>`,
  },
  {
    id: 2,
    name: "花字二",
    svgText: `<svg xmlns="http://www.w3.org/2000/svg" id="图层_1" data-name="图层 1" viewBox="0 0 76.74 42.05"><defs><style>.cls-1,.cls-2{font-size:36px;font-family:SourceHanSansCN-Bold-GBpc-EUC-H, Source Han Sans CN;}.cls-1{fill:#40593b;stroke:#40593b;stroke-linejoin:round;stroke-width:4px;}.cls-2{fill:#c3cf47;}</style></defs><title>7</title><text class="cls-1" transform="translate(2.74 34.85)">花字</text><text class="cls-2" transform="translate(2.74 34.85)">花字</text></svg>`,
  },
];

export const lightFontStyleList: FontStyle[] = [
  {
    id: 1,
    name: "高亮花字一",
    svgText: `<svg xmlns="http://www.w3.org/2000/svg" id="图层_1" data-name="图层 1"><defs><style>.cls-1,.cls-2{font-size:36px;font-family:SourceHanSansCN-Bold-GBpc-EUC-H, Source Han Sans CN;}.cls-1{fill:#40593b;stroke:#40593b;stroke-linejoin:round;stroke-width:4px;}.cls-2{fill:#c3cf47;}</style></defs><title>7</title><text class="cls-1" transform="translate(2.74 34.85)">花字</text><text class="cls-2" transform="translate(2.74 34.85)">花字</text></svg>`,
  },
  {
    id: 2,
    name: "高亮花字二",
    svgText: ``,
  },
];

export const fontSizeList: FontSize[] = [12, 14, 16, 18, 24, 28, 36, 48];

export const currentConfig = {
  fontFamily: "宋体-简",
  fontStyleId: 1,
  lightFontStyleId: 1,
};

export const videoPiece: AIGCClipItem = {
  id: "piece",
  duration: 0,
  info: [
    {
      point: "",
      group: "",
      duration: 0,
      hd_video_url: "",
      compress_video_url: "",
      sens: [
        {
          select: 0,
          text: "这是第一条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 0,
          text: "这是第二条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 0,
          text: "这是第三条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 1,
          text: "这是第四条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 1,
          text: "这是第五条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 1,
          text: "这是第六条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 1,
          text: "这是第七条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 1,
          text: "这是第八条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 0,
          text: "这是第九条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
        {
          select: 0,
          text: "这是第十条字幕",
          textList: [],
          duration: 0,
          timestamp: [],
          svgText: "",
        },
      ],
    },
  ],
};
