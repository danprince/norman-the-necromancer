import * as sprites from "./sprites.json";
import { ParticleEmitter, Sprite } from "./engine";
import { DEG_360, DEG_90, Rectangle } from "./helpers";
import { GameObject } from "./game";

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

export function royalty() {
  return trail().extend({
    frequency: 0.5,
    variants: [
      [sprites.p_star_1, sprites.p_star_2, sprites.p_star_3],
      [sprites.p_star_2, sprites.p_star_3, sprites.p_star_4],
      [sprites.p_star_1, sprites.p_star_3],
    ],
  });
}

export function dust() {
  return new ParticleEmitter({
    x: 0,
    y: 0,
    w: game.stage.width,
    h: game.stage.height,
    angle: [0, DEG_360],
    duration: [5000, 10000],
    velocity: [1, 3],
    bounce: [0, 0],
    frequency: 0.1,
    variants: [
      [sprites.p_dust_1, sprites.p_dust_2],
      [sprites.p_dust_2, sprites.p_dust_1, sprites.p_dust_3, sprites.p_dust_1]
    ]
  });
}

export function resurrect(unit: GameObject) {
  return cloud(unit.bounds(), [
    [sprites.p_green_1, sprites.p_green_2, sprites.p_green_3],
    [sprites.p_green_2, sprites.p_green_3, sprites.p_green_4],
    [sprites.p_green_1, sprites.p_green_3, sprites.p_green_5],
  ]).extend({ frequency: 0 });
}
