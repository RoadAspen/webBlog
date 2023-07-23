import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Component from "./优化/Component";
import PureComponent from "./优化/PureComponent";

function App() {
  return (
    <div className="App">
      <Component />
      <PureComponent />
    </div>
  );
}

export default App;
