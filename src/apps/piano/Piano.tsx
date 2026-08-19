import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { LIBRARY } from '@/apps/mediaPlayer/library.ts'
import { createPlayer } from '@/apps/mediaPlayer/synth.ts'
import type { Player } from '@/apps/mediaPlayer/synth.ts'
import { audioBus } from '@/os/audio.ts'
import { createInstrument } from '@/os/instrument.ts'
import type { HeldVoice, Instrument } from '@/os/instrument.ts'
import type { AppProps } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import {
  LAYOUT,
  OCTAVE_MAX,
  OCTAVE_MIN,
  WHITE_COUNT,
  labelFor,
  nameOf,
  noteFor,
} from './keys.ts'
import './Piano.css'

/**
 * A keyboard, playing the same instrument Media Player's library does.
 *
 * There was no piano in Windows XP; there were a hundred shareware ones, and this is that.
 * It exists because the sound already did: os/instrument.ts was written for the library, and
 * a struck string you can only listen to and not play is a waste of a struck string.
 *
 * Three ways in. Click a key, drag across them to run up the keyboard, or type — the `z`/`q`
 * row layout every soft-synth has used since the nineties, printed on the keys so it doesn't
 * have to be explained. And **Play** hands one of the library's pieces to the sequencer and
 * lights the keys as it goes, which is the only part of any of this that shows you what a
 * piece actually looks like under the hands.
 */

/** How often to ask the sequencer what is sounding. Fast enough to look like playing. */
const WATCH_MS = 40

