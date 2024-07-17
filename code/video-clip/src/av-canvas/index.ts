import {
  Combinator,
  DEFAULT_AUDIO_CONF,
  EventTool,
  Log,
  MediaStreamClip,
  OffscreenSprite,
  Rect,
  VisibleSprite,
  workerTimer
} from '@webav/av-cliper';
import {ESpriteManagerEvt,SpriteManager} from './sprites/sprite-manager';
import {IResolution} from './types';
import {createEl} from './utils';

function createInitCvsEl(resolution: IResolution & {style:string}): HTMLCanvasElement {
  const cvsEl = createEl('canvas') as HTMLCanvasElement;
  cvsEl.style.cssText = `
    display: block;
   ${resolution.style}
  `;
  cvsEl.width = resolution.width;
  cvsEl.height = resolution.height;

  return cvsEl;
}

export class AVCanvas {
  /** canvas 元素 */
  #cvsEl: HTMLCanvasElement;
  /** sprite 管理器 */
  #spriteManager: SpriteManager;
  /** canvas 画布 */
  #cvsCtx: CanvasRenderingContext2D;
  /** 是否销毁 */
  #destroyed = false;
  /** 需要清空的数组 */
  #clears: Array<() => void> = [];
  /** 当前渲染的时间 */
  #renderTime = 0;
  /** 帧率 */
  #frameRate = 30;
  /** 停止播放方法 */
  #stopRender: () => void;
  /** 事件中心 */
  #evtTool = new EventTool<{
    timeupdate: (time: number) => void;
    paused: () => void;
    playing: () => void;
    activeSpriteChange: (sprite: VisibleSprite | null) => void;
  }>();
  /** 事件绑定 */
  on = this.#evtTool.on;
  /**  */
  #opts;
  /** 播放配置 */
  #playState = {
    /** 开始时间 */
    start: 0,
    /** 结束时间 */
    end: 0,
    /** 每一帧之间的间隔时间 */
    step: 0,
    // step: (1000 / 30) * 1000,
    audioPlayAt: 0,
    // 倍速
    playbackRate:1.0
  };

  constructor(
    attchEl: HTMLElement,
    opts: {
      bgColor: string;
      style:string
    } & IResolution,
  ) {
    this.#opts = opts;
    this.#cvsEl = createInitCvsEl(opts);
    const ctx = this.#cvsEl.getContext('2d', { alpha: false });
    if (ctx == null) throw Error('canvas context is null');
    this.#cvsCtx = ctx;
    attchEl.appendChild(this.#cvsEl);

    createEmptyOscillatorNode(this.#audioCtx).connect(this.#captureAudioDest);

    Rect.CTRL_SIZE = 12 / (900 / this.#cvsEl.width);
    this.#spriteManager = new SpriteManager();

    this.#clears.push(
      this.#spriteManager.on(ESpriteManagerEvt.AddSprite, (s) => {
        const { rect } = s;
        // 默认居中
        if (rect.x === 0 && rect.y === 0) {
          rect.x = (this.#cvsEl.width - rect.w) / 2;
          rect.y = (this.#cvsEl.height - rect.h) / 2;
        }
      }),
      EventTool.forwardEvent(this.#spriteManager, this.#evtTool, [
        ESpriteManagerEvt.ActiveSpriteChange,
      ]),
    );

    let lastRenderTime = this.#renderTime;
    let start = performance.now();
    let runCnt = 0;
    const expectFrameTime = 1000 / this.#frameRate;
    /** 视频音量 */
    this.gainNode.gain.value = 0.1;
    this.gainNode.connect(this.#audioCtx.destination);
    this.#stopRender = workerTimer(() => {
      // workerTimer 会略快于真实时钟，使用真实时间（performance.now）作为基准
      // 跳过部分运行帧修正时间，避免导致音画不同步
      if ((performance.now() - start) / (expectFrameTime * runCnt) < 1) {
        return;
      }
      runCnt += 1;
      this.#cvsCtx.fillStyle = opts.bgColor;
      this.#cvsCtx.fillRect(0, 0, this.#cvsEl.width, this.#cvsEl.height);
      this.#render();

      if (lastRenderTime !== this.#renderTime) {
        lastRenderTime = this.#renderTime;
        this.#evtTool.emit('timeupdate', Math.round(lastRenderTime));
      }
    }, expectFrameTime);
  }
  /** 更新当前渲染时间 */
  #updateRenderTime(time: number) {
    this.#renderTime = time;
    this.#spriteManager.updateRenderTime(time);
  }

  #pause() {
    const emitPaused = this.#playState.step !== 0;
    this.#playState.step = 0;
    if (emitPaused) {
      this.#evtTool.emit('paused');
      this.#audioCtx.suspend();
    }
    for (const asn of this.#playingAudioCache) {
      asn.stop();
      asn.disconnect();
    }
    this.#playingAudioCache.clear();
  }
  /** 创建音频实例 */
  #audioCtx = new AudioContext();
  /** 音频播放流 */
  #captureAudioDest = this.#audioCtx.createMediaStreamDestination();
  /** 音频缓存 */
  #playingAudioCache: Set<AudioBufferSourceNode> = new Set();
  /** 创建音量控制器 */
  gainNode = this.#audioCtx.createGain();
  /** 渲染 */
  #render() {
    const cvsCtx = this.#cvsCtx;
    let ts = this.#renderTime;
    const { start, end, step, audioPlayAt } = this.#playState;
    if (step !== 0 && ts >= start && ts < end) {
      ts += step;
    } else {
      this.#pause();
    }
    this.#updateRenderTime(ts);

    const ctxDestAudioData: Float32Array[][] = [];
    for (const s of this.#spriteManager.getSprites()) {
      cvsCtx.save();
      const { audio } = s.render(cvsCtx, ts - s.time.offset);
      cvsCtx.restore();
      ctxDestAudioData.push(audio);
    }
    cvsCtx.resetTransform();

    if (step !== 0) {
      const curAudioTime = Math.max(this.#audioCtx.currentTime, audioPlayAt);
      const audioSourceArr = convertPCM2AudioSource(
        ctxDestAudioData,
        this.#audioCtx,
      );

      let addTime = 0;
      for (const ads of audioSourceArr) {
        ads.start(curAudioTime);
        ads.connect(this.#audioCtx.destination);
        ads.connect(this.#captureAudioDest);

        this.#playingAudioCache.add(ads);
        ads.onended = () => {
          ads.disconnect();
          this.#playingAudioCache.delete(ads);
        };
        addTime = Math.max(addTime, ads.buffer?.duration ?? 0);
      }
      this.#playState.audioPlayAt = curAudioTime + addTime;
    }
  }
  play(opts: { start: number; end: number; playbackRate?: number }) {
    const spriteTimes = this.#spriteManager
      .getSprites({ time: false })
      .map((s) => s.time.offset + s.time.duration);
    const end =
      opts.end ??
      (spriteTimes.length > 0 ? Math.max(...spriteTimes) : Infinity);

    if (opts.start >= end || opts.start < 0) {
      throw Error(
        `Invalid time parameter, ${JSON.stringify({ start: opts.start, end })}`,
      );
    }

    this.#updateRenderTime(opts.start);
    this.#spriteManager
      .getSprites({ time: false })
      .forEach((vs) => vs.preFirstFrame());

    this.#playState.start = opts.start;
    this.#playState.end = end;
    // AVCanvas 30FPS，将播放速率转换成步长
    this.#playState.step = (opts.playbackRate || this.#playState.playbackRate) * (1000 / this.#frameRate) * 1000;
    this.#audioCtx.resume();
    this.#playState.audioPlayAt = 0;

    this.#evtTool.emit('playing');
    Log.info('AVCanvs play by:', this.#playState);
  }
  pause() {
    this.#pause();
  }
  previewFrame(time: number) {
    this.#updateRenderTime(time);
    this.#pause();
  }
/** 设置倍速 */
  set playbackRate(nextPlaybackRate:number){
    this.#playState.playbackRate = nextPlaybackRate
    this.#playState.step = (nextPlaybackRate ?? 1) * (1000 / this.#frameRate) * 1000;
  }

  get activeSprite() {
    return this.#spriteManager.activeSprite;
  }
  set activeSprite(s: VisibleSprite | null) {
    this.#spriteManager.activeSprite = s;
  }

  #sprMapAudioNode = new WeakMap<VisibleSprite, AudioNode>();
  addSprite: SpriteManager['addSprite'] = async (vs) => {
    if (this.#audioCtx.state === 'suspended')
      this.#audioCtx.resume().catch(Log.error);

    const clip = vs.getClip();
    if (clip instanceof MediaStreamClip && clip.audioTrack != null) {
      const audioNode = this.#audioCtx.createMediaStreamSource(
        new MediaStream([clip.audioTrack]),
      );
      audioNode.connect(this.#captureAudioDest);
      this.#sprMapAudioNode.set(vs, audioNode);
    }
    await this.#spriteManager.addSprite(vs);
  };
  removeSprite: SpriteManager['removeSprite'] = (vs) => {
    /**  */
    this.#sprMapAudioNode.get(vs)?.disconnect();
    this.#spriteManager.removeSprite(vs);
  };
  /** 修改音量 0.1 - 1.0 */
  changeVolume(volume: number) {
    this.gainNode.gain.value = volume;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    this.#audioCtx.close();
    this.#captureAudioDest.disconnect();
    this.#evtTool.destroy();
    this.#stopRender();
    this.#cvsEl.parentElement?.remove();
    this.#clears.forEach((fn) => fn());
    this.#playingAudioCache.clear();
    this.#spriteManager.destroy();
  }

  captureStream(): MediaStream {
    if (this.#audioCtx.state === 'suspended') {
      this.#audioCtx.resume().catch(Log.error);
    }

    const ms = new MediaStream(
      this.#cvsEl
        .captureStream()
        .getTracks()
        .concat(this.#captureAudioDest.stream.getTracks()),
    );
    Log.info(
      'AVCanvas.captureStream, tracks:',
      ms.getTracks().map((t) => t.kind),
    );
    return ms;
  }

  async createCombinator(opts: { bitrate?: number } = {}) {
    const com = new Combinator({ ...this.#opts, ...opts });
    const sprites = this.#spriteManager.getSprites({ time: false });
    if (sprites.length === 0) throw Error('No sprite added');

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
  const asArr: AudioBufferSourceNode[] = [];
  if (pcmData.length === 0) return asArr;

  for (const [chan0Buf, chan1Buf] of pcmData) {
    if (chan0Buf == null) continue;
    const buf = ctx.createBuffer(
      2,
      chan0Buf.length,
      DEFAULT_AUDIO_CONF.sampleRate,
    );
    buf.copyToChannel(chan0Buf, 0);
    buf.copyToChannel(chan1Buf ?? chan0Buf, 1);
    const audioSource = ctx.createBufferSource();
    audioSource.buffer = buf;
    asArr.push(audioSource);
  }
  return asArr;
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
