import {
  Combinator,
  DEFAULT_AUDIO_CONF,
  EventTool,
  Log,
  MediaStreamClip,
  OffscreenSprite,
  Rect,
  TCtrlKey,
  VisibleSprite,
  concatPCMFragments,
  workerTimer,
} from "@webav/av-cliper";
import { renderCtrls } from "./sprites/render-ctrl";
import { ESpriteManagerEvt, SpriteManager } from "./sprites/sprite-manager";
import { activeSprite, draggabelSprite } from "./sprites/sprite-op";
import { IResolution } from "./types";
import { createEl } from "./utils";

function createInitCvsEl(resolution: IResolution): HTMLCanvasElement {
  const cvsEl = createEl("canvas") as HTMLCanvasElement;
  cvsEl.style.cssText = `
    width: 100%;
    height: 100%;
    display: block;
  `;
  cvsEl.width = resolution.width;
  cvsEl.height = resolution.height;

  return cvsEl;
}

export class AVCanvas {
  cvsEl: HTMLCanvasElement;

  spriteManager: SpriteManager;

  cvsCtx: CanvasRenderingContext2D;

  destroyed = false;

  clears: Array<() => void> = [];
  stopRender: () => void;

  evtTool = new EventTool<{
    timeupdate: (time: number) => void;
    paused: () => void;
    playing: () => void;
    activeSpriteChange: (sprite: VisibleSprite | null) => void;
  }>();
  on = this.evtTool.on;

  opts;

  constructor(
    attchEl: HTMLElement,
    opts: {
      bgColor: string;
    } & IResolution
  ) {
    this.opts = opts;
    this.cvsEl = createInitCvsEl(opts);
    const ctx = this.cvsEl.getContext("2d", { alpha: false });
    if (ctx == null) throw Error("canvas context is null");
    this.cvsCtx = ctx;
    const container = createEl("div");
    container.style.cssText =
      "width: 100%; height: 100%; position: relative; overflow: hidden;";
    container.appendChild(this.cvsEl);
    attchEl.appendChild(container);

    createEmptyOscillatorNode(this.audioCtx).connect(this.captureAudioDest);

    Rect.CTRL_SIZE = 12 / (900 / this.cvsEl.width);
    this.spriteManager = new SpriteManager();

    this.clears.push(
      // 鼠标样式、控制 sprite 依赖 activeSprite，
      // activeSprite 需要在他们之前监听到 mousedown 事件 (代码顺序需要靠前)
      activeSprite(this.cvsEl, this.spriteManager),
      dynamicCusor(this.cvsEl, this.spriteManager),
      draggabelSprite(this.cvsEl, this.spriteManager, container),
      renderCtrls(container, this.cvsEl, this.spriteManager),
      this.spriteManager.on(ESpriteManagerEvt.AddSprite, (s) => {
        const { rect } = s;
        // 默认居中
        if (rect.x === 0 && rect.y === 0) {
          rect.x = (this.cvsEl.width - rect.w) / 2;
          rect.y = (this.cvsEl.height - rect.h) / 2;
        }
      }),
      EventTool.forwardEvent(this.spriteManager, this.evtTool, [
        ESpriteManagerEvt.ActiveSpriteChange,
      ])
    );

    let lastRenderTime = this.renderTime;
    let start = performance.now();
    let runCnt = 0;
    const expectFrameTime = 1000 / 30;
    /** 视频音量 */
    this.gainNode.gain.value = 0.1;
    this.gainNode.connect(this.audioCtx.destination);
    /** 循环执行 */
    this.stopRender = workerTimer(() => {
      // workerTimer 会略快于真实时钟，使用真实时间（performance.now）作为基准
      // 跳过部分运行帧修正时间，避免导致音画不同步
      if ((performance.now() - start) / (expectFrameTime * runCnt) < 1) {
        return;
      }
      runCnt += 1;
      this.cvsCtx.fillStyle = opts.bgColor;
      this.cvsCtx.fillRect(0, 0, this.cvsEl.width, this.cvsEl.height);
      this.render();

      if (lastRenderTime !== this.renderTime) {
        lastRenderTime = this.renderTime;
        this.evtTool.emit("timeupdate", Math.round(lastRenderTime));
      }
    }, expectFrameTime);

    // ;(window as any).cvsEl = this.cvsEl
  }

  renderTime = 0e6;
  updateRenderTime(time: number) {
    this.renderTime = time;
    this.spriteManager.updateRenderTime(time);
  }

  pause() {
    const emitPaused = this.playState.step !== 0;
    this.playState.step = 0;
    if (emitPaused) {
      this.evtTool.emit("paused");
      this.audioCtx.suspend();
    }
    for (const asn of this.playingAudioCache) {
      asn.stop();
      asn.disconnect();
    }
    this.playingAudioCache.clear();
  }

