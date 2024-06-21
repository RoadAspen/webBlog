import { ImgClip, MP4Clip, VisibleSprite } from "@webav/av-cliper";
import {
  TimelineAction,
  TimelineRow,
  TimelineState,
} from "@xzdarcy/react-timeline-editor";
import { Button, Select, Slider } from "antd";
import { useEffect, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import { AVCanvas } from "../av-canvas";
import {
  fontFamilyList,
  fontSizeList,
  fontStyleList,
  lightFontStyleList,
} from "../constant";
import { FontFamily, FontSize, FontStyle, SingleText } from "../define";
import {
  convertSvgToPngStream,
  createSvg,
  getHtmlStringFromContentEditable,
  getSelectionAndTransform,
  getStringFromHtml,
} from "../utils/utils";
import { TLActionWithName, TimelineEditor } from "./time-line.component";

const actionSpriteMap = new WeakMap<TimelineAction, VisibleSprite>();
const actionIdMap = new Map<string, TimelineAction>();
const trackId = "video";
const trackId2 = "video2";
let preVideoTime = 0;
export function VideoClip() {
  const [avCvs, setAVCvs] = useState<AVCanvas | null>(null);
  const tlState = useRef<TimelineState>();
  const [allTime, setAllTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [playing, setPlaying] = useState(false);
  const [allTextList, setAllTextList] = useState<Array<SingleText>>([
    {
      id: "text1",
      textList: [{ text: "这是第一条字幕", isLight: false }],
      start: 3 * 1e6,
      end: 8 * 1e6,
    },
    {
      id: "text2",
      textList: [{ text: "这是第二条字幕", isLight: false }],
      start: 10 * 1e6,
      end: 15 * 1e6,
    },
  ]);
  const [fontFamily, setFontFamily] = useState<FontFamily>(fontFamilyList[0]);
  const [fontSize, setFontSize] = useState<FontSize>(30);
  const [fontStyle, setFontStyle] = useState<FontStyle | undefined>(
    fontStyleList[0]
  );
  const [lightFontStyle, setLightFontStyle] = useState<FontStyle | undefined>(
    lightFontStyleList[0]
  );
  /** canvas wrap */
  const [cvsWrapEl, setCvsWrapEl] = useState<HTMLDivElement | null>(null);
  const [tlData, setTLData] = useState<TimelineRow[]>([]);

  useEffect(() => {
    if (cvsWrapEl == null) return;
    avCvs?.destroy();
    const cvs = new AVCanvas(cvsWrapEl, {
      bgColor: "#000",
      width: 1280,
      height: 720,
    });
    setAVCvs(cvs);
    cvs.on("timeupdate", (time) => {
      if (tlState.current == null) return;
      tlState.current.setTime(time / 1e6);
      console.log("time", time);
    });
    cvs.on("playing", () => {
      setPlaying(true);
    });
    cvs.on("paused", () => {
      setPlaying(false);
    });

    return () => {
      cvs.destroy();
    };
  }, [cvsWrapEl]);
  /** 添加 视频 track */
  async function addVideoSprite2Track(file: File, trackId: string) {
    const videoStream = file.stream();
    const clips = new MP4Clip(videoStream);
    const data = await clips.ready;
    const spr = new VisibleSprite(clips);
    console.log("preVideoTime", preVideoTime);
    spr.time.offset = preVideoTime * 1e6;
    spr.time.duration = data.duration * 1e6;
    console.log("clips.meta.width", clips.meta.width);
    console.log("clips.meta.height", clips.meta.height);
    spr.rect.w = clips.meta.width;
    spr.rect.h = clips.meta.height;
    await avCvs?.addSprite(spr);
    const meta = spr.getClip().meta;
    const duration = meta.duration;
    const track: TimelineRow = tlData.find((tl) => tl.id === trackId) ?? {
      id: trackId,
      actions: [],
    };
    const end = duration / 1e6 + preVideoTime;
    const action = {
      id: Math.random().toString(),
      start: spr.time.offset / 1e6,
      end,
      effectId: trackId,
      name: "视频",
    };
    preVideoTime = end;
    actionSpriteMap.set(action, spr);
    actionIdMap.set(trackId, action);
    track.actions.push(action);
    setTLData((pre) => {
      const next = [track, ...pre];
      return next;
    });
    return action;
  }

  /** 添加 图片 track */
  async function addImageSprite2Track(params: {
    trackId: string;
    svgText: SingleText;
    name?: string;
  }) {
    const { trackId, svgText, name } = params;
    const svgImg = createSvg({
      textList: svgText.textList,
      fontSize,
      fontFamily,
      fontStyle,
      lightFontStyle,
    });
    console.log("svgImg", svgImg);
    const imageStream = await convertSvgToPngStream(svgImg);
    const imageClip = new ImgClip(imageStream);
    await imageClip.ready;
    const spr = new VisibleSprite(imageClip);
    await avCvs?.addSprite(spr);
    spr.time.offset = svgText.start;
    spr.time.duration = svgText.end - svgText.start;
    const track: TimelineRow = tlData.find((tl) => tl.id === trackId) ?? {
      id: trackId,
      actions: [],
    };

    const action = {
      id: Math.random().toString(),
      start: svgText.start / 1e6,
      end: svgText.end / 1e6,
      effectId: "",
      name,
    };
    actionSpriteMap.set(action, spr);
    actionIdMap.set(trackId, action);
    track.actions = [action];
    avCvs?.previewFrame(svgText.start);
    avCvs?.play({ start: svgText.start || 0 });
    setTLData((pre) => {
      const next = [track, ...pre];
      return next;
    });
    return action;
  }
  /** 更新 图片 track */
  async function updateImageSprite2Track(params: {
    trackId: string;
    svgText: SingleText;
    name?: string;
  }) {
    const { trackId } = params;
    await removeImageSprite2Track({ trackId });
    await addImageSprite2Track(params);
  }
  /** 删除图片 */
  async function removeImageSprite2Track(params: { trackId: string }) {
    const { trackId } = params;
    console.log("删除trackId", trackId);
    const action = actionIdMap.get(trackId);
    if (!action) return;
    const currentSprite = actionSpriteMap.get(action);
    if (!currentSprite) return;
    actionIdMap.delete(trackId);
    actionSpriteMap.delete(action);
    avCvs?.removeSprite(currentSprite);
    currentSprite.destroy();
    setTLData((pre) => {
      return pre.filter((tl) => tl.id !== trackId);
    });
  }

  return (
    <div className="canvas-wrap">
      <div className="flex mx-10">
        <div className="w-1/2 pt-10">
          <div ref={(el) => setCvsWrapEl(el)}></div>
          <div className="flex my-5">
            <button
              className="mx-[10px]"
              onClick={async () => {
                if (avCvs == null) return;
                if (playing) {
                  avCvs.pause();
                } else {
                  avCvs.play({ start: 0 });
                }
              }}
            >
              {playing ? "暂停" : "播放"}
            </button>
            <Slider
              className="mx-10 flex-1"
              min={0}
              max={allTime}
              value={currentTime}
            ></Slider>
            <div className="flex flex-row w-[300]">
              <p className="mr-5">倍速播放</p>
              <Select
                className="w-40"
                onChange={(val) => {
                  avCvs?.play({
                    start: 0,
                    playbackRate: val,
                  });
                }}
              >
                <Select.Option key={1} value={1}>
                  1
                </Select.Option>
                <Select.Option key={1.5} value={1.5}>
                  1.5
                </Select.Option>
                <Select.Option key={2} value={2}>
                  2
                </Select.Option>
              </Select>
            </div>
            <div className="mx-5 flex">
              <p className="mr-5">音量控制</p>
              <Slider
                className="flex-1 w-20"
                min={1}
                max={100}
                onChange={(val) => {
                  avCvs?.changeVolume(val / 100);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-1/2 pt-10">
          <div className="flex flex-col px-10 w-full">
            <div>
              {allTextList.map((singleText) => {
                return (
                  <label
                    id={singleText.id}
                    htmlFor=""
                    style={{ display: "flex", marginBottom: 10 }}
                  >
                    编辑字幕1
                    <ContentEditable
                      style={{
                        width: 300,
                        marginLeft: 10,
                        marginRight: 10,
                      }}
                      html={getHtmlStringFromContentEditable(
                        singleText.textList
                      )} // innerHTML of the editable div
                      disabled={false} // use true to disable editing
                      onChange={(e) => {
                        const value = e.target.value;
                        setAllTextList((prev) => {
                          const currentText = prev.find(
                            (textItem) => textItem.id === singleText.id
                          );
                          if (!currentText) return prev;
                          currentText.textList = getStringFromHtml(value);
                          return [...prev];
                        });
                      }}
                    />
                    <Button
                      onClick={() => {
                        setAllTextList((prev) => {
                          const currentText = prev.find(
                            (textItem) => textItem.id === singleText.id
                          );
                          if (!currentText) return prev;
                          currentText.textList = getSelectionAndTransform(
                            currentText.textList
                          );
                          return [...prev];
                        });
                      }}
                    >
                      高亮
                    </Button>
                    <Button
                      onClick={async () => {
                        await addImageSprite2Track({
                          trackId: singleText.id,
                          svgText: singleText,
                          name: "图片",
                        });
                      }}
                    >
                      添加
                    </Button>
                    <Button
                      onClick={async () => {
                        await updateImageSprite2Track({
                          trackId: singleText.id,
                          svgText: singleText,
                          name: "图片",
                        });
                      }}
                    >
                      更新
                    </Button>
                    <Button
                      onClick={async () => {
                        await removeImageSprite2Track({
                          trackId: singleText.id,
                        });
                      }}
                    >
                      删除
                    </Button>
                  </label>
                );
              })}
            </div>
            <div>
              <label htmlFor="" style={{ display: "flex", marginBottom: 10 }}>
                选择字体
                <Select
                  value={fontFamily}
                  onChange={(nextFont) => {
                    setFontFamily(nextFont);
                  }}
                  style={{ width: 300, marginLeft: 10, marginRight: 10 }}
                >
                  {fontFamilyList.map((font) => (
                    <Select.Option key={font} value={font}>
                      {font}
                    </Select.Option>
                  ))}
                </Select>
                <Button onClick={async () => {}}>点击应用字体</Button>
              </label>
              <label htmlFor="" style={{ display: "flex", marginBottom: 10 }}>
                选择字号
                <Select
                  value={fontSize}
                  onChange={(nextSize) => {
                    setFontSize(nextSize);
                  }}
                  style={{ width: 300, marginLeft: 10, marginRight: 10 }}
                >
                  {fontSizeList.map((size) => (
                    <Select.Option key={size} value={size}>
                      {size}
                    </Select.Option>
                  ))}
                </Select>
                <Button onClick={async () => {}}>点击应用字号</Button>
              </label>
              <label htmlFor="" style={{ display: "flex", marginBottom: 10 }}>
                选择字样
                <Select
                  value={fontStyle?.id}
                  onChange={(fontStyleId) => {
                    const nextFontStyle = fontStyleList.find(
                      (fs) => fs.id === fontStyleId
                    );
                    setFontStyle(nextFontStyle);
                  }}
                  style={{ width: 300, marginLeft: 10, marginRight: 10 }}
                >
                  {fontStyleList.map((fs) => (
                    <Select.Option key={fs.id} value={fs.id}>
                      {fs.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button onClick={async () => {}}>点击更新全部字幕字样</Button>
              </label>
              <label htmlFor="" style={{ display: "flex", marginBottom: 10 }}>
                选择高亮字样
                <Select
                  value={lightFontStyle?.id}
                  onChange={(lightFontStyleId) => {
                    const nextFontStyle = lightFontStyleList.find(
                      (fs) => fs.id === lightFontStyleId
                    );
                    setLightFontStyle(nextFontStyle);
                  }}
                  style={{ width: 300, marginLeft: 10, marginRight: 10 }}
                >
                  {lightFontStyleList.map((fs) => (
                    <Select.Option key={fs.id} value={fs.id}>
                      {fs.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button onClick={async () => {}}>
                  点击更新全部字幕高亮字样
                </Button>
              </label>
            </div>
            <div>
              <div></div>
              <div className="flex">
                <p className="mr-5">音量控制</p>
                <Slider
                  className="flex-1"
                  min={1}
                  max={100}
                  onChange={(val) => {
                    avCvs?.changeVolume(val / 100);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="">
          + 视频
          <input
            type="file"
            className="mx-[10px]"
            onChange={async (ev) => {
              const video = ev.target.files?.[0];
              if (!video) return;
              await addVideoSprite2Track(video, trackId);
            }}
          />
        </label>
      </div>
      <div>
        <label htmlFor="">
          + 视频
          <input
            type="file"
            className="mx-[10px]"
            onChange={async (ev) => {
              const video = ev.target.files?.[0];
              if (!video) return;
              await addVideoSprite2Track(video, trackId2);
            }}
          />
        </label>
      </div>
      <TimelineEditor
        timelineData={tlData}
        timelineState={tlState}
        onPreviewTime={(time) => {
          console.log("onPreviewTime", time, tlState.current?.getTime?.());
          avCvs?.previewFrame(time * 1e6);
          avCvs?.play({ start: (tlState.current?.getTime?.() || 0) * 1e6 });
        }}
        onOffsetChange={(action) => {
          console.log("onOffsetChange", action);
          const spr = actionSpriteMap.get(action);
          console.log("spr", spr);
          if (spr == null) return;
          spr.time.offset = action.start * 1e6;
        }}
        onDuraionChange={({ action, start, end }) => {
          console.log("onDuraionChange", action, start, end);
          const spr = actionSpriteMap.get(action);
          if (spr == null) return false;
          const duration = (end - start) * 1e6;
          if (duration > spr.getClip().meta.duration) return false;
          spr.time.duration = duration;
          return true;
        }}
        onDeleteAction={(action) => {
          console.log("onDeleteAction", action);
          const spr = actionSpriteMap.get(action);
          if (spr == null) return;
          avCvs?.removeSprite(spr);
          actionSpriteMap.delete(action);
          const track = tlData
            .map((t) => t.actions)
            .find((actions) => actions.includes(action));
          if (track == null) return;
          track.splice(track.indexOf(action), 1);
          setTLData([...tlData]);
        }}
        onSplitAction={async (action: TLActionWithName) => {
          console.log("onSplitAction", action);
        }}
      ></TimelineEditor>
    </div>
  );
}
