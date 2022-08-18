import * as sprites from "./sprites.json";
import { GameObject } from "./game";
import { randomElement } from "./helpers";
import { damage } from "./actions";
import { GreenTrail } from "./fx";
import { Heal, March } from "./behaviours";
import { CORPSE, LIVING, MOBILE, UNDEAD } from "./tags";

export function Corpse(x: number, y: number) {
  let unit = new GameObject();
  unit.x = x;
  unit.y = y;
  unit.sprite = sprites.skull;
  unit.gravity = 100;
  unit.tags = CORPSE;
  return unit;
}

export function Skeleton(x: number, y: number) {
  let unit = new GameObject();
  unit.sprite = sprites.skeleton;
  unit.x = x;
  unit.y = y;
  unit.tags = UNDEAD | MOBILE;
  unit.collisionTags = LIVING;
  unit.hp = 3;
  unit.maxHp = 3;
  unit.speed = 1000;
  unit.clock = 1000;

  unit.onCollision = target => {
    damage(target, 1);
    damage(unit, 1);
  };

  unit.addBehaviour(new March(16));

  let emitter = GreenTrail();
  emitter.x = unit.x;
  emitter.y = unit.y;
  emitter.options.angle = [0, 0];
  emitter.width = unit.sprite[2];
  emitter.height = unit.sprite[3];
  emitter.options.gravity = 10;
  emitter.burst(50);
  emitter.stopThenRemove();
  return unit;
}

export function Villager() {
  let unit = new GameObject();
  unit.sprite = randomElement([sprites.villager_1, sprites.villager_2, sprites.villager_3, sprites.villager_4]);
  unit.x = 400;
  unit.tags = LIVING | MOBILE;
  unit.hp = 1;
  unit.maxHp = 1;
  unit.speed = 600;
  unit.addBehaviour(new March(-16));
  return unit;
}

export function Paladin() {
  let unit = Villager();
  unit.sprite = sprites.paladin;
  unit.speed = 2000;
  unit.hp = 5;
  unit.maxHp = 5;
  return unit;
}

export function TheKing() {
  let unit = Villager();
  unit.sprite = sprites.the_king;
  unit.speed = 5000;
  unit.hp = 200;
  unit.maxHp = 200;
  return unit;
}

export function Archer() {
  let unit = Villager();
  unit.sprite = sprites.archer;
  unit.speed = 350;
  unit.hp = 2;
  unit.maxHp = 2;
  return unit;
}

export function Knight() {
  let unit = Villager();
  unit.sprite = sprites.knight;
  unit.speed = 500;
  unit.hp = 3;
  unit.maxHp = 3;
  return unit;
}

export function Priest() {
  let unit = Villager();
  unit.sprite = sprites.priest;
  unit.speed = 1000
  unit.hp = 3;
  unit.maxHp = 3;
  unit.addBehaviour(new Heal());
  return unit;
}
