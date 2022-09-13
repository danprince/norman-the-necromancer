import * as sprites from "./sprites.json";
import { init, updateParticles, updateTweens } from "./engine";
import { Game, INTRO, PLAYING, SHOPPING } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Resurrect } from "./actions";
import { angleBetweenPoints } from "./helpers";
import { Player } from "./objects";
import { isComplete, isLevelFinished, newGamePlus, updateLevel } from "./levels";
import { Benefactor, Bleed, Bouncing, Broken, Ceiling, Drunkard, Explosive, Extraction, Freeze, Homing, Knockback, Pact, Rain, Seance, SplitOnBounce, Splitshot, Streak, Triggerfinger, Weightless, Zap } from "./rituals";
import { buy, enterShop, selectShopIndex, shop } from "./shop";
import { dust } from "./fx";
import { BPM, play } from "./sounds";
import { March } from "./behaviours";

let player = Player();
player.sprite = sprites.skull;
let game = new Game(player);
let paused = false;

const ARROW_UP = 38;
const ARROW_DOWN = 40;
const SPACE = 32;
const ENTER = 13;
const KEY_P = 80;

const INTRO_DIALOGUE = [
  "Norman wasn't a particularly popular necromancer...",
  "         The other villagers hunted him.",
  "     Sometimes they even finished the job (@)",
  "  But like any self-respecting necromancer...",
  "        Norman just brought himself back.",
];

const OUTRO_DIALOGUE = [
  "The king was defeated. Norman could rest...",
  "But not for long",
];

onpointerup = () => {
  if (game.state === INTRO) {
    play();
    game.state = PLAYING;
    game.player.sprite = sprites.norman_arms_down;
  }

  Cast();
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

let normanIsBouncing = false;

function update(dt: number) {
  updateDialogue(dt);
  render(dt);
  if (paused) return;

  if (game.state === PLAYING) {
    updateLevel(dt);
  }

  game.update(dt);
  updateTweens(dt);
  updateParticles(dt);

  if (game.state === PLAYING && isLevelFinished()) {
    if (isComplete()) {
      game.dialogue = OUTRO_DIALOGUE;
      newGamePlus();
    } else {
      game.onLevelEnd();
      enterShop();
    }
  }

  if (game.level === 2 && !normanIsBouncing) {
    game.player.addBehaviour(new March(game.player, 0));
    game.player.updateClock = 100;
    game.player.updateSpeed = 60_000 / BPM * 2;
    normanIsBouncing = true;
  }
}

let dialogueTimer = 0;

function updateDialogue(dt: number) {
  if ((dialogueTimer += dt) > 4000) {
    game.dialogue.shift()
    dialogueTimer = 0;

    // If the player watched the whole dialogue, remind them to click to start
    if (game.state === INTRO && game.dialogue.length === 0) {
      game.dialogue.push("                (Click to begin)");
    }
  }
}

game.addRitual(Streak);

shop.rituals = [
  Ceiling,
  Explosive,
  Rain,
  Bouncing,
  Splitshot,
  Homing,
  Weightless,
  Knockback,
  Drunkard,
  Pact,
  Seance,
  Broken,
  Triggerfinger,
  Bleed,
  Extraction,
  Benefactor,
  Zap,
  Freeze,
];

game.dialogue = INTRO_DIALOGUE;

init(game.stage.width, game.stage.height, update);
dust().burst(200);
