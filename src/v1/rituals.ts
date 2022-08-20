import * as sprites from "./sprites.json";
import { BounceEvent, CastSpellEvent, on } from "./events";
import { Game, GameObject, Ritual } from "./game";
import { MiasmaCharge } from "./spells";
import { MISSILE } from "./tags";

export let Bouncing: Ritual = {
  name: "Bouncing",
  sprite: sprites.r_bounce,
  activate() {
    on(CastSpellEvent, object => object.bounce = 0.5);
  },
};

export let Farsight: Ritual = {
  name: "Farsight",
  sprite: sprites.r_farsighted,
  activate() {
    on(CastSpellEvent, object => {
      object.vx *= 1.5;
      object.vy *= 1.5;
    });
  },
};

export let Explosive: Ritual = {
  name: "Explosive",
  sprite: sprites.r_farsighted,
  activate() {
    game.spell.cast = (x, y, angle) => MiasmaCharge(x, y, angle, 160);
  },
};

export let TripleShot: Ritual = {
  name: "Triple Shot",
  sprite: sprites.r_tripleshot,
  activate() {
    game.spell.roundsPerCast = 3;
  },
};

export let BounceAndSplit: Ritual = {
  name: "Bounce and Split",
  sprite: sprites.r_tripleshot,
  activate() {
    let projectiles = new WeakSet();
    on(CastSpellEvent, object => projectiles.add(object));
    on(BounceEvent, object => {
      if (projectiles.has(object)) {
        let clone = object.clone();
        clone.y = 100;
        setTimeout(() => game.spawn(clone), 100);
      }
    });
  },
};
