import { BonePop } from "./fx";
import { GameObject } from "./game";
import { Corpse } from "./units";
import * as Sprites from "./sprites.json";
import { LIVING } from "./tags";

export function damage(unit: GameObject, amount: number) {
  unit.hp = Math.min(Math.max(unit.hp - amount, 0), unit.maxHp);

  if (unit.hp <= 0) {
    death(unit);
  }
}

export function death(unit: GameObject) {
  if (unit.tags & LIVING) {
    game.souls += 1;
    let corpse = Corpse(unit.x, 10);

    if (Math.random() > 0.5) {
      game.spawn(corpse);
    }

    let emitter = BonePop();
    emitter.x = unit.x;
    emitter.y = unit.y;
    emitter.start();
    emitter.burst(2 + Math.random() * 5 | 0);
    corpse.emitter = emitter;
  }

  game.despawn(unit);
}

let castTimeout = 0;

export function cast() {
  let playerX = game.player.x + game.player.sprite[2] / 2;
  let playerY = game.player.y + game.player.sprite[3] / 2;
  let x = playerX + Math.sin(game.targetAngle) * game.targetRadius;
  let y = playerY + Math.cos(game.targetAngle) * game.targetRadius;

  if (game.holding) {
    let object = game.holding;
    object.x = x;
    object.y = y;
    object.vx = Math.sin(game.targetAngle) * 150;
    object.vy = Math.cos(game.targetAngle) * 150;
    game.spawn(object);
    game.holding = undefined;
  } else {
    let spell = game.spell;
    if (spell.casts <= 0) return;
    spell.cast(x, y);
  }

  clearTimeout(castTimeout);
  game.player.sprite = Sprites.norman_arms_up;
  castTimeout = setTimeout(() => game.player.sprite = Sprites.norman_arms_down, 500);
}

export function useAbility() {
  game.ability.use();
}

