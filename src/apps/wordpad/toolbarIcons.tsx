/**
 * Toolbar artwork. WordPad's buttons were flat 16px bitmaps with a hard black
 * outline and two or three fills — no gradients and no shading, so the shapes have
 * to carry all of it.
 */

const S = { className: 'wp-icon', viewBox: '0 0 16 16', 'aria-hidden': true } as const

export function NewIcon() {
  return (
    <svg {...S}>
      <path d="M3.5 1.5h6L12.5 5v9.5h-9z" fill="#fff" stroke="#000" />
      <path d="M9.5 1.5V5h3z" fill="#c0c0c0" stroke="#000" />
    </svg>
  )
}

export function OpenIcon() {
  return (
    <svg {...S}>
      <path d="M1.5 4.5h5l1.4 1.6h6.6v7.4H1.5z" fill="#e8c53c" stroke="#000" />
      <path d="M3.5 7.5h11l-1.6 5H1.9z" fill="#f7dd7a" stroke="#000" />
    </svg>
  )
}

export function SaveIcon() {
  return (
    <svg {...S}>
      <rect x="1.5" y="1.5" width="13" height="13" fill="#3b6ea5" stroke="#000" />
      <rect x="4.5" y="1.5" width="7" height="5" fill="#d8d8d8" stroke="#000" />
      <rect x="3.5" y="9" width="9" height="5.5" fill="#fff" stroke="#000" />
      <rect x="6" y="2.5" width="2" height="3" fill="#404040" />
    </svg>
  )
}

export function PrintIcon() {
  return (
    <svg {...S}>
      <rect x="4" y="1.5" width="8" height="4" fill="#fff" stroke="#000" />
      <rect x="1.5" y="5.5" width="13" height="6" fill="#b9bec7" stroke="#000" />
      <rect x="4" y="9" width="8" height="5.5" fill="#fff" stroke="#000" />
      <rect x="11.5" y="7" width="2" height="1.4" fill="#2fa03f" />
    </svg>
  )
}

export function PreviewIcon() {
  return (
    <svg {...S}>
      <path d="M2.5 1.5h8L13 4v10h-10z" fill="#fff" stroke="#000" />
      <circle cx="9" cy="8.5" r="3.4" fill="#cfe8fb" stroke="#000" />
      <path d="M11.4 11l3 3" stroke="#000" strokeWidth="1.6" />
    </svg>
  )
}

export function FindIcon() {
  return (
    <svg {...S}>
      <circle cx="6.5" cy="6.5" r="4.4" fill="#cfe8fb" stroke="#000" />
      <path d="M9.8 9.8l4 4" stroke="#000" strokeWidth="1.8" />
    </svg>
  )
}

export function CutIcon() {
  return (
    <svg {...S}>
      <path d="M5 1.5l6 8M11 1.5l-6 8" stroke="#606060" strokeWidth="1.2" />
      <circle cx="4.4" cy="12" r="2.2" fill="none" stroke="#000" strokeWidth="1.2" />
      <circle cx="11.6" cy="12" r="2.2" fill="none" stroke="#000" strokeWidth="1.2" />
    </svg>
  )
}

export function CopyIcon() {
  return (
    <svg {...S}>
      <path d="M2.5 1.5h6l2 2v8h-8z" fill="#fff" stroke="#000" />
      <path d="M5.5 4.5h6l2 2v8h-8z" fill="#fff" stroke="#000" />
    </svg>
  )
}

export function PasteIcon() {
  return (
    <svg {...S}>
      <rect x="1.5" y="2.5" width="10" height="12" fill="#c8a870" stroke="#000" />
      <rect x="4" y="1" width="5" height="3" fill="#d8d8d8" stroke="#000" />
      <rect x="6" y="6.5" width="8" height="8" fill="#fff" stroke="#000" />
    </svg>
  )
}

export function UndoIcon() {
  return (
    <svg {...S}>
      <path
        d="M3 9c1-3.6 4.4-5.4 7.4-4.4 2.4.8 3.6 3 3.2 5.4"
        fill="none"
        stroke="#2f6fd0"
        strokeWidth="2"
      />
      <path d="M1.5 5.5L6 8.6 1.8 10.8z" fill="#2f6fd0" />
    </svg>
  )
}

export function DateTimeIcon() {
  return (
    <svg {...S}>
      <rect x="1.5" y="2.5" width="13" height="12" fill="#fff" stroke="#000" />
      <rect x="1.5" y="2.5" width="13" height="3" fill="#c81f1f" stroke="#000" />
      <g fill="#404040">
        <rect x="3.5" y="7" width="2" height="2" />
        <rect x="7" y="7" width="2" height="2" />
        <rect x="10.5" y="7" width="2" height="2" />
        <rect x="3.5" y="10.5" width="2" height="2" />
        <rect x="7" y="10.5" width="2" height="2" />
      </g>
    </svg>
  )
}

/** The colour button's swatch, which took whatever the current colour was. */
export function ColorIcon({ color }: { color: string }) {
  return (
    <svg {...S}>
      <text
        x="8"
        y="10"
        textAnchor="middle"
        fontFamily="Times New Roman, serif"
        fontSize="10"
        fontWeight="bold"
        fill="#000"
      >
        A
      </text>
      <rect x="2" y="11.5" width="12" height="3" fill={color} stroke="#000" strokeWidth="0.6" />
    </svg>
  )
}
