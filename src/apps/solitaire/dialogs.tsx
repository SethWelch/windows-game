import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import type { Scoring } from './engine.ts'
import { BACK_COUNT } from './options.ts'
import type { Options } from './options.ts'

const SCORING_LABELS: [Scoring, string][] = [
  ['standard', 'Standard'],
  ['vegas', 'Vegas'],
  ['none', 'None'],
]

/**
 * Options. Edits are held locally and only handed back on OK, so Cancel really
 * does mean cancel — changing Draw or Scoring restarts the game.
 */
export function OptionsDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: Options
  onConfirm: (next: Options) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(options)
  const set = <K extends keyof Options>(key: K, value: Options[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const restarts =
    draft.drawThree !== options.drawThree || draft.scoring !== options.scoring

  return (
    <Dialog title="Options" onClose={onCancel}>
      <div className="xp-sol-options">
        <fieldset className="xp-groupbox">
          <legend>Draw</legend>
          <label className="xp-choice">
            <input
              type="radio"
              className="xp-radio"
              name="sol-draw"
              checked={!draft.drawThree}
              onChange={() => set('drawThree', false)}
            />
            Draw one
          </label>
          <label className="xp-choice">
            <input
              type="radio"
              className="xp-radio"
              name="sol-draw"
              checked={draft.drawThree}
              onChange={() => set('drawThree', true)}
            />
            Draw three
          </label>
        </fieldset>

        <fieldset className="xp-groupbox">
          <legend>Scoring</legend>
          {SCORING_LABELS.map(([value, label]) => (
            <label key={value} className="xp-choice">
              <input
                type="radio"
                className="xp-radio"
                name="sol-scoring"
                checked={draft.scoring === value}
                onChange={() => set('scoring', value)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <label className="xp-choice">
          <input
            type="checkbox"
            className="xp-check"
            checked={draft.timed}
            onChange={(e) => set('timed', e.target.checked)}
          />
          Timed game
        </label>
        <label className="xp-choice">
          <input
            type="checkbox"
            className="xp-check"
            checked={draft.statusBar}
            onChange={(e) => set('statusBar', e.target.checked)}
          />
          Status bar
        </label>
        {/* XP could drag a wireframe on slow machines. There is no slow machine
            here, so the real cards always move. */}
        <label className="xp-choice" data-disabled>
          <input type="checkbox" className="xp-check" disabled />
          Outline dragging
        </label>

        {restarts && (
          <p className="xp-sol-options-note">
            Changing Draw or Scoring starts a new game.
          </p>
        )}
      </div>

      <div className="xp-dialog-buttons">
        <button
          type="button"
          className="xp-button xp-button--default"
          onClick={() => onConfirm(draft)}
        >
          OK
        </button>
        <button type="button" className="xp-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Dialog>
  )
}

/** Select Card Back. XP shipped twelve; these four are the ones worth drawing. */
export function DeckDialog({
  back,
  onConfirm,
  onCancel,
}: {
  back: number
  onConfirm: (back: number) => void
  onCancel: () => void
}) {
  const [choice, setChoice] = useState(back)

  return (
    <Dialog title="Select Card Back" onClose={onCancel}>
      <div className="xp-sol-decks">
        {Array.from({ length: BACK_COUNT }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className="xp-sol-deck-pick"
            data-selected={choice === n}
            aria-label={`Card back ${n}`}
            onClick={() => setChoice(n)}
            onDoubleClick={() => onConfirm(n)}
          >
            <span className="xp-sol-back" data-back={n} />
          </button>
        ))}
      </div>

      <div className="xp-dialog-buttons">
        <button
          type="button"
          className="xp-button xp-button--default"
          onClick={() => onConfirm(choice)}
        >
          OK
        </button>
        <button type="button" className="xp-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Dialog>
  )
}
