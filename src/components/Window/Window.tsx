import { useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useWindowGesture } from '@/hooks/useWindowGesture.ts'
import { applyRect } from '@/os/constants.ts'
import { getApp, minSizeOf } from '@/os/registry.ts'
import type { Rect, WindowInstance } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import { ResizeHandles } from './ResizeHandles.tsx'
import { TitleBar } from './TitleBar.tsx'
import './Window.css'

export function Window({ win }: { win: WindowInstance }) {
  const focused = useIsFocused(win.id)
  const ref = useRef<HTMLDivElement>(null)
  const app = getApp(win.appId)

  const resizable = app?.resizable !== false
  const maximizable = app?.maximizable !== false
  const normal = win.status === 'normal'

  const gesture = useWindowGesture({
    getRect: () => win.rect,
    getBounds: () => {
      const layer = ref.current?.parentElement
      return {
        width: layer?.clientWidth ?? window.innerWidth,
        height: layer?.clientHeight ?? window.innerHeight,
      }
    },
    minSize: app ? minSizeOf(app) : { width: 220, height: 150 },
    // Preview writes straight to the node — no React render per frame.
    onPreview: (r: Rect) => {
      if (ref.current) applyRect(ref.current, r)
    },
    onCommit: (r: Rect) => wm.setRect(win.id, r),
    onStart: () => wm.focus(win.id),
  })

  const onPointerDownCapture = useCallback(() => wm.focus(win.id), [win.id])

  /*
   * A minimized window is *hidden*, not unmounted — see `[data-status='minimized']` in
   * Window.css. This used to `return null`, which threw the app component away and every
   * piece of React state with it: minimizing Navigator lost your session history and put you
   * back on the home page, minimizing Solitaire reshuffled the deal, minimizing Paint lost
   * the drawing, and minimizing Media Player tore down the radio mid-song. Minimizing is
   * supposed to get a window out of the way, not close it.
   *
   * The cost is that a hidden window still renders and its loops still run. That is cheap:
   * `display: none` means no layout and no paint, and the canvases size themselves from
   * their host element, which measures zero while hidden — so they collapse to a pixel and
   * rebuild on the way back.
   */

  const style: CSSProperties =
    win.status === 'maximized'
      ? { inset: 0, width: 'auto', height: 'auto', transform: 'none', zIndex: win.zIndex }
      : {
          transform: `translate(${win.rect.x}px, ${win.rect.y}px)`,
          width: win.rect.width,
          height: win.rect.height,
          zIndex: win.zIndex,
        }

  const AppComponent = app?.component

  return (
    <div
      ref={ref}
      className="xp-window"
      style={style}
      data-focused={focused}
      data-status={win.status}
      onPointerDownCapture={onPointerDownCapture}
    >
      <TitleBar
        win={win}
        maximizable={maximizable}
        dragProps={normal ? gesture.moveProps : {}}
        onMinimize={() => wm.minimize(win.id)}
        onToggleMaximize={() => wm.toggleMaximize(win.id)}
        onClose={() => wm.close(win.id)}
      />

      <div className="xp-window-body">
        {AppComponent ? (
          <AppComponent windowId={win.id} args={win.args} />
        ) : (
          <div className="xp-window-content" />
        )}
      </div>

      {resizable && normal && <ResizeHandles resizeProps={gesture.resizeProps} />}
    </div>
  )
}
