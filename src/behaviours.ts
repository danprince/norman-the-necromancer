import * as fx from "./fx";
import * as sprites from "./sprites.json";
import { Damage } from "./actions";
import { tween } from "./engine";
import { Behaviour, Game, GameObject } from "./game";
import { screenshake } from "./renderer";
import type { Damage as Dmg } from "./game";
import { distance, vectorToAngle, angleBetweenPoints, vectorFromAngle } from "./helpers";

export class Attack extends Behaviour {
  onCollision(target: GameObject): void {
    let dealDamage = this.object.hp;
    let takeDamage = target.hp;
    Damage(target, dealDamage, this.object);
    Damage(this.object, takeDamage, target);
  }
}

export class DespawnTimer extends Behaviour {
  elapsed = 0;

  constructor(object: GameObject, readonly duration: number) {
    super(object);
  }

  onFrame(dt: number): void {
    if ((this.elapsed += dt) >= this.duration) {
      game.despawn(this.object);
    }
  }
}

export class March extends Behaviour {
  step: number;

  constructor(object: GameObject, step: number) {
    super(object);
    this.step = step;
  }

  onUpdate(): void {
    // Can't march if you're flying
    if (this.object.y > 0) return;

    // Animate the march with a little hop
    tween(this.object.x, this.object.x + this.step, 200, (x, t) => {
      this.object.x = x;
      this.object.hop = Math.sin(t * Math.PI) * 2;
      if (t === 1 && this.object.mass >= 100) screenshake(50);
    });

    // Despawn units that march offscreen
    if (this.object.x < 0 || this.object.x > game.stage.width) {
      game.despawn(this.object);
    }
  }
}

export class Damaging extends Behaviour {
  amount = 1;
  onCollision(target: GameObject): void {
    Damage(target, this.amount, this.object);
  }
}

export class Bleeding extends Behaviour {
  override turns = 3;

  emitter = fx.cloud({ x: 0, y: 0, w: 0, h: 0 }, [
    [sprites.health_orb, sprites.health_pip],
    [sprites.health_pip]
  ]).extend({
    mass: [10, 30],
    velocity: [10, 30],
    frequency: 0,
  });

  onUpdate(): boolean | void {
    this.emitter.extend(this.object.center());
    this.emitter?.burst(1);
    Damage(this.object, 1, this.object);
  }
}

export class Enraged extends Behaviour {
  emitter = fx.cloud({ x: 0, y: 0, w: 0, h: 0 }, [
    [sprites.health_orb, sprites.health_pip],
    [sprites.health_pip]
  ]).extend({
    mass: [10, 30],
    velocity: [10, 30],
    frequency: 0,
  });

  constructor(object: GameObject, public mask: number) {
    super(object);
  }

  onDamage(damage: Dmg): void {
    if (damage.dealer && damage.dealer.is(this.mask)) {
      Damage(this.object, -damage.amount, this.object);
      damage.amount = 0;
      this.emitter.extend(this.object.bounds()).burst(4);
    }
  }
}

export class Seeking extends Behaviour {
  onFrame(): void {
    let projectile = this.object;
    let target: GameObject | undefined;
    let minDist = 100;

    for (let object of game.objects) {
      if (object.is(this.object.collisionMask)) {
        let dist = distance(projectile, object);
        if (dist < minDist) {
          target = object;
          minDist = dist;
        }
      }
    }

    if (target) {
      let currentAngle = vectorToAngle(projectile.vx, projectile.vy);
      let desiredAngle = angleBetweenPoints(projectile, target);
      let angle = currentAngle + (desiredAngle - currentAngle) / 4;
      let magnitude = Math.hypot(projectile.vx, projectile.vy);
      let [vx, vy] = vectorFromAngle(angle);
      projectile.vx = vx * magnitude;
      projectile.vy = vy * magnitude;
    }
  }
}

export class Summon extends Behaviour {
  private summonTimer = 0;
  public summonCounter = 0;

  constructor(
    object: GameObject,
    private create: () => GameObject,
    private summonSpeed: number,
  ) {
    super(object);
  }

  onSummon(object: GameObject) {}

  onFrame(dt: number): void {
    if ((this.summonTimer += dt) > this.summonSpeed) {
      this.summonTimer = 0;
      this.summonCounter++;
      let object = this.create();
      game.spawn(object, this.object.x, this.object.y);
      this.onSummon(object);
    }
  }
}
