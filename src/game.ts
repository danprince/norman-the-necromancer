import { ParticleEmitter, Sprite, updateParticles, updateTweens } from "./engine";
import { clamp, overlaps, Point, Rectangle, removeFromArray, vectorFromAngle } from "./helpers";

declare global {
  let game: Game;
  interface Window {
    game: Game;
  }
}

export class GameObject {
  // Physics
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  mass = 0;
  bounce = 0;
  friction = 0;
  hop = 0;

  // Display
  sprite: Sprite = [0, 0, 0, 0];
  emitter: ParticleEmitter | undefined;

  // Logic
  tags = 0;
  collisionMask = 0;
  hp = 0;
  maxHp = 0;

  // Behaviours
  behaviours: Behaviour[] = [];
  updateSpeed = 0;
  updateClock = 0;

  bounds() {
    return Rectangle(this.x, this.y, this.sprite[2], this.sprite[3]);
  }

  center() {
    return Point(this.x + this.sprite[2] / 2, this.y + this.sprite[3] / 2);
  }

  update(dt: number) {
    this.onFrame(dt);

    this.updateClock -= dt;

    if (this.updateClock <= 0) {
      this.updateClock = this.updateSpeed;
      this.onUpdate();
    }

    if (this.emitter) {
      this.emitter.x = this.x;
      this.emitter.y = this.y;
    }
  }

  addBehaviour(behaviour: Partial<Behaviour>) {
    this.behaviours.push(behaviour as Behaviour);
  }

  onFrame(dt: number) {
    for (let behaviour of this.behaviours) {
      behaviour.onFrame(dt);
    }
  }

  onUpdate() {
    for (let behaviour of this.behaviours) {
      behaviour.onUpdate();
    }
  }

  onDamage(damage: Damage) {
    for (let behaviour of this.behaviours) {
      behaviour.onDamage(damage);
    }
  }

  onBounce() {
    for (let behaviour of this.behaviours) {
      behaviour.onBounce();
    }
  }

  onCollision(target: GameObject) {
    for (let behaviour of this.behaviours) {
      behaviour.onCollision(target);
    }
  }
}

export class Behaviour {
  constructor(public object: GameObject) {}
  onUpdate() {}
  onBounce() {}
  onDamage(damage: Damage) {}
  onDeath() {}
  onFrame(dt: number) {}
  onCollision(target: GameObject) {}
}

export interface Damage {
  amount: number;
}

interface Stage {
  width: number;
  height: number;
  floor: number;
  ceiling: number;
}

export interface Spell {
  targetAngle: number;
  targetRadius: number;
  targetPower: number;
  roundsPerCast: number;
  roundsDelay: number;
  shotsPerRound: number;
  shotOffsetAngle: number;
}

export interface Ability {
  cooldown: number;
  timer: number;
}

export class Game {
  stage: Stage = { width: 400, height: 200, floor: 0, ceiling: 200 };
  objects: GameObject[] = [];
  player: GameObject = undefined!;

  spell: Spell = {
    targetAngle: 0,
    targetRadius: 15,
    targetPower: 160,
    roundsDelay: 50,
    roundsPerCast: 1,
    shotsPerRound: 1,
    shotOffsetAngle: 0.3,
  };

  ability: Ability = {
    cooldown: 10_000,
    timer: 0,
  };

  constructor(player: GameObject) {
    this.player = player;
    this.spawn(player);
    window.game = this;
  }

  spawn(object: GameObject) {
    this.objects.push(object);
  }

  despawn(object: GameObject) {
    object.emitter?.remove();
    removeFromArray(this.objects, object);
  }

  update(dt: number) {
    this.updateObjects(dt);
    this.updatePhysics(dt);
    updateTweens(dt);
    updateParticles(dt);
  }

  private updateObjects(dt: number) {
    for (let object of this.objects) {
      object.update(dt);
    }
  }

  private updatePhysics(dt: number) {
    let d = dt / 1000;

    // Velocities
    for (let object of this.objects) {
      object.x += object.vx * d;
      object.y += object.vy * d;
    }

    // Bounces
    for (let object of this.objects) {
      let lower = this.stage.floor;
      let upper = this.stage.ceiling - object.sprite[3];

      if (object.y < lower || object.y > upper) {
        object.y = clamp(object.y, lower, upper);

        if (Math.abs(object.vy) >= 10) {
          object.onBounce();
        }

        object.vy *= -object.bounce;
        object.vx *= object.friction;
      }

      if (object.mass && object.y > 0) {
        object.vy -= object.mass * d;
      }
    }

    // Collisions
    for (let object of this.objects) {
      if (object.collisionMask) {
        for (let target of this.objects) {
          if (object.collisionMask & target.tags) {
            if (overlaps(object.bounds(), target.bounds())) {
              object.onCollision(target);
            }
          }
        }
      }
    }
  }

  getCastingPoint(): Point {
    let { spell, player } = this;
    let center = player.center();
    let [vx, vy] = vectorFromAngle(spell.targetAngle);
    return {
      x: center.x + vx * spell.targetRadius,
      y: center.y + vy * spell.targetRadius,
    };
  }
}
