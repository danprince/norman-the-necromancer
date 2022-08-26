import * as sprites from "./sprites.json";
import * as fx from "./fx";
import { Behaviour, GameObject } from "./game";
import { BARRIER, CORPSE, LIVING, MISSILE, MOBILE, PLAYER, UNDEAD } from "./tags";
import { DEG_90, randomElement } from "./helpers";
import { March, Attack, DespawnTimer, Damaging, Bleeding, Enraged } from "./behaviours";
import { Damage } from "./actions";
import { tween } from "./engine";

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
  player.tags = PLAYER | UNDEAD;
  player.sprite = sprites.norman_arms_down;
  player.collisionMask = LIVING;
  player.updateSpeed = 1000;
  player.hp = player.maxHp = 5;
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
  object.bounce = 0;
  object.friction = 0.1;
  object.despawnOnCollision = true;
  object.addBehaviour(new DespawnTimer(object, 3000));
  object.addBehaviour(new Damaging(object));
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

export function SkeletonLord(x: number, y: number) {
  let unit = Skeleton(x, y);
  unit.sprite = sprites.big_skeleton;
  unit.hp = unit.maxHp = 5;
  unit.updateSpeed = 3000;
  return unit;
}

export function Villager() {
  let unit = new GameObject();
  unit.sprite = randomElement([
    sprites.villager_1,
    sprites.villager_2,
    sprites.villager_3,
    sprites.villager_4,
  ]);
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
    if (shelled && dmg.amount > 0) {
      dmg.amount = 0;
    }
  };

  unit.addBehaviour(shell);

  return unit;
}

export function Monk() {
  let unit = Villager();
  unit.sprite = sprites.monk;
  unit.updateSpeed = 600;
  unit.hp = unit.maxHp = 3;

  let heal = new Behaviour(unit);
  heal.turns = 5;
  heal.onUpdate = () => {
    for (let object of game.objects) {
      if (object.tags & LIVING) {
        Damage(object, -1);
      }
    }

    fx.cloud(unit.bounds(), [
      [sprites.p_star_1, sprites.p_star_2, sprites.p_star_3],
      [sprites.p_star_2, sprites.p_star_3, sprites.p_star_4],
      [sprites.p_star_1, sprites.p_star_3],
    ]).burst(10).remove();
  };

  unit.addBehaviour(heal);
  return unit;
}

export function Archer() {
  let unit = Villager();
  unit.sprite = sprites.archer;
  unit.updateSpeed = 300;
  unit.hp = unit.maxHp = 2;
  return unit;
}

export function Jester() {
  let unit = Villager();
  unit.sprite = sprites.jester;
  unit.updateSpeed = 500;
  unit.hp = unit.maxHp = 2;
  let hopBack = new March(unit, 16);
  let hopForward = new March(unit, -16);
  hopBack.turns = 4;
  unit.behaviours = [hopForward, hopBack];
  return unit;
}

export function WardStone() {
  let unit = new GameObject();
  unit.sprite = sprites.wardstone;
  unit.hp = unit.maxHp = 5;
  unit.tags = BARRIER;
  unit.collisionMask = LIVING;
  unit.mass = 1000;
  unit.onCollision = object => {
    Damage(unit, 1);
    tween(object.x, object.x + 16, 200, x => object.x = x);
  }
  return unit;
}

export function Chariot() {
  let unit = new GameObject();
  unit.sprite = sprites.chariot;
  unit.tags = UNDEAD | MOBILE;
  unit.collisionMask = LIVING;
  unit.hp = unit.maxHp = 20;
  unit.updateSpeed = 100;
  unit.behaviours.push(new March(unit, 32));
  unit.behaviours.push(new Attack(unit));
  unit.emitter = fx.bones().extend({
    h: 16,
    frequency: 0.5,
    duration: [1000, 2000],
    angle: [DEG_90, 0.5],
    velocity: [20, 20],
  });
  unit.emitter.start();
  return unit;
}

export function RageKnight() {
  let unit = Villager();
  unit.sprite = sprites.rage_knight;
  unit.updateSpeed = 500;
  unit.hp = unit.maxHp = 5;
  unit.addBehaviour(new Bleeding(unit));
  unit.addBehaviour(new Enraged(unit));
  return unit;
}
