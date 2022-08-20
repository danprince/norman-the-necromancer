import spriteSrc from "./sprites.png";
import fontSrc from "./font.png";
import { glyphWidth, glyphHeight, glyphWidthOverrides, lineHeight } from "./font.json";

export type Sprite = number[];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Unpack font metrics
let metrics: Record<string, number> = {};

for (let k in glyphWidthOverrides) {
  for (let c of k) {
    metrics[c] = glyphWidthOverrides[k as keyof typeof glyphWidthOverrides];
  }
}

let fontImage = new Image();
fontImage.src = fontSrc;

let spritesImage = new Image();
spritesImage.src = spriteSrc;

let _pointer = { x: 0, y: 0, down: false };

interface State {
  x: number;
  y: number;
}

let _stack: State[] = [];
let _state: State = {
  x: 0,
  y: 0,
};

export function clear() {
  ctx.clearRect(0, 0, c.width, c.height);
}

export function beginView(x: number, y: number) {
  _stack.push(_state);
  ctx.save();
  ctx.translate(x, y);
  _state = { x: _state.x + x, y: _state.y + y };
}

export function endView() {
  ctx.restore();
  _state = _stack.pop()!;
}

declare const c: HTMLCanvasElement;
export let ctx = c.getContext("2d")!;

export function drawSprite([sx, sy, sw, sh]: number[], x: number, y: number) {
  ctx.drawImage(spritesImage, sx, sy, sw, sh, x | 0, y | 0, sw, sh);
}

/**
 * A scene sprite is drawn with their bottom left corner at the requested
 * X coordinate and the Y coordinate treated as a negative, so that a positive
 * Y value appears to move them upwards.
 * @param sprite
 * @param x
 * @param y
 */
export function drawSceneSprite(sprite: number[], x: number, y: number) {
  drawSprite(sprite, x, - y - sprite[3]);
}

export function write(text: string, x: number, y: number) {
  let currentX = x;
  let currentY = y;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char === "\n") {
      currentX = x;
      currentY += lineHeight;
      continue;
    }
    let code = char.charCodeAt(0);
    let sx = (code % 16) * glyphWidth;
    let sy = (code / 16 | 0) * glyphHeight;
    let dx = currentX;
    let dy = currentY;
    ctx.drawImage(fontImage, sx, sy, glyphWidth, glyphHeight, dx, dy, glyphWidth, glyphHeight);
    currentX += metrics[char] ?? glyphWidth;
  }
}

/**
 * @category Tweens
 */
export type Easing = (t: number) => number;

interface Tween {
  duration: number;
  elapsed: number;
  target: any;
  startValues: any;
  endValues: any;
  easing: Easing;
  callback(t: number): void;
  done(): void;
}

let _tweens: Tween[] = [];

export function tween<T extends Record<string, any>>(
  target: T,
  endValues: Partial<T>,
  duration: number,
  callback: (t: number) => void = (_: number) => {},
  easing: Easing = t => t,
) {
  type Values = typeof endValues;
  type Keys = keyof Values;
  let startValues = {} as Values;
  let keys = Object.keys(endValues) as Keys[];

  for (let key of keys) {
    startValues[key] = target[key as keyof T];
  }

  return new Promise<void>(done => {
    _tweens.push({
      duration,
      elapsed: 0,
      target,
      startValues,
      endValues,
      callback,
      easing,
      done,
    });
  });
}

/**
 * Updates all currently active tweens.
 * @param dt The number of milliseconds since the last tween update.
 * @category Tweens
 */
export function updateTweens(dt: number) {
  for (let tween of _tweens) {
    tween.elapsed += dt;

    let progress = Math.min(tween.elapsed / tween.duration, 1);
    let t = tween.easing(progress);
    let keys = Object.keys(tween.startValues);
    tween.callback(progress);

    for (let key of keys) {
      let startValue = tween.startValues[key];
      let endValue = tween.endValues[key];
      tween.target[key] = startValue + (endValue - startValue) * t;
    }
  }

  _tweens = _tweens.filter(t => {
    let done = t.elapsed >= t.duration;
    if (done) t.done();
    return !done;
  });
}

function _resize() {
  let { width: w, height: h } = c;
  let scale = Math.min(innerWidth / w, innerHeight / h, 3);
  c.width = w;
  c.height = h;
  c.style.width = c.width * scale + "px";
  c.style.height = c.height * scale + "px";
  ctx.imageSmoothingEnabled = false;
}

onmousemove = e => {
  let r = c.getBoundingClientRect();
  _pointer.x = (e.clientX - r.x) * (c.width / r.width) | 0;
  _pointer.y = (e.clientY - r.y) * (c.height / r.height) | 0;
}

onkeydown = e => {
  if (e.key === " ") {
    game.ability.use();
  }
}

export function mouse() {
  return [_pointer.x - _state.x, _pointer.y - _state.y];
}

export function init(width: number, height: number, update: (dt: number) => void) {
  c.width = width;
  c.height = height;
  (onresize = _resize)();

  let prev = 0;
  (function _loop(now = prev) {
    requestAnimationFrame(_loop);
    let dt = now - prev;
    prev = now;
    update(dt);
  })();
}
