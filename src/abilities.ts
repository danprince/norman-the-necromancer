import { Ability } from "./game";
import { CORPSE } from "./tags";
import { Skeleton } from "./units";
import * as sprites from "./sprites.json";

export class Resurrect extends Ability {
  name = "Resurrect";
  sprite = sprites.ability_resurrection;
  override cooldown = 10_000;

  onUse(): void {
    for (let object of game.objects) {
      if (object.tags & CORPSE) {
        game.despawn(object);
        game.spawn(Skeleton(object.x, 0));
      }
    }
  }
}
