import { useEffect, useState } from 'react'
import { audio } from '@/os/audio.ts'
import { boot } from '@/os/boot.ts'
import { wm } from '@/os/windowStore.ts'
import { buddy } from '@/os/buddy.ts'
import { discard } from '@/os/discard.ts'
import { popups } from '@/os/popups.ts'
import { screensaver } from '@/os/screensaver.ts'
import {
  clockRows,
  hardwareRows,
  identityRows,
  layout,
  networkRows,
  storageRows,
} from './specs.ts'
import type { SpecRow } from './specs.ts'
import './Boot.css'

/**
 * Power-on self test.
 *
 * Everything it reports is genuinely read off the machine (see specs.ts) rather than
 * invented, which is the whole point of a POST screen — and the reason so many rows
 * say `Unknown` is that the browser really won't tell us. The groups reveal in
 * sequence so it reads as a check running, then it waits for a key, as firmware did.
 */

/** Columns for the aligned `label : value` block, in monospace cells. */
const LABEL_WIDTH = 26
const WRAP = 46

/** How many groups have appeared. Everything is revealed by the last step. */
const GROUPS = 4

/** Shown while `navigator.storage.estimate()` is still out. */
const CHECKING: SpecRow[] = [
  { label: 'Storage Quota', value: 'Checking...' },
  { label: 'Storage Usage', value: 'Checking...' },
]

export function BootScreen() {
  const [revealed, setRevealed] = useState(0)
  const [storage, setStorage] = useState<SpecRow[] | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    // A machine that has just booted has nothing running on it.
    wm.closeAll()
    // Program-owned items in the bin belong to a session that is over — the Solitaire
    // deal that produced those cards is gone, so nothing could reclaim them. Files are
    // left alone: repairing the install belongs to a real power-off, not to a restart.
    discard.clear()
    // And the desktop assistant, who put himself in startup. Cleared and re-added
    // rather than carried over: his timers don't survive a machine being off.
    buddy.onBoot()
    // And the advertisements, along with whatever was still queued to arrive.
    popups.onBoot()
    // And any screen saver, plus its idle poll — module state outlives a POST.
    screensaver.onBoot()

    const timers: number[] = []
    for (let step = 1; step <= GROUPS; step++) {
      timers.push(window.setTimeout(() => setRevealed(step), step * 260))
    }
    void storageRows().then(setStorage)

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  /** ENTER starts Windows; M does it with the sound off. */
  useEffect(() => {
    if (revealed < GROUPS || starting) return

    const go = (silent: boolean) => {
      if (silent) audio.setMuted(true)
      setStarting(true)
      window.setTimeout(() => boot.start(), 1400)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') go(false)
      else if (e.key.toLowerCase() === 'm') go(true)
    }
    const onClick = () => go(false)

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onClick)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onClick)
    }
  }, [revealed, starting])

  if (starting) {
    return (
      <div className="boot">
        <div className="boot-screen">
          <div className="boot-line">Starting Windows XP...</div>
        </div>
      </div>
    )
  }

  const group = (index: number, rows: SpecRow[]) =>
    revealed >= index ? layout(rows, LABEL_WIDTH, WRAP) : []

  const body = [
    ...group(1, identityRows()),
    '',
    ...group(2, [...hardwareRows(), ...(storage ?? CHECKING)]),
    '',
    ...group(3, networkRows()),
    '',
    ...group(4, clockRows()),
  ]

  return (
    <div className="boot">
      <div className="boot-screen">
        <div className="boot-head">
          <div className="boot-vendor">
            <div className="boot-line">Meridian Modular BIOS v4.51PG</div>
            <div className="boot-line">
              Copyright (C) 1984-1998, Meridian Systems, Inc.
            </div>
          </div>
          <PowerSaverBadge />
        </div>

        {body.map((line, i) => (
          <div key={i} className="boot-line">
            {line}
          </div>
        ))}

        {revealed >= GROUPS && (
          <div className="boot-prompt">
            <div className="boot-line">
              Press <b>ENTER</b> to start Windows.
            </div>
            <div className="boot-line">
              Press <b>M</b> to start it without sound.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The badge every power-managed board of the era wore in its top-right corner.
 *
 * Deliberately *not* the Energy Star mark: that is a certification, and drawing a
 * lookalike would be claiming one. This is the same visual beat — a yellow star, a
 * swoosh, a green caption — without imitating anybody's mark.
 */
function PowerSaverBadge() {
  return (
    <svg className="boot-badge" viewBox="0 0 150 96" aria-hidden>
      <path
        d="M6 62C6 26 40 8 74 8s70 16 70 52"
        fill="none"
        stroke="#ffe000"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M104 24l9.5 20.5 22.5 2.6-16.8 15.2 4.6 22.2L104 73.2 84.2 84.7l4.6-22.2L72 47.3l22.5-2.6z"
        fill="none"
        stroke="#ffe000"
        strokeWidth="4"
      />
      <path d="M8 74h134" stroke="#00c000" strokeWidth="3" />
      <text
        x="75"
        y="93"
        textAnchor="middle"
        fill="#00e000"
        fontFamily="inherit"
        fontSize="15"
      >
        POWER SAVER
      </text>
    </svg>
  )
}
