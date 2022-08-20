import { beginView, clear, ctx, drawSceneSprite, drawSprite, endView, mouse, write } from "./engine";
import { drawParticles } from "./particles";
import * as Sprites from "./sprites.json";

let shake = false;
let shakeTimeout = 0;

export function screenshake(duration: number = 100) {
  shake = true;
  clearTimeout(shakeTimeout);
  shakeTimeout = setTimeout(() => shake = false, duration);
}

function drawBackground() {
  for (let i = 0; i < 400 / 16; i++) {
    drawSceneSprite(Sprites.wall, i * 16, 0);
    drawSceneSprite(Sprites.floor, i * 16, -16);
    //drawSceneSprite(Sprites.ceiling, i * 16, 32);
  }
}

function drawReticle() {
  let { player, holding } = game;
  let [mouseX, mouseY] = mouse();
  let playerX = player.x + player.sprite[2] / 2;
  let playerY = player.y + player.sprite[3] / 2;
  let angle = Math.atan2(mouseX - playerX, -mouseY - playerY);
  let reticleX = playerX + Math.sin(angle) * game.targetRadius;
  let reticleY = playerY + Math.cos(angle) * game.targetRadius;
  game.targetAngle = angle;
  if (holding) drawSceneSprite(holding.sprite, player.x, player.y);
  drawSceneSprite(Sprites.reticle, reticleX - Sprites.reticle[2] / 2, reticleY - Sprites.reticle[3] / 2);
}

export function render() {
  clear();
  beginView(0, 150);

  if (shake) {
    ctx.translate(Math.random() * 2 | 0, Math.random() * 2 | 0);
  }

  drawBackground();
  drawParticles();

  drawSceneSprite(Sprites.casting_glyphs, 0, 0);

  for (let object of game.objects) {
    drawSceneSprite(object.sprite, object.x, object.y);

    // Don't bother rendering HP for player/grunts
    if (object !== game.player && object.maxHp > 1) {
      let origin = object.center();
      origin.x -= (object.maxHp * 3) / 2;
      for (let i = 0; i < object.hp; i++) {
        drawSceneSprite(Sprites.health_pip, origin.x + i * 3, object.y - 3);
      }
    }
  }

  drawReticle();
  endView();

  beginView(0, 0);
  write(`\x03${game.player.hp} \x01${game.souls} \x02${game.wave.spawnCounter}`, 0, 0);
  endView();

  beginView(0, ctx.canvas.height - 32);
  drawSprite(game.spell.sprite, 0, 0);
  write(`${game.spell.name} (LMB)`, 12, 1);
  for (let i = 0; i < game.spell.casts; i++) {
    drawSprite(Sprites.cast_pip, 12 + i * 3, 8);
  }
  endView();

  beginView(0, ctx.canvas.height - 16);
  alpha(game.ability.timer < game.ability.cooldown ? 0.5 : 1);
  drawSprite(game.ability.sprite, 0, 0);
  write(`${game.ability.name} (SPC)`, 12, 3);
  endView();
}

export function alpha(v: number) {
  ctx.globalAlpha = v;
}