  /** 音频源 */
  audioCtx = new AudioContext();
  /** 音频流 */
  captureAudioDest = this.audioCtx.createMediaStreamDestination();
  /** 创建音量控制器 */
  gainNode = this.audioCtx.createGain();
  /** 播放中音频缓存 */
  playingAudioCache: Set<AudioBufferSourceNode> = new Set();
  /** 播放帧动画、音频 */
  render() {
    console.log("render");
    const cvsCtx = this.cvsCtx;
    let ts = this.renderTime;
    const { start, end, step, audioPlayAt } = this.playState;
    if (step !== 0 && ts >= start && ts < end) {
      ts += step;
    } else {
      this.pause();
    }
    this.updateRenderTime(ts);

    const ctxDestAudioData: Float32Array[][] = [];
    for (const s of this.spriteManager.getSprites()) {
      cvsCtx.save();
      const { audio } = s.render(cvsCtx, ts - s.time.offset);
      cvsCtx.restore();

      ctxDestAudioData.push(audio);
    }
    cvsCtx.resetTransform();

    if (step !== 0) {
      const curAudioTime = Math.max(this.audioCtx.currentTime, audioPlayAt);
      const ctxDestADSource = convertPCM2AudioSource(
        ctxDestAudioData,
        this.audioCtx
      );
      ctxDestADSource?.connect(this.gainNode);
      if (ctxDestADSource != null) {
        ctxDestADSource.connect(this.audioCtx.destination);
        ctxDestADSource.connect(this.captureAudioDest);
        ctxDestADSource.start(curAudioTime);

        this.playingAudioCache.add(ctxDestADSource);
        ctxDestADSource.onended = () => {
          ctxDestADSource.disconnect();
          this.playingAudioCache.delete(ctxDestADSource);
        };
        this.playState.audioPlayAt =
          curAudioTime + (ctxDestADSource.buffer?.duration ?? 0);
      }
    }
  }

  playState = {
    start: 0,
    end: 0,
    // paused state when step equal 0
    step: 0,
    // step: (1000 / 30) * 1000,
    audioPlayAt: 0,
  };
  play(opts: { start: number; end?: number; playbackRate?: number }) {
    const spriteTimes = this.spriteManager
      .getSprites({ time: false })
      .map((s) => s.time.offset + s.time.duration);
    const end =
      opts.end ??
      (spriteTimes.length > 0 ? Math.max(...spriteTimes) : Infinity);

    if (opts.start >= end || opts.start < 0) {
      throw Error(
        `Invalid time parameter, ${JSON.stringify({ start: opts.start, end })}`
      );
    }

    this.updateRenderTime(opts.start);
    this.spriteManager
      .getSprites({ time: false })
      .forEach((vs) => vs.preFirstFrame());

    this.playState.start = opts.start;
    this.playState.end = end;
    // AVCanvas 30FPS，将播放速率转换成步长
    this.playState.step = (opts.playbackRate ?? 1) * (1000 / 30) * 1000;
    this.audioCtx.resume();
    this.playState.audioPlayAt = 0;

    this.evtTool.emit("playing");
    Log.info("AVCanvs play by:", this.playState);
  }
  previewFrame(time: number) {
    this.updateRenderTime(time);
    this.pause();
  }

  sprMapAudioNode = new WeakMap<VisibleSprite, AudioNode>();
  addSprite: SpriteManager["addSprite"] = async (vs) => {
    if (this.audioCtx.state === "suspended")
      this.audioCtx.resume().catch(Log.error);

    const clip = vs.getClip();
    if (clip instanceof MediaStreamClip && clip.audioTrack != null) {
      const audioNode = this.audioCtx.createMediaStreamSource(
        new MediaStream([clip.audioTrack])
      );
      audioNode.connect(this.captureAudioDest);
      this.sprMapAudioNode.set(vs, audioNode);
    }
    this.spriteManager.addSprite(vs);
  };
  removeSprite: SpriteManager["removeSprite"] = (vs) => {
    this.sprMapAudioNode.get(vs)?.disconnect();
    this.spriteManager.removeSprite(vs);
  };

  /** 修改音量 0.1 - 1.0 */
  changeVolume(volume: number) {
    this.gainNode.gain.value = volume;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.audioCtx.close();
    this.captureAudioDest.disconnect();
    this.evtTool.destroy();
    this.stopRender();
    this.cvsEl.parentElement?.remove();
    this.clears.forEach((fn) => fn());
    this.playingAudioCache.clear();
    this.spriteManager.destroy();
  }

  captureStream(): MediaStream {
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(Log.error);
    }

    const ms = new MediaStream(
      this.cvsEl
        .captureStream()
        .getTracks()
        .concat(this.captureAudioDest.stream.getTracks())
    );
    Log.info(
      "AVCanvas.captureStream, tracks:",
      ms.getTracks().map((t) => t.kind)
    );
    return ms;
  }

  async createCombinator(opts: { bitrate?: number } = {}) {
    const com = new Combinator({ ...this.opts, ...opts });
    const sprites = this.spriteManager.getSprites({ time: false });
    if (sprites.length === 0) throw Error("No sprite added");

    for (const vs of sprites) {
      const os = new OffscreenSprite(vs.getClip());
      os.time = { ...vs.time };
      vs.copyStateTo(os);
      await com.addSprite(os);
    }
    return com;
  }
}

