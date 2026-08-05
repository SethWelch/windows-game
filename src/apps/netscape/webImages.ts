/**
 * The GIFs. Every page of this vintage was held together by 88x31 badges, bullet
 * spheres and a hit counter, so they have to be here — but nothing in this project
 * ships a bitmap, and a fake browser certainly can't fetch one. They're SVG behind
 * a `data:` URI instead, which keeps the markup on the pages honest: real `<img
 * src="...">` tags with width, height and `border="0"`, exactly as they were.
 */

const svg = (markup: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" ${markup}`,
  )}`

const BADGE = 'width="88" height="31" viewBox="0 0 88 31"'

export const UNDER_CONSTRUCTION = svg(`${BADGE}>
  <defs>
    <pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)">
      <rect width="4" height="8" fill="#000"/>
    </pattern>
  </defs>
  <rect width="88" height="31" fill="#ffcc00" stroke="#000"/>
  <rect y="1" width="88" height="5" fill="url(#h)"/>
  <rect y="25" width="88" height="5" fill="url(#h)"/>
  <text x="44" y="15" font-family="Arial,Helvetica,sans-serif" font-size="7"
    font-weight="bold" text-anchor="middle" fill="#000">UNDER</text>
  <text x="44" y="23" font-family="Arial,Helvetica,sans-serif" font-size="7"
    font-weight="bold" text-anchor="middle" fill="#000">CONSTRUCTION</text>
</svg>`)

export const NETSCAPE_NOW = svg(`${BADGE}>
  <rect width="88" height="31" fill="#000" stroke="#8f8f8f"/>
  <rect x="1" y="1" width="30" height="29" fill="#1c2f6e"/>
  <text x="16" y="25" font-family="Georgia,Times,serif" font-size="26"
    font-weight="bold" text-anchor="middle" fill="#7fd4ff">N</text>
  <text x="59" y="14" font-family="Arial,Helvetica,sans-serif" font-size="9"
    font-weight="bold" text-anchor="middle" fill="#fff">Netscape</text>
  <text x="59" y="25" font-family="Arial,Helvetica,sans-serif" font-size="9"
    font-weight="bold" text-anchor="middle" fill="#00d2ff">NOW!</text>
</svg>`)

export const BEST_VIEWED = svg(`${BADGE}>
  <rect width="88" height="31" fill="#c0c0c0" stroke="#000"/>
  <rect x="1" y="1" width="86" height="29" fill="none" stroke="#fff"/>
  <text x="44" y="12" font-family="Arial,Helvetica,sans-serif" font-size="7"
    text-anchor="middle" fill="#000">BEST VIEWED AT</text>
  <text x="44" y="24" font-family="Arial,Helvetica,sans-serif" font-size="10"
    font-weight="bold" text-anchor="middle" fill="#000080">800x600</text>
</svg>`)

export const WEBRING = svg(`${BADGE}>
  <rect width="88" height="31" fill="#330066" stroke="#000"/>
  <circle cx="16" cy="15" r="9" fill="none" stroke="#ffcc00" stroke-width="3"/>
  <circle cx="24" cy="15" r="9" fill="none" stroke="#00ccff" stroke-width="3"/>
  <text x="58" y="19" font-family="Arial,Helvetica,sans-serif" font-size="10"
    font-weight="bold" text-anchor="middle" fill="#fff">WebRing</text>
</svg>`)

/** The mechanical odometer every page bolted to the bottom. */
export const hitCounter = (digits: string) =>
  svg(`width="${digits.length * 12 + 6}" height="22"
    viewBox="0 0 ${digits.length * 12 + 6} 22">
    <rect width="${digits.length * 12 + 6}" height="22" fill="#101010"
      stroke="#606060"/>
    ${[...digits]
      .map(
        (d, i) => `<rect x="${i * 12 + 4}" y="3" width="10" height="16"
          fill="#1e1e1e" stroke="#3a3a3a"/>
        <text x="${i * 12 + 9}" y="16" font-family="Courier New,monospace"
          font-size="12" font-weight="bold" text-anchor="middle"
          fill="#f5f5f5">${d}</text>`,
      )
      .join('')}
  </svg>`)

export const NEW_BADGE = svg(`width="30" height="12" viewBox="0 0 30 12">
  <rect width="30" height="12" fill="#dd0000"/>
  <text x="15" y="9" font-family="Arial,Helvetica,sans-serif" font-size="8"
    font-weight="bold" text-anchor="middle" fill="#ffff00">NEW!</text>
</svg>`)

/** The blue sphere that stood in for every list bullet. */
export const BULLET = svg(`width="13" height="13" viewBox="0 0 13 13">
  <defs>
    <radialGradient id="b" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#bfe4ff"/>
      <stop offset="0.55" stop-color="#2f7fd0"/>
      <stop offset="1" stop-color="#0b2f63"/>
    </radialGradient>
  </defs>
  <circle cx="6.5" cy="6.5" r="6" fill="url(#b)"/>
</svg>`)

/** The rainbow rule, which no page of the era considered optional. */
export const RAINBOW_RULE = svg(`width="468" height="7" viewBox="0 0 468 7"
  preserveAspectRatio="none">
  <defs>
    <linearGradient id="r" x1="0" x2="1">
      <stop offset="0" stop-color="#ff0000"/>
      <stop offset="0.2" stop-color="#ff9900"/>
      <stop offset="0.4" stop-color="#ffee00"/>
      <stop offset="0.6" stop-color="#33cc33"/>
      <stop offset="0.8" stop-color="#0066ff"/>
      <stop offset="1" stop-color="#9900cc"/>
    </linearGradient>
  </defs>
  <rect width="468" height="7" fill="url(#r)"/>
</svg>`)

export const ENVELOPE = svg(`width="26" height="17" viewBox="0 0 26 17">
  <rect x="0.5" y="0.5" width="25" height="16" fill="#fffdf0" stroke="#000"/>
  <path d="M0.5 0.5 13 9.5 25.5 0.5" fill="none" stroke="#000"/>
</svg>`)

/** A star tile, for `<body background="stars.gif">`. */
export const STAR_TILE = svg(`width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#000044"/>
  <g fill="#ffffff">
    <circle cx="9" cy="12" r="1"/>
    <circle cx="41" cy="7" r="1.4"/>
    <circle cx="56" cy="29" r="1"/>
    <circle cx="23" cy="38" r="1.2"/>
    <circle cx="49" cy="52" r="1"/>
    <circle cx="12" cy="57" r="1.3"/>
    <circle cx="33" cy="21" r="0.9"/>
  </g>
  <g fill="#9fd0ff">
    <circle cx="61" cy="45" r="1"/>
    <circle cx="4" cy="33" r="1"/>
  </g>
</svg>`)
