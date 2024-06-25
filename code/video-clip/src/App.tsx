import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { BiliApp } from "./bili";
import { SvgText } from "./svg-text";
import { VideoClip } from "./video-clip";
import { VideoClipClass } from "./video-clip-class";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/video-clip" Component={VideoClip} />
          <Route path="/svg" Component={SvgText} />
          <Route path="/video-clip-class" Component={VideoClipClass} />
          <Route path="/bili-app" Component={BiliApp} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
