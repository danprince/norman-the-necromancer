import * as fx from "./fx";
import * as sprites from "./sprites.json";
import { Bleeding, Damaging, DespawnTimer, Frozen, HitStreak, LightningStrike, Seeking } from "./behaviours";
import { tween } from "./engine";
import { Behaviour, GameObject, RARE, Ritual } from "./game";
import { DEG_180, randomFloat, randomInt } from "./helpers";
import { SkeletonLord, Spell } from "./objects";
import { CORPSE, LIVING } from "./tags";
import { shop } from "./shop";

// Ritual tags
const NONE = 0;
const BOUNCING = 1 << 0;
const SPLITTING = 1 << 1;
const EXPLOSIVE = 1 << 2;
const HOMING = 1 << 3;
const WARDSTONES = 1 << 4;
const CASTING_RATE = 1 << 5;
const CURSE = 1 << 6;

export let Streak: Ritual = {
  tags: NONE,
  name: "Streak",
  description: "",
  onCast: spell => spell.addBehaviour(new HitStreak(spell)),
};

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

export let Doubleshot: Ritual = {
  tags: SPLITTING,
  exclusiveTags: SPLITTING,
  rarity: RARE,
  name: "Doubleshot",
  description: "Cast 2 spells",
  onActive() {
    game.spell.shotsPerRound = 2;
  },
}

export let Hunter: Ritual = {
  tags: HOMING,
  rarity: RARE,
  name: "Hunter",
  description: "Spells seek targets",
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

class KnockbackSpell extends Behaviour {
  onCollision(target: GameObject): void {
    // Knockback shouldn't work on the king
    if (target.mass < 1000) {
      tween(target.x, target.x + 16, 200, x => target.x = x);
    }

    // Throw objects into the air
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
  description: "Spells knock backwards",
  onCast(spell) {
    spell.addBehaviour(new KnockbackSpell(spell));
  },
};

export let Ceiling: Ritual = {
  tags: NONE,
  requiredTags: BOUNCING,
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
      p1.x = p2.x = p0.x;
      p1.y = p2.y = p0.y;
      p1.vx = p2.vx = p0.vx;
      p1.vy = p2.vy = p0.vy;
      p1.vx -= 20;
      p2.vx += 20;
      p1.groupId = p2.groupId = p0.groupId;
      game.onCast(p1, true);
      game.onCast(p2, true);
      game.spawn(p1);
      game.spawn(p2);
    }
  }
}

export let Rain: Ritual = {
  tags: SPLITTING,
  exclusiveTags: SPLITTING,
  rarity: RARE,
  name: "Rain",
  description: "Spells split when they drop",
  recursive: false,
  onCast(spell) {
    spell.addBehaviour(new RainSpell(spell));
  },
};

export let Drunkard: Ritual = {
  tags: NONE,
  name: "Drunkard",
  description: "2x damage, wobbly aim",
  onCast(spell) {
    spell.vx += randomInt(100) - 50;
    spell.vy += randomInt(100) - 50;
    spell.getBehaviour(Damaging)!.amount *= 2;
  },
};

export let Seer: Ritual = {
  tags: NONE,
  name: "Seer",
  description: "Spells pass through the dead",
  onCast(spell) {
    spell.collisionMask = LIVING;
  }
};

export let Tearstone: Ritual = {
  tags: NONE,
  name: "Tearstone",
  description: "2x damage when < half HP",
  onCast(spell) {
    if (game.player.hp < game.player.maxHp / 2) {
      spell.getBehaviour(Damaging)!.amount *= 3;
    }
  }
};

export let Impatience: Ritual = {
  tags: NONE,
  name: "Impatience",
  description: "Resurrection recharges 2x faster",
  onActive() {
    game.ability.cooldown /= 2;
  }
};

export let Bleed: Ritual = {
  tags: CURSE,
  name: "Bleed",
  description: "Inflicts bleed on hits",
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
    let inflict = spell.addBehaviour();
    inflict.onCollision = target => {
      target.addBehaviour(new Bleeding(target));
    };
  }
};

export let Allegiance: Ritual = {
  tags: NONE,
  name: "Allegiance",
  description: "Summon your honour guard after resurrections",
  onResurrect() {
    for (let i = 0; i < 3; i++) {
      let unit = SkeletonLord();
      unit.updateSpeed = 200;
      game.spawn(unit, i * -15, 0);
    }
  },
};

export let Salvage: Ritual = {
  tags: NONE,
  name: "Salvage",
  description: "Corpses become souls at the end of levels",
  onLevelEnd() {
    let corpses = game.objects.filter(object => object.is(CORPSE));

    for (let corpse of corpses) {
      let emitter = fx.bones().extend({
        ...corpse.center(),
        variants: [[sprites.p_green_skull]],
        duration: [100, 1000],
      });
      emitter.burst(5);
      emitter.remove();
      game.despawn(corpse);
      game.addSouls(5);
    }
  },
};

export let Studious: Ritual = {
  tags: NONE,
  rarity: RARE,
  name: "Studious",
  description: "Rituals are 50% cheaper",
  onShopEnter() {
    for (let item of shop.items) {
      item.cost = item.cost / 2 | 0;
    }
  },
};

export let Electrodynamics: Ritual = {
  tags: NONE,
  rarity: RARE,
  name: "Electrodynamics",
  description: "Lightning strikes after hits",
  onCast(spell) {
    spell.addBehaviour(new LightningStrike(spell));
  },
};

export let Chilly: Ritual = {
  tags: NONE,
  name: "Chilly",
  description: "10% chance to freeze enemies",
  onCast(spell) {
    if (randomFloat() <= 0.1) {
      spell.emitter!.variants = [[sprites.p_ice_1, sprites.p_ice_2, sprites.p_ice_3]];
      spell.sprite = sprites.p_skull;
      spell.getBehaviour(Damaging)!.amount = 0;
      // Frozen has to be added before other behaviours, so that it can prevent
      // them from updating
      spell.addBehaviour().onCollision = target => {
        // King can't be frozen
        if (target.mass < 1000) {
          target.addBehaviour(new Frozen(target), 0);
        }
      };
    }
  },
};

export let Giants: Ritual = {
  tags: NONE,
  name: "Giants",
  description: "20% chance to resurrect giant skeletons",
  onResurrection(object) {
    if (randomFloat() < 0.2) {
      game.despawn(object);
      game.spawn(SkeletonLord(), object.x, object.y);
    }
  },
};

export let Avarice: Ritual = {
  tags: NONE,
  name: "Avarice",
  description: "+1 soul for each corpse you resurrect",
  onResurrection() {
    game.addSouls(1);
  },
};

export let Hardened: Ritual = {
  tags: NONE,
  name: "Hardened",
  description: "Undead have +1 HP*",
  onResurrection(object) {
    object.hp = object.maxHp += 1;
  }
};
