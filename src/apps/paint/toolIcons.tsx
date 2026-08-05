import type { ToolId } from './palette.ts'

/**
 * Tool box artwork. These were 16px bitmaps drawn with about six colours each, so
 * the trick is fewer, chunkier shapes rather than accurate ones — a pencil is a
 * yellow diagonal with a grey tip, and that reads instantly at this size.
 */

const dashed = { fill: 'none', stroke: '#000', strokeWidth: 1, strokeDasharray: '2 2' }

const ART: Record<ToolId, () => React.ReactElement> = {
  freeSelect: () => (
    <>
      <path d="M2 9c1-5 5-7 8-5s4 6 2 8-8 2-10-3z" {...dashed} />
      <circle cx="12" cy="4" r="1.2" fill="#000" />
    </>
  ),
  select: () => (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" {...dashed} />
      <rect x="6" y="7" width="4" height="2" fill="#0a246a" opacity="0.35" />
    </>
  ),
  eraser: () => (
    <>
      <path d="M3 11l5-5 4 4-5 5H4z" fill="#f0d0d8" stroke="#000" />
      <path d="M8 6l2-2 4 4-2 2z" fill="#c8a0ac" stroke="#000" />
      <path d="M2 14h12" stroke="#000" />
    </>
  ),
  fill: () => (
    <>
      <path d="M5 3l6 6-4 4-6-6z" fill="#c0c0c0" stroke="#000" />
      <path d="M11 9l2-2 1 4a1.6 1.6 0 1 1-3 0z" fill="#0000c0" stroke="#000" />
      <path d="M4 12l7 0" stroke="#000" />
    </>
  ),
  pick: () => (
    <>
      <path d="M11 2l3 3-2 2-3-3z" fill="#c0c0c0" stroke="#000" />
      <path d="M9 4l3 3-6 6-3 1 1-3z" fill="#e0e0e0" stroke="#000" />
      <path d="M4 12l1-1" stroke="#000" />
    </>
  ),
  zoom: () => (
    <>
      <circle cx="7" cy="7" r="4.2" fill="#cfe8fb" stroke="#000" />
      <path d="M10 10l4 4" stroke="#000" strokeWidth="2" />
    </>
  ),
  pencil: () => (
    <>
      <path d="M11 2l3 3-8 8-3 1 1-3z" fill="#e8c53c" stroke="#000" />
      <path d="M3 14l1-3 2 2z" fill="#404040" stroke="#000" />
      <path d="M10.5 3.5l3 3" stroke="#000" />
    </>
  ),
  brush: () => (
    <>
      <path d="M10 2l4 3-6 5-3-2z" fill="#c08040" stroke="#000" />
      <path d="M5 8l3 2-2 4H3z" fill="#404040" stroke="#000" />
      <path d="M3 14h4" stroke="#000" strokeWidth="1.5" />
    </>
  ),
  airbrush: () => (
    <>
      <rect x="5" y="6" width="5" height="8" fill="#c0c0c0" stroke="#000" />
      <rect x="6" y="3" width="3" height="3" fill="#808080" stroke="#000" />
      <g fill="#000">
        <circle cx="12" cy="3" r="0.7" />
        <circle cx="14" cy="5" r="0.7" />
        <circle cx="12.5" cy="6.5" r="0.6" />
        <circle cx="14.5" cy="2" r="0.5" />
      </g>
    </>
  ),
  text: () => (
    <text
      x="8"
      y="13"
      textAnchor="middle"
      fontFamily="Times New Roman, serif"
      fontSize="14"
      fontWeight="bold"
      fill="#000"
    >
      A
    </text>
  ),
  line: () => <path d="M2.5 13.5L13.5 2.5" stroke="#000" strokeWidth="1.4" />,
  curve: () => (
    <path d="M2 13C2 5 14 11 14 3" fill="none" stroke="#000" strokeWidth="1.4" />
  ),
  rect: () => <rect x="2.5" y="4.5" width="11" height="7" fill="none" stroke="#000" />,
  polygon: () => (
    <path d="M8 2.5l5.5 4-2 6.5h-7l-2-6.5z" fill="none" stroke="#000" />
  ),
  ellipse: () => <ellipse cx="8" cy="8" rx="5.5" ry="4" fill="none" stroke="#000" />,
  roundRect: () => (
    <rect x="2.5" y="4.5" width="11" height="7" rx="2.5" fill="none" stroke="#000" />
  ),
}

export function ToolIcon({ id }: { id: ToolId }) {
  const Art = ART[id]
  return (
    <svg className="xp-paint-tool-art" viewBox="0 0 16 16" aria-hidden>
      <Art />
    </svg>
  )
}
