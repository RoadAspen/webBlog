import { AVCanvas } from "@webav/av-canvas";
import _ from "lodash";
import { nanoid } from "nanoid";
import { AIGCClip, FontStyle, TextItem } from "../define";

export function assetsPrefix<T extends string[] | Record<string, string>>(
  assetsURL: T
): T {
  const prefix = process.env.NODE_ENV === "development" ? "/" : "/WebAV/";
  if (Array.isArray(assetsURL)) {
    return assetsURL.map((url) => `${prefix}${url}`) as T;
  }

  return Object.fromEntries(
    Object.entries(assetsURL).map(([k, v]) => [k, `${prefix}${v}`])
  ) as T;
}

export async function createFileWriter(
  extName = "mp4"
): Promise<FileSystemWritableFileStream> {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: `WebAV-export-${Date.now()}.${extName}`,
  });
  return fileHandle.createWritable();
}

export async function fetchSvgAsReadableStream(url: string) {
  // 使用 fetch API 获取 SVG 文件
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch SVG file: ${response.statusText}`);
  }

  // 将响应体转换为 ReadableStream
  const readableStream = response.body;

  // 确保 readableStream 是 ReadableStream<Uint8Array>
  if (!(readableStream instanceof ReadableStream)) {
    throw new Error("Response body is not a ReadableStream");
  }

  // 可以对 stream 进行进一步处理
  // 例如，转换为 Uint8Array
  const reader = readableStream.getReader();
  const stream = new ReadableStream({
    start(controller) {
      function push() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          })
          .catch((err) => {
            controller.error(err);
          });
      }
      push();
    },
  });

  return stream;
}

/**
 *
 * @param svgText svg字符串
 * @returns
 */
export async function convertSvgToPngStream(
  svgText: string
): Promise<ReadableStream<any>> {
  // Create an off-screen canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  // 创建Blob对象
  const blob = new Blob([svgText], { type: "image/svg+xml" });

  // 创建File对象
  const file = new File([blob], "example.svg", {
    type: "image/svg+xml",
  });
  const svgUrl = URL.createObjectURL(file);
  // Create an image element and load the SVG into it
  const img = new Image();
  img.src = svgUrl;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the SVG image onto the canvas
      context.drawImage(img, 0, 0);

      // Convert the canvas content to a PNG data URL
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }

        // Convert blob to ReadableStream<Uint8Array>
        const stream = new ReadableStream({
          start(controller) {
            const reader = new FileReader();
            reader.onload = () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              const uint8Array = new Uint8Array(arrayBuffer);
              controller.enqueue(uint8Array);
              controller.close();
            };
            reader.onerror = () => {
              controller.error(reader.error);
            };
            reader.readAsArrayBuffer(blob);
          },
        });

        resolve(stream);
      }, "image/png");
    };

    img.onerror = (error) => {
      reject(new Error("Failed to load SVG image: " + error));
    };
  });
}
/** 获取高亮html */
const lightPrefix = '<span style="color:red">';
const lightSuffix = "</span>";
export function getHtmlStringFromContentEditable(textItem: TextItem[]) {
  return textItem
    .map((text) =>
      text.isLight ? `${lightPrefix}${text.text}${lightSuffix}` : text.text
    )
    .join("");
}

export function getStringFromHtml(value: string) {
  return value.split(lightPrefix).map((text) => {
    if (text.includes(lightSuffix)) {
      return {
        text: text.replace(lightSuffix, ""),
        isLight: true,
      };
    } else {
      return {
        text: text,
        isLight: false,
      };
    }
  });
}
/** 文本高亮 */
export function getSelectionAndTransform(textList: TextItem[]) {
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      console.log("选中的文本:", selectedText);
      const text = textList.reduce((pr, ne) => pr + ne.text, "");
      const splitList = text.split(selectedText);
      const nextTextList = [];
      if (splitList[0]) {
        nextTextList.push({ id: nanoid(), text: splitList[0], isLight: false });
      }
      nextTextList.push({ id: nanoid(), text: selectedText, isLight: true });
      if (splitList[1]) {
        nextTextList.push({ id: nanoid(), text: splitList[1], isLight: false });
      }
      return nextTextList;
    } else {
      console.log("未选中任何文本");
    }
  }
  return textList;
}

/** 拼装svg字符串*/
export function createSvg(params: {
  fontFamily: string;
  fontSize: number;
  fontStyle?: FontStyle | null;
  lightFontStyle?: FontStyle | null;
  textList: TextItem[];
  /** 视频分辨率 */
  resolution: {
    width: number;
    height: number;
  };
}): string {
  const { fontFamily, fontSize, fontStyle, lightFontStyle, textList } = params;
  const prefixSvg = `<svg font-family="${fontFamily}" width="800" height="200" xmlns="http://www.w3.org/2000/svg">`;
  const afterSvg = `</svg>`;
  let textListStr = `<text stroke="black" font-size="${fontSize}" x="10" y="40">replace</text>`;
  const tspanStr = textList.reduce((prev, item) => {
    const { text, isLight } = item;
    return prev + text;
  }, "");
  textListStr = textListStr.replace("replace", tspanStr);
  return prefixSvg + textListStr + afterSvg;
}

/**
 * 跳转到视频的指定位置
 * avCanvas 编辑器实例
 * time 微秒
 */
export function jumpToVideoTime(avCanvas: AVCanvas, time: number) {
  avCanvas.previewFrame(time * 1e6);
}

/**
 * 添加textList 和 片段的preDuration
 */
export function transformClipConfig(videoClipPiece: AIGCClip) {
  let preDuration = 0;
  const deepConfig = _.cloneDeep(videoClipPiece);
  for (const info of deepConfig.info) {
    info.preDuration = preDuration;
    for (const sen of info.sens) {
      sen.textList = sen.textList?.length
        ? sen.textList
        : [{ text: sen.text, isLight: false }];

      sen.originTimestamp = sen.originTimestamp?.length
        ? sen.originTimestamp
        : sen.timestamp.map((time) => time + info.preDuration);
      // sen.select = 1;
    }
    preDuration += info.duration;
  }
  return deepConfig;
}

/** 获取canvas画布等比例缩放的样式 */
export function getCanvasScaleStyleByResolutionAndContainerRect(
  resolution: { width: number; height: number },
  containerRect: { width: number; height: number }
) {
  const scaleW = containerRect.width / resolution.width;
  const scaleH = containerRect.height / resolution.height;
  if (scaleW < scaleH) {
    const y = (containerRect.height - resolution.height * scaleW) / 2;
    return `transform: scale(${scaleW});
      transform-origin: 0px 0px;
      margin-top: ${y}px;`;
  } else {
    const x = (containerRect.width - resolution.width * scaleH) / 2;
    return `transform: scale(${scaleH});
      transform-origin: 0px 0px;
      margin-left: ${x}px;`;
  }
}

/** 获取播放的时长数组 */
export const getSenPlayList = (clipConfig: AIGCClip) => {
  const playListTime = [];
  for (const info of clipConfig.info) {
    for (const sen of info.sens) {
      if (sen.select) {
        playListTime.push({
          start: sen.originTimestamp[0],
          end: sen.originTimestamp[1],
        });
      }
    }
  }
  return playListTime;
};
