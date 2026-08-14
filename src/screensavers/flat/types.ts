/**
 * What a screen saver is: a factory, not a draw function.
 *
 * `create` runs once per session and returns the per-frame painter. Everything the saver
 * needs to remember — stars, vertices, scroll offsets — lives in that closure, which is
 * why none of this ever touches React state. Two consequences worth knowing:
 *
 * - `react-hooks/immutability` has nothing to complain about, because there is no mutable
 *   object in `useState` to begin with. The canvas trap Paint documents doesn't arise.
 * - `Math.random()` is fine in here. The rule against it (see CLAUDE.md) is about
 *   *render*, where a re-render would reshuffle the result; `create` runs in an effect.
 *
 * `dtMs` is already clamped by the loop, so a painter can integrate it without checking.
 */
export type Frame = (ctx: CanvasRenderingContext2D, dtMs: number) => void

export interface Saver {
  /** Also the label the Screen Saver dropdown shows, so the two cannot drift. */
  name: string
  /**
   * How wide the backing store should be, if the default is wrong for this saver. The
   * maze asks for less: it does real work per column, and it looked better coarse anyway.
   */
  renderWidth?: number
  create(width: number, height: number): Frame
}
