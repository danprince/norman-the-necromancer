import { init } from "./engine";
import { Game } from "./game";
import { render, screenToSceneCoords } from "./renderer";
import { Cast, Resurrect } from "./actions";
import { Archer, Champion, Corpse, Jester, Monk, Player, ShellKnight, TheKing, Villager } from "./objects";
import { angleBetweenPoints, randomElement } from "./helpers";
import { Ceiling, Drunkard, Explosive, SkeletalRiders, Homing, Knockback, Piercing, Rain, Ricochet, Splitshot, Weightless, Pact, Seance, Meteoric } from "./rituals";
import { Hex } from "./behaviours";

let player = Player();
let game = new Game(player);

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

//game.addRitual(Homing);
//game.addRitual(Explosive);
//game.addRitual(Splitshot);
//game.addRitual(Weightless);
//game.addRitual(Knockback);
//game.addRitual(Piercing);
//game.addRitual(Ceiling);
//game.addRitual(Ricochet);
//game.addRitual(Rain);
//game.addRitual(Drunkard);
//game.addRitual(SkeletalRiders);
//game.addRitual(Pact);
//game.addRitual(Seance);
//game.spawn(Corpse(20, 0));
game.addRitual(Meteoric);

let spawnDelay = 1000;
let spawnTimer = 0;

function spawn() {
  let object = randomElement([
    Villager(),
    Villager(),
    Villager(),
    Villager(),
    Villager(),
    Villager(),
    Jester(),
    Champion(),
    Monk(),
    Archer(),
    ShellKnight(),
  ]);

  game.spawn(object);
}

function update(dt: number) {
  spawnTimer += dt;
  if (spawnTimer > spawnDelay) {
    spawn();
    spawnTimer = 0;
  }
  game.update(dt);
  render(dt);
}

init(game.stage.width, game.stage.height, update);
