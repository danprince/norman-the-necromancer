import * as fx from "./fx";
import * as sprites from "./sprites.json";
import { Damage } from "./actions";
import { tween } from "./engine";
import { Behaviour, GameObject } from "./game";
import { screenshake } from "./renderer";

export class Hex extends Behaviour {
  private hexSpeed = 3000;
  private hexTimer = 0;

  constructor(object: GameObject) {
    super(object);
    object.emitter = fx.cloud({ x: 0, y: 0, w: 0, h: 0 }, [
      [sprites.p_purple_1, sprites.p_purple_2, sprites.p_purple_3],
      [sprites.p_purple_2, sprites.p_purple_3],
    ]).extend({ frequency: 0.05 }).start();
  }

  onFrame(dt: number): void {
    if ((this.hexTimer += dt) < this.hexSpeed) return;

    this.hexTimer = 0;
    Object.assign(this.object.emitter!, this.object.bounds());
    this.object.emitter!.burst(20);

    // Hex can't kill
    if (this.object.hp > 1) {
      Damage(this.object, 1);
    }
  }
}

export class Attack extends Behaviour {
  constructor(object: GameObject) {
    super(object);
  }

  onCollision(target: GameObject): void {
    let dealDamage = this.object.hp;
    let takeDamage = target.hp;
    Damage(target, dealDamage);
    Damage(this.object, takeDamage);
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

  onCollision(target: GameObject): void {
    Damage(target, this.object.hp);
    Damage(this.object, this.object.hp);
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
    Damage(target, this.amount);
  }
}
