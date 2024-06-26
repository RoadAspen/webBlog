import {ImgClip,MP4Clip,VisibleSprite} from "@webav/av-cliper";
import {TimelineAction,TimelineState} from "@xzdarcy/react-timeline-editor";
import {AVCanvas} from "../av-canvas";
import {AIGCClip,FontFamily,FontStyle,SingleText} from "../define";
import {convertSvgToPngStream,createSvg} from "../utils/utils";

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
  clipConfig: AIGCClip;
  volume?: number;
  playing?:boolean;
  playbackRate?:number
}
export class VideoCanvas {
  /** av canvas实例 */
  avCvs: AVCanvas | null;
  /** 缓存action对应的sprite，接入 @xzdarcy/react-timeline-editor 时可用 */
  actionSpriteMap = new WeakMap<TimelineAction, VisibleSprite>();
  /** action id 映射action */
  actionIdMap = new Map<string, TimelineAction>();
  /** 播放状态 */
  tlState?: TimelineState;
  /** fontSize */
  #fontSize: number;
  /** 花字 */
  #fontStyle: FontStyle;
  /** 重点花字 */
  #lightFontStyle: FontStyle;
  /** 字体 */
  #fontFamily: FontFamily;
  /** 上一个视频结尾时间 */
  preVideoTime = 0;
  /** 视频分辨率 和 canvas 尺寸的缩放比例 */
  scale: number = 1;
  /** clipConfig */
  clipConfig: AIGCClip;
  /** 音量 */
  #volume: number;
  /** 是否播放中 */
  #playing: boolean = false;
  /** 倍速 */
  #playbackRate:number = 1.0;
  /** 实例 */
  constructor(props: VideoCanvasConstructor) {
    const {
      cvsWrapEl,
      handleTimeUpdate,
      onPlayingChange,
      canvasStyle = { width: 1280, height: 720, bgColor: "#999" },
      fontSize,
      fontStyle,
      lightFontStyle,
      fontFamily,
      clipConfig,
      volume,
      playing,
      playbackRate
    } = props;
    this.#fontSize = fontSize;
    this.#fontStyle = fontStyle;
    this.#lightFontStyle = lightFontStyle;
    this.#fontFamily = fontFamily;
    this.#volume = volume || 0.1;
    this.#playing = playing ?? false;
    this.#playbackRate = playbackRate ?? 1.0;
    this.clipConfig = clipConfig;
    
    this.avCvs = new AVCanvas(cvsWrapEl, canvasStyle);
    this.avCvs.on("timeupdate", (time) => {
      console.log('timeUpdate',time);
      handleTimeUpdate?.(time)}
    );
    this.avCvs.on("playing", () => {
      this.#playing = true;
      onPlayingChange?.(true);
    });
    this.avCvs.on("paused", () => {
      this.#playing = false;
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
    const {info} = this.clipConfig;
    let duration = 0;
    for await(const group of info) {
      const video = (await fetch(group.sdVideoUrl)).body
      if(video){  
        console.log(video);
       await this.addVideoSprite2Track(video,group.id)
      }
      const {sens} = group;
      for (const sen of sens) {
        if(sen.select){
          await this.addImageSprite2Track({trackId:sen.text,svgText:{
             id:group.id + sen.id,
             start:duration*1e6 + sen.timestamp[0] * 1e6,
             end:duration*1e6 + sen.timestamp[1] * 1e6,
             textList:[{text:sen.text,isLight:false}]
           }})
        }
      }
      duration += group.duration
    }
  };
  /** 添加 视频 track */
  public addVideoSprite2Track = async (videoStream: ReadableStream<Uint8Array>, trackId: string) => {
    const clips = new MP4Clip(videoStream,{audio:{volume:0.1}});
    const data = await clips.ready;
    const spr = new VisibleSprite(clips);
    console.log("preVideoTime", this.preVideoTime);
    spr.time.offset = this.preVideoTime * 1e6;
    spr.time.duration = data.duration * 1e6;
    spr.rect.w = clips.meta.width;
    spr.rect.h = clips.meta.height;
    await this.avCvs?.addSprite(spr);
    const meta = spr.getClip().meta;
    const duration = meta.duration;
    const end = duration / 1e6 + this.preVideoTime;
    const action = {
      id: Math.random().toString(),
      start: spr.time.offset / 1e6,
      end,
      effectId: trackId,
      name: "视频",
    };
    this.preVideoTime = end;
    return action;
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
      fontSize: this.#fontSize,
      fontFamily: this.#fontFamily,
      fontStyle: this.#fontStyle,
      lightFontStyle: this.#lightFontStyle,
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
    this.actionIdMap.set(trackId, action);
    this.actionSpriteMap.set(action, spr);
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
    await this.removeSprite2Track({ trackId });
    await this.addImageSprite2Track(params);
  };
  /** 删除句子、视频轨道 */
  public removeSprite2Track = async (params: { trackId: string }) => {
    const { trackId } = params;
    console.log("删除trackId", trackId);
    const action = this.actionIdMap.get(trackId);
    if (!action) {
      this.actionIdMap.delete(trackId);
      return;
    }
    const currentSprite = this.actionSpriteMap.get(action);
    if (!currentSprite) {
      this.actionSpriteMap.delete(action);
      return;
    }
    this.actionIdMap.delete(trackId);
    this.actionSpriteMap.delete(action);
    this.avCvs?.removeSprite(currentSprite);
    currentSprite.destroy();
  };
  /** 删除所有Sprite */
  public removeAllSprite2Track = async () => {
    this.resetAllSprite();
    for (const [trackId] of this.actionIdMap) {
      this.removeSprite2Track({ trackId });
    }
  };
  /** 重置 */
  public resetAllSprite = async () => {
    this.avCvs?.previewFrame(0);
    this.preVideoTime = 0;
    this.avCvs?.pause();
    this.scale = 1;
    this.#playing = false;
    this.removeAllSprite2Track();
  };
  /** 片段排序 */
  public fragmentSort = async (videoClipPiece: AIGCClip) => {
    await this.resetAllSprite();
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
    this.#fontSize = fontSize?? this.#fontSize;
    this.#fontStyle = fontStyle ?? this.#fontStyle;
    this.#lightFontStyle = lightFontStyle ?? this.#lightFontStyle;
    this.#fontFamily = fontFamily??this.#fontFamily;
    this.removeAllSprite2Track();
    await this.init(this.clipConfig);
  };
  /** 更改倍速 */
  public setPlayBackRate = (rate: number) => {
    this.avCvs?.play({
      start: 0,
      playbackRate: rate,
    });
  };
  /** 音量 */
  get volume() {
    return this.#volume * 100;
  }
  set volume(volume: number){
    const vol = volume / 100;
    this.#volume = vol;
    this.avCvs?.changeVolume(vol);
  }
  /** 开始 */
  public play(params:{start: number;
    end?: number | undefined;
    playbackRate?: number | undefined;}){
      const {start,end,playbackRate} = params
    this.avCvs?.play({start,end:end ?? 900000000,playbackRate:playbackRate ?? this.#playbackRate})
    this.#playing = true
  }
  /** 暂停 */
  public pause(){
    this.#playing = false
    this.avCvs?.pause()
  }
  /** 倍速 */
  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(nextPlaybackRate: number){
    this.#playbackRate = nextPlaybackRate;
    this.avCvs?.play({
      start:0,
      playbackRate:this.#playbackRate
    })
  }
  public previewFrame = (time:number) => {
    this.avCvs?.previewFrame(time);
  };
  /** 整个实例销毁 */
  public destroy = () => {
    this.avCvs?.destroy();
  };
}
