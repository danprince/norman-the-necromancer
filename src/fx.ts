import { Rect, Sprite } from "./engine";
import { Emitter } from "./particles";
import * as sprites from "./sprites.json";

export function GreenTrail() {
  return new Emitter({
    life: [500, 1000],
    speed: [1, 10],
    angle: [Math.PI / 2 + 0.2, 0.4],
    bounce: [0, 0],
    frequency: 2,
    gravity: -0.2,
    friction: 0.5,
    variants: [
      [sprites.p_green_1, sprites.p_green_2, sprites.p_green_3],
      [sprites.p_green_2, sprites.p_green_3, sprites.p_green_4],
      [sprites.p_green_1, sprites.p_green_3, sprites.p_green_5],
    ],
  });
}

export function BonePop() {
  return new Emitter({
    life: [10_000, 5_000],
    speed: [5, 50],
    angle: [0.5, -1],
    bounce: [0, 0.5],
    frequency: 0,
    gravity: -100,
    friction: 0.5,
    variants: [
      [sprites.p_bone_1],
      [sprites.p_bone_2],
      [sprites.p_bone_3],
    ],
  });
}

export function Cloud(area: Rect, variants: Sprite[][]) {
  let emitter = new Emitter({
    life: [500, 1000],
    speed: [1, 10],
    angle: [0.2, -0.4],
    bounce: [0, 0],
    frequency: 2,
    gravity: 0.5,
    friction: 0,
    variants,
  });
  emitter.x = area.x;
  emitter.y = area.y;
  emitter.width = area.w;
  emitter.height = area.h;
  return emitter;
}

export function HolyBlessing(area: Rect) {
  return Cloud(area, [
    [sprites.p_star_1, sprites.p_star_2, sprites.p_star_3],
    [sprites.p_star_2, sprites.p_star_3, sprites.p_star_4],
    [sprites.p_star_1, sprites.p_star_3],
  ]);
}

export function Healing(area: Rect) {
  return Cloud(area, [[sprites.health_pip]]);
}

export function PuffOfSmoke(area: Rect) {
  let emitter = Cloud(area, [
    [sprites.p_smoke_1, sprites.p_smoke_2, sprites.p_smoke_3],
    [sprites.p_smoke_4, sprites.p_smoke_5, sprites.p_smoke_6],
  ]);
  emitter.options.angle = [0.5, -0.5];
  emitter.options.speed = [0, 10];
  emitter.options.gravity = 0;
  return emitter;
}
