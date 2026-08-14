import type { IconProps } from './types.ts'

/**
 * The Display applet: a CRT showing the desktop, which is what the Control Panel icon
 * was. The screen carries a scrap of Bliss — a green hill under blue — because that is
 * how you knew at a glance which applet it was.
 */
export function DisplayIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      {/* case */}
      <rect x="2.5" y="4.5" width="27" height="20" rx="2" fill="#e8e4d4" stroke="#8a8678" />
      {/* screen */}
      <rect x="5" y="7" width="22" height="14" rx="1" fill="#2f7ad2" />
      <path d="M5 15c5-4 12-4 22 1v5H5z" fill="#6aae42" />
      <circle cx="9.5" cy="10.5" r="2" fill="#bfe0f7" opacity="0.75" />
      {/* stand */}
      <path d="M13 24.5h6l1.5 4h-9z" fill="#ded8c8" stroke="#8a8678" />
      <rect x="9" y="28" width="14" height="2.5" rx="1" fill="#e8e4d4" stroke="#8a8678" />
    </svg>
  )
}
