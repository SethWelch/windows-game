import type { IconProps } from './types.ts'

export function UserAvatar({ size = 42, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 42 42"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="ua-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc75c" />
          <stop offset="0.5" stopColor="#f6a623" />
          <stop offset="1" stopColor="#d97b0c" />
        </linearGradient>
      </defs>
      <rect
        x="0.5"
        y="0.5"
        width="41"
        height="41"
        rx="3"
        fill="url(#ua-bg)"
        stroke="#fff"
        strokeWidth="1.5"
      />
      {/* head + shoulders silhouette */}
      <circle cx="21" cy="16" r="7" fill="#fff" opacity="0.95" />
      <path
        d="M7 41c0-8.4 6.3-14 14-14s14 5.6 14 14z"
        fill="#fff"
        opacity="0.95"
      />
    </svg>
  )
}
