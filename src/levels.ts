import { LIVING } from "./tags";
import {
  Archer,
  Champion,
  Monk,
  Piper,
  RageKnight,
  Rat,
  RoyalGuard,
  ShellKnight,
  TheKing,
  Villager,
  Wizard,
} from "./objects";
import { randomInt } from "./helpers";
import { GameObject } from "./game";

// Signals (positive signals are spawn counters)
const END_OF_LEVEL = 99;
const END_OF_WAVE = 98;

// Spawn IDs
const VILLAGER = 0;
const ARCHER = 1;
const MONK = 2;
const CHAMPION = 3;
const PIPER = 4;
const RAGE_KNIGHT = 5;
const ROYAL_GUARD = 6;
const SHELL_KNIGHT = 7;
const WIZARD = 8;
const THE_KING = 9;
const RAT = 10;
const MOB = 11;

type Spawn = () => GameObject;

const LOOKUP: Spawn[] = [
  Villager,
  Archer,
  Monk,
  Champion,
  Piper,
  RageKnight,
  RoyalGuard,
  ShellKnight,
  Wizard,
  TheKing,
  Rat,
  Villager,
];

const DELAYS: Record<string | number, () => number> = {
  [RAT]: () => randomInt(500),
  [VILLAGER]: () => randomInt(200),
  [MOB]: () => -randomInt(500),
};

const LEVELS = [
  // Level 1
  4, VILLAGER, END_OF_WAVE,
  2, VILLAGER, 1, ARCHER, 4, VILLAGER, END_OF_WAVE,
  2, VILLAGER, 1, ARCHER, END_OF_LEVEL,

  // Level 2
  4, VILLAGER, 2, ARCHER, 4, VILLAGER, END_OF_WAVE,
  4, ARCHER, END_OF_WAVE,
  8, VILLAGER, END_OF_WAVE,
  4, VILLAGER, 2, SHELL_KNIGHT, END_OF_LEVEL,

  // Level 3
  4, VILLAGER, 4, ARCHER, 1, MONK, END_OF_WAVE,
  3, MONK, END_OF_LEVEL,

  // Level 4
  1, WIZARD, END_OF_LEVEL,

  // Level 5 - Pied Piper (Miniboss)
  1, RAT, END_OF_WAVE,
  3, RAT, END_OF_WAVE,
  10, RAT, 1, PIPER, END_OF_LEVEL,

  // Level 6
  1, RAGE_KNIGHT, END_OF_WAVE,
  3, WIZARD, END_OF_LEVEL,

  // Level 7 - Angry Mob
  20, MOB, 1, RAGE_KNIGHT, 20, MOB, 1, RAGE_KNIGHT, 20, MOB, 10, CHAMPION, END_OF_LEVEL,

  // Level 8
  10, VILLAGER, 3, MONK, 10, VILLAGER, 3, MONK, END_OF_WAVE,
  10, VILLAGER, 3, MONK, 3, CHAMPION, END_OF_WAVE,
  3, RAGE_KNIGHT, 10, VILLAGER, 5, ARCHER, 1, MONK, END_OF_LEVEL,

  // Level 9 - Guards Approaching
  20, VILLAGER, END_OF_WAVE,
  4, ROYAL_GUARD, END_OF_WAVE,
  20, VILLAGER, END_OF_WAVE,
  4, ROYAL_GUARD, 2, MONK, END_OF_WAVE,
  10, VILLAGER, 4, SHELL_KNIGHT, 2, MONK, END_OF_WAVE,
  END_OF_LEVEL,

  // Level 10 - The King (Boss Fight)
  1, THE_KING, END_OF_LEVEL,
];

let timer = 0;
let cursor = 0;

export function isLevelFinished() {
  return LEVELS[cursor] === END_OF_LEVEL && isCleared();
}

export let nextLevel = () => cursor++;

export function updateLevel(dt: number) {
  let cmd = LEVELS[cursor];
  if ((timer -= dt) > 0) {}
  else if (cmd === END_OF_WAVE) isCleared() && cursor++;
  else if (cmd === END_OF_LEVEL) {}
  else if (cmd) {
    LEVELS[cursor]--; // Decrement quantity
    let id = LEVELS[cursor + 1];
    let unit = LOOKUP[id]();
    game.spawn(unit);
    timer = unit.updateSpeed + (DELAYS[id]?.() || 0);
  } else {
    cursor += 2;
  }
}

function isCleared() {
  return !game.objects.some(object => object.is(LIVING));
}
