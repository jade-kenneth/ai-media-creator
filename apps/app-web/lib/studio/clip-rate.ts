/** The slowest a short clip plays (the browser's lowest playback rate). */
const MIN_CLIP_RATE = 0.0625;

/**
 * The speed a clip plays at so its footage from the start point lasts the
 * whole scene (plus the next scene's overlap): 1 when there is enough, slower
 * when the narration outlasts it. Mirrors the render's `clipPlaybackRate`.
 */
export function clipPlaybackRate(
  availableSeconds: number,
  neededSeconds: number,
): number {
  if (!(availableSeconds > 0) || !(neededSeconds > 0)) return 1;

  return Math.max(MIN_CLIP_RATE, Math.min(1, availableSeconds / neededSeconds));
}

/** A slowed rate for copy: two decimals, never shown as 1×. */
export function formatClipRate(rate: number): string {
  return String(Math.min(0.99, Math.round(rate * 100) / 100));
}
