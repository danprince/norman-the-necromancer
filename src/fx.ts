import * as sprites from "./sprites.json";
import { ParticleEmitter, Sprite } from "./engine";
import { DEG_90, Rectangle } from "./helpers";

export function bones() {
  return new ParticleEmitter({
    duration: [10_000, 5_000],
    friction: [0.6, 0],
    velocity: [5, 20],
    angle: [DEG_90 - 0.5, 1],
    bounce: [0.1, 0.5],
    mass: [60, 0],
    variants: [
      [sprites.p_bone_1],
      [sprites.p_bone_2],
      [sprites.p_bone_3],
    ],
  });
}

export function trail() {
  return new ParticleEmitter({
    duration: [500, 1000],
    velocity: [1, 10],
    angle: [Math.PI, -0.5],
    bounce: [0, 0],
    frequency: 2,
    mass: [3, 0],
    friction: [0.5, 0],
    variants: [
      [sprites.p_green_1, sprites.p_green_2, sprites.p_green_3],
      [sprites.p_green_2, sprites.p_green_3, sprites.p_green_4],
      [sprites.p_green_1, sprites.p_green_2, sprites.p_green_3],
    ],
  });
}

export function cloud(area: Rectangle, variants: Sprite[][]) {
  return new ParticleEmitter({
    ...area,
    duration: [500, 1000],
    velocity: [1, 10],
    angle: [DEG_90 - 0.2, 0.4],
    bounce: [0, 0],
    frequency: 2,
    mass: [-2, 0],
    variants,
  });
}
