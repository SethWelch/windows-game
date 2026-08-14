import type { CSSProperties } from 'react'
import autumnUrl from '@/images/autumn.jpg'
import azulUrl from '@/images/Azul.webp'
import blissUrl from '@/images/background.jpg'
import moonUrl from '@/images/Red_moon_desert.webp'
import windUrl from '@/images/Wind.webp'
import type { DisplaySettings, Position } from './display.ts'
import type { FsNode } from './fs.ts'

/**
 * The wallpapers that ship with the machine, and the job of turning the display
 * settings into something to put on an element.
 *
 * Shared by the real desktop and by the little monitor in Display Properties, so the
 * preview cannot drift from what you actually get — XP's preview was a bitmap per
 * scheme and disagreed with reality often enough to be noticeable.
 *
 * Importing every wallpaper here costs nothing at runtime. An image import compiles to
 * a URL string, so the bundler emits the files but the browser only fetches the one the
 * settings actually name — the four nobody has selected are never requested.
 *
 * The three `.webp` files stay `.webp` deliberately. Every current browser reads it,
 * Vite treats it as an asset with no configuration, and re-encoding them to JPEG
 * measured 1.4x larger at q80 and 1.8x at q90 while also adding generational loss to an
 * already-lossy source. Converting would be worse on both counts.
 *
 * `display.ts` imports BUNDLED from here to validate a persisted id, and this module
 * imports its types back — a cycle only on paper, because `import type` under
 * verbatimModuleSyntax is erased entirely and the emitted JS goes one way.
 */

interface BundledWallpaper {
  /** As it appears in the Background list. */
  name: string
  url: string
  /**
   * Bliss alone has a CSS approximation of itself underneath the photograph, which
   * doubles as its loading state and its fallback. See styles/wallpaper.css.
   */
  className?: string
}

/** The ids, spelled out so `BUNDLED` can be annotated and every entry gets the
 *  optional `className` — inferring the union from an `as const` object instead
 *  narrows each entry to its own literal type, and the ones without a className then
 *  don't have the property at all. */
export type BundledId = 'bliss' | 'autumn' | 'azul' | 'moon' | 'wind'

/**
 * Keyed by id rather than by filename, because the id is what gets persisted and a
 * file can be renamed. `bliss` is the machine's default. The annotation makes TypeScript
 * check that every id above has an entry.
 */
export const BUNDLED: Record<BundledId, BundledWallpaper> = {
  bliss: { name: 'Bliss', url: blissUrl, className: 'xp-bliss' },
  autumn: { name: 'Autumn', url: autumnUrl },
  azul: { name: 'Azul', url: azulUrl },
  moon: { name: 'Red moon desert', url: moonUrl },
  wind: { name: 'Wind', url: windUrl },
}

/** How `Position` maps onto the three background properties. */
const LAYOUT: Record<Position, Pick<CSSProperties, 'backgroundSize' | 'backgroundRepeat'>> = {
  stretch: { backgroundSize: 'cover', backgroundRepeat: 'no-repeat' },
  center: { backgroundSize: 'auto', backgroundRepeat: 'no-repeat' },
  tile: { backgroundSize: 'auto', backgroundRepeat: 'repeat' },
}

/** The picture a setting names, if it still resolves to one. */
function source(settings: DisplaySettings, node?: FsNode): string | undefined {
  if (settings.wallpaper.kind === 'bundled') return BUNDLED[settings.wallpaper.id]?.url
  // A node id is a reference, and references go stale — a picture whose file has been
  // deleted falls back to the colour rather than to a broken image.
  if (settings.wallpaper.kind === 'file') return node?.content
  return undefined
}

export function wallpaperLook(
  settings: DisplaySettings,
  node?: FsNode,
): { className: string; style: CSSProperties } {
  const src = source(settings, node)
  if (!src) return { className: '', style: { backgroundColor: settings.color } }

  const bundled =
    settings.wallpaper.kind === 'bundled' ? BUNDLED[settings.wallpaper.id] : undefined

  if (bundled?.className) {
    // Bliss hands its photograph to the stylesheet through a custom property. It is
    // deliberately not a `url()` in the CSS: a relative path there is relative to the
    // stylesheet, so moving the rule between folders silently breaks it and Vite
    // leaves an unresolvable path alone rather than failing the build. Through this
    // import the bundler resolves and hashes it, and the path cannot rot.
    return {
      className: bundled.className,
      // Cast because CSSProperties has no index signature for custom properties,
      // though React sets them happily.
      style: { '--bliss-photo': `url("${src}")` } as CSSProperties,
    }
  }

  return {
    className: '',
    style: {
      backgroundColor: settings.color,
      backgroundImage: `url("${src}")`,
      backgroundPosition: 'center center',
      ...LAYOUT[settings.position],
    },
  }
}
