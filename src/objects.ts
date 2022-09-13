import * as sprites from "./sprites.json";
import * as fx from "./fx";
import * as sfx from "./sounds";
import { Behaviour, GameObject } from "./game";
import { CORPSE, LIVING, SPELL, MOBILE, PLAYER, UNDEAD } from "./tags";
import { DEG_180, DEG_90, randomElement } from "./helpers";
import { March, Attack, Damaging, Bleeding, Enraged, Summon, Invulnerable, DespawnTimer } from "./behaviours";
import { Damage, Die } from "./actions";

export function Corpse() {
  let unit = new GameObject();
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
  object.collisionMask = MOBILE | LIVING;
  object.mass = 100;
  object.emitter = fx.trail();
  object.friction = 0.1;
  object.despawnOnCollision = true;
  object.despawnOnBounce = true;
  object.addBehaviour(new Damaging(object));
  return object;
}

export function BleedSpell() {
  let spell = Spell();
  spell.sprite = sprites.p_red_skull;
  spell.emitter!.extend({
    variants: [
      [sprites.p_red_3, sprites.p_red_2, sprites.p_red_1],
      [sprites.p_red_4, sprites.p_red_3, sprites.p_red_2],
      [sprites.p_red_3, sprites.p_red_2, sprites.p_red_1],
    ],
    frequency: 5,
    angle: [DEG_180, 0],
    mass: [20, 50],
  });
  spell.addBehaviour().onCollision = target =>
    target.addBehaviour(new Bleeding(target));
  return spell;
}

export function LightningSpell() {
  let spell = Spell();
  spell.sprite = sprites.p_skull_yellow;
  spell.emitter!.frequency = 0.8;
  spell.emitter!.variants = [
    [sprites.p_lightning_1, sprites.p_lightning_2, sprites.p_lightning_3, sprites.p_lightning_4],
    [sprites.p_lightning_1, sprites.p_lightning_2, sprites.p_lightning_3, sprites.p_lightning_5],
    [sprites.p_lightning_2, sprites.p_lightning_3, sprites.p_lightning_6],
    [sprites.p_lightning_4, sprites.p_lightning_5, sprites.p_lightning_6],
    [sprites.p_purple_5],
  ];
  return spell;
}

export function Skeleton() {
  let unit = new GameObject();
  unit.sprite = sprites.skeleton;
  unit.tags = UNDEAD | MOBILE;
  unit.collisionMask = LIVING;
  unit.hp = unit.maxHp = 1;
  unit.updateSpeed = 1000;
  unit.behaviours.push(new March(unit, 16));
  unit.behaviours.push(new Attack(unit, ))
  return unit;
}

export function SkeletonLord() {
  let unit = Skeleton();
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
  unit.corpseChance = 1;
  unit.souls = 5;
  return unit;
}

export function Bandit() {
  let unit = Villager();
  unit.hp = unit.maxHp = 2;
  return unit;
}

export function TheKing() {
  let unit = Villager();
  unit.sprite = sprites.the_king;
  unit.updateSpeed = 5000;
  unit.hp = unit.maxHp = 100;
  unit.behaviours = [];
  unit.mass = 1000;
  unit.emitter = fx.royalty().extend({
    frequency: 0.2,
    angle: [DEG_90, 0.5],
    w: unit.sprite[2],
    h: unit.sprite[3],
  });

  let phase = 1
  let marching = new March(unit, -32);
  let summons = new Summon(unit, RoyalGuard, 2000);
  let enraged = new Enraged(unit, SPELL);
  let invulnerable = new Invulnerable(unit);
  let boss = new Behaviour(unit);

  unit.addBehaviour(marching);
  unit.addBehaviour(boss);

  boss.onDamage = ({ amount }) => {
    let willDie = unit.hp - amount <= 0;

    if (phase === 1 && willDie) {
      phase = 2;
      unit.addBehaviour(summons);
      unit.addBehaviour(enraged);
      unit.addBehaviour(invulnerable);
      marching.step *= -1;
    } else if (phase === 3 && willDie) {
      sfx.synths.kick.enter();
      phase = 4;
      unit.hp = unit.maxHp;
      unit.sprite = sprites.the_king_on_foot;
      unit.updateSpeed = unit.updateClock = 1000;
      marching.step /= 2;
    }
  };

  summons.onSummon = () => {
    if (summons.summonCounter >= 5) {
      phase = 3;
      unit.removeBehaviour(enraged);
      unit.removeBehaviour(invulnerable);
      unit.removeBehaviour(summons);
      marching.step *= -1;
    }
  };

  return unit;
}

