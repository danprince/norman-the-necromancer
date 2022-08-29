import { Damage } from "./actions";
import { Bleeding, Damaging, DespawnTimer, Seeking } from "./behaviours";
import { tween } from "./engine";
import * as fx from "./fx";
import * as sprites from "./sprites.json";
import { Behaviour, Game, GameObject, Ritual } from "./game";
import { angleBetweenPoints, clamp, DEG_180, DEG_360, distance, randomInt, vectorFromAngle, vectorToAngle } from "./helpers";
import { Chariot, Spell, WardStone } from "./objects";
import { screenshake } from "./renderer";
import { LIVING, MOBILE, UNDEAD } from "./tags";

/*
- Every nth shot
- Power shot
- Casting Modifiers
  - Increased casting capacity
  - Increased casting charge speed
  - One cast creates 3 spells
- Spell Modifiers
  - Drunk: Random aim but 2x damage
  - Straight: Spells do not drop
  - Homing: Spells seek enemies
  - Knockback: Enemies are knocked back and stunned
  - Piercing: Spells pass through enemies
  - Explosive: Spells explode on impact
    - Craters: Explosion size determined by downward velocity
  - Bouncy: Spells bounce on surfaces
    - Spells split on bounce
- Corpses
  - % chance on projectile bounce
  - % chance on kill
  - % chance on direct hit
- Game changers
  - Corridor: Ceiling
  - Forsaken: 1hp, 3x damage
- Sustain
  - One-off increase to max HP
  - Small chance to regain HP on kill
- Curses
  - Stun: Inactive for 3 seconds
  - Bleed: Lose 1hp every 3 turns
  - Doom: Guaranteed to leave a corpse
- Wardstones
- Souls
- Resurrections:
  - 10% chance to create skeleton lord
*/

// Ritual tags
const NONE = 0;
const BOUNCING = 1 << 0;
const SPLITTING = 1 << 1;
const EXPLOSIVE = 1 << 2;
const HOMING = 1 << 3;
const MAX_CASTS = 1 << 4;
const CASTING_RATE = 1 << 5;
const CURSE = 1 << 6;

export let Bouncing: Ritual = {
  tags: BOUNCING,
  name: "Bouncing",
  description: "Spells bounce",
  onCast(spell) {
    spell.addBehaviour(new DespawnTimer(spell, 3000));
    spell.despawnOnBounce = false;
    spell.bounce = 0.5;
  },
};

class ProjectileSplitOnBounce extends Behaviour {
  onBounce(): void {
    let p1 = this.object;
    let p2 = Spell();
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
    let spell = this.object;
    game.despawn(spell);

    for (let object of game.objects) {
      if (object.is(this.object.collisionMask)) {
        if (distance(spell, object) < 50) {
          Damage(object, 1, spell);
        }
      }
    }

    screenshake(50);
    fx.trail()
      .extend({
        ...spell.center(),
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
  depth: Infinity,
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

export let Homing: Ritual = {
  tags: HOMING,
  name: "Homing",
  description: "Spells seek living enemies",
  onCast(projectile) {
    projectile.addBehaviour(new Seeking(projectile));
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
    //target.addBehaviour(new Stunned(target));

    // Knock objects backwards
    //for (let object of game.objects) {
    //  if (this.object.collisionMask & object.tags) {
    //    let dist = distance(this.object, object);
    //    let scale = 1 - clamp(dist / 50, 0, 1);
    //    let [vx] = vectorFromAngle(angleBetweenPoints(this.object, object));
    //    object.vx = vx * 50 * scale;
    //    object.vy = 100 * scale;
    //  }
    //}
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

class RainSpell extends Behaviour {
  split = false;
  onFrame(): void {
    if (!this.split && this.object.vy < 0) {
      this.split = true;
      let p0 = this.object;
      let p1 = Spell();
      let p2 = Spell();
      game.onCast(p1, 1);
      game.onCast(p2, 1);
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
    spell.vx += randomInt(100) - 50;
    spell.vy += randomInt(100) - 50;
    spell.getBehaviour(Damaging)!.amount *= 2;
  },
};

export let Riders: Ritual = {
  tags: NONE,
  name: "Riders",
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
      if (object.is(UNDEAD)) {
        Damage(object, object.hp - object.maxHp);
      }
    }
  }
};

export let Seance: Ritual = {
  tags: NONE,
  name: "Seance",
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

export let Triggerfinger: Ritual = {
  tags: CASTING_RATE,
  name: "Triggerfinger",
  description: "Casts recharge 2x faster",
  onActive() {
    game.spell.castRechargeRate /= 2;
  }
};

export let Bleed: Ritual = {
  tags: CURSE,
  name: "Bleed",
  description: "Inflicts bleed on targets",
  onCast(spell: GameObject) {
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
    let inflictBleed = new Behaviour(spell);
    inflictBleed.onCollision = target => {
      target.addBehaviour(new Bleeding(target));
    };
    spell.addBehaviour(inflictBleed);
  }
};
