import * as sfx from "./sounds";
import { Damage } from "./actions";
import { PLAYING, RARE, Ritual, ShopItem, SHOPPING } from "./game";
import { clamp, randomInt, removeFromArray, shuffled } from "./helpers";
import { nextLevel } from "./levels";

export interface Shop {
  rituals: Ritual[];
  items: ShopItem[];
  selectedIndex: number;
}

export let shop: Shop = {
  rituals: [],
  items: [],
  selectedIndex: 0,
};

export function buy() {
  let item = shop.items[shop.selectedIndex];
  if (item && item.cost <= game.souls) {
    game.souls -= item.cost;
    removeFromArray(shop.items, item);
    item.purchase();
    selectShopIndex(shop.selectedIndex);
  }
}

export function selectShopIndex(step: number) {
  shop.selectedIndex = clamp(shop.selectedIndex + step, 0, shop.items.length - 1);
  sfx.pluck();
}

export function enterShop() {
  game.state = SHOPPING;
  restockShop();
  sfx.useShopSynths();
}

export function exitShop() {
  game.state = PLAYING;
  nextLevel();
  sfx.useLevelSynths();
}

export function restockShop() {
  let items: (ShopItem | false)[] = [
    game.player.hp < game.player.maxHp && ShopItem(10, "Heal", `Heal 1*`, () => Damage(game.player, -1)),
    ShopItem(100, "Revive", `+1* max hp`, () => {
      game.player.maxHp++;
      game.player.hp++;
    }),
    ShopItem(10, "Charge", "+1\x7F max casts", () => game.spell.maxCasts++),
    ...createRitualItems(),
    ShopItem(0, "Continue", "Begin the next level", () => exitShop()),
  ];
  shop.items = items.filter(item => item) as ShopItem[];
}

export function createRitualItems(): ShopItem[] {
  let rituals = shuffled(shop.rituals.filter(ritual => game.canAddRitual(ritual)));
  let commons = rituals.filter(r => r.rarity !== RARE);
  let rares = rituals.filter(r => r.rarity === RARE);
  let pool = rares.slice(0, 1).concat(commons.slice(0, 2));
  return pool.map((ritual): ShopItem => {
    return {
      name: ritual.name,
      description: ritual.description,
      cost: ritual.rarity === RARE ? 200 + randomInt(100) : 75 + randomInt(100),
      purchase() {
        removeFromArray(shop.rituals, ritual);
        game.addRitual(ritual);
      },
    };
  });
}
