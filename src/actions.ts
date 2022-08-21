import * as sprites from "./sprites.json";
import * as fx from "./fx";
import { Damage, GameObject } from "./game";
import { clamp, vectorFromAngle } from "./helpers";
import { Corpse, Projectile, Skeleton } from "./objects";
import { CORPSE, LIVING } from "./tags";

export function Damage(object: GameObject, amount: number) {
  let damage: Damage = { amount };
  object.onDamage(damage);
  object.hp = clamp(object.hp - damage.amount, 0, object.maxHp);
  if (!object.hp) Die(object);
}

export function Die(object: GameObject) {
  game.despawn(object);

  if (object.tags & LIVING) {
    fx
      .bones()
      .extend({ x: object.x, y: object.y })
      .burst(2 + Math.random() * 5)
      .remove();

    if (Math.random() > 0.5) {
      game.spawn(Corpse(object.x, 10));
    }
  }
}

let castAnimationTimeout = 0;

export function Cast() {
  let { spell } = game;

  game.player.sprite = sprites.norman_arms_up;
  clearTimeout(castAnimationTimeout);
  castAnimationTimeout = setTimeout(() => game.player.sprite = sprites.norman_arms_down, 500);

  for (let i = 0; i < spell.roundsPerCast; i++) {
    setTimeout(() => {
      for (let j = 0; j < spell.shotsPerRound; j++) {
        let projectile = Projectile();
        let [vx, vy] = vectorFromAngle(spell.targetAngle);
        let { x, y } = game.getCastingPoint();
        projectile.sprite = sprites.p_green_skull;
        projectile.x = x - projectile.sprite[2] / 2;
        projectile.y = y - projectile.sprite[3] / 2;
        projectile.vx = vx * spell.targetPower;
        projectile.vy = vy * spell.targetPower;
        game.spawn(projectile);
      }
    }, i * spell.roundsDelay);
  }
}

export function Resurrect() {
  for (let object of game.objects) {
    if (object.tags & CORPSE) {
      game.despawn(object);
      let unit = Skeleton(object.x, 0);
      fx.cloud(unit.bounds(), [
        [sprites.p_green_1, sprites.p_green_2, sprites.p_green_3],
        [sprites.p_green_2, sprites.p_green_3, sprites.p_green_4],
        [sprites.p_green_1, sprites.p_green_3, sprites.p_green_5],
      ]).burst(10).remove();
      game.spawn(unit);
    }
  }
}
