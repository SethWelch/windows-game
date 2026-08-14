import { beziers } from './flat/beziers.ts'
import { blank } from './flat/blank.ts'
import { marquee } from './flat/marquee.ts'
import { mystify } from './flat/mystify.ts'
import { maze3d } from './maze3d/index.ts'
import { starfield } from './flat/starfield.ts'
import type { Saver } from './flat/types.ts'

/**
 * Every screen saver installed, and the names the Screen Saver dropdown shows.
 *
 * The registry is the single source of both, so an id and its label cannot drift — the
 * same argument `SCHEME_NAMES` makes in os/display.ts. `os/display.ts` also validates a
 * persisted `saver` against these keys, so deleting one from here degrades to `(None)`
 * rather than to an overlay with nothing to draw.
 *
 * `none` is a real entry rather than a special case. It has no factory: the overlay is
 * never mounted for it, and the store refuses to start a session while it is selected.
 */
export type SaverId =
  | 'none'
  | 'blank'
  | 'starfield'
  | 'mystify'
  | 'beziers'
  | 'marquee'
  | 'maze3d'

export const SAVERS: Record<SaverId, Saver | null> = {
  none: null,
  blank,
  starfield,
  mystify,
  beziers,
  marquee,
  maze3d,
}

/** In the order the dropdown lists them: `(None)` first, then alphabetically. */
export const SAVER_ORDER: SaverId[] = [
  'none',
  'maze3d',
  'beziers',
  'blank',
  'marquee',
  'mystify',
  'starfield',
]

export const saverName = (id: SaverId) => SAVERS[id]?.name ?? '(None)'
