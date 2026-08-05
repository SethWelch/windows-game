import { EMOTICON_PATTERN, FACE_BY_TOKEN } from './emoticons.ts'
import type { Face } from './emoticons.ts'

/**
 * Typed emoticons become little yellow faces, which is the single most AIM thing
 * a message window can do.
 */
export function Emoticon({ face }: { face: Face }) {
  return (
    <svg className="xp-aim-emoticon" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#ffd93b" stroke="#c99a00" />

      {face === 'cool' ? (
        <g fill="#3a3a3a">
          <rect x="2.5" y="6.6" width="15" height="1.4" />
          <path d="M3.8 8h5.2l-1 3.2H5z" />
          <path d="M11 8h5.2l-1.5 3.2h-2.3z" />
        </g>
      ) : (
        <g fill="#3a3a3a">
          {face === 'wink' ? (
            <rect x="4.9" y="7.4" width="3.2" height="1.3" rx="0.6" />
          ) : (
            <ellipse cx="6.5" cy="7.8" rx="1.15" ry="1.5" />
          )}
          <ellipse cx="13.5" cy="7.8" rx="1.15" ry="1.5" />
        </g>
      )}

      {face === 'frown' ? (
        <path
          d="M6 14.2Q10 10.8 14 14.2"
          fill="none"
          stroke="#3a3a3a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ) : face === 'shock' ? (
        <ellipse cx="10" cy="13.4" rx="2.2" ry="2.6" fill="#3a3a3a" />
      ) : face === 'grin' ? (
        <path d="M4.8 11.4h10.4a5.2 5.2 0 0 1-10.4 0z" fill="#3a3a3a" />
      ) : face === 'tongue' ? (
        <>
          <path d="M5.2 11.4h9.6a4.8 4.8 0 0 1-9.6 0z" fill="#3a3a3a" />
          <path d="M9 14.4h3.4a1.7 1.7 0 0 1-3.4 0z" fill="#e8607a" />
        </>
      ) : (
        <path
          d="M5.6 11.6Q10 15.6 14.4 11.6"
          fill="none"
          stroke="#3a3a3a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

/** Message text with its emoticons swapped for glyphs. */
export function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split(EMOTICON_PATTERN).map((part, i) => {
        const face = FACE_BY_TOKEN.get(part)
        return face ? <Emoticon key={i} face={face} /> : part
      })}
    </>
  )
}
