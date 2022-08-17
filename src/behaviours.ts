import { damage } from "./actions";
import { tween } from "./engine";
import { Healing, HolyBlessing } from "./fx";
import { Behaviour } from "./game";
import { LIVING } from "./tags";

export class March extends Behaviour {
  direction: number;
  cooldown = 1;

  constructor(direction: number) {
    super();
    this.direction = direction;
  }

  onUse() {
    tween(this.owner, {
      x: this.owner.x + this.direction,
    }, 200, t => {
      this.owner.y = Math.sin(t * Math.PI) * 2;
    });

    // Ensure objects that move off stage are despawned
    if (this.owner.x > game.stageWidth || this.owner.x < 0) {
      game.despawn(this.owner);
    }
  }
}

export class Heal extends Behaviour {
  override cooldown = 5;

  onUse() {
    let emitter = HolyBlessing(this.owner.bounds());
    emitter.burst(20);
    emitter.stopThenRemove();

    for (let object of game.objects) {
      if (object.tags & LIVING) {
        if (object.hp < object.maxHp) {
          damage(object, -1);
          let emitter = Healing(object.bounds());
          emitter.burst(5);
          emitter.stopThenRemove();
        }
      }
    }
  }
}
