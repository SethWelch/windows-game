/**
 * Skins.
 *
 * The real ones were downloadable bundles of bitmaps and XML that replaced the player's
 * chrome outright — a shape, not a palette. Ours are palettes, and that is a deliberate
 * departure rather than a half-finished version of the same thing: every pixel of this
 * player is CSS, and the honest CSS equivalent of a skin is to re-colour the whole thing
 * coherently. Nothing here is a bitmap, which is the project's standing rule.
 *
 * What makes that work is in MediaPlayer.css: every colour in the player is one hue at
 * some saturation and lightness, and each keeps its own offset from the base — so
 * rotating `--wmp-hue` moves the panels, the borders, the text and the cyan highlights
 * together, and they stay in the same relationship to each other. A skin is therefore
 * three numbers rather than forty.
 *
 * The names are the real player's. The palettes are **not** reproductions — I have no way
 * to sample the originals, and inventing a colour and calling it authentic would be
 * worse than saying so. Roundlet really was the silver rounded one; the rest are chosen
 * to be distinct from each other and from Corona.
 */

export type SkinId = 'corona' | 'roundlet' | 'pyrite' | 'headspace' | 'quickplay'

export interface Skin {
  id: SkinId
  name: string
  /** One line, as the chooser's description pane showed. */
  blurb: string
}

/**
 * Order matters: Corona first because it is what the player ships as, and the chooser
 * reads top to bottom.
 */
export const SKINS: Skin[] = [
  {
    id: 'corona',
    name: 'Corona',
    blurb: "The blue the player ships in — Windows Media Player 9's own look.",
  },
  {
    id: 'roundlet',
    name: 'Roundlet',
    blurb: 'Brushed silver with rounded corners. Almost no colour at all.',
  },
  {
    id: 'pyrite',
    name: 'Pyrite',
    blurb: 'Fool’s gold. Warm amber panels with a brass edge.',
  },
  {
    id: 'headspace',
    name: 'Headspace',
    blurb: 'Deep violet, dimmed down. The one for playing music in the dark.',
  },
  {
    id: 'quickplay',
    name: 'QuickPlay',
    blurb: 'Cold green over near-black, like a hi-fi display.',
  },
]

export const DEFAULT_SKIN: SkinId = 'corona'

export const skinName = (id: SkinId) =>
  SKINS.find((s) => s.id === id)?.name ?? 'Corona'

/** Whether a persisted value still names a skin we ship. */
export const isSkin = (v: unknown): v is SkinId =>
  typeof v === 'string' && SKINS.some((s) => s.id === v)
