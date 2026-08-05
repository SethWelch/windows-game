import type { IconProps } from './types.ts'

/**
 * SVG fallback for the `shortcut` overlay, used only if
 * `src/images/icons/shortcut.ico` is missing.
 *
 * Note the 32×32 viewBox with the badge sitting in the bottom-left corner and
 * everything else transparent: that matches how Windows ships overlay icons, so
 * it composites over a base icon at `inset: 0` with no corner offsets. The arrow
 * points up-RIGHT.
 */
export function ShortcutOverlay({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect
        x="1.5"
        y="19.5"
        width="12"
        height="12"
        fill="#fdfdfd"
        stroke="#000"
        strokeWidth="2"
      />
      {/* shaft, bottom-left to centre */}
      <path
        d="M5.5 28.5 10 24"
        stroke="#000"
        strokeWidth="2.4"
        strokeLinecap="square"
        fill="none"
      />
      {/* arrowhead filling the top-right of the badge */}
      <path d="M11.6 22 6.6 22 11.6 27Z" fill="#000" />
    </svg>
  )
}
