import type { DOMAttributes, PointerEvent as ReactPointerEvent } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import {
  CloseGlyph,
  MaxGlyph,
  MinGlyph,
  RestoreGlyph,
} from '@/icons/TitleBarGlyphs.tsx'
import type { WindowInstance } from '@/os/types.ts'

interface TitleBarProps {
  win: WindowInstance
  maximizable: boolean
  dragProps: DOMAttributes<HTMLElement>
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
}

export function TitleBar({
  win,
  maximizable,
  dragProps,
  onMinimize,
  onToggleMaximize,
  onClose,
}: TitleBarProps) {
  // Keeps a click on Close from also starting a drag.
  const swallow = (e: ReactPointerEvent) => e.stopPropagation()

  return (
    <div
      className="xp-titlebar"
      {...dragProps}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('.xp-titlebar-buttons')) return
        if (maximizable) onToggleMaximize()
      }}
    >
      <span className="xp-titlebar-icon">
        <Icon id={win.iconId} size={16} />
      </span>
      <span className="xp-titlebar-text">{win.title}</span>
      <div className="xp-titlebar-buttons">
        <button
          type="button"
          className="xp-tb-btn"
          onPointerDown={swallow}
          onClick={onMinimize}
          aria-label="Minimize"
          title="Minimize"
        >
          <MinGlyph />
        </button>
        <button
          type="button"
          className="xp-tb-btn"
          onPointerDown={swallow}
          onClick={onToggleMaximize}
          disabled={!maximizable}
          aria-label={win.status === 'maximized' ? 'Restore' : 'Maximize'}
          title={win.status === 'maximized' ? 'Restore' : 'Maximize'}
        >
          {win.status === 'maximized' ? <RestoreGlyph /> : <MaxGlyph />}
        </button>
        <button
          type="button"
          className="xp-tb-btn xp-tb-btn--close"
          onPointerDown={swallow}
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <CloseGlyph />
        </button>
      </div>
    </div>
  )
}
