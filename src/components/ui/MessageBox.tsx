import { useEffect } from 'react'
import { audio } from '@/os/audio.ts'
import { Dialog } from './Dialog.tsx'

export interface MessageBoxButton {
  label: string
  onClick: () => void
  /** Renders with the heavy default-button border. */
  primary?: boolean
}

export function MessageBox({
  title,
  message,
  variant = 'warn',
  buttons,
  onClose,
}: {
  title: string
  message: string
  variant?: 'warn' | 'info'
  buttons: MessageBoxButton[]
  onClose: () => void
}) {
  // A message box announces itself. Which sound depends on which kind it is — the
  // same split the variant already makes for the glyph.
  useEffect(() => {
    audio.play(variant === 'warn' ? 'exclamation' : 'ding')
  }, [variant])

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="xp-msgbox">
        <span className={`xp-msgbox-glyph xp-msgbox-glyph--${variant}`}>
          {variant === 'warn' ? '!' : 'i'}
        </span>
        <span className="xp-msgbox-text">{message}</span>
      </div>
      <div className="xp-dialog-buttons">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            className={`xp-button${b.primary ? ' xp-button--default' : ''}`}
            onClick={b.onClick}
          >
            {b.label}
          </button>
        ))}
      </div>
    </Dialog>
  )
}
