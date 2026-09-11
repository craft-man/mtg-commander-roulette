/** Returns an unbiased random integer in the range 0..max-1. */
export function randomIndex(max: number): number {
  if (!Number.isSafeInteger(max) || max <= 0) {
    throw new RangeError("max must be a positive integer");
  }

  if (!globalThis.crypto?.getRandomValues) {
    return Math.floor(Math.random() * max);
  }

  const upperBound = 0x1_0000_0000;
  const limit = upperBound - (upperBound % max);
  const values = new Uint32Array(1);

  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % max;
}
