import { ICONS } from './registry.ts'
import type { IconId } from './registry.ts'

/**
 * Real icon artwork, if present, wins over the hand-drawn SVG fallbacks.
 *
 * Drop files into `src/images/icons/`, `.png` or `.ico`, named either:
 *   `<iconId>-<size>` — e.g. `notepad-16.png`, `notepad-32.ico`  (preferred)
 *   `<iconId>`        — e.g. `notepad.ico`, used at any requested size
 *
 * Vite resolves this glob at build time, so there's no import list to maintain
 * and no code change when files are added or removed.
 *
 * Prefer per-size files. A multi-frame `.ico` renders, but nothing in HTML or CSS
 * can select which frame the browser uses — Chrome and Safari tend to take the
 * largest and scale it down, so a 16px titlebar gets downscaled 48px art instead
 * of XP's hand-pixeled 16px art.
 */
const RASTER = import.meta.glob<string>('../images/icons/*.{png,ico}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** `{ notepad: { 16: url, 32: url, 0: url } }`, where 0 is the sizeless file. */
const BY_ID: Record<string, Record<number, string>> = {}
for (const [path, url] of Object.entries(RASTER)) {
  // Hyphens and underscores are allowed in the id. The size group requires
  // digits, so `go-arrow-32.ico` still splits into `go-arrow` + `32` and
  // `notepad-16.ico` into `notepad` + `16` — the lazy id can't swallow the size.
  const match = /\/([A-Za-z0-9_-]+?)(?:-(\d+))?\.(?:png|ico)$/.exec(path)
  if (!match) continue
  const id = match[1]
  BY_ID[id] ??= {}
  BY_ID[id][match[2] ? Number(match[2]) : 0] = url
}

function pickRaster(id: string, size: number): string | undefined {
  const set = BY_ID[id]
  if (!set) return undefined
  // Exact match means no scaling at all, which is the whole point: XP's 16px
  // icons were pixeled by hand, not shrunk from the 32px ones.
  const exact = set[size]
  if (exact) return exact
  const sized = Object.keys(set)
    .map(Number)
    .filter((s) => s > 0)
    .sort((a, b) => a - b)
  // Downscaling looks soft; upscaling looks worse. Prefer the next size up.
  const nextUp = sized.find((s) => s >= size) ?? sized[sized.length - 1]
  return nextUp ? set[nextUp] : set[0]
}

export function Icon({
  id,
  size = 32,
  className,
}: {
  id: IconId
  size?: number
  className?: string
}) {
  const src = pickRaster(id, size)
  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt=""
        className={className}
        draggable={false}
      />
    )
  }

  const Art = ICONS[id]
  return <Art size={size} className={className} />
}
