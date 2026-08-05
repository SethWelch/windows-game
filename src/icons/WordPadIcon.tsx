import type { IconProps } from './types.ts'

/** A page of formatted text with a pen resting on it. */
export function WordPadIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="wp-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6ebf2" />
        </linearGradient>
      </defs>

      {/* Page with a dog-eared corner. */}
      <path
        d="M6 2.5h14L26 8v21.5H6z"
        fill="url(#wp-page)"
        stroke="#6d8ba8"
      />
      <path d="M20 2.5 26 8h-6z" fill="#c3cdd8" stroke="#6d8ba8" />

      {/* A heading, then body rules — the "rich" in rich text. */}
      <rect x="9" y="11" width="10" height="2.4" fill="#1c4f9c" />
      <g fill="#8a939e">
        <rect x="9" y="16" width="14" height="1.4" />
        <rect x="9" y="19" width="14" height="1.4" />
        <rect x="9" y="22" width="10" height="1.4" />
      </g>

      {/* Pen across the lower right. */}
      <g transform="rotate(-40 22 25)">
        <rect x="14" y="23.4" width="13" height="3" fill="#2f6fd0" stroke="#123f7f" />
        <path d="M27 23.4h3l1.4 1.5-1.4 1.5h-3z" fill="#d8d8d8" stroke="#6a6a6a" />
        <rect x="12.4" y="23.4" width="1.8" height="3" fill="#e8c53c" stroke="#8a6a12" />
      </g>
    </svg>
  )
}
