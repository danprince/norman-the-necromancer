import { init } from "./engine";
import { Game } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Resurrect } from "./actions";
import { Corpse, Player, ShellKnight } from "./objects";
import { angleBetweenPoints } from "./helpers";

let player = Player();
let game = new Game(player);
game.spell.targetAngle = 0.6;

let knight = Corpse(200, 0);
game.spawn(knight);
onclick = () => Cast();

onpointermove = ({ clientX, clientY }) => {
  let p1 = player.center();
  let p2 = screenToSceneCoords(clientX, clientY);
  game.spell.targetAngle = angleBetweenPoints(p1, p2);
};

onkeydown = ({ key }) => {
  switch (key) {
    case " ":
      Resurrect();
      break;
  }
}

init(game.stage.width, game.stage.height, dt => {
  game.update(dt);
  render(dt);
});
