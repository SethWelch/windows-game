import type { ComponentType } from 'react'

/**
 * Navigator's toolbar artwork. Chunky, saturated and lit from the top left, the
 * way every 1997 toolbar was — these were 23px bitmaps, so there is no fine detail
 * to miss.
 */

/** Icon over label, the shape Navigator's buttons had. */
export function Tool({
  label,
  art: Art,
  onClick,
  disabled,
}: {
  label: string
  art: ComponentType
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className="ns-tool"
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <Art />
      <span>{label}</span>
    </button>
  )
}

export function BackIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <path
        d="M14 3 4 12l10 9v-6h7V9h-7z"
        fill="#3b7a1f"
        stroke="#1d3d0f"
        strokeWidth="1"
      />
      <path d="M13 5.5 6 12l7 6.5v-3.2h6.8V8.7H13z" fill="#7cc94a" />
    </svg>
  )
}

export function ForwardIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <path
        d="M10 3l10 9-10 9v-6H3V9h7z"
        fill="#3b7a1f"
        stroke="#1d3d0f"
        strokeWidth="1"
      />
      <path d="M11 5.5 18 12l-7 6.5v-3.2H4.2V8.7H11z" fill="#7cc94a" />
    </svg>
  )
}

export function ReloadIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <path
        d="M12 4a8 8 0 1 0 7.4 5"
        fill="none"
        stroke="#1c5fa8"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M12 4a8 8 0 1 0 7.4 5"
        fill="none"
        stroke="#57a5e8"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M11 1.5 17 4.6l-6 3.1z" fill="#1c5fa8" />
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <path d="M12 3 2.5 11h3v10h13V11h3z" fill="#b8571f" stroke="#5c2a0c" />
      <path d="M7 12.5h4V21H7z" fill="#f0d9a8" stroke="#5c2a0c" strokeWidth="0.7" />
      <rect x="13" y="12.5" width="4" height="4" fill="#8ed0f0" stroke="#5c2a0c" strokeWidth="0.7" />
      <path d="M12 4.6 4.6 10.8h14.8z" fill="#d97a34" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <circle cx="10" cy="10" r="6.4" fill="#cfe8fb" stroke="#1c5fa8" strokeWidth="2" />
      <path d="M6.2 7.4a5 5 0 0 1 4-2.6" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M14.8 14.8 21 21" stroke="#7a5a12" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M14.8 14.8 21 21" stroke="#e0b537" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function PrintIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <rect x="6" y="2.5" width="12" height="7" fill="#fffdf0" stroke="#4a4a4a" />
      <rect x="2.5" y="9" width="19" height="8" rx="1" fill="#b9bec7" stroke="#4a4a4a" />
      <rect x="6" y="14" width="12" height="7.5" fill="#fffdf0" stroke="#4a4a4a" />
      <rect x="16.5" y="10.6" width="2.6" height="2" fill="#3fa03f" />
    </svg>
  )
}

export function StopIcon() {
  return (
    <svg className="ns-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9.2" fill="#c81f1f" stroke="#6d0d0d" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#f08a8a" strokeWidth="1.2" />
      <path
        d="M7.6 7.6 16.4 16.4M16.4 7.6 7.6 16.4"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The closed padlock, for the rare page that actually was encrypted. */
export function ClosedLock() {
  return (
    <svg viewBox="0 0 20 14" width="18" height="13" aria-hidden>
      <path
        d="M7 7V5.2a3 3 0 0 1 6 0V7"
        fill="none"
        stroke="#ffd95e"
        strokeWidth="1.6"
      />
      <rect x="5.6" y="6.6" width="8.8" height="6.6" rx="1" fill="#ffd95e" />
      <rect x="9.2" y="8.4" width="1.6" height="3" fill="#7a5a12" />
    </svg>
  )
}

/** The broken-key security indicator, which is what the status bar always showed. */
export function BrokenKey() {
  return (
    <svg viewBox="0 0 20 14" width="18" height="13" aria-hidden>
      <circle cx="5" cy="7" r="3.4" fill="none" stroke="#d8d4c4" strokeWidth="2" />
      <path d="M8.4 7h3.2" stroke="#d8d4c4" strokeWidth="2" />
      <path d="M13.6 7h3.2M14.6 4.6v4.8" stroke="#d8d4c4" strokeWidth="2" />
    </svg>
  )
}

/**
 * The throbber. A stylised N over a starfield with a comet through it, which
 * streaks while the page is coming in and sits still when it isn't.
 */
export function Throbber({ spinning }: { spinning: boolean }) {
  return (
    <span className="ns-throbber" data-spinning={spinning} title="Netscape">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
        <rect width="32" height="32" fill="#0b1140" />
        <g fill="#3c4a90">
          <circle cx="5" cy="6" r="1" />
          <circle cx="26" cy="4" r="1.2" />
          <circle cx="29" cy="22" r="1" />
          <circle cx="4" cy="26" r="1.1" />
          <circle cx="17" cy="29" r="1" />
        </g>
        <text
          x="16"
          y="26"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="28"
          fontWeight="bold"
          textAnchor="middle"
          fill="#8fd8ff"
        >
          N
        </text>
        <g className="ns-comet">
          <path
            d="M2 30C10 22 22 10 30 2"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity="0.55"
          />
          <circle cx="30" cy="2" r="2.2" fill="#ffffff" />
        </g>
      </svg>
    </span>
  )
}
