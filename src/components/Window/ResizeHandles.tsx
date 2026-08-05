import type { DOMAttributes } from 'react'
import type { ResizeEdge } from '@/os/types.ts'

// Corners come last so they stack above the edges they overlap.
const EDGES: ResizeEdge[] = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']

export function ResizeHandles({
  resizeProps,
}: {
  resizeProps: (edge: ResizeEdge) => DOMAttributes<HTMLElement>
}) {
  return (
    <>
      {EDGES.map((edge) => (
        <div key={edge} className={`xp-rh xp-rh-${edge}`} {...resizeProps(edge)} />
      ))}
    </>
  )
}
