import type { IconProps } from './types.ts'

/** A corridor in perspective, which is all the maze ever showed you. */
export function MazeIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="28" height="28" rx="2" fill="#2b2934" stroke="#14131a" />
      {/* Floor and ceiling meeting at a vanishing point in the middle. */}
      <path d="M3 29L14 17h4l11 12z" fill="#3a3844" />
      <path d="M3 3l11 12h4L29 3z" fill="#4d4a58" />
      {/* The two side walls, in the same violet stone as the real thing. */}
      <path d="M3 3v26l11-12V15z" fill="#7a6f82" />
      <path d="M29 3v26L18 17V15z" fill="#5f566a" />
      {/* Brick courses, just enough to read as masonry at 32px. */}
      <path d="M3 11l8-2M3 18l9 2M29 11l-8-2M29 18l-9 2" stroke="#4a4453" strokeWidth="0.9" />
      {/* The lit end of the corridor. */}
      <rect x="14" y="15" width="4" height="2.4" fill="#c8b8d8" />
    </svg>
  )
}
