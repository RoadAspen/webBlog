const express = require("express");
const path = require("path");
const app = express();
const PORT = 3002;

app.use(express.static("public"));

app.get("/video1", (req, res) => {
  console.log("video1");
  const videoPath = path.resolve(
    __dirname,
    "../../../../../../../Downloads/file_v3_007j_c9009fe7-9e27-4019-83d6-78e17d8c0c1g.mp4"
  );
  res.sendFile(videoPath);
});
app.get("/video2", (req, res) => {
  console.log("video2");
  const videoPath = path.resolve(
    __dirname,
    "../../../../../../../Downloads/file_v3_007j_c9009fe7-9e27-4019-83d6-78e17d8c0c1g.mp4"
  );
  res.sendFile(videoPath);
});
app.get("/video3", (req, res) => {
  console.log("video3");
  const videoPath = path.resolve(
    __dirname,
    "../../../../../../../Downloads/file_v3_007j_c9009fe7-9e27-4019-83d6-78e17d8c0c1g.mp4"
  );
  res.sendFile(videoPath);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
