// Copy shown on the block page. Browser-independent so the rotation logic can
// be unit-tested; the block page shell just calls pickFocusLine() on load.

/** Short encouraging lines rotated beneath the block-page headline. */
export const FOCUS_LINES: readonly string[] = [
  "Get back to what matters.",
  "The work you want to do is on the other side of this tab.",
  "This is the distraction you decided to skip.",
  "Future you will be glad you closed this.",
  "One small choice toward focus.",
  "Nothing here is more important than your attention.",
];

/**
 * Pick a focus line. `random` is a value in [0, 1) (defaults to Math.random());
 * out-of-range values are clamped so the result is always a real line.
 */
export function pickFocusLine(random: number = Math.random()): string {
  const clamped = random < 0 ? 0 : random >= 1 ? 1 - Number.EPSILON : random;
  return FOCUS_LINES[Math.floor(clamped * FOCUS_LINES.length)];
}
