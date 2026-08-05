import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { CloseGlyph } from '@/icons/TitleBarGlyphs.tsx'
import { TASKBAR_H, clamp } from '@/os/constants.ts'
import './Dialog.css'

/**
 * XP dialog frame: a non-resizable window with a close-only titlebar. Backs Save
 * As, Open, About, and every message box.
 *
 * Owner-modal, exactly as XP's are. Two consequences drive the implementation:
 *
 * 1. It renders *inside* its owner window rather than portaling to the body, so
 *    it shares the owner's stacking context. It therefore sits above the owner's
 *    content but below any window with a higher z-index — raise another program
 *    and it goes over the top of both.
 * 2. `.xp-dialog-host` covers the owner's client area, which is what makes the
 *    owner unclickable. It stops below the titlebar on purpose: XP lets you drag
 *    a window that has a modal dialog open.
 */
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Centring stays in CSS; dragging is a translate offset layered on top, so
  // there is nothing to measure and no jump on the first drag.
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{
    px: number
    py: number
    ox: number
    oy: number
    /** Untranslated box, measured once at pointerdown. */
    baseLeft: number
    baseTop: number
    w: number
    h: number
  } | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  /** Keep part of the titlebar reachable, as the window manager does. */
  const clampOffset = (x: number, y: number) => {
    const d = drag.current
    if (!d) return { x, y }
    return {
      x: clamp(x, 90 - d.baseLeft - d.w, window.innerWidth - d.baseLeft - 90),
      y: clamp(y, -d.baseTop, window.innerHeight - TASKBAR_H - d.baseTop - 24),
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('.xp-tb-btn')) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      ox: offset.x,
      oy: offset.y,
      baseLeft: r.left - offset.x,
      baseTop: r.top - offset.y,
      w: r.width,
      h: r.height,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || !ref.current) return
    const next = clampOffset(d.ox + (e.clientX - d.px), d.oy + (e.clientY - d.py))
    ref.current.style.transform = `translate(${next.x}px, ${next.y}px)`
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const next = clampOffset(d.ox + (e.clientX - d.px), d.oy + (e.clientY - d.py))
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setOffset(next)
  }

  return (
    <div className="xp-dialog-host">
      <div
        ref={ref}
        className="xp-dialog"
        role="dialog"
        aria-modal
        aria-label={title}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <div
          className="xp-dialog-titlebar"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span>{title}</span>
          <button
            type="button"
            className="xp-tb-btn xp-tb-btn--close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseGlyph />
          </button>
        </div>
        <div className="xp-dialog-body">{children}</div>
      </div>
    </div>
  )
}
