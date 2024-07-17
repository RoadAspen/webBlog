import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { SvgText } from "./svg-text";
import { VideoClipClass } from "./video-clip-class";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/svg" Component={SvgText} />
          <Route path="/video-clip-class" Component={VideoClipClass} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
