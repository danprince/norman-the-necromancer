export type Constructor<T> = { new(...args: any[] ): T };

export const DEG_180 = Math.PI;
export const DEG_90 = DEG_180 / 2;
export const DEG_270 = DEG_180 + DEG_90;
export const DEG_360 = DEG_180 * 2;

export interface Point {
  x: number;
  y: number;
}

export type Vector = [x: number, y: number];

export function Point(x: number, y: number): Point {
  return { x, y };
}

export interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function Rectangle(
  x: number,
  y: number,
  w: number,
  h: number,
): Rectangle {
  return { x, y, w, h };
}

export function overlaps(a: Rectangle, b: Rectangle) {
  return (
    a.x < b.x + b.w &&
    a.y < b.y + b.h &&
    a.x + a.w > b.x &&
    a.y + a.h > b.y
  );
}

export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

export function vectorFromAngle(radians: number): Vector {
  return [Math.cos(radians), Math.sin(radians)];
}

export function angleBetweenPoints(
  p1: Point,
  p2: Point,
): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function removeFromArray<T>(array: T[], element: T) {
  let index = array.indexOf(element);
  if (index >= 0) array.splice(index, 1);
}

export function randomElement<T>(items: T[]): T {
  return items[Math.random() * items.length | 0];
}

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function vectorToAngle(x: number, y: number): number {
  return Math.atan2(y, x);
}
