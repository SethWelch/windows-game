import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import { RANKS, isRed } from './engine.ts'
import type { Card, Suit } from './engine.ts'

/** The four pips, drawn once and scaled wherever a suit is needed. */
const SUIT_PATHS: Record<Suit, string> = {
  hearts:
    'M50 90C20 67 7 49 7 33 7 17 19 9 31 9c9 0 15 5 19 12 4-7 10-12 19-12 12 0 24 8 24 24 0 16-13 34-43 57z',
  diamonds: 'M50 5 89 50 50 95 11 50z',
  spades:
    'M50 6s39 31 39 51c0 14-10 23-21 23-7 0-13-4-16-10 2 10 6 18 12 22H36c6-4 10-12 12-22-3 6-9 10-16 10-11 0-21-9-21-23C11 37 50 6 50 6z',
  clubs:
    'M50 5c11 0 20 9 20 20 0 4-1 8-3 11 3-2 7-3 11-3 11 0 20 9 20 20s-9 20-20 20c-8 0-15-4-19-11 0 13 4 25 10 30H31c6-5 10-17 10-30-4 7-11 11-19 11-11 0-20-9-20-20s9-20 20-20c4 0 8 1 11 3-2-3-3-7-3-11 0-11 9-20 20-20z',
}

function Pip({
  suit,
  className,
  style,
}: {
  suit: Suit
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 100"
      fill={isRed(suit) ? '#c8102e' : '#000'}
      aria-hidden
    >
      <path d={SUIT_PATHS[suit]} />
    </svg>
  )
}

/**
 * Where the pips go, as fractions of the card face.
 *
 * These are the traditional layouts — three columns, and the seven and eight get
 * their extra pip tucked between the rows rather than in a neat grid. Anything in
 * the bottom half is drawn upside down, the way a real deck prints them.
 */
const X = { left: 0.27, mid: 0.5, right: 0.73 }
const Y = { top: 0.16, upper: 0.325, mid: 0.5, lower: 0.675, bottom: 0.84 }

const PIPS: Record<number, [number, number][]> = {
  1: [[X.mid, Y.mid]],
  2: [
    [X.mid, Y.top],
    [X.mid, Y.bottom],
  ],
  3: [
    [X.mid, Y.top],
    [X.mid, Y.mid],
    [X.mid, Y.bottom],
  ],
  4: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
  5: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.mid, Y.mid],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
  6: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.left, Y.mid],
    [X.right, Y.mid],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
  7: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.mid, 0.41],
    [X.left, Y.mid],
    [X.right, Y.mid],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
  8: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.mid, 0.41],
    [X.left, Y.mid],
    [X.right, Y.mid],
    [X.mid, 0.59],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
  9: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.left, Y.upper + 0.055],
    [X.right, Y.upper + 0.055],
    [X.mid, Y.mid],
    [X.left, Y.lower - 0.055],
    [X.right, Y.lower - 0.055],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
  10: [
    [X.left, Y.top],
    [X.right, Y.top],
    [X.mid, 0.265],
    [X.left, Y.upper + 0.055],
    [X.right, Y.upper + 0.055],
    [X.left, Y.lower - 0.055],
    [X.right, Y.lower - 0.055],
    [X.mid, 0.735],
    [X.left, Y.bottom],
    [X.right, Y.bottom],
  ],
}

function CardFace({ card }: { card: Card }) {
  const label = RANKS[card.rank]
  const court = card.rank > 10
  return (
    <div className="xp-sol-face" data-red={isRed(card.suit)}>
      <span className="xp-sol-index">
        {label}
        <Pip suit={card.suit} className="xp-sol-index-pip" />
      </span>
      <span className="xp-sol-index xp-sol-index--flipped">
        {label}
        <Pip suit={card.suit} className="xp-sol-index-pip" />
      </span>

      {court ? (
        // A proper court card is a hand-painted figure. This is the honest
        // alternative: the letter at full size in a ruled panel, with the suit
        // in opposing corners the way the originals framed theirs.
        <span className="xp-sol-court">
          <Pip suit={card.suit} className="xp-sol-court-pip" />
          <span className="xp-sol-court-letter">{label}</span>
          <Pip
            suit={card.suit}
            className="xp-sol-court-pip xp-sol-court-pip--flipped"
          />
        </span>
      ) : (
        PIPS[card.rank].map(([x, y], i) => (
          <Pip
            key={i}
            suit={card.suit}
            className="xp-sol-pip"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              // Pips below the middle are printed inverted on a real card.
              transform: `translate(-50%, -50%) rotate(${y > 0.5 ? 180 : 0}deg)`,
            }}
          />
        ))
      )}
    </div>
  )
}

export function CardView({
  card,
  back,
  style,
  className = '',
  onPointerDown,
  onDoubleClick,
}: {
  card: Card
  /** Which back design to draw when face down — see `.xp-sol-back` in the CSS. */
  back: number
  style?: CSSProperties
  className?: string
  /** The rest of the gesture runs on document listeners — see Solitaire.tsx. */
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void
  onDoubleClick?: () => void
}) {
  return (
    <div
      className={`xp-sol-card ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      aria-label={card.faceUp ? `${RANKS[card.rank]} of ${card.suit}` : 'face down'}
    >
      {card.faceUp ? (
        <CardFace card={card} />
      ) : (
        <div className="xp-sol-back" data-back={back} />
      )}
    </div>
  )
}

/** The empty outline a pile leaves behind — a foundation, or a cleared column. */
export function CardSlot({
  drop,
  onClick,
  children,
  className = '',
}: {
  /** `'foundation:2'`, read back by the drop hit-test. Omitted for the stock. */
  drop?: string
  onClick?: () => void
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`xp-sol-slot ${className}`} data-drop={drop} onClick={onClick}>
      {children}
    </div>
  )
}
