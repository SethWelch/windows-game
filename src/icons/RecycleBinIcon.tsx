import type { IconProps } from './types.ts'

export function RecycleBinIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="rb-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e4eaf0" />
          <stop offset="0.35" stopColor="#c2ccd6" />
          <stop offset="0.75" stopColor="#9aa7b4" />
          <stop offset="1" stopColor="#c8d2dc" />
        </linearGradient>
      </defs>

      {/* crumpled paper poking out the top */}
      <path
        d="M13 4.5 17.5 3l2.5 3.2-2 2.4-4.5-.6z"
        fill="#fdfdfd"
        stroke="#b8bec5"
        strokeWidth="0.8"
      />
      <path d="M15 4.2l2 2.4-1.4 1.2" fill="none" stroke="#d8dde2" />

      {/* bin body — trapezoid, wider at the top */}
      <path
        d="M7 9.5h18l-2.2 20.2H9.2z"
        fill="url(#rb-body)"
        stroke="#6f7a85"
        strokeWidth="1"
      />
      {/* vertical ribs */}
      <g stroke="#aab5c0" strokeWidth="1" opacity="0.85">
        <path d="M12.2 11.5 11.4 28" />
        <path d="M16 11.5 16 28" />
        <path d="M19.8 11.5 20.6 28" />
      </g>

      {/* rim */}
      <ellipse
        cx="16"
        cy="9.4"
        rx="9.2"
        ry="3.1"
        fill="#eef2f6"
        stroke="#6f7a85"
        strokeWidth="1"
      />
      <ellipse cx="16" cy="9.6" rx="7" ry="2" fill="#b9c4ce" opacity="0.55" />

      {/* recycle chevrons on the front face */}
      <g fill="#4f9e2f">
        <path d="M16 15.5l2.4 3.4h-4.8z" />
        <path d="M20.8 22.4l-1.4-3.9-2.6 1.5z" />
        <path d="M11.4 22.4l4-2.4-2.6-1.5z" />
      </g>
    </svg>
  )
}
