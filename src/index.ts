import { init, updateParticles, updateTweens } from "./engine";
import { Game, PLAYING, SHOPPING } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Resurrect } from "./actions";
import { angleBetweenPoints } from "./helpers";
import { Player } from "./objects";
import { isLevelFinished, updateLevel } from "./levels";
import { Bleed, Bouncing, Broken, Ceiling, Drunkard, Explosive, Homing, Knockback, Meteoric, Pact, Piercing, Rain, Seance, SplitOnBounce, Splitshot, Streak, Triggerfinger, Weightless } from "./rituals";
import { buy, restockShop, selectShopIndex, shop } from "./shop";

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
    restockShop();
  }
}

game.addRitual(Streak);

shop.rituals = [
  Ceiling,
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
