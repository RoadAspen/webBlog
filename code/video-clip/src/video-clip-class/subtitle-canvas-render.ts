import { FontStyleItem, TextItem } from "../define";

interface CreateImageFromTextListProps {
  /** 字体 */
  fontFamily?: string;
  /** 字号 */
  fontSize: number;
  /** 是否加粗 */
  fontWeight?: number | string;
  /** 花字样式 */
  fontStyle: FontStyleItem;
  /** 高亮花字样式 */
  lightFontStyle: FontStyleItem;
  /** 文案最大宽度 */
  containerWidth: number;
  /** 文字列表 */
  textList: TextItem[];
  /** 放大倍数，削减文字锯齿 */
  multiple?: number;
  /** 字间距 */
  letterSpacing?: number;
  /** 行间距 */
  lineSpacing?: number;
}
let a = false;
/** 根据字幕文案创建图片 */
export async function createImageFromSubtitleList(
  params: CreateImageFromTextListProps
) {
  const {
    fontFamily = "华文楷体",
    fontStyle,
    fontSize = 36,
    lightFontStyle,
    containerWidth,
    textList,
    multiple = 10,
    fontWeight = "bold",
    letterSpacing = 10,
    lineSpacing = 10,
  } = params;
  let isBr = false;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const maxLineWidth = containerWidth;
  const xPadding = 0;
  const yPadding = (fontSize + lineSpacing / 2) * multiple;
  canvas.width = maxLineWidth;
  canvas.height = 5000;

  let drawX = xPadding;
  let drawY = yPadding;

  for (const textItem of textList) {
    const { stroke, fill, shadow, filter } = textItem.isLight
      ? lightFontStyle.fontStyle
      : fontStyle.fontStyle;
    if (textItem.text?.length) {
      for (const text of textItem.text) {
        ctx.font = `${fontWeight} ${fontSize * multiple}px ${fontFamily}`;
        ctx.save();
        // 测量字符宽度
        const textWidth = ctx.measureText(text).width;

        console.log("text", text);
        console.log("textWidth", textWidth);
        console.log("drawX", drawX);
        // 判断是否需要换行
        if (drawX + textWidth > maxLineWidth) {
          isBr = true;
          drawX = xPadding;
          drawY += yPadding;
        }

        // 应用描边
        if (stroke?.length) {
          for (const str of stroke) {
            ctx.lineJoin = str.lineJoin;
            ctx.strokeStyle = str.strokeStyle;
            ctx.lineWidth = str.lineWidth * multiple;
            // 描边路径
            const clientX = drawX + (str.strokeOffsetX || 0) * multiple;
            const clientY = drawY + (str.strokeOffsetY || 0) * multiple;
            ctx.strokeText(text, clientX, clientY);
          }
        }

        if (filter) {
          ctx.filter = filter;
        }
        // 应用阴影
        if (shadow) {
          ctx.shadowColor = shadow.shadowColor;
          ctx.shadowBlur = shadow.shadowBlur * multiple;
          ctx.shadowOffsetX = (shadow.shadowOffsetX || 0) * multiple;
          ctx.shadowOffsetY = (shadow.shadowOffsetY || 0) * multiple;
        }
        // 应用填充
        if (fill) {
          ctx.fillStyle = fill.color;
        }
        ctx.fillText(text, drawX, drawY);
        ctx.restore();
        // 增加字符间距
        drawX += textWidth + letterSpacing * multiple;
      }
    }
  }

  const clipWidth = isBr ? maxLineWidth : drawX;
  const clipHeight = drawY + lineSpacing * multiple;
  // 获取要裁剪的图像数据
  const imageData = ctx.getImageData(0, 0, clipWidth, clipHeight);

  // 创建新的 Canvas 并绘制裁剪后的图像数据
  const croppedCanvas = document.createElement("canvas");

  croppedCanvas.width = clipWidth;
  croppedCanvas.height = clipHeight;
  const croppedCtx = croppedCanvas.getContext("2d") as CanvasRenderingContext2D;
  croppedCtx.putImageData(imageData, 0, 0);

  // // 导出裁剪后的图像
  const croppedImageURL = croppedCanvas.toDataURL("image/png");
  if (!a) {
    const link = document.createElement("a");
    link.href = croppedImageURL;
    link.download = "cropped_image.png";
    link.click();
    link.remove();
    a = true;
  }
  return croppedImageURL;
}
