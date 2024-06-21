import React, { useEffect, useRef, useState } from "react";

interface SVGTextProps {
  text: string;
  font: string;
  fontSize: number;
  style1SVG: string;
  style2SVG: string;
}

const SVGText: React.FC<SVGTextProps> = ({
  text,
  font,
  fontSize,
  style1SVG,
  style2SVG,
}) => {
  const svgTempRef = useRef<SVGSVGElement | null>(null);
  const [svgContent, setSvgContent] = useState("");
  const [svgWidth, setSvgWidth] = useState(0);
  const [svgHeight, setSvgHeight] = useState(0);

  const getTextDimensions = (
    text: string,
    font: string,
    fontSize: number
  ): { width: number; height: number } => {
    const svgTemp = svgTempRef.current;
    if (!svgTemp) return { width: 0, height: 0 };
    const textElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    textElement.setAttribute("x", "0");
    textElement.setAttribute("y", "0");
    textElement.setAttribute("font-family", font);
    textElement.setAttribute("font-size", `${fontSize}px`);
    textElement.textContent = text;
    svgTemp.appendChild(textElement);
    const bbox = textElement.getBBox();
    svgTemp.removeChild(textElement);
    return { width: bbox.width, height: bbox.height };
  };

  const extractStyles = (svgString: string): string => {
    const div = document.createElement("div");
    div.innerHTML = svgString;
    const styles = div.querySelector("style");
    return styles ? styles.innerHTML : "";
  };

  const extractText = (svgString: string): string => {
    const div = document.createElement("div");
    div.innerHTML = svgString;
    const textElement = div.querySelector("text");
    return textElement ? textElement.innerHTML : "";
  };

  useEffect(() => {
    const characters = text.split("");
    let currentX = 0;
    const style1 = extractStyles(style1SVG);
    const style2 = extractStyles(style2SVG);
    const text1 = extractText(style1SVG);
    const text2 = extractText(style2SVG);

    let totalWidth = 0;
    let maxHeight = 0;

    const dimensions = characters.map((char) => {
      const { width, height } = getTextDimensions(char, font, fontSize);
      totalWidth += width;
      if (height > maxHeight) maxHeight = height;
      return { width, height };
    });

    setSvgWidth(totalWidth);
    setSvgHeight(maxHeight);

    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${maxHeight}" viewBox="0 0 ${totalWidth} ${maxHeight}">
      <style>
         ${style1}
      </style>
      <text font-family="${font}" font-size="${fontSize}px">`;

    characters.forEach((char, index) => {
      const charClass = index % 2 === 0 ? "cls-1" : "cls-1";
      const charContent = index % 2 === 0 ? text1 : text2;
      svgString += `<tspan class="${charClass}" x="${currentX}" y="${maxHeight}">${charContent.replace(
        /花字/g,
        char
      )}</tspan>`;
      currentX += dimensions[index].width;
    });

    svgString += `</text></svg>`;
    setSvgContent(svgString);
  }, [text, font, fontSize, style1SVG, style2SVG]);

  return (
    <div>
      <svg
        ref={svgTempRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          visibility: "hidden",
        }}
      ></svg>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
};

export const SvgText: React.FC = () => {
  const [text, setText] = useState("测试文字");
  const [font, setFont] = useState(
    "SourceHanSansCN-Bold-GBpc-EUC-H, Source Han Sans CN"
  );
  const [fontSize, setFontSize] = useState(36);
  const [style1SVG, setStyle1SVG] = useState(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76.74 42.05"><defs><style>.cls-1{fill:#36ff00;stroke:#36ff00;stroke-linejoin:round;stroke-width:4px;}</style></defs><text class="cls-1" transform="translate(2.74 34.85)">花字</text></svg>'
  );
  const [style2SVG, setStyle2SVG] = useState(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77.84 43.05"><defs><style>.cls-1{fill:#095dd6;stroke:#095dd6;stroke-linejoin:round;stroke-width:4px;}</style></defs><text class="cls-1" transform="translate(3.84 35.85)">花字</text></svg>'
  );

  return (
    <div className="container">
      <div className="input-group">
        <label htmlFor="text">Text:</label>
        <input
          type="text"
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="font">Font:</label>
        <input
          type="text"
          id="font"
          value={font}
          onChange={(e) => setFont(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="fontSize">Font Size:</label>
        <select
          name=""
          id="fontSize"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
        >
          <option value="36">36</option>
          <option value="46">46</option>
          <option value="56">56</option>
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="style1SVG">Style 1 SVG:</label>
        <textarea
          id="style1SVG"
          value={style1SVG}
          onChange={(e) => setStyle1SVG(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="style2SVG">Style 2 SVG:</label>
        <textarea
          id="style2SVG"
          value={style2SVG}
          onChange={(e) => setStyle2SVG(e.target.value)}
        />
      </div>
      <SVGText
        text={text}
        font={font}
        fontSize={fontSize}
        style1SVG={style1SVG}
        style2SVG={style2SVG}
      />
    </div>
  );
};