function convertPCM2AudioSource(pcmData: Float32Array[][], ctx: AudioContext) {
  if (pcmData.length === 0) return null;
  const [chan0, chan1] = concatPCMFragments(pcmData);
  if (chan0 == null || chan0.length === 0) return null;
  const buf = ctx.createBuffer(
    2,
    chan0.length / 2,
    DEFAULT_AUDIO_CONF.sampleRate
  );
  buf.copyToChannel(chan0, 0);
  buf.copyToChannel(chan1, 1);

  const audioSource = ctx.createBufferSource();
  audioSource.buffer = buf;
  return audioSource;
}

/**
 * 根据当前位置（sprite & ctrls），动态调整鼠标样式
 */
function dynamicCusor(
  cvsEl: HTMLCanvasElement,
  sprMng: SpriteManager
): () => void {
  const cvsRatio = {
    w: cvsEl.clientWidth / cvsEl.width,
    h: cvsEl.clientHeight / cvsEl.height,
  };

  const observer = new ResizeObserver(() => {
    cvsRatio.w = cvsEl.clientWidth / cvsEl.width;
    cvsRatio.h = cvsEl.clientHeight / cvsEl.height;
  });
  observer.observe(cvsEl);

  const cvsStyle = cvsEl.style;

  let actSpr = sprMng.activeSprite;
  sprMng.on(ESpriteManagerEvt.ActiveSpriteChange, (s) => {
    actSpr = s;
    if (s == null) cvsStyle.cursor = "";
  });
  // 鼠标按下时，在操作过程中，不需要变换鼠标样式
  let isMSDown = false;
  const onDown = ({ offsetX, offsetY }: MouseEvent): void => {
    isMSDown = true;
    // 将鼠标点击偏移坐标映射成 canvas 坐，
    const ofx = offsetX / cvsRatio.w;
    const ofy = offsetY / cvsRatio.h;
    // 直接选中 sprite 时，需要改变鼠标样式为 move
    if (actSpr?.rect.checkHit(ofx, ofy) === true && cvsStyle.cursor === "") {
      cvsStyle.cursor = "move";
    }
  };
  const onWindowUp = (): void => {
    isMSDown = false;
  };

  // 八个 ctrl 点位对应的鼠标样式，构成循环
  const curStyles = [
    "ns-resize",
    "nesw-resize",
    "ew-resize",
    "nwse-resize",
    "ns-resize",
    "nesw-resize",
    "ew-resize",
    "nwse-resize",
  ];
  const curInitIdx = { t: 0, rt: 1, r: 2, rb: 3, b: 4, lb: 5, l: 6, lt: 7 };

  const onMove = (evt: MouseEvent): void => {
    // 按下之后，不再变化，因为可能是在拖拽控制点
    if (actSpr == null || isMSDown) return;
    const { offsetX, offsetY } = evt;
    const ofx = offsetX / cvsRatio.w;
    const ofy = offsetY / cvsRatio.h;
    const [ctrlKey] =
      (Object.entries(actSpr.rect.ctrls).find(([, rect]) =>
        rect.checkHit(ofx, ofy)
      ) as [TCtrlKey, Rect]) ?? [];

    if (ctrlKey != null) {
      if (ctrlKey === "rotate") {
        cvsStyle.cursor = "crosshair";
        return;
      }
      // 旋转后，控制点的箭头指向也需要修正
      const angle = actSpr.rect.angle;
      const oa = angle < 0 ? angle + 2 * Math.PI : angle;
      // 每个控制点的初始样式（idx） + 旋转角度导致的偏移，即为新鼠标样式
      // 每旋转45°，偏移+1，以此在curStyles中循环
      const idx =
        (curInitIdx[ctrlKey] + Math.floor((oa + Math.PI / 8) / (Math.PI / 4))) %
        8;
      cvsStyle.cursor = curStyles[idx];
      return;
    }
    if (actSpr.rect.checkHit(ofx, ofy)) {
      cvsStyle.cursor = "move";
      return;
    }
    // 未命中 ctrls、sprite，重置为默认鼠标样式
    cvsStyle.cursor = "";
  };

  cvsEl.addEventListener("mousemove", onMove);
  cvsEl.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onWindowUp);

  return () => {
    observer.disconnect();
    cvsEl.removeEventListener("mousemove", onMove);
    cvsEl.removeEventListener("mousedown", onDown);
    window.removeEventListener("mouseup", onWindowUp);
  };
}

/**
 * 空背景音，让 dest 能持续收到音频数据，否则时间会异常偏移
 */
function createEmptyOscillatorNode(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const real = new Float32Array([0, 0]);
  const imag = new Float32Array([0, 0]);
  const wave = ctx.createPeriodicWave(real, imag, {
    disableNormalization: true,
  });
  osc.setPeriodicWave(wave);
  osc.start();
  return osc;
}
