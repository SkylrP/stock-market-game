export function moveQbi(current: number, change: number): number {
  const min = 0;
  const max = 100;
  const range = max - min;

  let temp = current + change - min;

  if (temp < 0) {
    temp = -temp;
  }

  const numBounces = Math.floor(temp / range);
  const remainder = temp % range;

  if (numBounces % 2 === 0) {
    return min + remainder;
  } else {
    return max - remainder;
  }
}