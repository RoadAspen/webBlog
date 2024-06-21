import _ from "lodash";

const NO_ROTATION_RANGE = [
  [0x2e80, 0x2fef],
  [0x3040, 0x9fff],
  [0xac00, 0xd7ff],
  [0xf900, 0xfaff],
  [0x1d300, 0x1d35f],
  [0x20000, 0x2fa1f],
];
const CHAR_ROTATE = (90 * Math.PI) / 180;
export function needsRotation(char) {
  let codePoint = char.codePointAt(0);
  for (let [lowerBound, upperBound] of NO_ROTATION_RANGE) {
    if (lowerBound <= codePoint && codePoint <= upperBound) {
      return false;
    }
  }
  return true;
}
export class FontCanvas {
  constructor(params: { canvas: HTMLCanvasElement }) {
    this.canvasDom = params.canvas;
    this.canvasContext = this.canvasDom.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
  }
  /** canvasDom */
  canvasDom: HTMLCanvasElement | null;
  canvasContext: CanvasRenderingContext2D | null;
  /** data */
  data: {
    id: string;
    doc: {
      width: number;
      height: number;
      objects: any[];
    };
  } = {
    id: "",
    doc: {
      width: 0,
      height: 0,
      objects: [],
    },
  };
  drawDoc(doc: any) {
    let canvas = this.canvasDom;
    _.extend(canvas, {
      width: +doc.width,
      height: +doc.height,
    });
    if (!this.canvasContext) return;
    // ctx.scale(0.25,0.25)
    this.canvasContext.fillStyle = doc.background;
    this.canvasContext.fillRect(0, 0, +doc.width, +doc.height);

    this.prepare(doc, () => {
      this.objectEach(doc, (object) => this.drawObject(object));
    });
  }
  redraw() {
    this.drawDoc(this.data.doc);
    console.log("redraw");
    return this.drawDoc;
  }
  objectEach(object: any, callback: any) {
    if (object.objects) {
      _.each(object.objects, (_object) => this.objectEach(_object, callback));
      return;
    }
    callback(object);
  }
  text_add(item: any) {
    item.layer = item.layers[0];
    this.data.doc.objects.push(item);
  }
  /** 初始化 */
  init(_id, _doc, _json) {
    this.data.id = _id || "";
    this.data.doc = _doc || {
      objects: [],
      background: "#ffffff00",
      width: 800,
      height: 400,
    };
    if (_.isEmpty(this.data.doc.objects)) {
      this.text_add(_json);
    }
    this.redraw();
    console.log("init", this.data.doc, this.data.id, _json.w);
  }