export function Piano({ windowId }: AppProps) {
  const focused = useIsFocused(windowId)
  const [octave, setOctave] = useState(0)
  const [sustain, setSustain] = useState(false)
  /** Notes under a finger or a typing key. A new Set each time — never mutated in place. */
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set())
  /** Notes the sequencer is sounding, for the demo. */
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set())
  const [demo, setDemo] = useState<string | null>(null)

  const instrumentRef = useRef<Instrument | null>(null)
  const playerRef = useRef<Player | null>(null)
  /** Sounding voices by note. Mutable, so it lives in a ref rather than in state. */
  const voicesRef = useRef(new Map<number, HeldVoice>())
  /** Notes whose key has been let go while the pedal is down. */
  const pedalRef = useRef(new Set<number>())
  /**
   * The pedal, where the press/release handlers can see it. They are built once, so they
   * cannot read it out of a closure — the `latest` idiom from hooks/useOutsideClick.ts, and
   * written in an effect because writing a ref during render is not allowed.
   */
  const sustainRef = useRef(sustain)
  useEffect(() => {
    sustainRef.current = sustain
  })

  /** One instrument and one sequencer for as long as the window is open. */
  useEffect(() => {
    const bus = audioBus()
    // No Web Audio. The keyboard still works, silently, which is what os/audio.ts does
    // about the same problem.
    if (!bus) return
    const instrument = createInstrument(bus.ctx, bus.out)
    instrumentRef.current = instrument
    playerRef.current = createPlayer(bus.ctx, instrument)
    return () => {
      playerRef.current?.dispose()
      instrument.dispose()
      playerRef.current = null
      instrumentRef.current = null
      voicesRef.current = new Map()
      pedalRef.current = new Set()
    }
  }, [])

  /**
   * Press and release. Kept in a memo so the document listeners below can be attached once
   * and still reach the current instrument — the same reason `useOutsideClick` keeps a
   * `latest` ref.
   */
  const play = useMemo(
    () => ({
      press(midi: number) {
        const instrument = instrumentRef.current
        if (!instrument || voicesRef.current.has(midi)) return
        // Struck a little under full force: a keyboard has no velocity to report, and
        // everything at maximum is the flatness that os/instrument.ts is all about avoiding.
        voicesRef.current.set(midi, instrument.press(midi, 0.85))
        pedalRef.current.delete(midi)
        setHeld((prev) => new Set(prev).add(midi))
      },
      release(midi: number) {
        const voice = voicesRef.current.get(midi)
        if (!voice) return
        setHeld((prev) => {
          const next = new Set(prev)
          next.delete(midi)
          return next
        })
        // With the pedal down the string keeps ringing; the voice is remembered so lifting
        // the pedal can damp it.
        if (sustainRef.current) {
          pedalRef.current.add(midi)
          return
        }
        voice.release()
        voicesRef.current.delete(midi)
      },
      releaseAll() {
        for (const [midi, voice] of voicesRef.current) {
          voice.release()
          pedalRef.current.delete(midi)
        }
        voicesRef.current = new Map()
        setHeld(new Set())
      },
    }),
    [],
  )

  /** Lifting the pedal damps everything it was holding. */
  useEffect(() => {
    if (sustain) return
    for (const midi of pedalRef.current) {
      voicesRef.current.get(midi)?.release()
      voicesRef.current.delete(midi)
    }
    pedalRef.current = new Set()
  }, [sustain])

  /**
   * Typing. Guarded on focus, as every app with a document key listener here is — nine others
   * are listening, and an unfocused piano must not answer to someone typing in Notepad.
   */
  useEffect(() => {
    if (!focused) return

    const down = (e: KeyboardEvent) => {
      // Autorepeat would re-strike the note thirty times a second.
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const midi = noteFor(e.key, octave)
      if (midi === null) return
      e.preventDefault()
      play.press(midi)
    }
    const up = (e: KeyboardEvent) => {
      const midi = noteFor(e.key, octave)
      if (midi !== null) play.release(midi)
    }
    // A window that loses focus mid-chord would hold those notes forever.
    const blur = () => play.releaseAll()

    document.addEventListener('keydown', down)
    document.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      play.releaseAll()
    }
  }, [focused, octave, play])

  /**
   * The pointer. Held on the document rather than on each key, because a drag that starts on
   * one key and ends anywhere else still has to let go — and dragging across the keyboard
   * running up the notes is half the fun of one of these.
   */
  const draggingRef = useRef(false)
  useEffect(() => {
    const up = () => {
      draggingRef.current = false
      play.releaseAll()
    }
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', up)
    return () => {
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', up)
    }
  }, [play])

  const onKeyDown = (midi: number) => (e: ReactPointerEvent) => {
    e.preventDefault()
    draggingRef.current = true
    play.press(midi)
  }
  const onKeyEnter = (midi: number) => () => {
    if (!draggingRef.current) return
    // Glissando: the note behind us goes as the next one arrives.
    for (const sounding of voicesRef.current.keys()) {
      if (sounding !== midi) play.release(sounding)
    }
    play.press(midi)
  }

  /** Watches the sequencer so the keys light up as it plays. */
  useEffect(() => {
    const player = playerRef.current
    const track = LIBRARY.find((t) => t.id === demo)
    if (!player || !track) return
    player.load(track.notes)
    player.start()
    const timer = window.setInterval(() => {
      const at = player.position()
      const sounding = new Set<number>()
      for (const note of track.notes) {
        if (note.at <= at && at < note.at + note.dur) sounding.add(note.midi)
      }
      setLit(sounding)
      // Stop of its own accord at the end rather than sitting on silence.
      if (at >= track.length) setDemo(null)
    }, WATCH_MS)
    return () => {
      window.clearInterval(timer)
      player.stop()
      setLit(new Set())
    }
  }, [demo])

  const menus = useMemo(
    () => [
      {
        id: 'file',
        label: '&File',
        items: [{ id: 'close', label: '&Close', onSelect: () => wm.close(windowId) }],
      },
      {
        id: 'play',
        label: '&Play',
        items: [
          ...LIBRARY.map((t) => ({
            id: `demo-${t.id}`,
            label: t.title,
            checked: demo === t.id,
            onSelect: () => setDemo((d) => (d === t.id ? null : t.id)),
          })),
          { kind: 'separator' as const },
          {
            id: 'stop',
            label: '&Stop',
            disabled: !demo,
            onSelect: () => setDemo(null),
          },
        ],
      },
    ],
    [windowId, demo],
  )

  return (
    <div className="pn">
      <MenuBar menus={menus} />

      <div className="pn-bar">
        <label className="pn-check">
          <input
            type="checkbox"
            checked={sustain}
            onChange={(e) => setSustain(e.target.checked)}
          />
          Sustain
        </label>

        <span className="pn-octave">
          <span>Octave</span>
          <button
            type="button"
            className="xp-button"
            disabled={octave <= OCTAVE_MIN}
            onClick={() => setOctave((o) => o - 1)}
            aria-label="Octave down"
          >
            &minus;
          </button>
          <output className="pn-octave-value">
            {octave > 0 ? `+${octave}` : octave}
          </output>
          <button
            type="button"
            className="xp-button"
            disabled={octave >= OCTAVE_MAX}
            onClick={() => setOctave((o) => o + 1)}
            aria-label="Octave up"
          >
            +
          </button>
        </span>

        <span className="pn-hint">
          {demo
            ? `Playing ${LIBRARY.find((t) => t.id === demo)?.title ?? ''}`
            : 'Click the keys, drag across them, or type'}
        </span>
      </div>

      {/* The white keys lay out in a row and the black ones sit over the joins, which is why
          they are absolutely positioned rather than being part of the flow. `isolation` keeps
          their `z-index` inside this box — the trap in CLAUDE.md. */}
      <div
        className="pn-keys"
        role="group"
        aria-label="Keyboard"
        style={{ '--pn-whites': WHITE_COUNT } as CSSProperties}
      >
        {LAYOUT.map(({ midi, black, x, w }) => {
          const label = labelFor(midi, octave)
          return (
            <button
              key={midi}
              type="button"
              className={black ? 'pn-key pn-key--black' : 'pn-key'}
              style={{ '--x': x, '--w': w } as CSSProperties}
              data-down={held.has(midi) || lit.has(midi)}
              data-demo={lit.has(midi) && !held.has(midi)}
              aria-label={nameOf(midi)}
              onPointerDown={onKeyDown(midi)}
              onPointerEnter={onKeyEnter(midi)}
            >
              {label && <span className="pn-key-label">{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
