export function randomElement<T>(array: T[]): T {
  return array[Math.random() * array.length | 0];
}
