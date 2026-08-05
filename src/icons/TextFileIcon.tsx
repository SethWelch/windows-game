import type { IconProps } from './types.ts'

export function TextFileIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="tf-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9eef3" />
        </linearGradient>
      </defs>
      <path
        d="M7 2.5h12L25 8.5v21H7z"
        fill="url(#tf-page)"
        stroke="#8595a5"
        strokeWidth="1"
      />
      <path d="M19 2.5 25 8.5h-6z" fill="#c9d3dd" stroke="#8595a5" />
      <g fill="#9aa3ab">
        <rect x="9.5" y="12" width="13" height="1.3" />
        <rect x="9.5" y="15.4" width="13" height="1.3" />
        <rect x="9.5" y="18.8" width="9" height="1.3" />
        <rect x="9.5" y="22.2" width="11" height="1.3" />
      </g>
    </svg>
  )
}
