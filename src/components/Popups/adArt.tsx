/**
 * Illustrations for the advertisements, in two kinds.
 *
 * The drawn set below is original vector work: invented company marks, flat
 * stock-photo people, and the products these things were always selling. The names
 * are made up and the faces are shapes rather than anybody. It covers the things no
 * photograph here does — a beige tower, a printer, a mobile telephone.
 *
 * The photographs do the rest, and carry most of the slots. They are freely-licensed
 * stock and arrived at up to 7418px wide, 39MB the lot; each is resized to fit 240px
 * and reduced to a 128-colour palette with per-index alpha, which is 96KB for all ten
 * and more resolution than a 120px slot in an ad can use.
 *
 * Both kinds answer to `ArtName` and both land in the same slots, so a template
 * doesn't care which it got. See `images/SOURCES.md` for provenance.
 */

import saleRibbon from './images/sale-ribbon.png'
import wallet from './images/wallet.png'
import cashMascot from './images/cash-mascot.png'
import payHere from './images/pay-here.png'
import dice from './images/dice.png'
import creditCard from './images/credit-card.png'
import crutches from './images/crutches.png'
import dinosaur from './images/dinosaur.png'
import houseCottage from './images/house-cottage.png'
import houseShed from './images/house-shed.png'

/** The photographs, by the slot they're for rather than by what they are. */
const PHOTOS = {
  'photo-sale': saleRibbon,
  'photo-wallet': wallet,
  'photo-mascot': cashMascot,
  'photo-pay': payHere,
  'photo-dice': dice,
  'photo-card': creditCard,
  'photo-crutches': crutches,
  'photo-dinosaur': dinosaur,
  'photo-cottage': houseCottage,
  'photo-shed': houseShed,
} as const

export type PhotoName = keyof typeof PHOTOS

export type ArtName =
  | 'desktop'
  | 'printer'
  | 'phone'
  | 'person'
  | 'people'
  | 'piggy'
  | PhotoName

/** Six invented emblems, so no two brand strips look related. */
export function BrandMark({ mark }: { mark: number }) {
  const emblems = [
    // A swoosh in a disc: the default logo of the entire decade.
    <g key="0">
      <circle cx="11" cy="11" r="9.5" fill="#1a5fd0" />
      <path d="M4 14c5-7 11-8 15-5" fill="none" stroke="#fff" strokeWidth="2.6" />
    </g>,
    <g key="1">
      <rect x="2" y="2" width="18" height="18" rx="2" fill="#e87200" />
      <path d="M5 17L17 5" stroke="#fff" strokeWidth="3" />
    </g>,
    <g key="2">
      <path d="M11 2c6 5 8 9 8 12a8 8 0 0 1-16 0c0-3 2-7 8-12z" fill="#2fa03f" />
      <path d="M11 7v10" stroke="#d8f5c0" strokeWidth="1.6" />
    </g>,
    <g key="3">
      <circle cx="11" cy="11" r="9.5" fill="#6b3fc0" />
      <ellipse cx="11" cy="11" rx="4" ry="9.5" fill="none" stroke="#dcd0ff" />
      <path d="M1.5 11h19" stroke="#dcd0ff" />
    </g>,
    <g key="4">
      <path d="M11 2l9 3v8c0 5-4 7-9 9-5-2-9-4-9-9V5z" fill="#c81f2a" />
      <path d="M7 11l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.4" />
    </g>,
    <g key="5">
      <circle cx="8" cy="11" r="6.5" fill="#00a8c8" opacity="0.85" />
      <circle cx="14" cy="8" r="6.5" fill="#0060a8" opacity="0.75" />
      <circle cx="14" cy="14" r="6.5" fill="#40d0e8" opacity="0.7" />
    </g>,
  ]
  return (
    <svg className="ad-mark" viewBox="0 0 22 22" aria-hidden>
      {emblems[mark % emblems.length]}
    </svg>
  )
}

/**
 * A flat stock-photo bust. Two variants of hair and shirt so a row of them doesn't
 * look like the same person three times.
 */
function Bust({
  x,
  scale = 1,
  variant = 0,
}: {
  x: number
  scale?: number
  variant?: number
}) {
  const skin = ['#f0c9a8', '#c98d63', '#8a5a3c'][variant % 3]
  const hair = ['#3a2a1a', '#7a4a20', '#1a1a1a'][variant % 3]
  const shirt = ['#2f6fd0', '#c83a3a', '#2fa03f'][variant % 3]
  return (
    <g transform={`translate(${x} 0) scale(${scale})`}>
      {/* shoulders */}
      <path d="M2 68c0-13 9-20 20-20s20 7 20 20z" fill={shirt} />
      <path d="M17 48h10l-5 9z" fill="#fff" />
      {/* head */}
      <ellipse cx="22" cy="30" rx="13" ry="15" fill={skin} />
      <path d="M9 26c2-11 24-11 26 0 1-8-3-15-13-15S8 18 9 26z" fill={hair} />
      {/* a smile, because they were always delighted */}
      <path
        d="M16 35a6 6 0 0 0 12 0"
        fill="none"
        stroke="#8a5a45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="28" r="1.6" fill="#3a2a1a" />
      <circle cx="27" cy="28" r="1.6" fill="#3a2a1a" />
    </g>
  )
}

