import * as sprites from "./sprites.json";
import * as fx from "./fx";
import { Behaviour, GameObject } from "./game";
import { BARRIER, CORPSE, LIVING, SPELL, MOBILE, PLAYER, UNDEAD } from "./tags";
import { DEG_90, randomElement } from "./helpers";
import { March, Attack, Damaging, Bleeding, Enraged, Summon } from "./behaviours";
import { Damage, Die } from "./actions";
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
  player.x = 5;
  player.tags = PLAYER | UNDEAD;
  player.sprite = sprites.norman_arms_down;
  player.collisionMask = LIVING;
  player.updateSpeed = 1000;
  player.hp = player.maxHp = 5;
  player.onCollision = unit => {
    Damage(player, unit.hp);
    Die(unit);
    if (player.hp <= 0) {
      window.location = window.location;
    }
  };
  return player;
}

export function Spell() {
  let object = new GameObject();
  object.sprite = sprites.p_green_skull;
  object.tags = SPELL;
  object.collisionMask = MOBILE;
  object.mass = 100;
  object.emitter = fx.trail();
  object.bounce = 0;
  object.friction = 0.1;
  object.despawnOnCollision = true;
  object.despawnOnBounce = true;
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
  unit.friction = 0.8;
  unit.mass = 75;
  unit.x = game.stage.width;
  unit.tags = LIVING | MOBILE;
  unit.hp = unit.maxHp = 1;
  unit.updateSpeed = 600;
  unit.addBehaviour(new March(unit, -16));
  unit.corpseChance = 0.5;
  unit.souls = 5;
  return unit;
}

export function TheKing() {
  let unit = Villager();
  unit.sprite = sprites.the_king;
  unit.updateSpeed = 5000;
  unit.hp = unit.maxHp = 100;
  unit.behaviours = [];
  unit.mass = 1000;

  let phase = 1
  let marching = new March(unit, -32);
  let summons = new Summon(unit, RoyalGuard, 1000);
  let enraged = new Enraged(unit, SPELL);
  let boss = new Behaviour(unit);

  unit.addBehaviour(marching);
  unit.addBehaviour(boss);

  boss.onDamage = ({ amount }) => {
    let willDie = unit.hp - amount <= 0;

    if (phase === 1 && willDie) {
      phase = 2;
      unit.addBehaviour(summons);
      unit.addBehaviour(enraged);
      unit.removeBehaviour(marching);
      unit.hp = amount + 1;
    } else if (phase === 3 && willDie) {
      phase = 4;
      unit.hp = unit.maxHp = unit.maxHp / 2;
      unit.sprite = sprites.the_king_on_foot;
      unit.updateSpeed = unit.updateClock = 500;
      marching.step /= 2;
    }
  };

  summons.onSummon = () => {
    if (summons.summonCounter >= 10) {
      phase = 3;
      unit.removeBehaviour(enraged);
      unit.addBehaviour(marching);
      unit.removeBehaviour(summons);
    }
  };

  return unit;
}

export function Champion() {
  let unit = Villager();
  unit.sprite = sprites.champion;
  unit.updateSpeed = 2000;
  unit.hp = unit.maxHp = 10;
  unit.souls = 25;
  return unit;
}

export function ShellKnight() {
  let unit = Villager();
  unit.sprite = sprites.shell_knight_up;
  unit.updateSpeed = 1000;
  unit.hp = unit.maxHp = 5;
  unit.souls = 25;

  let shell = unit.addBehaviour();
  let shelled = false;
  let timer = 0;

  shell.onUpdate = () => {
    shelled = timer++ % 4 > 1;
    unit.sprite = shelled ? sprites.shell_knight_down : sprites.shell_knight_up;
    shell.sprite = shelled ? sprites.status_shielded : undefined;
  };

  shell.onDamage = (dmg) => dmg.amount = Math.max(0, dmg.amount);

  return unit;
}

export function Monk() {
  let unit = Villager();
  unit.sprite = sprites.monk;
  unit.updateSpeed = 600;
  unit.hp = unit.maxHp = 3;
  unit.souls = 10;

  let heal = new Behaviour(unit);
  heal.turns = 5;
  heal.onUpdate = () => {
    for (let object of game.objects) {
      if (object.is(LIVING)) {
        Damage(object, -1, unit);
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

export function Piper() {
  let unit = Villager();
  unit.sprite = sprites.piper;
  unit.updateSpeed = 500;
  unit.hp = unit.maxHp = 10;
  unit.addBehaviour(new Summon(unit, Rat, 1250));
  unit.souls = 200;
  return unit;
}

export function Rat() {
  let unit = Villager();
  unit.sprite = sprites.rat;
  unit.updateSpeed = 200;
  unit.souls = 1;
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
  //unit.sprite = sprites.chariot;
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
  return unit;
}

export function RageKnight() {
  let unit = Villager();
  unit.sprite = sprites.rage_knight;
  unit.updateSpeed = 1000;
  unit.hp = unit.maxHp = 5;
  unit.addBehaviour(new Bleeding(unit));
  unit.addBehaviour(new Enraged(unit, SPELL));
  unit.souls = 50;
  return unit;
}

export function RoyalGuard() {
  let unit = Villager();
  unit.sprite = sprites.royal_guard;
  unit.hp = unit.maxHp = 5;
  unit.souls = 20;
  return unit;
}

export function Wizard() {
  let unit = Villager();
  unit.sprite = sprites.wizard;
  unit.hp = unit.maxHp = 3;
  unit.souls = 30;
  return unit;
}
