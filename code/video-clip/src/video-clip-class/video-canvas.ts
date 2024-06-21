import { ImgClip, VisibleSprite } from "@webav/av-cliper";
import { TimelineAction, TimelineState } from "@xzdarcy/react-timeline-editor";
import { AVCanvas } from "../av-canvas";
import { AIGCClip, FontFamily, FontStyle, SingleText } from "../define";
import { convertSvgToPngStream, createSvg } from "../utils/utils";

interface VideoCanvasConstructor {
  cvsWrapEl: HTMLDivElement;
  handleTimeUpdate?: (time: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  canvasStyle?: {
    bgColor: string;
    width: number;
    height: number;
  };
  fontSize: number;
  fontStyle: FontStyle;
  lightFontStyle: FontStyle;
  fontFamily: string;
}
export class VideoCanvas {
  /** av canvas实例 */
  avCvs: AVCanvas | null;
  /** 缓存action对应的sprite，接入 @xzdarcy/react-timeline-editor 时可用 */
  actionSpriteMap = new WeakMap<TimelineAction, VisibleSprite>();
  /** action id 映射action */
  actionIdMap = new Map<string, TimelineAction>();
  /** 是否播放中 */
  playing: boolean = false;
  /** 播放状态 */
  tlState?: TimelineState;
  /** fontSize */
  fontSize: number;
  /** 花字 */
  fontStyle: FontStyle;
  /** 重点花字 */
  lightFontStyle: FontStyle;
  /** 字体 */
  fontFamily: FontFamily;
  /** 上一个视频结尾时间 */
  preVideoTime = 0;
  /** 视频分辨率 和 canvas 尺寸的缩放比例 */
  scale: number = 1;
  /** clipConfig */
  clipConfig: AIGCClip | null;
  /** 实例 */
  constructor(props: VideoCanvasConstructor) {
    const {
      cvsWrapEl,
      handleTimeUpdate,
      onPlayingChange,
      canvasStyle = { width: 1280, height: 720, bgColor: "#000" },
      fontSize,
      fontStyle,
      lightFontStyle,
      fontFamily,
    } = props;
    this.fontSize = fontSize;
    this.fontStyle = fontStyle;
    this.lightFontStyle = lightFontStyle;
    this.fontFamily = fontFamily;
    this.avCvs = new AVCanvas(cvsWrapEl, canvasStyle);
    this.avCvs.on("timeupdate", (time) => handleTimeUpdate?.(time));
    this.avCvs.on("playing", () => {
      this.playing = true;
      onPlayingChange?.(true);
    });
    this.avCvs.on("paused", () => {
      this.playing = false;
      onPlayingChange?.(false);
    });
  }
  /** 初始化所有的sprint */
  init = async (videoClipPiece: AIGCClip) => {
    this.clipConfig = videoClipPiece;
    await this.createAllSprite();
  };
  /** 初始化所有的sprite */
  private createAllSprite = async () => {
    // const {} = this.clipConfig;
  };
  /** 添加图片 */
  public addImageSprite2Track = async (
    params: {
      trackId: string;
      svgText: SingleText;
      name?: string;
    },
    isPreviewFrame?: boolean
  ) => {
    const { trackId, svgText, name } = params;
    const svgImg = createSvg({
      textList: svgText.textList,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontStyle: this.fontStyle,
      lightFontStyle: this.lightFontStyle,
    });
    console.log("svgImg", svgImg);
    const imageStream = await convertSvgToPngStream(svgImg);
    const imageClip = new ImgClip(imageStream);
    await imageClip.ready;
    const spr = new VisibleSprite(imageClip);
    await this.avCvs?.addSprite(spr);
    spr.time.offset = svgText.start;
    spr.time.duration = svgText.end - svgText.start;

    const action = {
      id: Math.random().toString(),
      start: svgText.start / 1e6,
      end: svgText.end / 1e6,
      effectId: "",
      name,
    };
    if (isPreviewFrame) {
      this.avCvs?.previewFrame(svgText.start);
      this.avCvs?.play({ start: svgText.start || 0 });
    }
    return { trackId, spr, action };
  };
  /** 更新 句子 track */
  public updateImageSprite2Track = async (params: {
    trackId: string;
    svgText: SingleText;
    name?: string;
  }) => {
    const { trackId } = params;
    await this.removeImageSprite2Track({ trackId });
    await this.addImageSprite2Track(params);
  };
  /** 删除句子 */
  public removeImageSprite2Track = async (params: { trackId: string }) => {
    const { trackId } = params;
    console.log("删除trackId", trackId);
    const action = this.actionIdMap.get(trackId);
    if (!action) return;
    const currentSprite = this.actionSpriteMap.get(action);
    if (!currentSprite) return;
    this.actionIdMap.delete(trackId);
    this.actionSpriteMap.delete(action);
    this.avCvs?.removeSprite(currentSprite);
    currentSprite.destroy();
  };
  /** 删除所有Sprite */
  public removeAllSprite2Track = async () => {
    this.avCvs?.pause();
    for (const [trackId, action] of this.actionIdMap) {
      if (!action) {
        this.actionIdMap.delete(trackId);
        continue;
      }
      const currentSprite = this.actionSpriteMap.get(action);
      if (!currentSprite) return;
      this.actionIdMap.delete(trackId);
      this.actionSpriteMap.delete(action);
      this.avCvs?.removeSprite(currentSprite);
      currentSprite.destroy();
    }
  };
  /** 片段排序 */
  public fragmentSort = async (videoClipPiece: AIGCClip) => {
    this.removeAllSprite2Track();
    await this.init(videoClipPiece);
  };
  /**  */
  /** 更新字幕配置 */
  public updateTextConfig = async (config: {
    /** fontSize */
    fontSize?: number;
    /** 花字 */
    fontStyle?: FontStyle;
    /** 重点花字 */
    lightFontStyle?: FontStyle;
    /** 字体 */
    fontFamily?: FontFamily;
  }) => {
    const { fontSize, fontStyle, lightFontStyle, fontFamily } = config;
    this.fontSize = fontSize || this.fontSize;
    this.fontStyle = fontStyle;
    this.lightFontStyle = lightFontStyle;
    this.fontFamily = fontFamily;
    this.removeAllSprite2Track();
    await this.init(videoClipPiece);
  };
  /** 整个实例销毁 */
  public destroy = () => {
    this.avCvs?.destroy();
  };
}
