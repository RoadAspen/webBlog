import { useMemoizedFn } from "ahooks";
import { Button, Checkbox, Select, Slider } from "antd";
import { produce } from "immer";
import { cloneDeep } from "lodash";
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
  getSenPlayList,
  getStringFromHtml,
  transformClipConfig,
} from "../utils/utils";
import { VideoCanvas } from "./video-canvas";
export function VideoClipClass() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [allProgressTime, setAllProgressTime] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  /** 视频class实例 */
  const videoCanvasInstanceRef = useRef<VideoCanvas>();
  const [currentVideoClipPiece, setCurrentVideoClipPiece] = useState<AIGCClip>(
    transformClipConfig(videoClipPiece)
  );
  const [playing, setPlaying] = useState(false);
  const [fontStyle, setFontStyle] = useState<FontStyle | undefined>(
    fontStyleList[0]
  );
  const [lightFontStyle, setLightFontStyle] = useState<FontStyle | undefined>(
    lightFontStyleList[0]
  );
  const [fontFamily, setFontFamily] = useState<FontFamily>(fontFamilyList[0]);
  const [fontSize, setFontSize] = useState<FontSize>(60);
  /** 切片配置 ref */
  const currentVideoClipPieceRef = useRef<AIGCClip>(currentVideoClipPiece);
  /** 当前播放的视频片段索引index ref */
  const currentIntervalIndexRef = useRef(0);
  /** 当前可播放的视频时长区间列表 ref */
  const senPlayListRef = useRef(
    getSenPlayList(currentVideoClipPieceRef.current)
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

  /** 根据进度条的时间，获取到原视频的的播放时间 */
  const getPlayTimeByProgress = useMemoizedFn((currentPreviewTime: number) => {
    let progressTime = 0;
    let allTime = 0;
    for (const info of currentVideoClipPieceRef.current.info) {
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
  /** 更新进度条 */
  const handleTimeUpdate = useMemoizedFn((time: number) => {
    console.log("handleTimeUpdate time", time);
    const currentTime = time / 1e6;
    setAllProgressTime(currentTime);
    const currentInterval =
      senPlayListRef.current[currentIntervalIndexRef.current];
    if (currentInterval) {
      // 跳过不需要播放的区间
      if (
        currentTime >= currentInterval.end ||
        currentTime + 0.34 > currentInterval.end
      ) {
        currentIntervalIndexRef.current++;
        if (currentIntervalIndexRef.current < senPlayListRef.current.length) {
          const nextInterval =
            senPlayListRef.current[currentIntervalIndexRef.current];
          if (nextInterval.start > currentInterval.end) {
            videoCanvasInstanceRef.current?.play({
              start: nextInterval.start * 1e6,
            });
            return;
          }
        } else {
          currentIntervalIndexRef.current = 0;
          videoCanvasInstanceRef.current?.play({
            start: senPlayListRef.current[0].start * 1e6,
          });
        }
      }
    } else {
      currentIntervalIndexRef.current = 0;
      videoCanvasInstanceRef.current?.play({
        start:
          senPlayListRef.current[currentIntervalIndexRef.current].start * 1e6,
      });
    }
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
        handleTimeUpdate: handleTimeUpdate,
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
      videoCanvasInstanceRef.current.init(currentVideoClipPiece);
    }
  }, [
    allPieceDuration,
    currentVideoClipPiece,
    fontFamily,
    fontSize,
    fontStyle,
    handleTimeUpdate,
    lightFontStyle,
  ]);
  return (
    <div className="canvas-wrap">
      <div className="flex mx-10">
        <div className="w-1/2 pt-10">
          <div
            className="w-[600px] h-[560px] bg-black overflow-hidden"
            ref={canvasContainerRef}
          ></div>
          <div className="flex">
            全部进度条
            <Slider
              className="mx-10 flex-1"
              min={0}
              max={currentVideoClipPiece.duration}
              value={allProgressTime}
              step={0.1}
            ></Slider>
          </div>
          <div className="flex my-5">
            <button
              className="mx-[10px]"
              onClick={async () => {
                if (!videoCanvasInstanceRef.current) return;
                setPlaying(!playing);
                if (playing) {
                  videoCanvasInstanceRef.current.pause();
                  console.log("暂停");
                } else {
                  if (currentTime === 0) {
                    currentIntervalIndexRef.current = 0;
                    videoCanvasInstanceRef.current.play({
                      start:
                        senPlayListRef.current[currentIntervalIndexRef.current]
                          .start * 1e6,
                    });
                  } else {
                    videoCanvasInstanceRef.current.play({
                      start: videoCanvasInstanceRef.current.currentTime,
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
                const previewTime = getPlayTimeByProgress(val);
                setCurrentTime(val);
                const index = senPlayListRef.current.findIndex((playArr) => {
                  if (
                    playArr.start <= previewTime &&
                    playArr.end >= previewTime
                  ) {
                    console.log(
                      "senPlayListRef.current, playArr",
                      previewTime,
                      senPlayListRef.current,
                      playArr
                    );
                    return true;
                  }
                  return false;
                });
                currentIntervalIndexRef.current = index;
                videoCanvasInstanceRef.current?.previewFrame(previewTime * 1e6);
              }}
            ></Slider>
            <div></div>
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
                              const deepConfig = cloneDeep(
                                currentVideoClipPieceRef.current
                              );
                              const currentVideoClip = deepConfig.info.find(
                                (clipItem) => clipItem.id === videoClip.id
                              );
                              if (currentVideoClip) {
                                const currentText = currentVideoClip.sens.find(
                                  (textItem) => textItem.id === sen.id
                                );
                                if (currentText) {
                                  currentText.select = checked ? 1 : 0;
                                }
                              }
                              currentVideoClipPieceRef.current = deepConfig;
                              senPlayListRef.current = getSenPlayList(
                                currentVideoClipPieceRef.current
                              );
                              if (checked) {
                                currentIntervalIndexRef.current = 2;
                                videoCanvasInstanceRef.current?.previewFrame(
                                  sen.originTimestamp?.[0] * 1e6
                                );
                              } else {
                                currentIntervalIndexRef.current = 2;
                                videoCanvasInstanceRef.current?.removeSprite2Track(
                                  { trackId: sen.id }
                                );
                                if (currentIntervalIndexRef.current > 1) {
                                  videoCanvasInstanceRef.current?.previewFrame(
                                    senPlayListRef.current[
                                      currentIntervalIndexRef.current - 1
                                    ].start * 1e6
                                  );
                                }
                              }
                              setCurrentVideoClipPiece(deepConfig);
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
