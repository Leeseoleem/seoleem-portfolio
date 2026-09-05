/** 구간 [from, to]에서 0 → 1로 부드럽게 오르는 값. 구간 밖은 0 또는 1로 고정된다 */
export function smoothstep(x: number, from = 0, to = 1): number {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
}
