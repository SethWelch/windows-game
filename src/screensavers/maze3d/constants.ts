/** The maze's shared numbers. Anything two files must agree on lives here. */

/** Cells across and down. 16 gives corridors long enough to be interesting. */
export const CELLS = 16
/** Tiles across and down: odd coordinates are cells, even ones are the wall lattice. */
export const GRID = CELLS * 2 + 1

/** One wall texture is this square. Also the atlas's slot width. */
export const TEX = 64

/**
 * Tile kinds, which double as atlas slot indices — `tile * TEX` is the source x, so a
 * tile byte can be handed straight to `drawImage`.
 */
export const OPEN = 0
export const BRICK = 1
export const POSTER = 2
export const END = 3
export const START = 4
export const SLOTS = 5

/**
 * Horizontal field of view, as the camera-plane half-width: `tan(fov / 2)`.
 *
 * Fixed *horizontally* on purpose. Fixing it vertically and deriving the horizontal from
 * a 16:9 viewport gives a 90-degree fisheye; the era's games were 4:3 with a fixed
 * horizontal field, so a wide window should show a taller-feeling corridor rather than a
 * wider one.
 */
export const PLANE = Math.tan((75 * Math.PI) / 360)

/**
 * The internal buffer's width. CSS stretches it to fill.
 *
 * 480 rather than native: on a 2560-wide display that is 130k pixels a frame instead of
 * 3.7M, and it is more faithful — this ran on a CRT. Not 320, because at an 8x scale the
 * fog banding reads as a bug rather than as an era.
 */
export const RENDER_W = 480
export const RENDER_H_MIN = 200
export const RENDER_H_MAX = 340

/**
 * How far a wall has to be to fade out, in tiles.
 *
 * Deliberately far enough that fog is nearly absent inside a maze this size. The original
 * had essentially none — a corridor four cells away is as red as the one you are standing
 * in, and the depth reads from the perspective and the two-tone corners instead. An
 * earlier version faded hard at 9 tiles and turned the whole thing into a grey tunnel.
 */
export const FOG_TILES = 26
/** And it never gets darker than this, however far away. */
export const FOG_MAX = 0.3

/**
 * How close the camera may get to a wall.
 *
 * Also what bounds the tallest wall strip: at 0.22 the perpendicular distance stays above
 * about 0.2, so a strip is never more than ~5x the buffer height and the clipping in
 * raycast.ts has no pathological case.
 */
export const RADIUS = 0.22

/** Autopilot pace: about 650ms per tile and per quarter turn, close to the original's. */
export const AUTO_SPEED = 1.55
export const AUTO_TURN = 2.4
/** How near a waypoint counts as reached, in tiles. */
export const ARRIVE = 0.1

/** The player is brisker than the autopilot, because holding a key should feel like it. */
export const USER_SPEED = 2.6
export const USER_TURN = 2.9

/** How long the fade lasts when the end is reached, in ms. */
export const FADE_MS = 700
