import { Damage } from "./actions";
import { Damaging } from "./behaviours";
import { tween } from "./engine";
import * as fx from "./fx";
import { Behaviour, GameObject, Ritual } from "./game";
import { angleBetweenPoints, DEG_360, distance, vectorFromAngle, vectorToAngle } from "./helpers";
import { Chariot, Projectile, WardStone } from "./objects";
import { screenshake } from "./renderer";
import { LIVING, MOBILE, UNDEAD } from "./tags";

// Ritual tags
const NONE = 0;
const BOUNCING = 1 << 0;
const SPLITTING = 1 << 1;
const EXPLOSIVE = 1 << 2;
const HOMING = 1 << 3;
const MAX_CASTS = 1 << 4;
const CASTING_RATE = 1 << 5;

export let Bouncing: Ritual = {
  tags: BOUNCING,
  name: "Bouncing",
  description: "Spells bounce",
  onCast(projectile) {
    projectile.bounce = 0.5;
  },
};

class ProjectileSplitOnBounce extends Behaviour {
  onBounce(): void {
    let p1 = this.object;
    let p2 = Projectile();
    p2.x = p1.x;
    p2.y = p1.y;
    p2.vx = p1.vy;
    p2.vy = p1.vx * 2;
    game.spawn(p2);
  }
}

export let SplitOnBounce: Ritual = {
  tags: BOUNCING,
  requiredTags: BOUNCING,
  exclusiveTags: SPLITTING,
  name: "Split on Bounce",
  description: "Spells split after bouncing",
  onCast(projectile) {
    projectile.addBehaviour(new ProjectileSplitOnBounce(projectile));
  },
};

class ProjectileExplode extends Behaviour {
  onBounce = this.explode;
  onCollision = this.explode;

  explode() {
    let proj = this.object;
    game.despawn(proj);

    for (let object of game.objects) {
      if (object.tags & LIVING) {
        if (distance(proj, object) < 50) {
          Damage(object, 1);
        }
      }
    }

    screenshake(50);
    fx.particles()
      .extend({
        ...proj.center(),
        velocity: [50, 100],
        angle: [0, DEG_360],
        duration: [200, 500],
      })
      .burst(200)
      .remove();
  }
}

export let Explosive: Ritual = {
  tags: EXPLOSIVE,
  exclusiveTags: BOUNCING,
  name: "Explosive",
  description: "Spells explode on impact",
  onCast(projectile) {
    projectile.addBehaviour(new ProjectileExplode(projectile));
  },
}

export let Splitshot: Ritual = {
  tags: SPLITTING,
  exclusiveTags: SPLITTING,
  name: "Splitshot",
  description: "Shot 3 projectiles",
  onActive() {
    game.spell.shotsPerRound = 3;
  },
}

