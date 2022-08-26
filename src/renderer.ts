import * as sprites from "./sprites.json";
import { canvas, clear, ctx, drawSceneSprite, particleEmitters } from "./engine";
import { GameObject } from "./game";
import { Point } from "./helpers";

let screenShakeTimer = 0;

export function screenshake(time: number) {
  screenShakeTimer = time;
}

let sceneOrigin = Point(0, 150);

export function screenToSceneCoords(x: number, y: number): Point {
  let r = canvas.getBoundingClientRect();
  let sx = (x - r.x) * (canvas.width / r.width) | 0;
  let sy = (y - r.y) * (canvas.height / r.height) | 0;
  return { x: sx, y: sceneOrigin.y - sy };
}

export function render(dt: number) {
  clear();
  ctx.save();

  if (screenShakeTimer > 0) {
    screenShakeTimer -= dt;
    ctx.translate(Math.random() * 2 | 0, Math.random() * 2 | 0);
  }

  ctx.translate(sceneOrigin.x, sceneOrigin.y);
  drawBackground();
  drawParticles();
  drawSceneSprite(sprites.casting_glyphs, 0, 0);
  drawObjects();
  drawReticle();
  ctx.restore();
}

function drawObjects() {
  for (let object of game.objects) {
    drawSceneSprite(object.sprite, object.x, object.y + object.hop);

    if (object != game.player) {
      if (object.maxHp > 1 && object.maxHp <= 10) {
        drawHealthOrbs(object);
      }
    }
  }
}

function drawBackground() {
  for (let i = 0; i < game.stage.width / 16; i++) {
    drawSceneSprite(sprites.wall, i * 16, 0);
    drawSceneSprite(sprites.floor, i * 16, -16);
    drawSceneSprite(sprites.ceiling, i * 16, game.stage.ceiling);
  }
}

function drawHealthOrbs(object: GameObject) {
  let origin = object.center();
  let x = origin.x - (object.maxHp * 5) / 2;
  let y = object.y - 7;
  for (let i = 0; i < object.hp; i++) {
    drawSceneSprite(sprites.health_orb, x + i * 5, y);
  }
}

function drawReticle() {
  let { x, y } = game.getCastingPoint();
  let sprite = sprites.reticle;
  drawSceneSprite(sprites.reticle, x - sprite[2] / 2, y - sprite[3] / 2);
}

function drawParticles() {
  for (let emitter of particleEmitters) {
    for (let particle of emitter.particles) {
      let variant = emitter.variants[particle.variant];
      let progress = particle.elapsed / particle.duration;
      let sprite = variant[progress * variant.length | 0];
      drawSceneSprite(sprite, particle.x, particle.y);
    }
  }
}
