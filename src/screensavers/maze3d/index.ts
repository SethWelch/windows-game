import type { Saver } from '../flat/types.ts'
import { RENDER_W } from './constants.ts'
import { render } from './raycast.ts'
import { buildAtlas, buildGround } from './textures.ts'
import { createWorld, step } from './world.ts'

/**
 * 3D Maze, as a screen saver: it wanders, and any input dismisses it like any other.
 *
 * The drivable version is a separate app — see apps/maze. That split is deliberate: nine
 * apps keep a `keydown` on `document`, so a saver that consumed the arrow keys would also
 * be steering Solitaire. Keeping the saver input-dismissed and the game in a window means
 * neither has to know the other exists.
 *
 * It fits the ordinary `Saver` factory with nothing added: the world, the atlas and the
 * backdrop all live in the closure `create` returns, which is exactly what that shape is
 * for.
 */
export const maze3d: Saver = {
  name: '3D Maze',
  // Coarser than the flat savers: this one does real work per column, and 480 across is
  // near enough to what a 640x480 CRT resolved to after the upscale.
  renderWidth: RENDER_W,
  create() {
    const atlas = buildAtlas()
    // The ground is texture pixels, not a canvas, and does not depend on the buffer size.
    const ground = buildGround()
    // Seeded from the clock, in an effect rather than during render — so one session is
    // one maze, not a new one every frame.
    const world = createWorld(Date.now() >>> 0)

    return (ctx, dtMs) => {
      // `null` held keys means the autopilot is steering.
      step(world, dtMs / 1000, null)
      render(ctx, world, atlas, ground)
    }
  },
}
