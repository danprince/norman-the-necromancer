import * as sprites from "./sprites.json";
import { GameObject, Spell } from "./game";
import { damage } from "./actions";
import { GreenTrail as greenTrail } from "./fx";
import { MOBILE, MISSILE } from "./tags";

export function ScreechingSkull(x: number, y: number, angle: number, speed: number) {
  let object = new GameObject();
  object.sprite = sprites.p_green_skull;
  object.x = x;
  object.y = y;
  object.vx = Math.sin(angle) * speed - 4;
  object.vy = Math.cos(angle) * speed + 4;
  object.tags = MISSILE;
  object.collisionTags = MOBILE;
  object.gravity = 100;
  object.bounce = 0.5;
  object.friction = 0.5;
  object.ttl = 3000;

  object.onCollision = target => {
    game.despawn(object);
    damage(target, 1);
  };

  object.emitter = greenTrail();
  object.emitter.start();
  return object;
}

export class Skullduggery extends Spell {
  name = "Skullduggery";
  sprite = sprites.spell_skullduggery;
  override maxCasts = 5;
  override casts = 5;
  override reloadCooldown = 1000;
  override onCast(x: number, y: number) {
    game.spawn(ScreechingSkull(x, y, game.targetAngle, 160));
  }
}

export function MiasmaCharge(x: number, y: number, angle: number, speed: number) {
  let object = new GameObject();
  object.sprite = sprites.miasma;
  object.x = x;
  object.y = y;
  object.vx = Math.sin(angle) * speed;
  object.vy = Math.cos(angle) * speed;
  object.tags = MISSILE;
  object.collisionTags = MOBILE;
  object.gravity = 100;
  object.bounce = 0;
  object.friction = 0.9;

  let emitter = greenTrail();
  emitter.options.frequency = 0.1;
  emitter.start();
  object.emitter = emitter;

  object.onBounce = object.onCollision = () => {
    let emitter = greenTrail();
    emitter.x = object.x;
    emitter.y = object.y;
    emitter.options.angle = [0, Math.PI * 2];
    emitter.options.speed = [50, 200];
    emitter.options.life = [200, 400];
    emitter.options.bounce = [0, 0.5];
    emitter.burst(200);
    emitter.stopThenRemove();
    game.despawn(object);

    let p1 = object.center();
    for (let other of game.objects) {
      if (other.tags & MOBILE) {
        let p2 = other.center();
        let dist = Math.hypot(p1.x-p2.x, p1.y-p2.y);
        if (dist < 50) damage(other, 3);
      }
    }
  };

  return object;
}

export class Miasma extends Spell {
  name = "Miasma";
  sprite = sprites.spell_skullduggery;
  override maxCasts = 1;
  override casts = 1;
  override reloadCooldown = 2000;
  override onCast(x: number, y: number) {
    game.spawn(MiasmaCharge(x, y, game.targetAngle, 180));
  }
}
