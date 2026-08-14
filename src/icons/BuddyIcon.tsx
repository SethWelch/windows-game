import type { IconProps } from './types.ts'

/** Bongo's head, for the desktop shortcut and the titlebar. */
export function BuddyIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <ellipse cx="16" cy="17" rx="13" ry="11.5" fill="#8d55d0" />
      <ellipse cx="3.6" cy="17" rx="3" ry="3.8" fill="#7a45bd" />
      <ellipse cx="28.4" cy="17" rx="3" ry="3.8" fill="#7a45bd" />
      <ellipse cx="16" cy="22" rx="8" ry="6" fill="#e8d6b4" />
      <ellipse cx="16" cy="19.4" rx="2.2" ry="1.6" fill="#4a2b18" />
      <path d="M11 23c2.4 3.6 7.6 3.6 10 0" fill="none" stroke="#5a3520" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="11.5" cy="13" rx="4" ry="4.6" fill="#fff" />
      <ellipse cx="20.5" cy="13" rx="4" ry="4.6" fill="#fff" />
      <circle cx="11.9" cy="13.4" r="1.9" fill="#20140a" />
      <circle cx="20.9" cy="13.4" r="1.9" fill="#20140a" />
    </svg>
  )
}
