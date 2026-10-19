export function getReelSwipeDirection(deltaX: number, deltaY: number): -1 | 0 | 1 {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return 0;

  const horizontal = Math.abs(deltaX);
  const vertical = Math.abs(deltaY);
  const dominant = Math.max(horizontal, vertical);
  const secondary = Math.min(horizontal, vertical);
  if (dominant < 44 || (secondary > 0 && dominant / secondary < 1.2)) return 0;

  const movement = horizontal > vertical ? deltaX : deltaY;
  return movement < 0 ? 1 : -1;
}

export function getAdjacentReelIndex(index: number, direction: -1 | 1, count: number): number {
  if (!Number.isSafeInteger(count) || count <= 1 || !Number.isFinite(index)) return 0;

  const offset = Math.trunc(index) % count;
  const normalizedIndex = offset < 0 ? offset + count : offset;
  if (direction === 1) return normalizedIndex === count - 1 ? 0 : normalizedIndex + 1;
  return normalizedIndex === 0 ? count - 1 : normalizedIndex - 1;
}
