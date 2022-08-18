import { GameObject } from "./game";
import * as sprites from "./sprites.json";
import { CONSUMABLE, LIVING, MISSILE } from "./tags";
import { Skeleton } from "./units";

export function Consumable() {
  let item = new GameObject();
  item.tags = CONSUMABLE;
  item.gravity = 100;
  item.friction = 0.6;
  return item;
}

export function InstantDeath() {
  let item = Consumable();
  item.sprite = sprites.potion_1;
  item.collisionTags = LIVING | MISSILE;
  item.onCollision = target => {
    game.despawn(target);
    game.despawn(item);
    let unit = Skeleton(target.x, item.y);
    unit.vx = item.vx;
    unit.vy = item.vy;
    unit.gravity = 50;
    game.spawn(unit);
  };
  return item;
}
