import spriteSrc from "./sprites.png";
import { glyphWidth, glyphHeight, glyphWidthOverrides, lineHeight } from "./font.json";
import { clamp, removeFromArray, vectorFromAngle } from "./helpers";

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

let spritesImage = new Image();
spritesImage.src = spriteSrc;

declare const c: HTMLCanvasElement;
export let canvas = c;
export let ctx = canvas.getContext("2d")!;

export function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawSprite([sx, sy, sw, sh]: Sprite, x: number, y: number) {
  drawSpriteSlice(sx, sy, sw, sh, x, y, sw, sh);
}

/**
 * A scene sprite is drawn with their bottom left corner at the requested
 * X coordinate and the Y coordinate treated as a negative, so that a positive
 * Y value appears to move them upwards.
 * @param sprite
 * @param x
 * @param y
 */
export function drawSceneSprite(sprite: Sprite, x: number, y: number) {
  drawSprite(sprite, x, - y - sprite[3]);
}

export function drawSpriteSlice(sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
  ctx.drawImage(spritesImage, sx, sy, sw, sh, dx | 0, dy | 0, dw, dh);
}

export function drawNineSlice(sprite: Sprite, x: number, y: number, w: number, h: number) {
  let [sx, sy, sw, sh] = sprite;
  //     |--c--|
  //     x1    x2     x3
  //  y1 +-----+------+-----+
  //     |     |      |     |
  //  y2 +-----+------+-----| -
  //     |     |      |     | |
  //     |     |      |     | |h1
  //     |     |      |     | |
  //  y3 +-----+------|-----+ -
  //     |     |      |     |
  //     +-----+------+-----+
  //           |--w1--|
  let c = 3;
  let sx1 = sx;
  let sx2 = sx + c;
  let sx3 = sx + sw - c;
  let sy1 = sy;
  let sy2 = sy + c;
  let sy3 = sy + sh - c
  let sw1 = sx3 - sx2;
  let sh1 = sy3 - sy2;
  let dx1 = x;
  let dx2 = x + c;
  let dx3 = x + w - c
  let dy1 = y;
  let dy2 = y + c;
  let dy3 = y + h - c
  let dw1 = dx3 - dx2;
  let dh1 = dy3 - dy2;
  drawSpriteSlice(sx1, sy1, c, c, dx1, dy1, c, c); // Top left corner
  drawSpriteSlice(sx3, sy1, c, c, dx3, dy1, c, c); // Top right corner
  drawSpriteSlice(sx1, sy3, c, c, dx1, dy3, c, c); // Bottom left corner
  drawSpriteSlice(sx3, sy3, c, c, dx3, dy3, c, c); // Bottom right corner
  drawSpriteSlice(sx2, sy1, sw1, c, dx2, dy1, dw1, c); // Top
  drawSpriteSlice(sx2, sy3, sw1, c, dx2, dy3, dw1, c); // Bottom
  drawSpriteSlice(sx1, sy2, c, sh1, dx1, dy2, c, dh1); // Left
  drawSpriteSlice(sx3, sy2, c, sh1, dx3, dy2, c, dh1); // Right
  drawSpriteSlice(sx2, sy2, sw1, sh1, dx2, dy2, dw1, dh1); // Center
}

let textX = 0;
let textY = 0;

/**
 * Write a string of text from the pixel font onto the screen.
 * @param text
 * @param x
 * @param y
 */
export function write(text: string, x: number = textX, y: number = textY) {
  textX = x | 0;
  textY = y | 0;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char === "\n") {
      textX = x;
      textY += lineHeight;
    } else {
      let code = char.charCodeAt(0) - 32;
      let sx = (code % 32) * glyphWidth;
      let sy = (code / 32 | 0) * glyphHeight;
      let dx = textX;
      let dy = textY;
      ctx.drawImage(spritesImage, sx, sy, glyphWidth, glyphHeight, dx, dy, glyphWidth, glyphHeight);
      textX += metrics[char] ?? glyphWidth;
    }
  }
}

function resize() {
  let { width: w, height: h } = canvas;
  let scale = Math.min(innerWidth / w, innerHeight / h, 3);
  canvas.style.width = canvas.width * scale + "px";
  canvas.style.height = canvas.height * scale + "px";
  ctx.imageSmoothingEnabled = false;
}

