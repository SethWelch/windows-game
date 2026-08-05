import { useRef, useState } from 'react'
import { useClock } from '@/hooks/useClock.ts'
import { useOutsideClick } from '@/hooks/useOutsideClick.ts'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import type { MenuNode } from '@/components/ui/menu.types.ts'
import { NetworkIcon, VolumeIcon, WarningIcon } from '@/icons/TrayIcons.tsx'
import { audio, useAudioSettings } from '@/os/audio.ts'
import { usePersisted } from '@/os/fs.ts'

export function SystemTray() {
  const now = useClock()
  const { volume, muted } = useAudioSettings()
  const persisted = usePersisted()

  // The balloon opens the moment a write fails and closes when dismissed — derived
  // rather than an effect, so there's no state to push on a render. Once dismissed
  // the triangle stays in the tray and clicking it says the same thing again.
  const [warningDismissed, setWarningDismissed] = useState(false)
  const balloonOpen = !persisted && !warningDismissed

  const [sliderOpen, setSliderOpen] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const volumeRef = useRef<HTMLDivElement>(null)

  useOutsideClick([volumeRef], () => setSliderOpen(false), sliderOpen)

  const trayMenu: MenuNode[] = [
    { id: 'volume', label: '&Adjust Audio Properties', disabled: true },
    { id: 'sndvol', label: '&Open Volume Control', disabled: true },
    { kind: 'separator' },
    {
      id: 'mute',
      label: '&Mute',
      checked: muted,
      onSelect: () => audio.setMuted(!muted),
    },
  ]

  return (
    <div className="xp-tray">
      {!persisted && (
        <div className="xp-tray-warning">
          <button
            type="button"
            className="xp-tray-icon xp-tray-button"
            title="Your changes are not being saved"
            aria-label="Your changes are not being saved"
            onClick={() => setWarningDismissed((d) => !d)}
          >
            <WarningIcon size={16} />
          </button>

          {/* The balloon tip, which is how the shell told you this sort of thing. */}
          {balloonOpen && (
            <div className="xp-balloon" role="status">
              <button
                type="button"
                className="xp-balloon-close"
                aria-label="Close"
                onClick={() => setWarningDismissed(true)}
              >
                ✕
              </button>
              <p className="xp-balloon-title">Your changes are not being saved</p>
              <p className="xp-balloon-body">
                There is not enough free space to store your files. Everything still
                works, but nothing you do from now on will be here next time.
              </p>
            </div>
          )}
        </div>
      )}

      <span className="xp-tray-icon" title="Local Area Connection">
        <NetworkIcon size={16} />
      </span>

      <div className="xp-tray-volume" ref={volumeRef}>
        <button
          type="button"
          className="xp-tray-icon xp-tray-button"
          title={muted ? 'Volume (muted)' : `Volume: ${volume}%`}
          aria-label="Volume"
          onClick={() => setSliderOpen((v) => !v)}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenu({ x: e.clientX, y: e.clientY })
          }}
        >
          <VolumeIcon size={16} muted={muted} />
        </button>

        {/* The little panel a left-click raised: one vertical slider and a mute box. */}
        {sliderOpen && (
          <div className="xp-volume-popup">
            <span className="xp-volume-title">Volume</span>
            {/* Rotated rather than a vertical range input, which browsers still
                disagree about how to spell. */}
            <div className="xp-volume-track">
              <input
                className="xp-volume-slider"
                type="range"
                min={0}
                max={100}
                value={volume}
                aria-label="Volume"
                autoFocus
                onChange={(e) => audio.setVolume(Number(e.target.value))}
                // The test beep lands on release, not on change: `onChange` fires
                // for every pixel of a drag, which would stack dozens of them.
                onPointerUp={() => audio.play('ding')}
                onKeyUp={() => audio.play('ding')}
              />
            </div>
            <label className="xp-choice xp-volume-mute">
              <input
                type="checkbox"
                className="xp-check"
                checked={muted}
                onChange={(e) => audio.setMuted(e.target.checked)}
              />
              Mute
            </label>
          </div>
        )}
      </div>

      <span
        className="xp-clock"
        title={now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      >
        {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </span>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={trayMenu}
          onDismiss={() => setMenu(null)}
        />
      )}
    </div>
  )
}
