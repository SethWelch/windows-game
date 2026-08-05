import type { IconProps } from './types.ts'

/** A console window: grey titlebar, black client area, `C:\>` and a block cursor. */
export function CommandPromptIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <rect x="2" y="5" width="28" height="22" rx="1.5" fill="#4a4f57" stroke="#23272e" />
      {/* Titlebar, with the three little buttons at its right end. */}
      <rect x="2" y="5" width="28" height="4.5" fill="#8d939d" />
      <g fill="#d7dae0">
        <rect x="22.5" y="6.4" width="1.8" height="1.8" />
        <rect x="24.8" y="6.4" width="1.8" height="1.8" />
        <rect x="27.1" y="6.4" width="1.8" height="1.8" />
      </g>

      <rect x="3.6" y="11" width="24.8" height="14.4" fill="#000" />

      {/* The prompt, pixelled rather than typeset — it has to read at 16px. */}
      <g fill="#c8c8c8">
        {/* C */}
        <rect x="5.4" y="13.4" width="1" height="3.4" />
        <rect x="6.4" y="13.4" width="1.8" height="0.9" />
        <rect x="6.4" y="15.9" width="1.8" height="0.9" />
        {/* : */}
        <rect x="9.2" y="14.3" width="0.9" height="0.9" />
        <rect x="9.2" y="15.9" width="0.9" height="0.9" />
        {/* \ */}
        <rect x="11" y="13.4" width="0.9" height="1.2" />
        <rect x="11.7" y="14.5" width="0.9" height="1.2" />
        <rect x="12.4" y="15.6" width="0.9" height="1.2" />
        {/* > */}
        <rect x="14.2" y="13.7" width="0.9" height="1" />
        <rect x="15" y="14.6" width="0.9" height="1" />
        <rect x="14.2" y="15.5" width="0.9" height="1" />
      </g>
      <rect x="16.8" y="13.4" width="2.2" height="3.4" fill="#c8c8c8" />
    </svg>
  )
}
