"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const dataListRef = useRef<any[]>([]);
  const [originVideoUrl, setOriginVideoUrl] = useState("");
  const [clipUrl, setClipUrl] = useState({
    clipUrl1: "",
    clipUrl2: "",
    clipUrl3: "",
  });
  const [combineUrl, setCombineUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [startTime1, setStartTime1] = useState("0");
  const [endTime1, setEndTime1] = useState("10");
  const [startTime2, setStartTime2] = useState("30");
  const [endTime2, setEndTime2] = useState("40");
  const [startTime3, setStartTime3] = useState("70");
  const [endTime3, setEndTime3] = useState("90");
  const load = useCallback(async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setLoaded(true);
    setIsLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const cutVideo = async function(index = 0, startTime = "0", endTime = "0") {
    const ffmpeg = ffmpegRef.current;
    const outputName = `clip${index}.mp4`;
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      startTime,
      "-to",
      endTime,
      "-c",
      "copy",
      outputName,
    ]);
    const outputData = (await ffmpeg.readFile(outputName)) as Uint8Array;
    dataListRef.current.push(outputData);
    const videoBlob = new Blob([outputData.buffer], {
      type: "video/mp4",
    });
    const videoUrl = URL.createObjectURL(videoBlob);
    setClipUrl((prev) => ({
      ...prev,
      [`clipUrl${index}`]: videoUrl,
    }));
  };

  const transform = async () => {
    if (!originVideoUrl) {
      alert("Please provide a video file ");
      return;
    }
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(originVideoUrl));
    console.log("加载视频结束");
    await cutVideo(1, startTime1, endTime1);
    await cutVideo(2, startTime2, endTime2);
    await cutVideo(3, startTime3, endTime3);

    const concatList = "file 'clip1.mp4'\nfile 'clip2.mp4'\nfile 'clip3.mp4'";
    ffmpeg.writeFile("concat_list.txt", concatList);

    // Concatenate the clips
    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat_list.txt",
      "-c",
      "copy",
      "combined.mp4",
    ]);

    console.log("合并 complete!");
    // 从文件系统中读取合并后的视频数据
    const combinedData = (await ffmpeg.readFile("combined.mp4")) as Uint8Array;

    // 创建 Blob 对象并转换为 URL
    const combinedBlob = new Blob([combinedData.buffer], {
      type: "video/mp4",
    });
    const combinedUrl = URL.createObjectURL(combinedBlob);
    setCombineUrl(combinedUrl);
    // Create subtitles file
    const subtitles = `
    [Script Info]
Title: Example Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H00FFFF00,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,Hello, this is the first clip.
Dialogue: 0,0:00:05.00,0:00:10.00,Default,,0,0,0,,This is the second clip.
Dialogue: 0,0:00:10.00,0:00:15.00,Default,,0,0,0,,And this is the third clip.
`;
    await ffmpeg.writeFile("subtitles.srt", subtitles);
    await ffmpeg.exec([
      "-i",
      "combined.mp4",
      "-vf",
      "subtitles-overlay=subtitles-file=/subtitles.srt:fontname=Arial:fontsize=24:alpha=0.5",
      "-c",
      "copy",
      "output_with_subs.mp4",
    ]);

    console.log("添加字幕 complete!");

    // 从文件系统中读取合并后的视频数据
    const finalData = (await ffmpeg.readFile(
      "output_with_subs.mp4"
    )) as Uint8Array;

    // 创建 Blob 对象并转换为 URL
    const finalBlob = new Blob([finalData.buffer], { type: "video/mp4" });
    const finalUrl = URL.createObjectURL(finalBlob);
    setFinalUrl(finalUrl);
    console.log("Final URL:", finalUrl);
  };

  return (
    <div className="w-[700px] my-0 mx-auto">
      <div className=" w-full min-h-[300px] bg-gray-200 mx-auto">
        <video
          controls
          id="initialVideoPlayer"
          className="w-full"
          src={originVideoUrl}
        ></video>
      </div>
      <h1>Video Trimmer</h1>
      <input
        type="file"
        id="videoInput"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const videoUrl = window.URL.createObjectURL(file);
            setOriginVideoUrl(videoUrl);
          }
        }}
      />
      <div>
        <h2>选择时间段</h2>
        <div>
          时间段一
          <input
            type="text"
            id="startTime1"
            placeholder="Start time (in seconds)"
            value={startTime1}
          />
          <input
            type="text"
            id="endTime1"
            value={endTime1}
            placeholder="End time (in seconds)"
          />
        </div>
        <div>
          时间段二
          <input
            type="text"
            id="startTime2"
            placeholder="Start time (in seconds)"
            value={startTime2}
          />
          <input
            type="text"
            id="endTime2"
            value={endTime2}
            placeholder="End time (in seconds)"
          />
        </div>
        <div>
          时间段三
          <input
            type="text"
            id="startTime3"
            placeholder="Start time (in seconds)"
            value={startTime3}
          />
          <input
            type="text"
            id="endTime3"
            value={endTime3}
            placeholder="End time (in seconds)"
          />
        </div>
      </div>
      <button
        className="p-2 bg-gray-500 text-white"
        onClick={() => {
          transform();
        }}
      >
        开始处理视频
      </button>
      <div className="mb-8">
        <h2>剪辑结果</h2>
        <div className="flex justify-between">
          <video id="videoPlayer1" controls src={clipUrl.clipUrl1}></video>
          <video id="videoPlayer2" controls src={clipUrl.clipUrl2}></video>
          <video id="videoPlayer3" controls src={clipUrl.clipUrl3}></video>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          合并视频
          <video id="combinedVideo" controls src={combineUrl}></video>
        </div>
        <div className="w-1/2">
          添加字幕的视频
          <video id="finalVideo" controls src={finalUrl}></video>
        </div>
      </div>
    </div>
  );
}
