import type { GameObject } from "./game";

// Lifecycle
export const SpawnEvent = 0;
export const DespawnEvent = 1;
export const DamageEvent = 2;
export const DeathEvent = 3;
// Physics
export const BounceEvent = 10;
export const CollisionEvent = 11;
// Actions
export const CastSpellEvent = 20;
export const UseAbilityEvent = 21;
export const ThrowEvent = 22;

export interface EventHandlers {
  [SpawnEvent](object: GameObject): void;
  [DespawnEvent](object: GameObject): void;
  [DamageEvent](target: GameObject, amount: number): void;
  [DeathEvent](object: GameObject): void;
  [BounceEvent](object: GameObject): void;
  [CollisionEvent](object: GameObject, target: GameObject): void;
  [CastSpellEvent](projectile: GameObject): void;
  [UseAbilityEvent](): void;
  [ThrowEvent](item: GameObject): void;
}

let _listeners: Record<number, ((...args: any[]) => void)[]> = {};

export function on<E extends keyof EventHandlers>(event: E, callback: EventHandlers[E]) {
  (_listeners[event] ||= []).push(callback);
}

export function off<E extends keyof EventHandlers>(event: E, callback: EventHandlers[E]) {
  _listeners[event].splice(_listeners[event].indexOf(callback), 1);
}

export function emit<E extends keyof EventHandlers>(event: E, ...args: Parameters<EventHandlers[E]>) {
  for (let f of _listeners[event] || []) {
    f(...args);
  }
}
