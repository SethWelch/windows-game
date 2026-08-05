import { useLayoutEffect, useRef, useState } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick.ts'
import { MenuList } from './MenuList.tsx'
import type { MenuNode } from './menu.types.ts'

/**
 * The box a `position: fixed` descendant actually resolves against.
 *
 * Normally that's the viewport, but a transformed ancestor takes over — and
 * `.xp-window` positions itself with a `transform`, so a menu opened from inside a
 * window would otherwise land at the click point *plus* the window's own offset.
 * Finding that ancestor and subtracting it puts the menu back under the pointer,
 * while a menu opened from the desktop or the taskbar finds nothing and is unmoved.
 */
function fixedOrigin(el: Element): { x: number; y: number } {
  for (let parent = el.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent)
    if (
      style.transform !== 'none' ||
      style.filter !== 'none' ||
      style.perspective !== 'none' ||
      style.willChange.includes('transform') ||
      style.contain.includes('paint')
    ) {
      const box = parent.getBoundingClientRect()
      return { x: box.left, y: box.top }
    }
  }
  return { x: 0, y: 0 }
}

export function ContextMenu({
  x,
  y,
  items,
  onDismiss,
}: {
  x: number
  y: number
  items: MenuNode[]
  onDismiss: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useOutsideClick([ref], onDismiss)

  // Measures before the browser paints, so the first frame is already in the right
  // place: flip back inside the viewport if the menu would hang off an edge, then
  // convert the result out of viewport space.
  useLayoutEffect(() => {
    const el = ref.current
    const menu = el?.firstElementChild as HTMLElement | null
    if (!el || !menu) return
    const { width, height } = menu.getBoundingClientRect()
    const origin = fixedOrigin(el)

    setPos({
      x: (x + width > window.innerWidth ? Math.max(0, x - width) : x) - origin.x,
      y: (y + height > window.innerHeight ? Math.max(0, y - height) : y) - origin.y,
    })
  }, [x, y])

  return (
    <div ref={ref} style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 900 }}>
      <MenuList items={items} onDismiss={onDismiss} />
    </div>
  )
}
