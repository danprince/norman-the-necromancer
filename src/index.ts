import { init, updateParticles, updateTweens } from "./engine";
import { Game } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Resurrect } from "./actions";
import { angleBetweenPoints } from "./helpers";
import { Player } from "./objects";
import { updateLevel } from "./levels";
import { Explosive, Rain } from "./rituals";

let player = Player();
let game = new Game(player);
let paused = false;

game.addRitual(Explosive);
game.addRitual(Rain);

onpointerdown = () => game.spell.castStartTime = Date.now();
onpointerup = () => Cast();
onpointermove = ({ clientX, clientY }) => {
  let p1 = player.center();
  let p2 = screenToSceneCoords(clientX, clientY);
  game.spell.targetAngle = angleBetweenPoints(p1, p2);
};

onkeydown = ({ key }) => {
  if (key === " ") Resurrect();
  if (key === "p") paused = !paused;
}

function update(dt: number) {
  render(dt);
  if (paused) return;
  updateLevel(dt);
  game.update(dt);
  updateTweens(dt);
  updateParticles(dt);
}

init(game.stage.width, game.stage.height, update);
