import type { IconProps } from './types.ts'

/** A pocket calculator, three-quarter on: dark case, green display, grey keys. */
export function CalculatorIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="calc-case" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6f7683" />
          <stop offset="1" stopColor="#3b414c" />
        </linearGradient>
        <linearGradient id="calc-lcd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8e6a0" />
          <stop offset="1" stopColor="#8fbe63" />
        </linearGradient>
      </defs>

      <rect
        x="6"
        y="2"
        width="20"
        height="28"
        rx="2.5"
        fill="url(#calc-case)"
        stroke="#23272e"
      />

      {/* Display, with a couple of segment marks so it reads as switched on. */}
      <rect x="8.5" y="4.5" width="15" height="6" rx="1" fill="url(#calc-lcd)" stroke="#4e6b33" />
      <g fill="#33501c">
        <rect x="17.5" y="6" width="1.4" height="3.2" />
        <rect x="20" y="6" width="1.4" height="3.2" />
      </g>

      {/* Keypad: three columns of grey keys with an orange one for the total. */}
      <g fill="#d7dae0" stroke="#8f959f" strokeWidth="0.6">
        <rect x="8.5" y="12.5" width="4" height="3.4" rx="0.7" />
        <rect x="13.9" y="12.5" width="4" height="3.4" rx="0.7" />
        <rect x="19.3" y="12.5" width="4" height="3.4" rx="0.7" />
        <rect x="8.5" y="17.3" width="4" height="3.4" rx="0.7" />
        <rect x="13.9" y="17.3" width="4" height="3.4" rx="0.7" />
        <rect x="19.3" y="17.3" width="4" height="3.4" rx="0.7" />
        <rect x="8.5" y="22.1" width="4" height="3.4" rx="0.7" />
        <rect x="13.9" y="22.1" width="4" height="3.4" rx="0.7" />
      </g>
      <rect
        x="19.3"
        y="22.1"
        width="4"
        height="3.4"
        rx="0.7"
        fill="#f0a028"
        stroke="#b06f10"
        strokeWidth="0.6"
      />
    </svg>
  )
}
