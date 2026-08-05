import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { LIMITS, normalizeLevel } from './engine.ts'
import type { Level } from './engine.ts'
import { LEVEL_LABELS, SCORED_LEVELS } from './bestTimes.ts'
import type { BestTimes, ScoredLevel } from './bestTimes.ts'

/**
 * Custom Field. The inputs are free text and only normalized on OK, exactly like
 * the real dialog — typing `500` and getting 24 back is the expected behaviour,
 * not a validation error.
 */
export function CustomFieldDialog({
  level,
  onConfirm,
  onCancel,
}: {
  level: Level
  onConfirm: (level: Level) => void
  onCancel: () => void
}) {
  const [rows, setRows] = useState(String(level.rows))
  const [cols, setCols] = useState(String(level.cols))
  const [mines, setMines] = useState(String(level.mines))

  const submit = () =>
    onConfirm(
      normalizeLevel({
        rows: Number(rows),
        cols: Number(cols),
        mines: Number(mines),
      }),
    )

  const fields: [string, string, string, (v: string) => void][] = [
    ['Height:', 'ms-height', rows, setRows],
    ['Width:', 'ms-width', cols, setCols],
    ['Mines:', 'ms-mines', mines, setMines],
  ]

  return (
    <Dialog title="Custom Field" onClose={onCancel}>
      <div className="xp-ms-custom">
        {fields.map(([label, id, value, set]) => (
          <div key={id} className="xp-ms-custom-row">
            <label htmlFor={id}>{label}</label>
            <input
              id={id}
              className="xp-field xp-ms-custom-input"
              inputMode="numeric"
              value={value}
              autoFocus={id === 'ms-height'}
              onChange={(e) => set(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
        ))}
        <p className="xp-ms-custom-hint">
          Height {LIMITS.rows.min}&ndash;{LIMITS.rows.max}, width{' '}
          {LIMITS.cols.min}&ndash;{LIMITS.cols.max}. Out-of-range values are
          rounded to fit.
        </p>
      </div>

      <div className="xp-dialog-buttons">
        <button
          type="button"
          className="xp-button xp-button--default"
          onClick={submit}
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

export function BestTimesDialog({
  times,
  onReset,
  onClose,
}: {
  times: BestTimes
  onReset: () => void
  onClose: () => void
}) {
  return (
    <Dialog title="Fastest Mine Sweepers" onClose={onClose}>
      <div className="xp-ms-scores">
        {SCORED_LEVELS.map((level) => (
          <div key={level} className="xp-ms-scores-row">
            <span>{LEVEL_LABELS[level]}:</span>
            <span className="xp-ms-scores-time">{times[level].time} seconds</span>
            <span className="xp-ms-scores-name">{times[level].name}</span>
          </div>
        ))}
      </div>

      <div className="xp-dialog-buttons">
        <button type="button" className="xp-button" onClick={onReset}>
          Reset Scores
        </button>
        <button
          type="button"
          className="xp-button xp-button--default"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </Dialog>
  )
}

/** Shown the moment a preset level is beaten, before the score is recorded. */
export function NewRecordDialog({
  level,
  currentName,
  onSubmit,
}: {
  level: ScoredLevel
  currentName: string
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(currentName)
  const submit = () => onSubmit(name.trim() || 'Anonymous')

  return (
    <Dialog title="Congratulations" onClose={submit}>
      <div className="xp-ms-record">
        <p>
          You have the fastest time for {LEVEL_LABELS[level].toLowerCase()} level.
          <br />
          Please enter your name.
        </p>
        <input
          className="xp-field"
          value={name}
          autoFocus
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
      </div>

      <div className="xp-dialog-buttons">
        <button
          type="button"
          className="xp-button xp-button--default"
          onClick={submit}
        >
          OK
        </button>
      </div>
    </Dialog>
  )
}
