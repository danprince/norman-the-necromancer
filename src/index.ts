import { init, updateParticles, updateTweens } from "./engine";
import { Game, PLAYING, ShopItem, SHOPPING } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Damage, Resurrect } from "./actions";
import { angleBetweenPoints } from "./helpers";
import { Player } from "./objects";
import { isLevelFinished, nextLevel, updateLevel } from "./levels";
import { Bleed, Bouncing, Broken, Doom, Drunkard, Explosive, Homing, Knockback, Meteoric, Pact, Piercing, Rain, Riders, Seance, SplitOnBounce, Splitshot, Triggerfinger, Weightless } from "./rituals";
import { buy, createRitualItems, selectShopIndex, shop } from "./shop";

let player = Player();
let game = new Game(player);
let paused = false;

const ARROW_UP = 38;
const ARROW_DOWN = 40;
const SPACE = 32;
const ENTER = 13;
const KEY_P = 80;

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

onkeydown = ({ which: key }) => {
  if (game.state === PLAYING) {
    if (key === SPACE) Resurrect();
    if (key === KEY_P) paused = !paused;
  } else {
    if (key === ARROW_UP) selectShopIndex(-1);
    if (key === ARROW_DOWN) selectShopIndex(+1);
    if (key === ENTER) buy();
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
    ShopItem(10, "Charge", "+1\x7F max casts", () => game.spell.maxCasts++),
    ShopItem(10, "Heal", `Heal 1*`, () => Damage(game.player, -1)),
    ShopItem(100, "Revive", `+1* max hp`, () => {
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

game.addRitual(Doom);
game.addRitual(Bleed);

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
  Pact,
  Seance,
  Broken,
  Meteoric,
  Triggerfinger,
  Bleed,
];

init(game.stage.width, game.stage.height, update);
