import { init } from "./engine";
import { cast, damage, useAbility } from "./actions";
import { Game, GameObject, Wave } from "./game";
import { render } from "./renderer";
import { Archer, Paladin, Priest, Villager } from "./units";
import { Miasma, Skullduggery } from "./spells";
import * as sprites from "./sprites.json";
import { MOBILE, PLAYER } from "./tags";
import { Resurrect } from "./abilities";
import { randomElement } from "./helpers";

declare global {
  const game: Game;
}

let wave = new Wave();
wave.spawnCounter = 25;
wave.spawnChance = 0.2;
wave.spawnCooldown = 1000;
wave.spawn = () => {
  if (Math.random() > 0.9) {
    game.spawn(Paladin());
  } else if (Math.random() > 0.8) {
    game.spawn(Priest());
  } else if (Math.random() > 0.7) {
    game.spawn(Archer());
  } else {
    game.spawn(Villager());
  }
};

let player = new GameObject();
player.hp = player.maxHp = 5;
player.sprite = sprites.norman_arms_down;
player.tags = PLAYER;
player.collisionTags = MOBILE;
player.onCollision = unit => {
  damage(player, 1);
  damage(unit, 5);
  if (player.hp <= 0) {
    window.location = window.location;
  }
}

(window as any).game = new Game(
  player,
  randomElement([new Skullduggery(), new Miasma()]),
  new Resurrect(),
  wave
);

let down = false;
onpointerdown = () => down = true;
onpointerup = () => down = false;

onkeydown = ({ key }) => {
  if (key === " ") {
    return useAbility();
  }
}

init(game.stageWidth, game.stageHeight, dt => {
  if (down) cast();
  game.update(dt);
  render();
});
