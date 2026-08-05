import { useWindows } from '@/os/useWM.ts'
import { Window } from './Window.tsx'

export function WindowLayer() {
  const windows = useWindows()
  return (
    <div className="xp-window-layer">
      {/* Rendered in creation order and stacked with z-index. Reordering this
          list would remount app content — Notepad would lose its text. */}
      {windows.map((win) => (
        <Window key={win.id} win={win} />
      ))}
    </div>
  )
}
