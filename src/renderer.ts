import * as sprites from "./sprites.json";
import { canvas, clear, ctx, drawSceneSprite, drawSprite, particleEmitters, Sprite, write } from "./engine";
import { GameObject } from "./game";
import { Point, randomInt } from "./helpers";

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
    ctx.translate(randomInt(2), randomInt(2));
  }

  ctx.translate(sceneOrigin.x, sceneOrigin.y);
  drawBackground();
  drawParticles();
  drawObjects();
  drawReticle();
  ctx.restore();

  drawHud();
}

function drawHud() {
  ctx.save();
  ctx.translate(0, 0);
  drawSprite(sprites.norman_icon, 0, 0);

  for (let i = 0; i < game.player.maxHp; i++) {
    let sprite = i < game.player.hp ? sprites.health_orb : sprites.health_orb_empty;
    drawSprite(sprite, 11 + i * 4, 0);
  }

  for (let i = 0; i < game.spell.maxCasts; i++) {
    let sprite = i < game.spell.currentCasts ? sprites.cast_orb : sprites.cast_orb_empty;
    drawSprite(sprite, 11 + i * 4, 6);
  }

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
    drawSceneSprite(sprites.floor, i * 16, -sprites.floor[3]);
    drawSceneSprite(sprites.ceiling, i * 16, game.stage.ceiling);
  }
}

function drawHealthOrbs(object: GameObject) {
  let origin = object.center();
  let x = origin.x - (object.maxHp * 4) / 2;
  let y = object.y - 7;
  for (let i = 0; i < object.maxHp; i++) {
    let sprite = i < object.hp ? sprites.health_orb : sprites.health_orb_empty;
    drawSceneSprite(sprite, x + i * 4, y);
  }
}

function drawReticle() {
  let { x, y } = game.getCastingPoint();
  let sprite = sprites.reticle;
  drawSceneSprite(sprite, x - sprite[2] / 2, y - sprite[3] / 2);

  let energy = game.getCastingEnergy();
  let p0 = game.player.center();
  let p1 = game.getCastingPoint();
  let dx = p1.x - p0.x;
  let dy = p1.y - p0.y;

  for (let i = 0; i < energy; i += 0.2) {
    let x = p0.x + dx * i;
    let y = p0.y + dy * i;
    let sprite = sprites.cast_pip;
    drawSceneSprite(sprite, x - sprite[2] / 2, y - sprite[3] / 2);
  }
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