export function Champion() {
  let unit = Villager();
  unit.sprite = sprites.champion;
  unit.updateSpeed = 1000;
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

  shell.onDamage = (dmg) => {
    if (shelled) {
      dmg.amount = Math.min(0, dmg.amount);
    }
  };

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
  unit.hp = unit.maxHp = 15;
  unit.addBehaviour(new Summon(unit, Rat, 2000));
  unit.souls = 200;
  return unit;
}

export function Rat() {
  let unit = Villager();
  unit.sprite = sprites.rat;
  unit.updateSpeed = 200;
  unit.souls = 1;
  unit.corpseChance = 0;
  return unit;
}

export function RageKnight() {
  let unit = Villager();
  unit.sprite = sprites.rage_knight;
  unit.updateSpeed = 500;
  unit.hp = unit.maxHp = 5;
  let raging = unit.addBehaviour();
  let march = unit.getBehaviour(March)!;
  let enraged = new Enraged(unit, SPELL);
  let angry = false;
  let step = march.step;
  raging.turns = 5;
  raging.onUpdate = () => {
    angry = !angry;

    if (angry) {
      unit.addBehaviour(enraged);
    } else {
      unit.removeBehaviour(enraged);
    }

    unit.sprite = angry ? sprites.rage_knight_enraged : sprites.rage_knight;
    march.step = angry ? 0 : step;
  };
  unit.souls = 50;
  return unit;
}

export function RoyalGuard() {
  let unit = Villager();
  unit.sprite = sprites.royal_guard;
  unit.hp = unit.maxHp = 4;
  unit.souls = 20;
  let march = unit.getBehaviour(March)!;

  let shielded = false;
  let shield = unit.addBehaviour();
  shield.turns = 3;

  shield.onUpdate = () => {
    shielded = !shielded;
    march.step = shielded ? 0 : -16;
    unit.sprite = shielded ? sprites.royal_guard_shielded : sprites.royal_guard;
  };

  shield.onDamage = dmg => {
    if (!shielded || !dmg.dealer?.is(SPELL)) return;

    if (dmg.dealer.vx > 0) {
      dmg.amount = 0;

      let orb = RoyalGuardOrb();
      orb.vx = dmg.dealer.vx *= -1;
      orb.vy = dmg.dealer.vy *= -0.25;
      orb.mass = dmg.dealer.mass;
      game.spawn(orb, dmg.dealer.x - orb.sprite[2] - 1, dmg.dealer.y);
    }
  };

  // Looks more natural if the shield comes up first
  unit.behaviours.reverse();
  return unit;
}

export function RoyalGuardOrb() {
  let unit = new GameObject();
  unit.sprite = sprites.yellow_orb;
  unit.tags = LIVING;
  unit.collisionMask = MOBILE | PLAYER;
  unit.hp = 1;
  unit.despawnOnBounce = true;
  unit.despawnOnCollision = true;
  unit.addBehaviour(new Damaging(unit));
  unit.addBehaviour(new DespawnTimer(unit, 3000));
  unit.friction = 0.9;
  unit.emitter = fx.royalty();
  return unit;
}

export function Wizard() {
  let unit = Villager();
  unit.sprite = sprites.wizard;
  unit.hp = unit.maxHp = 5;
  unit.souls = 30;
  unit.addBehaviour(new Summon(unit, Portal, 3000));
  return unit;
}

export function Portal() {
  let unit = new GameObject();
  unit.sprite = sprites.portal;
  unit.tags = LIVING;
  unit.hp = unit.maxHp = 3;
  // Prevent the player from farming portals for souls
  unit.addBehaviour(new DespawnTimer(unit, 3000 * 10));
  unit.addBehaviour(
    new Summon(unit, () => randomElement([Villager, Bandit, Archer])(), 3000),
  );

  unit.emitter = fx.cloud(unit.bounds(), [
    [sprites.p_blue_1, sprites.p_blue_2, sprites.p_blue_3],
    [sprites.p_blue_2, sprites.p_blue_3],
    [sprites.p_blue_3],
  ]).extend({
    frequency: 0.2,
  });

  return unit;
}
