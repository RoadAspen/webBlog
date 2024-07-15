const express = require("express");
const path = require("path");
const app = express();
const PORT = 3002;

app.use(express.static("static"));

app.get("/static/video1", (req, res) => {
  console.log("video1");
  const videoPath = path.resolve(__dirname, "./static/test_video_1.mp4");
  res.sendFile(videoPath);
});
app.get("/static/video2", (req, res) => {
  console.log("video2");
  const videoPath = path.resolve(__dirname, "./static/test_video_2.mp4");
  res.sendFile(videoPath);
});
app.get("/static/video3", (req, res) => {
  console.log("video3");
  const videoPath = path.resolve(__dirname, "./static/test_video_3.mp4");
  res.sendFile(videoPath);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