class HomingProjectile extends Behaviour {
  onFrame(): void {
    let projectile = this.object;
    let target: GameObject | undefined;
    let minDist = 100;

    for (let object of game.objects) {
      if (object.tags & LIVING) {
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

export let Homing: Ritual = {
  tags: HOMING,
  name: "Homing",
  description: "Spells seek living enemies",
  onCast(projectile) {
    projectile.addBehaviour(new HomingProjectile(projectile));
  },
}

export let Weightless: Ritual = {
  tags: NONE,
  name: "Weightless",
  description: "Spells are not affected by gravity",
  onCast(spell) {
    spell.mass = 0;
    spell.friction = 0;
    spell.bounce = 1;
  },
}

export let Piercing: Ritual = {
  tags: NONE,
  name: "Piercing",
  // TODO: Too powerful, maybe percentage chance instead? Or maybe getting weaker?
  description: "Spells pass through enemies",
  onCast(spell) {
    spell.despawnOnCollision = false;
  },
}

class KnockbackSpell extends Behaviour {
  onCollision(target: GameObject): void {
    tween(target.x, target.x + 16, 200, x => target.x = x);
  }
}

export let Knockback: Ritual = {
  tags: NONE,
  name: "Knockback",
  description: "Spells knock enemies backwards",
  onCast(spell) {
    spell.addBehaviour(new KnockbackSpell(spell));
  },
};

export let Ceiling: Ritual = {
  tags: NONE,
  name: "Ceiling",
  description: "Adds a ceiling",
  onActive() {
    game.stage.ceiling = 48;
  },
};

class RicochetSpell extends Behaviour {
  onBounce(): void {
    let damaging = this.object.getBehaviour(Damaging);
    if (damaging) {
      damaging.amount += 1;
      if (this.object.emitter) {
        this.object.emitter.frequency = damaging.amount;
      }
    }
  }
}

export let Ricochet: Ritual = {
  tags: NONE,
  requiredTags: BOUNCING,
  name: "Ricochet",
  description: "Spells increase +1 damage each time they bounce, but direct hits do 0 damage",
  onCast(spell) {
    let damaging = spell.getBehaviour(Damaging);
    if (damaging) damaging.amount = 0;
    spell.addBehaviour(new RicochetSpell(spell));
    if (spell.emitter) spell.emitter.frequency = 0;
  },
};

class RainSpell extends Behaviour {
  split = false;
  onFrame(): void {
    if (!this.split && this.object.vy < 0) {
      this.split = true;
      let p0 = this.object;
      let p1 = Projectile();
      let p2 = Projectile();
      p1.x = p2.x = p0.x;
      p1.y = p2.y = p0.y;
      p1.vx = p2.vx = p0.vx;
      p1.vy = p2.vy = p0.vy;
      p1.vx -= 20;
      p2.vx += 20;
      game.spawn(p1);
      game.spawn(p2);
    }
  }
}

export let Rain: Ritual = {
  tags: SPLITTING,
  exclusiveTags: SPLITTING,
  name: "Rain",
  description: "Spells split when they start to drop",
  onCast(spell) {
    spell.addBehaviour(new RainSpell(spell));
  },
};

export let Drunkard: Ritual = {
  tags: NONE,
  name: "Drunkard",
  description: "Do 2x damage, but your aim is wobbly",
  onCast(spell) {
    spell.vx += Math.random() * 100 - 50;
    spell.vy += Math.random() * 100 - 50;
    spell.getBehaviour(Damaging)!.amount *= 2;
  },
};

export let SkeletalRiders: Ritual = {
  tags: NONE,
  name: "Skeletal Riders",
  description: "Create a bone chariot each time you resurrect",
  onResurrect() {
    game.spawn(Chariot());
  }
};

export let Pact: Ritual = {
  tags: NONE,
  name: "Pact",
  description: "Resurrections heal undead allies",
  onResurrect() {
    for (let object of game.objects) {
      if (object.tags & UNDEAD) {
        Damage(object, object.hp - object.maxHp);
      }
    }
  }
};

export let Seance: Ritual = {
  tags: NONE,
  name: "Séance",
  description: "Your spells pass through the undead",
  onCast(spell) {
    spell.collisionMask = LIVING;
  }
};

export let Broken: Ritual = {
  tags: NONE,
  name: "Broken",
  description: "Deal 3x damage, but max hp is reduced to 1",
  onActive() {
    game.player.hp = game.player.maxHp = 1;
  },
  onCast(spell) {
    spell.getBehaviour(Damaging)!.amount *= 3;
  }
};

export let Meteoric: Ritual = {
  tags: NONE,
  name: "Meteoric",
  description: "Wardstones drop from above on resurrection",
  onResurrect() {
    let object = WardStone();
    object.x = Math.random() * game.stage.width;
    object.y = game.stage.ceiling;
    game.spawn(object);
  }
};

export let Pentagram: Ritual = {
  tags: MAX_CASTS,
  name: "Pentagram",
  description: "Increase casting capacity to 5x",
  onActive() {
    game.spell.maxCasts = 5;
  }
};

export let Triggerfinger: Ritual = {
  tags: CASTING_RATE,
  name: "Triggerfinger",
  description: "Casts recharge 2x as fast",
  onActive() {
    game.spell.castRechargeRate /= 2;
  }
};
