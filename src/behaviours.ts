import { Damage } from "./actions";
import { tween } from "./engine";
import { Behaviour, GameObject } from "./game";
import { screenshake } from "./renderer";

export class Attack extends Behaviour {
  constructor(object: GameObject) {
    super(object);
  }

  onCollision(target: GameObject): void {
    Damage(target, this.object.hp);
    Damage(this.object, this.object.hp);
  }
}

export class DespawnTimer extends Behaviour {
  elapsed = 0;

  constructor(object: GameObject, readonly duration: number) {
    super(object);
  }

  onFrame(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
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

export class VelocityTrail extends Behaviour {
  onFrame() {
    let energy = Math.hypot(this.object.vx, this.object.vy) * 1.5;
    this.object.emitter!.frequency = energy / 100;
  }
}