  /** effect  end*/
  img_pool: any = {};
  prepare = (doc, callback) => {
    let img_new: any[] = [];
    let font_new: any = [];
    this.objectEach(doc, (object) => {
      _.each(object.layers, (layer) => {
        _.each(layer.styles, (style) => {
          let src = style.color.src;
          if (src && !this.img_pool[src] && img_new.indexOf(src) == -1) {
            img_new.push(src);
          }
        });
      });
      let font = object.font;
      if (!font.family && font.id) {
        // console.log('font_new', font.id, font.family);
        font_new.push(object);
      }
    });
    let n = img_new.length + font_new.length;
    if (n) {
      _.each(img_new, (src) => {
        // let img = new Image();
        let img = document.createElement("img");
        img.onload = () => {
          this.img_pool[src] = img;
          if (--n == 0) {
            callback();
          }
        };
        img.crossOrigin = "anonymous";
        img.src = src + "?timeStamp=${new Date()}"; //加上时间戳解决跨域问题
      });
      font_new.length &&
        this.webFont(
          _.map(font_new, (object) => ({
            ProductId: object.font.id,
            Chas: object.text,
          })),
          (family, i) => {
            font_new[i].font.family = family;
            if (--n == 0) {
              callback();
            }
          }
        );
    } else {
      callback();
    }
  };
  /** 根据字体json绘制 canvas*/
  drawObject(object) {
    console.log("drawObject", object);
    const ctx = this.canvasContext;
    if (!ctx) return;
    let font = object.font;
    let off_x = -object.w / 2;
    let off_y = -object.h / 2;
    let line_height = font.size * font.line_height;
    ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family ||
      "Arial"}`;
    ctx.save();
    ctx.translate(object.x, object.y);
    if (object.rotate) {
      ctx.translate(-off_x, -off_y);
      ctx.rotate((object.rotate * Math.PI) / 180);
      ctx.translate(off_x, off_y);
    }
    let i;
    for (i = object.layers.length - 1; i >= 0; i--) {
      let layer = object.layers[i];

      let fillShadow = false,
        strokeShadow = false,
        maxStrokeWidth = 0;
      _.each(layer.styles, (style) => {
        if (style.type == "stroke" && style.visible)
          maxStrokeWidth = _.max([maxStrokeWidth, style.lineWidth]);
      });
      _.each(["fill", "stroke", "fill", "stroke"], (type, index) => {
        let j;
        for (j = layer.styles.length - 1; j >= 0; j--) {
          let style = layer.styles[j];
          if (!style.visible || style.type != type) {
            continue;
          }
          if (style.type == "stroke" && style.lineWidth == 0) {
            continue;
          }
          ctx.save();
          if (index < 2 && layer.shadow && layer.shadow.visible) {
            //先绘制阴影，保证阴影在最下方。绘制阴影须有填充或描边。填充+阴影绘制一次，最宽的描边+阴影绘制一次，再依次绘制一遍不带阴影的填充和描边
            if (
              (style.type == "fill" && style.visible && !fillShadow) ||
              (type == "stroke" &&
                style.visible &&
                maxStrokeWidth == style.lineWidth &&
                !strokeShadow)
            ) {
              let arc = (layer.shadow.angle * Math.PI) / 180;
              _.assign(ctx, {
                shadowColor: layer.shadow.color,
                shadowOffsetX:
                  Math.cos(arc) * layer.shadow.distance * object.strength,
                shadowOffsetY:
                  -Math.sin(arc) * layer.shadow.distance * object.strength,
                shadowBlur: layer.shadow.blur,
              });
              if (type == "fill") fillShadow = true;
              if (type == "stroke") strokeShadow = true;
            }
          }
          let color = style.color;
          if (!this.canvasDom) return;
          if (color) {
            if (color.src) {
              let img = this.img_pool[color.src],
                x = (-this.canvasDom.width * color.offsetX) / 100,
                y = (-this.canvasDom.height * color.offsetY) / 100;
              // console.log('img', img.width, img.height);
              this.canvasDom.width = img.width * color.scale; // 目标宽度
              this.canvasDom.height = img.height * color.scale; // 目标高度
              ctx.drawImage(
                img,
                x,
                y,
                this.canvasDom.width,
                this.canvasDom.height
              );
              ctx.drawImage(
                img,
                x + this.canvasDom.width,
                y,
                this.canvasDom.width,
                this.canvasDom.height
              );
              ctx.drawImage(
                img,
                x,
                y + this.canvasDom.height,
                this.canvasDom.width,
                this.canvasDom.height
              );
              ctx.drawImage(
                img,
                x + this.canvasDom.width,
                y + this.canvasDom.height,
                this.canvasDom.width,
                this.canvasDom.height
              );
              color = ctx.createPattern(this.canvasDom, "repeat");
              // color = ctx.createPattern(img, 'repeat');
            } else if (color.stops) {
              if (color.gradientType == "radial") {
                let r = Math.sqrt(
                  Math.pow(object.w / 2, 2) + Math.pow(object.h / 2, 2)
                );
                let gradient = ctx.createRadialGradient(
                  (color.radial.x1 / 100) * r + object.w / 2,
                  (color.radial.y1 / 100) * r + object.h / 2,
                  (color.radial.r1 / 100) * r,
                  (color.radial.x2 / 100) * r + object.w / 2,
                  (color.radial.y1 / 100) * r + object.h / 2,
                  (color.radial.r2 / 100) * r
                );
                _.each(color.stops, (stop) => {
                  gradient.addColorStop(stop[1], stop[0]);
                });
                color = gradient;
              } else {
                let arc = (color.angle * Math.PI) / 180;
                var arg;
                let arctan = Math.atan(object.h / object.w);

                if (
                  (arc < Math.PI - arctan && arc >= 0) ||
                  (arc > -arctan && arc < 0)
                ) {
                  if (Math.abs(Math.tan(arc)) < object.h / object.w) {
                    arg = [
                      [0, (object.w / 2) * Math.tan(arc) + object.h / 2],
                      [
                        object.w,
                        (-object.w / 2) * Math.tan(arc) + object.h / 2,
                      ],
                    ];
                  } else {
                    arg = [
                      [-object.h / 2 / Math.tan(arc) + object.w / 2, object.h],
                      [object.h / 2 / Math.tan(arc) + object.w / 2, 0],
                    ];
                  }
                } else {
                  if (Math.abs(Math.tan(arc)) < object.h / object.w) {
                    arg = [
                      [
                        object.w,
                        (-object.w / 2) * Math.tan(arc) + object.h / 2,
                      ],
                      [0, (object.w / 2) * Math.tan(arc) + object.h / 2],
                    ];
                  } else {
                    arg = [
                      [object.h / 2 / Math.tan(arc) + object.w / 2, 0],
                      [-object.h / 2 / Math.tan(arc) + object.w / 2, object.h],
                    ];
                  }
                }
                let gradient = ctx.createLinearGradient.apply(
                  ctx,
                  _.flatten(arg)
                );
                _.each(color.stops, (stop) => {
                  gradient.addColorStop(stop[1], stop[0]);
                });
                color = gradient;
              }
            }
            ctx[
              {
                fill: "fillStyle",
                stroke: "strokeStyle",
                shadow: "shadowColor",
              }[type]
            ] = color;
          }

          if (type == "stroke") {
            ctx.lineWidth = style.lineWidth * object.strength;
            ctx.lineJoin = style.lineJoin;
          }
          if (style.compositeOperation) {
            ctx.globalCompositeOperation = style.compositeOperation;
          }
          let method = type == "stroke" ? "strokeText" : "fillText",
            baseline = font.size * 0.9;

          ctx.translate(
            layer.offsetX * object.strength,
            layer.offsetY * object.strength
          );
          _.each(object.typeset.lines, (line) => {
            _.each(line.items, (item) => {
              let x = +item.x,
                y = +item.y;
              if (item.rotate) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(item.rotate);
                ctx[method](item.char, 0, -font.size * 0.1);
                ctx.restore();
              } else {
                ctx[method](item.char, x, y + baseline);
              }
              // console.log(_.cloneDeep(o));
            });
          });
          ctx.restore();
        }
      });
    }
    ctx.restore();
  }
  /** 导出 */
  exportToBase64(scale) {
    let oCanvas = document.createElement("canvas");
    if (!this.canvasDom) return;
    oCanvas.width = this.canvasDom.width * scale;
    oCanvas.height = this.canvasDom.height * scale;
    let oCtx = oCanvas.getContext("2d");
    if (!oCtx) return;

    _.each(this.data.doc.objects, (o) => {
      var object = _.cloneDeep(o);
      object.x *= scale;
      object.y *= scale;
      object.w *= scale;
      object.h *= scale;
      object.font.size *= scale;
      object.font.letter_space *= scale;
      _.each(object.layers, (layer) => {
        layer.offsetX *= scale;
        layer.offsetY *= scale;
        if (layer.shadow) layer.shadow.distance *= scale;
        _.each(layer.styles, (style) => {
          if (style.lineWidth) {
            style.lineWidth *= scale;
          }
          if (style.colortype === "texture") {
            style.color.scale *= scale;
          }
        });
      });
      delete object.typeset;
      this.drawObject(object);
    });
    return oCanvas.toDataURL();
  }
}
