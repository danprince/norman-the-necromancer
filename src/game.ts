import { Rect, Sprite, updateTweens } from "./engine";
import { Emitter, updateParticles } from "./particles";

const FLOOR_LEVEL = 0;
const CEILING_LEVEL = 200;

export class GameObject {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  gravity = 0;
  sprite: Sprite = [0, 0, 0, 0];
  tags: number = 0;
  collisionTags: number = 0;
  hp = 0;
  maxHp = 0;
  emitter?: Emitter;
  clock = 0;
  speed = 1000;
  bounce = 0;
  friction = 0;
  ttl?: number;
  behaviours: Behaviour[] = [];

  bounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      w: this.sprite[2],
      h: this.sprite[3],
    };
  }

  onCollision(object: GameObject) {}
  onBounce() {}
  onUpdate() {}

  center() {
    return {
      x: this.x + this.sprite[2] / 2,
      y: this.y + this.sprite[3] / 2,
    };
  }

  update(dt: number) {
    this.onUpdate();

    if (this.clock < this.speed) {
      this.clock += dt;
    } else {
      this.clock = 0;

      for (let behaviour of this.behaviours) {
        let acted = behaviour.update();
        if (acted) break;
      }
    }
  }

  addBehaviour(behaviour: Behaviour) {
    behaviour.owner = this;
    this.behaviours.unshift(behaviour);
  }

  intersects(object: GameObject): boolean {
    let a = this;
    let b = object;
    return (
      a.x < b.x + b.sprite[2] &&
      a.y < b.y + b.sprite[3] &&
      a.x + a.sprite[2] > b.x &&
      a.y + a.sprite[3] > b.y
    );
  }
}

export class Wave {
  spawnCounter = 0;
  spawnTimer = 0;
  spawnCooldown = 0;
  spawnChance = 1;

  spawn() {}

  update(dt: number) {
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnCooldown;
      if (Math.random() <= this.spawnChance) {
        this.spawn();
        this.spawnCounter -= 1;
      }
    }
  }
  done() {}
}

export abstract class Ability {
  abstract name: string;
  abstract sprite: Sprite;
  abstract cooldown: number;
  timer: number = 0;
  protected abstract onUse(): void;

  use() {
    if (this.timer >= this.cooldown) {
      this.timer = 0;
      this.onUse();
    }
  }

  update(dt: number) {
    if (this.timer < this.cooldown) {
      this.timer += dt;
    }
  }
}

export abstract class Behaviour {
  owner: GameObject = null!;
  timer: number = 0;
  abstract cooldown: number;
  protected abstract onUse(): void;

  update(): boolean {
    this.timer += 1;
    let act = this.timer >= this.cooldown;
    if (act) {
      this.timer = 0;
      this.onUse();
    }
    return act;
  }
}

export abstract class Spell {
  abstract name: string;
  abstract sprite: Sprite;
  casts: number = 1;
  maxCasts: number = 1;
  reloadCooldown: number = 500;
  reloadTimer: number = 0;
  rateOfFire: number = 200;
  fireTimer: number = 0;

  abstract onCast(x: number, y: number): void;

  cast(x: number, y: number) {
    if (this.fireTimer > 0) return;
    this.casts -= 1;
    this.reloadTimer = this.reloadCooldown;
    this.fireTimer = this.rateOfFire;
    this.onCast(x, y);
  }

  canCast() {
    return this.casts > 0;
  }

  update(dt: number) {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    if (this.casts < this.maxCasts) {
      this.reloadTimer -= dt;
    }

    if (this.reloadTimer <= 0) {
      this.casts = Math.min(this.casts + 1, this.maxCasts);
      this.reloadTimer = this.reloadCooldown;
    }
  }
}

export class Game {
  stageWidth = 400;
  stageHeight = 200;

  objects: GameObject[] = [];
  player: GameObject;
  wave: Wave;
  spell: Spell;
  ability: Ability;

  souls: number = 0;

  targetAngle: number = 0;
  targetRadius: number = 15;
  targetPower: number = 0;

  constructor(player: GameObject, spell: Spell, ability: Ability, wave: Wave) {
    this.player = player;
    this.wave = wave;
    this.spell = spell;
    this.ability = ability;
    this.spawn(player);
  }

  update(dt: number) {
    this.wave.update(dt);
    this.spell.update(dt);
    this.ability.update(dt);
    this.updateObjects(dt);
    this.updatePhysics(dt);
    updateParticles(dt);
    updateTweens(dt);
  }

  updatePhysics(dt: number) {
    let t = dt / 1000;

    for (let object of this.objects) {
      object.x += object.vx * t;
      object.y += object.vy * t;

      if (object.y <= FLOOR_LEVEL || object.y + object.sprite[3] >= CEILING_LEVEL + 1) {
        object.y = Math.min(CEILING_LEVEL, Math.max(FLOOR_LEVEL, object.y));
        object.vy *= -object.bounce;
        object.vx *= object.friction;
        object.onBounce();
      }

      if (object.gravity) {
        object.vy -= object.gravity * t;
      }
    }
  }

  updateObjects(dt: number) {
    for (let object of this.objects) {
      object.update(dt);

      if (object.ttl) {
        object.ttl -= dt;
        if (object.ttl < 0) {
          this.despawn(object);
        }
      }
    }

    for (let object of this.objects) {
      if (object.emitter) {
        object.emitter.x = object.x;
        object.emitter.y = object.y;
      }
    }

    for (let object of this.objects) {
      if (object.collisionTags) {
        for (let other of this.objects) {
          if (object.collisionTags & other.tags) {
            if (object.intersects(other)) {
              object.onCollision?.(other);
            }
          }
        }
      }
    }
  }

  spawn(object: GameObject) {
    this.objects.push(object);
  }

  despawn(object: GameObject) {
    object.emitter?.stopThenRemove();
    this.objects.splice(this.objects.indexOf(object), 1);
  }
}
