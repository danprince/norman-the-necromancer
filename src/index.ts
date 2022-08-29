import { init, updateParticles, updateTweens } from "./engine";
import { Game, PLAYING, ShopItem, SHOPPING } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Damage, Resurrect } from "./actions";
import { angleBetweenPoints } from "./helpers";
import { Player } from "./objects";
import { isLevelFinished, nextLevel, updateLevel } from "./levels";
import { Bleed, Bouncing, Broken, Drunkard, Explosive, Homing, Knockback, Meteoric, Pact, Piercing, Rain, Riders, Seance, SplitOnBounce, Splitshot, Triggerfinger, Weightless } from "./rituals";
import { buy, createRitualItems, selectShopIndex, shop } from "./shop";

let player = Player();
let game = new Game(player);
let paused = false;

onpointerdown = () => {
  game.spell.castStartTime = Date.now();
}

onpointerup = () => {
  if (game.state === PLAYING) {
    Cast();
  }
}

onpointermove = ({ clientX, clientY }) => {
  let p1 = player.center();
  let p2 = screenToSceneCoords(clientX, clientY);
  game.spell.targetAngle = angleBetweenPoints(p1, p2);
}

onkeydown = ({ key }) => {
  if (game.state === PLAYING) {
    if (key === " ") Resurrect();
    if (key === "p") paused = !paused;
  } else {
    if (key === "ArrowUp") selectShopIndex(-1);
    if (key === "ArrowDown") selectShopIndex(+1);
    if (key === "Enter" || key === " ") buy();
  }
}

function update(dt: number) {
  render(dt);
  if (paused) return;
  updateLevel(dt);
  game.update(dt);
  updateTweens(dt);
  updateParticles(dt);

  if (game.state === PLAYING && isLevelFinished()) {
    game.state = SHOPPING;
    restock();
  }
}

function restock() {
  shop.items = [
    ShopItem(10, "+1 Casts  ", "Permanent +1\x04", () => game.spell.maxCasts++),
    ShopItem(10, "+1 Health ", `Heal 1\x03`, () => Damage(game.player, -1)),
    ShopItem(100, "+1 Max HP ", `Permanent +1\x03 `, () => {
      game.player.maxHp++;
      game.player.hp++;
    }),
    ...createRitualItems(),
    ShopItem(0, "Continue", "Begin the next level", () => {
      game.state = PLAYING;
      nextLevel();
    }),
  ];
}

shop.rituals = [
  Explosive,
  Rain,
  Bouncing,
  SplitOnBounce,
  Splitshot,
  Homing,
  Weightless,
  Piercing,
  Knockback,
  Drunkard,
  Riders,
  Pact,
  Seance,
  Broken,
  Meteoric,
  Triggerfinger,
  Bleed,
];

init(game.stage.width, game.stage.height, update);
