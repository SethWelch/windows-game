/**
 * The emoticon vocabulary — data only, so Emoticon.tsx can stay a file of pure
 * components (which is what keeps fast refresh working).
 */

export type Face = 'smile' | 'frown' | 'wink' | 'grin' | 'tongue' | 'shock' | 'cool'

/** Longest first, so `:-)` matches before a bare `:)`. */
export const EMOTICONS: [string, Face][] = [
  [':-)', 'smile'],
  [':-(', 'frown'],
  [';-)', 'wink'],
  [':-D', 'grin'],
  [':-P', 'tongue'],
  [':-O', 'shock'],
  ['8-)', 'cool'],
  [':)', 'smile'],
  [':(', 'frown'],
  [';)', 'wink'],
  [':D', 'grin'],
  [':P', 'tongue'],
]

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Capturing, so `split` keeps the tokens as their own runs. */
export const EMOTICON_PATTERN = new RegExp(
  `(${EMOTICONS.map(([token]) => escape(token)).join('|')})`,
  'g',
)

export const FACE_BY_TOKEN = new Map(EMOTICONS)
