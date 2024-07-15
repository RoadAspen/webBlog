import { Button, Checkbox, Select, Slider } from "antd";
import { produce } from "immer";
import { useEffect, useMemo, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import {
  fontFamilyList,
  fontSizeList,
  fontStyleList,
  lightFontStyleList,
  videoClipPiece,
} from "../constant";
import { AIGCClip, FontFamily, FontSize, FontStyle } from "../define";
import {
  getHtmlStringFromContentEditable,
  getSelectionAndTransform,
  getStringFromHtml,
} from "../utils/utils";
import { VideoCanvas } from "./video-canvas";

export function VideoClipClass() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  /** 视频class实例 */
  const videoCanvasInstanceRef = useRef<VideoCanvas>();
  const [currentVideoClipPiece, setCurrentVideoClipPiece] = useState<AIGCClip>(
    videoClipPiece
  );
  const [playing, setPlaying] = useState(false);
  const [fontFamily, setFontFamily] = useState<FontFamily>(fontFamilyList[0]);
  const [fontSize, setFontSize] = useState<FontSize>(60);
  const [fontStyle, setFontStyle] = useState<FontStyle | undefined>(
    fontStyleList[0]
  );
  const [lightFontStyle, setLightFontStyle] = useState<FontStyle | undefined>(
    lightFontStyleList[0]
  );
  useEffect(() => {
    if (canvasContainerRef.current && !videoCanvasInstanceRef.current) {
      videoCanvasInstanceRef.current = new VideoCanvas({
        cvsWrapEl: canvasContainerRef.current,
        clipConfig: currentVideoClipPiece,
        fontSize,
        fontStyle,
        lightFontStyle,
        fontFamily,
        handleTimeUpdate: (time) => {
          requestAnimationFrame(() => {
            setCurrentTime(time);
          });
        },
        canvasStyle: {
          width: 1862,
          height: 1080,
          bgColor: "#999",
        },
      });
      videoCanvasInstanceRef.current.init(videoClipPiece);
    }
  }, [currentVideoClipPiece, fontFamily, fontSize, fontStyle, lightFontStyle]);
  /** 选中的句子的总时长 */
  const duration = useMemo(() => {
    let duration = 0;
    currentVideoClipPiece.info.forEach((info) => {
      info.sens.forEach((sen) => {
        if (sen.select) {
          duration += sen.duration;
        }
      });
    });
    return duration;
  }, [currentVideoClipPiece]);
  /** 原视频各片段的总和时长 */
  const senPlayList = useMemo(() => {
    let currentTime = 0;
    currentVideoClipPiece.info.forEach((info) => {
      info.sens.forEach((sen) => {
        if (sen.select) {
          currentTime += sen.duration;
        }
      });
    });
    return duration;
  }, [currentVideoClipPiece]);
  /** 根据当前的时间，获取到原视频的的播放时间 */
  const getPlayTime = (currentPreviewTime: number) => {
    let previewTime = 0;
    let allTime = 0;
    let prevTime = 0;
    for (const info of currentVideoClipPiece.info) {
      for (const sen of info.sens) {
        allTime += sen.duration;
        if (sen.select) {
          previewTime += sen.duration;
        }
        if (currentPreviewTime <= previewTime) {
          prevTime = prevTime + previewTime - currentPreviewTime;
          break;
        }
        prevTime = allTime;
      }
    }
    return prevTime;
  };
  return (
    <div className="canvas-wrap">
      <div className="flex mx-10">
        <div className="w-1/2 pt-10">
          <div
            className="w-[600px] h-[560px] bg-black"
            ref={canvasContainerRef}
          ></div>
          <div className="flex my-5">
            <button
              className="mx-[10px]"
              onClick={async () => {
                if (!videoCanvasInstanceRef.current) return;
                setPlaying(!playing);
                if (playing) {
                  videoCanvasInstanceRef.current.pause();
                } else {
                  videoCanvasInstanceRef.current.play({ start: currentTime });
                }
              }}
            >
              {playing ? "暂停" : "播放"}
            </button>
            <Slider
              className="mx-10 flex-1"
              min={0}
              max={duration * 1e6}
              value={currentTime}
              onChange={(val) => {
                const previewTime = getPlayTime(val);
                videoCanvasInstanceRef.current?.previewFrame(previewTime);
                setCurrentTime(previewTime);
              }}
            ></Slider>
            <div className="flex flex-row">
              <p className="mr-5">倍速播放</p>
              <Select
                className="w-10"
                onChange={(val) => {
                  videoCanvasInstanceRef.current?.play({
                    start: currentTime,
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
                className="flex-1 w-10"
                min={1}
                max={100}
                onChange={(val) => {
                  if (videoCanvasInstanceRef.current) {
                    videoCanvasInstanceRef.current.volume = val;
                  }
                }}
              />
            </div>
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
              <Button onClick={async () => {}}>点击更新全部字幕高亮字样</Button>
            </label>
          </div>
        </div>
        <div className="flex flex-col items-center w-1/2 pt-10">
          <div className="flex flex-col px-10 w-full">
            <div className="max-w-96 overflow-y-auto">
              {currentVideoClipPiece.info.map((videoClip, index) => {
                return (
                  <div key={videoClip.id}>
                    <h1>片段 {index}</h1>
                    {videoClip.sens.map((sen) => {
                      return (
                        <label
                          key={sen.id}
                          id={sen.id}
                          htmlFor=""
                          style={{ display: "flex", marginBottom: 10 }}
                        >
                          <Checkbox
                            checked={sen.select ? true : false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              console.log("checked", checked);
                              setCurrentVideoClipPiece(
                                produce((draft) => {
                                  const currentVideoClip = draft.info.find(
                                    (clipItem) => clipItem.id === videoClip.id
                                  );
                                  if (!currentVideoClip) return;
                                  const currentText = currentVideoClip.sens.find(
                                    (textItem) => textItem.id === sen.id
                                  );
                                  if (!currentText) return draft;
                                  currentText.select = checked ? 1 : 0;
                                  console.log(
                                    "currentText.select",
                                    currentText.select
                                  );
                                  if (currentText.select) {
                                    videoCanvasInstanceRef.current?.addImageSprite2Track(
                                      {
                                        trackId: sen.id,
                                        svgText: {
                                          id: sen.id,
                                          start:
                                            videoClip.preDuration * 1e6 +
                                            sen.timestamp[0] * 1e6,
                                          end:
                                            videoClip.preDuration * 1e6 +
                                            sen.timestamp[1] * 1e6,
                                          textList: [
                                            { text: sen.text, isLight: false },
                                          ],
                                        },
                                      }
                                    );
                                    videoCanvasInstanceRef.current?.previewFrame(
                                      videoClip.preDuration * 1e6 +
                                        sen.timestamp[0] * 1e6
                                    );
                                  } else {
                                    videoCanvasInstanceRef.current?.pause();
                                    videoCanvasInstanceRef.current?.removeSprite2Track(
                                      {
                                        trackId: sen.id,
                                      }
                                    );
                                  }
                                })
                              );
                            }}
                          />
                          <ContentEditable
                            style={{
                              width: 300,
                              marginLeft: 10,
                              marginRight: 10,
                            }}
                            html={getHtmlStringFromContentEditable(
                              sen.textList.length
                                ? sen.textList
                                : [{ text: sen.text, isLight: false }]
                            )}
                            disabled={false}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCurrentVideoClipPiece(
                                produce((draft) => {
                                  const currentVideoClip = draft.info.find(
                                    (clipItem) => clipItem.id === videoClip.id
                                  );
                                  if (!currentVideoClip) return;
                                  const currentText = currentVideoClip.sens.find(
                                    (textItem) => textItem.id === sen.id
                                  );
                                  if (!currentText) return draft;
                                  currentText.textList = getStringFromHtml(
                                    value
                                  );
                                })
                              );
                            }}
                          />
                          <Button
                            onClick={() => {
                              setCurrentVideoClipPiece(
                                produce((draft) => {
                                  const currentVideoClip = draft.info.find(
                                    (clipItem) => clipItem.id === videoClip.id
                                  );
                                  if (!currentVideoClip) return draft;
                                  const currentText = currentVideoClip.sens.find(
                                    (textItem) => textItem.id === sen.id
                                  );
                                  if (!currentText) return draft;
                                  currentText.textList = getSelectionAndTransform(
                                    currentText.textList
                                  );
                                })
                              );
                            }}
                          >
                            高亮
                          </Button>
                          <Button
                            onClick={async () => {
                              videoCanvasInstanceRef.current?.updateImageSprite2Track(
                                {
                                  trackId: sen.id,
                                  svgText: {
                                    id: sen.id,
                                    textList: sen.textList,
                                    start: sen.timestamp[0] * 1e6,
                                    end: sen.timestamp[1] * 1e6,
                                  },
                                  name: "图片",
                                }
                              );
                            }}
                          >
                            更新
                          </Button>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