/** One person, pointing at you. */
function Person() {
  return (
    <svg className="ad-art" viewBox="0 0 100 68" aria-hidden>
      <Bust x={12} scale={1} variant={0} />
      {/* The arm, aimed out of the advertisement. */}
      <path d="M52 52l30-8 4 9-32 8z" fill="#f0c9a8" stroke="#c99a70" />
      <circle cx="86" cy="47" r="7" fill="#f0c9a8" stroke="#c99a70" />
    </svg>
  )
}

/** Three of them, delighted together. */
function People() {
  return (
    <svg className="ad-art" viewBox="0 0 100 68" aria-hidden>
      <Bust x={2} scale={0.72} variant={1} />
      <Bust x={34} scale={0.72} variant={0} />
      <Bust x={66} scale={0.72} variant={2} />
    </svg>
  )
}

/** The prize: a beige CRT and the tower it came with. */
function DesktopPC() {
  return (
    <svg className="ad-art" viewBox="0 0 100 68" aria-hidden>
      {/* monitor */}
      <rect x="4" y="8" width="56" height="44" rx="3" fill="#e8e2d0" stroke="#a8a294" />
      <rect x="9" y="13" width="46" height="31" rx="1" fill="#3a6a2a" />
      <path d="M9 13h46v9H9z" fill="#5a9a3a" opacity="0.5" />
      <path d="M24 52h16l3 8H21z" fill="#ded8c8" stroke="#a8a294" />
      <rect x="14" y="60" width="36" height="4" rx="1" fill="#e8e2d0" stroke="#a8a294" />
      {/* tower */}
      <rect x="66" y="14" width="26" height="50" rx="2" fill="#f0ebdc" stroke="#a8a294" />
      <rect x="70" y="19" width="18" height="4" fill="#d8d2c0" />
      <rect x="70" y="26" width="18" height="4" fill="#d8d2c0" />
      <circle cx="79" cy="57" r="3" fill="#7ab8e8" stroke="#4a7a9a" />
    </svg>
  )
}

function Printer() {
  return (
    <svg className="ad-art" viewBox="0 0 100 68" aria-hidden>
      <rect x="26" y="4" width="48" height="20" fill="#fffdf2" stroke="#8a8a8a" />
      <path d="M32 10h36M32 15h30" stroke="#c0c0c0" />
      <rect x="14" y="24" width="72" height="26" rx="3" fill="#b9bec7" stroke="#5a5a5a" />
      <rect x="22" y="30" width="34" height="5" rx="1" fill="#6a6a6a" />
      <circle cx="74" cy="32" r="3" fill="#2fa03f" />
      <circle cx="74" cy="41" r="3" fill="#e8a000" />
      <rect x="26" y="50" width="48" height="14" fill="#fffdf2" stroke="#8a8a8a" />
    </svg>
  )
}

function Phone() {
  return (
    <svg className="ad-art" viewBox="0 0 100 68" aria-hidden>
      <rect x="36" y="6" width="28" height="58" rx="5" fill="#3a3a42" stroke="#1a1a1e" />
      <rect x="40" y="12" width="20" height="16" rx="1" fill="#9fd870" stroke="#2a4a1a" />
      <rect x="62" y="0" width="3" height="10" rx="1.5" fill="#1a1a1e" />
      <g fill="#6a6a76">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}-${c}`} x={41 + c * 7} y={33 + r * 7} width="5" height="5" rx="1" />
          )),
        )}
      </g>
    </svg>
  )
}

function Piggy() {
  return (
    <svg className="ad-art" viewBox="0 0 100 68" aria-hidden>
      <ellipse cx="50" cy="40" rx="30" ry="21" fill="#f2a0bc" stroke="#b8607e" />
      <ellipse cx="78" cy="38" rx="9" ry="8" fill="#f2a0bc" stroke="#b8607e" />
      <circle cx="80" cy="38" r="2" fill="#b8607e" />
      <circle cx="72" cy="32" r="1.8" fill="#5a2a3a" />
      <path d="M40 22l6-8 7 8z" fill="#f2a0bc" stroke="#b8607e" />
      <rect x="42" y="19" width="16" height="3" rx="1.5" fill="#7a3a52" />
      <g stroke="#b8607e" strokeWidth="5" strokeLinecap="round">
        <path d="M34 58v5M46 60v4M56 60v4M66 57v5" />
      </g>
      {/* the coin, on its way in */}
      <ellipse cx="50" cy="9" rx="8" ry="3" fill="#ffd85a" stroke="#a07800" />
    </svg>
  )
}

const DRAWN: Record<Exclude<ArtName, PhotoName>, () => React.ReactElement> = {
  desktop: DesktopPC,
  printer: Printer,
  phone: Phone,
  person: Person,
  people: People,
  piggy: Piggy,
}

export function AdArt({ name }: { name: ArtName }) {
  if (name in PHOTOS) {
    // Decorative: the ad's own copy already says what it's selling.
    return <img className="ad-art ad-art--photo" src={PHOTOS[name as PhotoName]} alt="" />
  }
  const Art = DRAWN[name as Exclude<ArtName, PhotoName>]
  return <Art />
}
