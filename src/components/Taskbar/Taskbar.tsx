import { useRef } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import { useStartMenuOpen, useWindows } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import { StartMenu } from './StartMenu.tsx'
import { SystemTray } from './SystemTray.tsx'
import { TaskButton } from './TaskButton.tsx'
import './Taskbar.css'

export function Taskbar() {
  const windows = useWindows()
  const startOpen = useStartMenuOpen()
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {startOpen && (
        <StartMenu panelRef={panelRef} startButtonRef={startButtonRef} />
      )}

      <div className="xp-taskbar">
        <button
          ref={startButtonRef}
          type="button"
          className="xp-start"
          data-open={startOpen}
          // Without this the desktop's pointerdown handler closes the menu first,
          // and the click below would immediately reopen it.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => wm.setStartMenu(!startOpen)}
        >
          <span className="xp-start-flag">
            {/* 24 is a native size in the artwork, so nothing gets rescaled. */}
            <Icon id="windowsxp" size={24} />
          </span>
          start
        </button>

        <div className="xp-taskbar-buttons">
          {/* Creation order, so buttons never reshuffle when focus changes. */}
          {windows.map((win) => (
            <TaskButton key={win.id} win={win} />
          ))}
        </div>

        <SystemTray />
      </div>
    </>
  )
}
