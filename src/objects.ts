import * as sprites from "./sprites.json";
import * as fx from "./fx";
import { Behaviour, GameObject } from "./game";
import { CORPSE, LIVING, MISSILE, MOBILE, PLAYER, UNDEAD } from "./tags";
import { DEG_360, randomOneOf } from "./helpers";
import { March, Attack, DespawnTimer, VelocityTrail } from "./behaviours";
import { Damage } from "./actions";

export function Corpse(x: number, y: number) {
  let unit = new GameObject();
  unit.x = x;
  unit.y = y;
  unit.sprite = sprites.skull;
  unit.mass = 100;
  unit.tags = CORPSE;
  return unit;
}

export function Player() {
  let player = new GameObject();
  player.tags = PLAYER;
  player.sprite = sprites.norman_arms_down;
  player.collisionMask = LIVING;
  player.updateSpeed = 1000;
  player.onCollision = unit => {
    Damage(player, 1);
    Damage(unit, 5);
    if (player.hp <= 0) {
      window.location = window.location;
    }
  };
  return player;
}

export function Projectile() {
  let object = new GameObject();
  object.sprite = sprites.p_green_skull;
  object.tags = MISSILE;
  object.collisionMask = MOBILE;
  object.mass = 100;
  object.emitter = fx.particles();
  object.emitter.start();
  object.bounce = 0.5;
  object.friction = 0.5;
  object.addBehaviour(new DespawnTimer(object, 3000));
  object.addBehaviour(new VelocityTrail(object));

  object.onCollision = target => {
    Damage(target, 1);
    game.despawn(object);
  };

  return object;
}

export function Skeleton(x: number, y: number) {
  let unit = new GameObject();
  unit.sprite = sprites.skeleton;
  unit.x = x;
  unit.y = y;
  unit.tags = UNDEAD | MOBILE;
  unit.collisionMask = LIVING;
  unit.hp = unit.maxHp = 3;
  unit.updateSpeed = 1000;
  unit.behaviours.push(new March(unit, 16));
  unit.behaviours.push(new Attack(unit, ))
  return unit;
}

export function Villager() {
  let unit = new GameObject();
  unit.sprite = randomOneOf(
    sprites.villager_1,
    sprites.villager_2,
    sprites.villager_3,
    sprites.villager_4,
  );
  unit.x = game.stage.width;
  unit.tags = LIVING | MOBILE;
  unit.hp = unit.maxHp = 1;
  unit.updateSpeed = 600;
  unit.behaviours.push(new March(unit, -16));
  return unit;
}

export function TheKing() {
  let unit = Villager();
  unit.sprite = sprites.the_king;
  unit.updateSpeed = 5000;
  unit.hp = unit.maxHp = 200;
  unit.behaviours.push(new March(unit, -32));
  return unit;
}

export function Champion() {
  let unit = Villager();
  unit.sprite = sprites.champion;
  unit.updateSpeed = 2000;
  unit.hp = unit.maxHp = 5;
  return unit;
}

export function ShellKnight() {
  let unit = Villager();
  unit.sprite = sprites.shell_knight_up;
  unit.updateSpeed = 2000;
  unit.hp = unit.maxHp = 3;

  let shell = new Behaviour(unit);
  let shelled = false;

  shell.onUpdate = () => {
    shelled = !shelled;
    unit.sprite = shelled ? sprites.shell_knight_down : sprites.shell_knight_up;
  };

  shell.onDamage = dmg => {
    if (shelled) {
      dmg.amount = 0;
    }
  };

  unit.addBehaviour(shell);

  return unit;
}
