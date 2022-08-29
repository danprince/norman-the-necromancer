import { Ritual, ShopItem } from "./game";
import { clamp, removeFromArray, shuffled } from "./helpers";

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
}

export function createRitualItems(): ShopItem[] {
  return shuffled(shop.rituals)
    .filter(ritual => game.canAddRitual(ritual))
    .slice(0, 3)
    .map((ritual): ShopItem => {
      return {
        name: ritual.name,
        description: ritual.description,
        cost: 100,
        purchase() {
          removeFromArray(shop.rituals, ritual);
          game.addRitual(ritual);
        }
      };
    });
}
