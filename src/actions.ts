import * as sprites from "./sprites.json";
import * as fx from "./fx";
import { Damage, Death, GameObject } from "./game";
import { clamp, randomFloat, randomInt, vectorFromAngle } from "./helpers";
import { Corpse, Spell, Skeleton } from "./objects";
import { CORPSE, MOBILE } from "./tags";

export function Damage(
  object: GameObject,
  amount: number,
  dealer?: GameObject,
) {
  let damage: Damage = { amount, dealer };
  object.onDamage(damage);
  object.hp = clamp(object.hp - damage.amount, 0, object.maxHp);
  if (!object.hp) Die(object, dealer);
}

export function Die(object: GameObject, killer?: GameObject) {
  let death: Death = {
    object,
    killer,
    souls: object.souls,
  };

  if (object.is(MOBILE)) {
    let center = object.center();

    fx
      .bones()
      .extend(center)
      .burst(2 + randomInt(3))
      .remove();

    for (let ritual of game.rituals) {
      ritual.onDeath?.(death);
    }

    if (randomFloat() <= object.corpseChance) {
      game.spawn(Corpse(), center.x, center.y);
    }

    game.addSouls(death.souls);
  }

  object.onDeath(death);

  game.despawn(object);
}

let castAnimationTimeout = 0;
let castGroupId = 1;

export function Cast() {
  let { spell, player } = game;

  if (spell.casts === 0) return;
  spell.casts--;

  player.sprite = sprites.norman_arms_up;
  clearTimeout(castAnimationTimeout);
  castAnimationTimeout = setTimeout(() => player.sprite = sprites.norman_arms_down, 500);

  let power = spell.basePower;
  let targetAngle = spell.targetAngle - (spell.shotsPerRound * spell.shotOffsetAngle / 2);
  let groupId = castGroupId++;

  for (let j = 0; j < spell.shotsPerRound; j++) {
    let projectile = Spell();
    let angle = targetAngle + j * spell.shotOffsetAngle;
    let [vx, vy] = vectorFromAngle(angle);
    let { x, y } = game.getCastingPoint();
    projectile.x = x - projectile.sprite[2] / 2;
    projectile.y = y - projectile.sprite[3] / 2;
    projectile.vx = vx * power;
    projectile.vy = vy * power;
    projectile.groupId = groupId;
    game.spawn(projectile);
    game.onCast(projectile);
  }
}

export function Resurrect() {
  if (game.ability.timer < game.ability.cooldown) {
    return;
  }

  game.ability.timer = 0;

  for (let ritual of game.rituals) {
    ritual.onResurrect?.();
  }

  let corpses = game.objects.filter(object => object.is(CORPSE));

  for (let corpse of corpses) {
    game.despawn(corpse);

    let unit = Skeleton();
    game.spawn(unit, corpse.x, 0);
    fx.resurrect(unit).burst(10).remove();

    for (let ritual of game.rituals) {
      ritual.onResurrection?.(unit);
    }
  }
}
