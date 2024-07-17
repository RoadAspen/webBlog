import { useMemoizedFn } from "ahooks";
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
  getCanvasScaleStyleByResolutionAndContainerRect,
  getHtmlStringFromContentEditable,
  getSelectionAndTransform,
  getStringFromHtml,
  transformClipConfig,
} from "../utils/utils";
import { VideoCanvas } from "./video-canvas";
export function VideoClipClass() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  /** 视频class实例 */
  const videoCanvasInstanceRef = useRef<VideoCanvas>();
  const [currentVideoClipPiece, setCurrentVideoClipPiece] = useState<AIGCClip>(
    transformClipConfig(videoClipPiece)
  );
  const [playing, setPlaying] = useState(false);
  const [fontFamily, setFontFamily] = useState<FontFamily>(fontFamilyList[0]);
  const [fontSize, setFontSize] = useState<FontSize>(60);
  /** 更新的  */
  const currentVideoClipPieceRef = useRef<AIGCClip>(currentVideoClipPiece);
  const currentIntervalIndexRef = useRef(0);
  const [fontStyle, setFontStyle] = useState<FontStyle | undefined>(
    fontStyleList[0]
  );
  const [lightFontStyle, setLightFontStyle] = useState<FontStyle | undefined>(
    lightFontStyleList[0]
  );
  /** 选中的句子的总时长 */
  const allPieceDuration = useMemo(() => {
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
  /** 支持播放的时长数组 */
  const senPlayList = useMemo(() => {
    const playListTime = [];
    for (const info of currentVideoClipPiece.info) {
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
  }, [currentVideoClipPiece]);
  /** 根据进度条的时间，获取到原视频的的播放时间 */
  const getPlayTimeByProgress = useMemoizedFn((currentPreviewTime: number) => {
    let progressTime = 0;
    let allTime = 0;
    for (const info of currentVideoClipPiece.info) {
      for (const sen of info.sens) {
        if (sen.select) {
          const nextProgressTime = progressTime + sen.duration;
          if (currentPreviewTime <= nextProgressTime) {
            allTime = allTime + currentPreviewTime - progressTime;
            break;
          }
          progressTime = nextProgressTime;
        }
        allTime += sen.duration;
      }
    }
    return allTime;
  });
  useEffect(() => {
    if (canvasContainerRef.current && !videoCanvasInstanceRef.current) {
      videoCanvasInstanceRef.current = new VideoCanvas({
        cvsWrapEl: canvasContainerRef.current,
        clipConfig: currentVideoClipPiece,
        fontSize,
        fontStyle,
        lightFontStyle,
        fontFamily,
        playbackRate: 1,
        handleTimeUpdate: (time) => {
          const currentTime = time / 1e6;
          const currentInterval = senPlayList[currentIntervalIndexRef.current];
          if (currentInterval) {
            // 跳过不需要播放的区间
            if (currentTime >= currentInterval.end) {
              currentIntervalIndexRef.current++;
              if (currentIntervalIndexRef.current < senPlayList.length) {
                const nextInterval =
                  senPlayList[currentIntervalIndexRef.current];
                if (currentInterval.end < nextInterval.start) {
                  videoCanvasInstanceRef.current?.play({
                    start: nextInterval.start * 1e6,
                  });
                }
                const elapsedPlayTime =
                  senPlayList
                    .slice(0, currentIntervalIndexRef.current)
                    .reduce(
                      (total, interval) =>
                        total + (interval.end - interval.start),
                      0
                    ) +
                  (currentTime - currentInterval.start);
                setCurrentTime(elapsedPlayTime);
              } else {
                currentIntervalIndexRef.current = 0;
                setCurrentTime(0);
                videoCanvasInstanceRef.current?.play({
                  start:
                    senPlayList[currentIntervalIndexRef.current].start * 1e6,
                });
              }
            } else {
              const elapsedPlayTime =
                senPlayList
                  .slice(0, currentIntervalIndexRef.current)
                  .reduce(
                    (total, interval) =>
                      total + (interval.end - interval.start),
                    0
                  ) +
                (currentTime - currentInterval.start);
              setCurrentTime(elapsedPlayTime);
            }
          } else {
            currentIntervalIndexRef.current = 0;
            setCurrentTime(0);
            videoCanvasInstanceRef.current?.play({
              start: senPlayList[currentIntervalIndexRef.current].start * 1e6,
            });
          }
        },
        onPlayingChange: (play: boolean) => {
          setPlaying(play);
        },
        canvasStyle: {
          width: currentVideoClipPiece.resolution.width,
          height: currentVideoClipPiece.resolution.height,
          bgColor: "#999",
          style: getCanvasScaleStyleByResolutionAndContainerRect(
            currentVideoClipPiece.resolution,
            { width: 600, height: 560 }
          ),
        },
      });
      videoCanvasInstanceRef.current.init(videoClipPiece);
    }
  }, [
    allPieceDuration,
    currentVideoClipPiece,
    fontFamily,
    fontSize,
    fontStyle,
    lightFontStyle,
    senPlayList,
  ]);

  return (
    <div className="canvas-wrap">
      <div className="flex mx-10">
        <div className="w-1/2 pt-10">
          <div
            className="w-[600px] h-[560px] bg-black overflow-hidden"
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
                  if (currentTime === 0) {
                    currentIntervalIndexRef.current = 0;
                    videoCanvasInstanceRef.current.play({
                      start:
                        senPlayList[currentIntervalIndexRef.current].start *
                        1e6,
                    });
                  }
                }
              }}
            >
              {playing ? "暂停" : "播放"}
            </button>
            <Slider
              className="mx-10 flex-1"
              min={0}
              max={allPieceDuration}
              value={currentTime}
              step={0.1}
              onChange={(val) => {
                console.log("val", allPieceDuration, val, currentTime);
                const previewTime = getPlayTimeByProgress(val);
                videoCanvasInstanceRef.current?.previewFrame(previewTime * 1e6);
              }}
            ></Slider>
            {/* <div className="flex flex-row">
              <p className="mr-5">倍速播放</p>
              <Select
                className="w-10"
                onChange={(val) => {
                  if (videoCanvasInstanceRef.current) {
                    videoCanvasInstanceRef.current.playbackRate = val;
                  }
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
            </div> */}
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
                                  if (currentVideoClip) {
                                    const currentText = currentVideoClip.sens.find(
                                      (textItem) => textItem.id === sen.id
                                    );
                                    if (currentText) {
                                      currentText.select = checked ? 1 : 0;
                                      console.log(
                                        "currentText.select",
                                        currentText.select
                                      );
                                      if (currentText.select) {
                                        videoCanvasInstanceRef.current?.addImageSprite2Track(
                                          {
                                            trackId: sen.id,
                                            sen: {
                                              id: sen.id,
                                              start:
                                                sen.originTimestamp?.[0] || 0,
                                              end:
                                                sen.originTimestamp?.[1] || 0,
                                              textList: sen.textList,
                                            },
                                          }
                                        );
                                      } else {
                                        videoCanvasInstanceRef.current?.removeSprite2Track(
                                          {
                                            trackId: sen.id,
                                          }
                                        );
                                      }
                                    }
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
                                  sen: {
                                    id: sen.id,
                                    textList: sen.textList,
                                    start: sen.originTimestamp[0] * 1e6,
                                    end: sen.originTimestamp[1] * 1e6,
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
