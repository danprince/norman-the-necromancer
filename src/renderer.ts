import * as sprites from "./sprites.json";
import { canvas, clear, ctx, drawNineSlice, drawSceneSprite, drawSprite, particleEmitters, Sprite, write } from "./engine";
import { clamp, Point, randomInt } from "./helpers";
import { SHOPPING } from "./game";
import { shop } from "./shop";
import { Frozen } from "./behaviours";

const ICON_SOULS = "$";

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

  if (game.state === SHOPPING) {
    drawShop();
  }
}

function drawShop() {
  write("~~-~--~~~-~~\n", 160, 20);
  write("Necronomicon\n");
  write("~~-~--~~~-~~\n\n");
  let selected = shop.items[shop.selectedIndex];
  for (let item of shop.items) {
    write(
      `${item === selected ? ">" : " "}${
        item.name
      } $${item.cost}\n`,
    );
  }
  write("\n~~-~--~~~-~~\n");
  write(selected?.description + "\n");
  write("~~-~--~~~-~~\n");
}

function drawHud() {
  drawSprite(sprites.norman_icon, 0, 0);

  for (let i = 0; i < game.player.maxHp; i++) {
    let sprite = i < game.player.hp ? sprites.health_orb : sprites.health_orb_empty;
    drawSprite(sprite, 11 + i * 4, 0);
  }

  for (let i = 0; i < game.spell.maxCasts; i++) {
    let sprite = i < game.spell.casts ? sprites.cast_orb : sprites.cast_orb_empty;
    drawSprite(sprite, 11 + i * 4, 6);
  }

  let souls = game.souls | 0;
  let multiplier = game.getStreakMultiplier();
  let bonus = multiplier ? `(+${multiplier * 100 + "%"})` : "";
  write(`${ICON_SOULS}${souls} ${bonus}`, canvas.width / 2 - 30, 0);

  {
    let x = 1;
    let y = canvas.height - 12;
    let progress = clamp(game.ability.timer / game.ability.cooldown, 0, 1);
    drawNineSlice(sprites.pink_frame, x, y, 52 * (1 - progress) | 0, 10);
    write("Resurrect", x + 10, y + 2);
    if (progress === 1) write(" (SPC)");
    else write(" " + (((1 - progress) * game.ability.cooldown) / 1000 | 0) + "s");
    drawSprite(sprites.skull, x + 1, y + 1);
  }
}

function drawOrbs(
  x: number,
  y: number,
  value: number,
  maxValue: number,
  sprite: Sprite,
  emptySprite: Sprite,
) {
  let x0 = x - (maxValue * 4) / 2;
  for (let i = 0; i < maxValue; i++) {
    drawSceneSprite(i < value ? sprite : emptySprite, x0 + i * 4, y);
  }
}

function drawObjects() {
  for (let object of game.objects) {
    drawSceneSprite(object.sprite, object.x, object.y + object.hop);

    if (object.getBehaviour(Frozen)) {
      drawNineSlice(sprites.ice, object.x, -object.sprite[3], object.sprite[2], object.sprite[3]);
    }

    if (object.maxHp > 1 && object !== game.player) {
      if (object.maxHp < 10) {
        let { x } = object.center();
        drawOrbs(x, -6, object.hp, object.maxHp, sprites.health_orb, sprites.health_orb_empty);
      } else {
        drawSceneSprite(sprites.health_orb, object.x, -6);
        write(`${object.hp}/${object.maxHp}`, object.x + 6, 0);
      }
    }

    let { x } = object;
    for (let behaviour of object.behaviours) {
      if (behaviour.sprite) {
        drawSceneSprite(behaviour.sprite, x, -12);
        x += behaviour.sprite[2] + 1;
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

function drawReticle() {
  let { x, y } = game.getCastingPoint();
  let sprite = sprites.reticle;
  drawSceneSprite(sprite, x - sprite[2] / 2, y - sprite[3] / 2);
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