export function init(width: number, height: number, update: (dt: number) => void) {
  canvas.width = width;
  canvas.height = height;
  (onresize = resize)();

  let t0 = 0;
  (function loop(t1 = 0) {
    requestAnimationFrame(loop);
    update(t1 - t0);
    t0 = t1;
  })();
}

type Easing = (t: number) => number;

interface Tween {
  startValue: number;
  endValue: number;
  duration: number;
  elapsed: number;
  ease: Easing;
  callback: (v: number, t: number) => void;
}

let tweens: Tween[] = [];

export let linear: Easing = x => x;

export function updateTweens(dt: number) {
  tweens = tweens.filter(tween => {
    tween.elapsed += dt;
    let progress = clamp(tween.elapsed / tween.duration, 0, 1);
    let t = tween.ease(progress);
    let value = tween.startValue + (tween.endValue - tween.startValue) * t;
    tween.callback(value, t);
    return progress < 1;
  })
}

export function tween(
  startValue: number,
  endValue: number,
  duration: number,
  callback: Tween["callback"],
  ease: Tween["ease"] = linear,
) {
  tweens.push({
    startValue,
    endValue,
    duration,
    callback,
    ease,
    elapsed: 0,
  });
}

export type Range = [base: number, spread: number];

const defaultRange: Range = [0, 0];

export function randomFromRange([base, spread]: Range): number {
  return base + Math.random() * spread;
}

export let particleEmitters: ParticleEmitter[] = [];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounce: number;
  elapsed: number;
  duration: number;
  variant: number;
  mass: number;
  friction: number;
}

export class ParticleEmitter {
  private static pool: Particle[] = [];

  particles = new Set<Particle>;

  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;

  variants: Sprite[][] = [];
  frequency: number = 0;
  velocity: Range = defaultRange;
  angle: Range = defaultRange;
  duration: Range = defaultRange;
  bounce: Range = defaultRange;
  friction: Range = defaultRange;
  mass: Range = defaultRange;

  private clock = 0;
  private done = false;

  constructor(props: Partial<ParticleEmitter> = {}) {
    Object.assign(this, props);
    particleEmitters.push(this);
  }

  extend(options: Partial<ParticleEmitter>) {
    return Object.assign(this, options);
  }

  remove() {
    this.done = true;
  }

  update(dt: number) {
    let t = dt / 1000;

    this.clock += this.frequency;
    while (!this.done && this.clock > 0) {
      this.clock -= 1;
      this.emit();
    }

    for (let p of this.particles) {
      if ((p.elapsed += dt) >= p.duration) {
        this.particles.delete(p);
        ParticleEmitter.pool.push(p);
      } else {
        p.x += p.vx * t;
        p.y += p.vy * t;
        p.vy -= p.mass * t;

        if (p.y <= 0) {
          p.y = 0;
          p.vy *= -p.bounce;
          p.vx *= p.friction;
        }
      }
    }

    if (this.done && this.particles.size === 0) {
      removeFromArray(particleEmitters, this);
    }
  }

  emit() {
    let p = ParticleEmitter.pool.pop() || {} as Particle;
    let velocity = randomFromRange(this.velocity);
    let angle = randomFromRange(this.angle);
    let [vx, vy] = vectorFromAngle(angle);
    p.x = randomFromRange([this.x, this.w]);
    p.y = randomFromRange([this.y, this.h]);
    p.vx = vx * velocity;
    p.vy = vy * velocity;
    p.elapsed = 0;
    p.duration = randomFromRange(this.duration);
    p.bounce = randomFromRange(this.bounce);
    p.friction = randomFromRange(this.friction);
    p.mass = randomFromRange(this.mass);
    p.variant = randomFromRange([0, this.variants.length]) | 0;
    this.particles.add(p);
  }

  burst(count: number) {
    for (let i = 0; i < count; i++) {
      this.emit();
    }
    return this;
  }
}

export function updateParticles(dt: number) {
  for (let emitter of particleEmitters) {
    emitter.update(dt);
  }
}
